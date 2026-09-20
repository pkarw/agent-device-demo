import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const config = JSON.parse(readFileSync(".ai/agentic.config.json", "utf8"));
const qa = path.resolve(config.paths.qa);
const descriptor = path.join(qa, "test-env.json");
const serial = process.env.ANDROID_SERIAL || "emulator-5554";
const app = "dev.example.flutter_counter";
const session = `pipeline-${createHash("sha256").update(`${root}:${serial}`).digest("hex").slice(0, 12)}`;
const cli = path.join(root, "node_modules/.bin/agent-device");
const apk = "examples/flutter_counter/build/app/outputs/flutter-apk/app-debug.apk";
const [operation, ...args] = process.argv.slice(2);
mkdirSync(qa, { recursive: true });

function run(command, argv, { timeout = 300_000, quiet = false, cwd = root } = {}) {
  const result = spawnSync(command, argv, { cwd, encoding: "utf8", timeout, maxBuffer: 10 * 1024 * 1024 });
  if (!quiet || result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} ${argv[0]} failed (${result.status})`);
  return result.stdout;
}
const device = (...argv) => run(cli, [...argv, "--platform", "android", "--serial", serial, "--session", session]);
const adb = (...argv) => run("adb", ["-s", serial, ...argv], { quiet: true, timeout: 15_000 });
const readState = () => existsSync(descriptor) ? JSON.parse(readFileSync(descriptor, "utf8")) : null;
function writeState(value) {
  const temporary = `${descriptor}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, descriptor);
}
function requireDevice() {
  if (!existsSync(cli)) throw new Error("agent-device is missing. Restore the pinned dependencies with npm ci.");
  if (adb("shell", "getprop", "sys.boot_completed").trim() !== "1") {
    throw new Error(`Android ${serial} is not ready. Run npm run android:emulator and retry after boot.`);
  }
}
function inputs(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["build", ".dart_tool", ".gradle", ".kotlin"].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? inputs(file) : [file];
  });
}
function buildInputs() {
  return [
    ...inputs("examples/flutter_counter/lib"),
    ...inputs("examples/flutter_counter/android").filter((file) => !["local.properties", ".gitignore"].includes(path.basename(file))),
    "examples/flutter_counter/pubspec.yaml", "examples/flutter_counter/pubspec.lock",
  ];
}
function fingerprint() {
  const hash = createHash("sha256").update(root);
  for (const file of buildInputs().sort()) {
    hash.update(file).update(readFileSync(file));
  }
  return hash.digest("hex");
}
function close() {
  const state = readState();
  if (state?.status !== "running") return;
  if (state.device?.serial !== serial || state.device?.session !== session) {
    throw new Error("Descriptor belongs to another device. Set ANDROID_SERIAL to its recorded serial before closing.");
  }
  device("close");
  writeState({ ...state, status: "stopped", stoppedAt: new Date().toISOString() });
}
function health() {
  device("wait", 'label="Increment"', "60000");
  device("snapshot", "--json");
  const output = path.join(qa, "artifacts_doctor", "screen.png");
  mkdirSync(path.dirname(output), { recursive: true });
  device("screenshot", output);
  if (!readFileSync(output).subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error("Device health check produced an invalid PNG");
  }
}

