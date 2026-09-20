import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { onboardingAction } from './react-native-onboarding.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'rn-provider-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, '.ai/qa'), { recursive: true });
  copyFileSync(new URL('./react-native-device.mjs', import.meta.url), path.join(root, 'provider.mjs'));
  copyFileSync(new URL('./react-native-onboarding.mjs', import.meta.url), path.join(root, 'react-native-onboarding.mjs'));
  return { root, run: (...args) => spawnSync(process.execPath, ['provider.mjs', ...args], { cwd: root, encoding: 'utf8', timeout: 10000 }) };
}
test('close without an environment is idempotent', t => {
  const f = fixture(t);
  assert.equal(f.run('close').status, 0);
  assert.equal(f.run('close').status, 0);
  assert.equal(existsSync(path.join(f.root, '.ai/qa/react-native.lock')), false);
});
test('only the identified Expo tutorial and its ensuing menu may be dismissed', () => {
  const rect = { x: 10, y: 20, width: 30, height: 40 };
  const node = label => ({ label, bundleId: 'host.exp.exponent', enabled: true, rect });
  const tutorial = node('This is the developer menu. It gives you access to useful tools in your development builds.');
  assert.deepEqual(onboardingAction([tutorial, node('Continue')]), { rect, tutorial: true });
  assert.equal(onboardingAction([node('Continue')]), null);
  assert.equal(onboardingAction([{ ...tutorial, bundleId: 'another.app' }, node('Continue')]), null);
  assert.equal(onboardingAction([tutorial, { ...node('Continue'), enabled: false }]), null);
  const menu = [node('SDK version: 57.0.0'), node('Close')];
  assert.equal(onboardingAction(menu), null);
  assert.deepEqual(onboardingAction(menu, true), { rect, tutorial: false });
  assert.equal(onboardingAction([node('App is not responding'), node('Close')], true), null);
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
