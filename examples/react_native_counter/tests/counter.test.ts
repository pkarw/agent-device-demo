import assert from 'node:assert/strict';
import test from 'node:test';
import { canReset, counterReducer } from '../counter.ts';

test('zero disables reset', () => assert.equal(canReset(0), false));
test('increment adds one and enables reset', () => {
  const count = counterReducer(0, 'increment');
  assert.equal(count, 1);
  assert.equal(canReset(count), true);
});
test('five increments reset to zero and disable reset', () => {
  let count = 0;
  for (let i = 0; i < 5; i++) count = counterReducer(count, 'increment');
  assert.equal(count, 5);
  count = counterReducer(count, 'reset');
  assert.equal(count, 0);
  assert.equal(canReset(count), false);
});
test('repeated reset is idempotent', () => {
  assert.equal(counterReducer(counterReducer(5, 'reset'), 'reset'), 0);
});
test('increment works after reset', () => {
  assert.equal(counterReducer(counterReducer(5, 'reset'), 'increment'), 1);
});
test('increment does not exceed safe integer precision', () => {
  assert.equal(counterReducer(Number.MAX_SAFE_INTEGER, 'increment'), Number.MAX_SAFE_INTEGER);
});
