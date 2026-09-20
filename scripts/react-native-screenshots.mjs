import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const output = path.resolve(process.argv[2] || `.ai/qa/artifacts_rn-${Date.now()}`);
mkdirSync(output, { recursive: true });
const commands = [];
const screenshots = [];
function run(...args) {
  const result = spawnSync('bash', ['.ai/scripts/react-native-device.sh', ...args], { encoding: 'utf8', timeout: 300000, maxBuffer: 10 * 1024 * 1024 });
  commands.push({ args, status: result.status, stdout: result.stdout, stderr: result.stderr });
  writeFileSync(path.join(output, 'commands.json'), JSON.stringify(commands, null, 2));
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
function snapshot() {
  return JSON.parse(run('snapshot')).data.nodes.filter(n => n.bundleId === 'host.exp.exponent');
}
function count(nodes) {
  const matches = nodes.filter(n => n.identifier === 'counter-value');
  assert.equal(matches.length, 1, 'Exactly one counter must be visible');
  assert.match(matches[0].value, /^\d+$/);
  return Number(matches[0].value);
}
function press(label, before, after) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const nodes = snapshot();
    const button = nodes.find(n => n.label === label && n.type === 'android.widget.Button');
    assert.ok(button?.enabled, `${label} must be enabled`);
    assert.ok(button.rect, 'Observed button bounds are required');
    run('interact', 'press', String(Math.round(button.rect.x + button.rect.width / 2)), String(Math.round(button.rect.y + button.rect.height / 2)), '--hold-ms', '1', '--settle');
    const actual = count(snapshot());
    if (actual === after) return;
    assert.equal(actual, before, 'Unexpected counter transition');
  }
  throw new Error(`Counter did not reach ${after}`);
}
function capture(name, value) {
  run('assert', `label="${value}"`);
  const nodes = snapshot();
  assert.equal(count(nodes), value);
  assert.equal(nodes.find(n => n.label === 'Reset counter' && n.type === 'android.widget.Button')?.enabled, value > 0);
  const file = `${name}.png`;
  run('screenshot', path.join(output, file));
  const png = readFileSync(path.join(output, file));
  assert.ok(png.length >= 24 && png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  screenshots.push({ file, count: value, width: png.readUInt32BE(16), height: png.readUInt32BE(20) });
  writeFileSync(path.join(output, `${name}.json`), JSON.stringify(nodes, null, 2));
  console.log(`PASS ${file}: count=${value}, resetEnabled=${value > 0}`);
}
capture('01-zero', 0);
for (let value = 1; value <= 5; value++) press('Increment', value - 1, value);
capture('02-five', 5);
press('Reset counter', 5, 0);
capture('03-reset', 0);
press('Increment', 0, 1);
capture('04-count-again', 1);
writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({ platform: 'android', app: 'host.exp.exponent', screenshots }, null, 2));
console.log(`Native React Native screenshots saved: ${output}`);