// Serialize state changes. Never remove a lock whose owner might still be alive.
const lock = path.join(qa, "test-env.lock");
let locked = false;
try {
  try {
    mkdirSync(lock);
    locked = true;
    writeFileSync(path.join(lock, "owner.json"), JSON.stringify({ pid: process.pid, source: root, acquiredAt: new Date().toISOString() }));
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    throw new Error(`Another environment operation holds ${lock}; retry after it completes. Inspect owner.json before recovering a stale lock.`);
  }
  if (operation === "close") {
    close();
    console.log("TEST_ENV_STATUS=stopped");
  } else if (operation === "ensure-installed" || operation === "open") {
    if (args.some((arg) => !["--force", "--force-rebuild", app, `android://${app}`].includes(arg))) {
      throw new Error("This provider opens only the Flutter counter Android app; supported flags: --force, --force-rebuild.");
    }
    requireDevice();
    let state = readState();
    if (state?.status === "running" && state.device?.serial !== serial) {
      throw new Error("Close the recorded environment before selecting another ANDROID_SERIAL.");
    }
    const cachePath = path.join(qa, "test-env-build-cache.json");
    const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : null;
    const sourceFingerprint = fingerprint();
    const artifactHash = existsSync(apk) ? createHash("sha256").update(readFileSync(apk)).digest("hex") : null;
    // The supplied APK can seed the first cache only when all build inputs predate it.
    const initialApk = !cache && artifactHash && buildInputs().every((file) => statSync(file).mtimeMs <= statSync(apk).mtimeMs);
    const cached = cache?.sourceFingerprint === sourceFingerprint && cache?.artifactHash === artifactHash && artifactHash;
    if (args.includes("--force-rebuild") || (!cached && !initialApk)) {
      throw new Error("APK missing or stale. Close QA, stop the emulator to free memory, then run: bash .ai/scripts/android-build.sh. Restart the emulator and retry.");
    }
    const reused = state?.status === "running" && state.sourceFingerprint === sourceFingerprint && state.artifactHash === artifactHash && !args.includes("--force");
    if (!reused) {
      close();
      state = null;
      device("install", path.resolve(apk));
    }
    let opened = false;
    try {
      device("open", app, ...(reused ? [] : ["--relaunch"]), "--foreground", "--timeout", "300000");
      opened = true;
      health();
    } catch (error) {
      if (opened) device("close");
      if (state) writeState({ ...state, status: "failed", notes: error.message });
      throw error;
    }
    const version = run(cli, ["--version"], { quiet: true }).trim();
    writeFileSync(cachePath, JSON.stringify({ projectRoot: root, sourceFingerprint, artifactHash }, null, 2));
    writeState({ version: 1, runId: session, status: "running", mode: "discovered", baseUrl: `android://${app}`,
      startedByThisRepo: false, startScript: ".ai/scripts/test-env-up.sh", stopScript: ".ai/scripts/test-env-down.sh",
      app: { startCommand: "bash .ai/scripts/agent-device.sh open", package: app }, services: [], credentials: [],
      browser: { provider: "agent-device", installed: true, command: "bash .ai/scripts/agent-device.sh", version, descriptor: ".ai/browsers/agent-device.md", notes: "Android native app; baseUrl is an app URI, not HTTP." },
      device: { platform: "android", serial, session, ownedEmulator: false },
      testRunner: { name: "other", config: "scripts/android-screenshots.mjs" }, platform: process.platform,
      startedAt: reused ? state.startedAt : new Date().toISOString(), checkedAt: new Date().toISOString(), sourceFingerprint, artifactHash,
      notes: "Reuses the operator's emulator. Down closes only the pipeline session; never shuts down the emulator. Close this session before the independent android:screenshots runner." });
    console.log(`TEST_ENV_STATUS=running\nTEST_ENV_BASE_URL=android://${app}\nTEST_ENV_DESCRIPTOR=${path.relative(root, descriptor)}\nTEST_ENV_REUSED=${reused ? 1 : 0}\nBROWSER_PROVIDER=agent-device\nBROWSER_INSTALLED=1\nBROWSER_COMMAND=bash .ai/scripts/agent-device.sh\nBROWSER_VERSION=${version}\nBROWSER_NOTES=`);
  } else {
    requireDevice();
    const state = readState();
    if (state?.status !== "running" || state.device?.session !== session) throw new Error("Run sh .ai/scripts/test-env-up.sh first.");
    if (operation === "doctor") { device("doctor", "--app", app); health(); }
    else if (operation === "snapshot") device("snapshot", "--json");
    else if (operation === "interact") {
      if (!["press", "fill", "scroll", "back", "keyboard"].includes(args[0])) throw new Error("Supported actions: press, fill, scroll, back, keyboard");
      device(...args);
    } else if (operation === "assert") {
      if (!args[0]) throw new Error("assert requires an observed selector");
      device("wait", args[0], args[1] || "60000");
      device("snapshot", "--json");
    } else if (operation === "screenshot") {
      if (!args[0]) throw new Error("screenshot requires an output PNG path");
      mkdirSync(path.dirname(path.resolve(args[0])), { recursive: true });
      device("screenshot", path.resolve(args[0]));
    } else throw new Error(`Unknown provider operation: ${operation}`);
  }
} catch (error) {
  console.error(error.message);
  if (operation === "ensure-installed") console.error(`BROWSER_PROVIDER=agent-device\nBROWSER_INSTALLED=0\nBROWSER_NOTES=${error.message}`);
  process.exitCode = 1;
} finally {
  if (locked) rmSync(lock, { recursive: true });
}
