import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { onboardingAction } from './react-native-onboarding.mjs';

const root = process.cwd();
const project = path.join(root, 'examples/react_native_counter');
const qa = path.join(root, '.ai/qa');
const descriptor = path.join(qa, 'test-env.json');
const app = 'host.exp.exponent';
const serial = process.env.ANDROID_SERIAL || 'emulator-5554';
const session = `rn-${createHash('sha256').update(`${root}:${serial}`).digest('hex').slice(0, 12)}`;
const cli = path.join(root, 'node_modules/.bin/agent-device');
const expo = path.join(project, 'node_modules/expo/bin/cli');
const [operation, ...args] = process.argv.slice(2);
const apk = path.join(root, '.android-demo-tools/downloads/Expo-Go-57.0.9.apk');
const expectedApkHash = '14c18828a3d04e43922245920bd941b978fd1c7a5aec88a0188032f0bb4972ce';
mkdirSync(qa, { recursive: true });

function run(command, argv, timeout = 300000) {
  const result = spawnSync(command, argv, { cwd: root, encoding: 'utf8', timeout, maxBuffer: 10 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} ${argv[0]}: ${result.stderr || result.stdout}`);
  return result.stdout;
}
const device = (...argv) => run(cli, [...argv, '--platform', 'android', '--serial', serial, '--session', session]);
const adb = (...argv) => run('adb', ['-s', serial, ...argv], 60000);
const readState = () => existsSync(descriptor) ? JSON.parse(readFileSync(descriptor, 'utf8')) : null;
function writeState(state) {
  const temporary = `${descriptor}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(state, null, 2));
  renameSync(temporary, descriptor);
}
function fingerprint() {
  const hash = createHash('sha256').update(root);
  for (const file of ['App.tsx', 'counter.ts', 'index.ts', 'package.json', 'package-lock.json', 'app.json', 'tsconfig.json']) {
    hash.update(file).update(readFileSync(path.join(project, file)));
  }
  return hash.digest('hex');
}
async function ready(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(2000) });
    return (await response.text()).includes('packager-status:running');
  } catch { return false; }
}
function ownsMetro(state) {
  if (state?.projectRoot !== root || !Number.isInteger(state.app?.pid)) return false;
  try {
    const command = readFileSync(`/proc/${state.app.pid}/cmdline`, 'utf8').split('\0');
    return command.includes(expo) && command.includes(project);
  } catch { return false; }
}
async function close() {
  const state = readState();
  if (!state || state.status === 'stopped') return;
  if (state.device?.session !== session || state.projectRoot !== root) throw new Error('Descriptor belongs to another provider/worktree; close it there first.');
  let failure;
  try { if (state.sessionOpened) device('close'); } catch (error) { failure = error; }
  try {
    if (ownsMetro(state)) process.kill(-state.app.pid, 'SIGTERM');
    if (state.reverseCreated) adb('reverse', '--remove', `tcp:${state.app.port}`);
  } catch (error) { failure ??= error; }
  writeState({ ...state, status: failure ? 'failed' : 'stopped', stoppedAt: new Date().toISOString() });
  if (failure) throw failure;
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function health() {
  const deadline = Date.now() + 120000;
  let snapshot;
  let dismissedTutorial = false;
  let visible = false;
  do {
    snapshot = JSON.parse(device('snapshot', '--json'));
    const nodes = snapshot.data.nodes.filter(n => n.bundleId === app);
    const action = onboardingAction(snapshot.data.nodes, dismissedTutorial);
    if (action) {
      device('press', String(Math.round(action.rect.x + action.rect.width / 2)), String(Math.round(action.rect.y + action.rect.height / 2)), '--hold-ms', '1', '--settle');
      dismissedTutorial ||= action.tutorial;
    } else if (nodes.some(n => n.label === 'Increment') && !nodes.some(n => n.label === 'SDK version: 57.0.0')) {
      visible = true; break;
    }
    await delay(1000);
  } while (Date.now() < deadline);
  mkdirSync(path.join(qa, 'artifacts_rn-doctor'), { recursive: true });
  writeFileSync(path.join(qa, 'artifacts_rn-doctor/snapshot.json'), JSON.stringify(snapshot, null, 2));
  if (!visible) throw new Error('React Native counter not visible');
  const output = path.join(qa, 'artifacts_rn-doctor/screen.png');
  mkdirSync(path.dirname(output), { recursive: true });
  device('screenshot', output);
  const png = readFileSync(output);
  if (png.length < 24 || !png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error('Invalid device PNG');
  return snapshot;
}

const lock = path.join(qa, 'react-native.lock');
let locked = false;
try {
  mkdirSync(lock); locked = true;
  writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, root }));
  if (operation === 'close') {
    await close(); console.log('TEST_ENV_STATUS=stopped');
  } else if (operation === 'open' || operation === 'ensure-installed') {
    if (args.some(arg => arg !== '--force')) throw new Error('Only --force is supported. Build/export with npm run bundle:android.');
    if (process.platform !== 'linux') throw new Error('This native emulator adapter currently supports Linux only.');
    if (!existsSync(cli) || !existsSync(expo)) throw new Error('Install root and React Native lockfile dependencies with npm ci.');
    if (adb('shell', 'getprop', 'sys.boot_completed').trim() !== '1') throw new Error('Android is not booted; start npm run android:emulator first.');
    const sourceFingerprint = fingerprint();
    let state = readState();
    const reused = state?.status === 'running' && state.sourceFingerprint === sourceFingerprint && ownsMetro(state) && await ready(state.app.port) && !args.includes('--force');
    if (!reused) {
      await close();
      if (!existsSync(apk)) {
        mkdirSync(path.dirname(apk), { recursive: true });
        run('curl', ['-fL', '--retry', '2', '--connect-timeout', '20', '-o', apk, 'https://github.com/expo/expo-go-releases/releases/download/Expo-Go-57.0.9/Expo-Go-57.0.9.apk']);
      }
      if (createHash('sha256').update(readFileSync(apk)).digest('hex') !== expectedApkHash) throw new Error('Expo Go APK checksum mismatch');
      const installed = adb('shell', 'dumpsys', 'package', app);
      if (!installed.includes('versionName=57.0.9')) console.log(device('install', apk));
      const port = await freePort();
      const output = openSync(path.join(qa, 'react-native-metro.log'), 'a');
      const metro = spawn(process.execPath, [expo, 'start', project, '--go', '--localhost', '--port', String(port), '--max-workers', '2'], {
        cwd: project, env: { ...process.env, CI: '1', NODE_ENV: 'development', EXPO_OFFLINE: '1', EXPO_NO_TELEMETRY: '1', EXPO_UNSTABLE_HEADLESS: '1', NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --dns-result-order=ipv4first` },
        detached: true, stdio: ['ignore', output, output],
      });
      closeSync(output); metro.unref();
      state = { version: 1, runId: session, projectRoot: root, status: 'starting', mode: 'dev', baseUrl: `exp://127.0.0.1:${port}`,
        startedByThisRepo: true, startScript: '.ai/scripts/test-env-up.sh', stopScript: '.ai/scripts/test-env-down.sh', sourceFingerprint,
        app: { pid: metro.pid, port, startCommand: 'sh .ai/scripts/test-env-up.sh' }, services: [], credentials: [],
        browser: { provider: 'agent-device-react-native', installed: false, command: 'bash .ai/scripts/react-native-device.sh', version: '0.21.6', descriptor: '.ai/browsers/agent-device-react-native.md' },
        device: { platform: 'android', serial, session, ownedEmulator: false }, sessionOpened: false, reverseCreated: false,
        testRunner: { name: 'other', config: 'scripts/react-native-screenshots.mjs' }, platform: process.platform, startedAt: new Date().toISOString(),
        notes: 'Expo Go 57.0.9 hosts the React Native app. Metro is local/offline; teardown stops only this Metro process/session and reverse mapping, never the emulator.' };
      writeState(state);
      const deadline = Date.now() + 120000;
      while (!(await ready(port))) { if (Date.now() > deadline || !ownsMetro(state)) throw new Error('Metro failed to become ready; inspect .ai/qa/react-native-metro.log'); await delay(1000); }
      adb('reverse', `tcp:${port}`, `tcp:${port}`); state.reverseCreated = true; writeState(state);
    }
    state.sessionOpened = true; writeState(state);
    console.log(device('open', app, state.baseUrl, ...(reused ? [] : ['--relaunch']), '--foreground', '--timeout', '300000'));
    await health();
    state = { ...state, status: 'running', browser: { ...state.browser, installed: true }, checkedAt: new Date().toISOString() };
    writeState(state);
    console.log(`TEST_ENV_STATUS=running\nTEST_ENV_BASE_URL=${state.baseUrl}\nTEST_ENV_DESCRIPTOR=.ai/qa/test-env.json\nTEST_ENV_REUSED=${reused ? 1 : 0}\nBROWSER_PROVIDER=agent-device-react-native\nBROWSER_INSTALLED=1\nBROWSER_COMMAND=bash .ai/scripts/react-native-device.sh\nBROWSER_VERSION=0.21.6\nBROWSER_NOTES=Native Android Expo Go; no browser`);
  } else {
    const state = readState();
    if (state?.status !== 'running' || state.device?.session !== session) throw new Error('Start the environment with sh .ai/scripts/test-env-up.sh');
    if (operation === 'doctor') console.log(JSON.stringify(await health()));
    else if (operation === 'snapshot') console.log(device('snapshot', '--json'));
    else if (operation === 'interact') {
      if (!['press', 'scroll', 'back'].includes(args[0])) throw new Error('Unsupported native action');
      console.log(device(...args));
    } else if (operation === 'assert') {
      if (!args[0]) throw new Error('Expected an observed selector');
      device('wait', args[0], '60000'); console.log(device('snapshot', '--json'));
    } else if (operation === 'screenshot') {
      if (!args[0]) throw new Error('Expected output PNG path');
      mkdirSync(path.dirname(path.resolve(args[0])), { recursive: true });
      console.log(device('screenshot', path.resolve(args[0])));
    } else throw new Error(`Unknown operation: ${operation}`);
  }
} catch (error) {
  console.error(error.message);
  if (locked && (operation === 'open' || operation === 'ensure-installed')) {
    try { await close(); } catch (cleanupError) { console.error(`Cleanup: ${cleanupError.message}`); }
    console.error('BROWSER_PROVIDER=agent-device-react-native\nBROWSER_INSTALLED=0');
  }
  process.exitCode = 1;
} finally { if (locked) rmSync(lock, { recursive: true }); }
