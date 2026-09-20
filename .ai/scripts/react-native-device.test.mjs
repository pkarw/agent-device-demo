import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'rn-provider-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, '.ai/qa'), { recursive: true });
  copyFileSync(new URL('./react-native-device.mjs', import.meta.url), path.join(root, 'provider.mjs'));
  return { root, run: (...args) => spawnSync(process.execPath, ['provider.mjs', ...args], { cwd: root, encoding: 'utf8', timeout: 10000 }) };
}
test('close without an environment is idempotent', t => {
  const f = fixture(t);
  assert.equal(f.run('close').status, 0);
  assert.equal(f.run('close').status, 0);
  assert.equal(existsSync(path.join(f.root, '.ai/qa/react-native.lock')), false);
});
test('missing dependencies fail before touching Android', t => {
  const f = fixture(t);
  const result = f.run('open');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Install root and React Native/);
});
test('unsupported open arguments fail closed', t => {
  const f = fixture(t);
  assert.match(f.run('open', 'https://example.com').stderr, /Only --force/);
});
test('foreign environment is never torn down', t => {
  const f = fixture(t);
  const file = path.join(f.root, '.ai/qa/test-env.json');
  const original = JSON.stringify({ status: 'running', projectRoot: '/another/project', device: { session: 'another-run' } });
  writeFileSync(file, original);
  assert.match(f.run('close').stderr, /belongs to another/);
  assert.equal(readFileSync(file, 'utf8'), original);
});
test('lock contention never closes another operation or deletes its lock', t => {
  const f = fixture(t);
  const lock = path.join(f.root, '.ai/qa/react-native.lock');
  mkdirSync(lock);
  const file = path.join(f.root, '.ai/qa/test-env.json');
  const original = JSON.stringify({ status: 'running' });
  writeFileSync(file, original);
  assert.equal(f.run('open').status, 1);
  assert.equal(existsSync(lock), true);
  assert.equal(readFileSync(file, 'utf8'), original);
});
