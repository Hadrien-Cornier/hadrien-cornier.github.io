import test from 'node:test';
import assert from 'node:assert/strict';
import { stateAt } from '../assets/robotics/faster-wam/sequence.js';

test('the complete schematic accounts for 300 matching-cache reads, then 10 fused-cache reads', () => {
  assert.equal(stateAt(.12).baselineReads, 0);
  assert.equal(stateAt(.43).baselineReads, 300);
  assert.equal(stateAt(.66).fasterReads, 0);
  assert.equal(stateAt(.94).fasterReads, 10);
  let previous = stateAt(0);
  for (let tick = 1; tick <= 10000; tick++) {
    const s = stateAt(tick / 10000);
    assert.ok(s.baselineReads >= previous.baselineReads && s.baselineReads <= 300);
    assert.ok(s.fasterReads >= previous.fasterReads && s.fasterReads <= 10);
    if (s.fasterReads > 0) {
      assert.equal(s.fusion, 1, 'fusion finishes before the action loop reads it');
      assert.equal(s.removal, 1, 'only one action layer remains');
    }
    previous = s;
  }
});

test('scrubbing back reconstructs state without carrying reads or fusion from the other architecture', () => {
  stateAt(1);
  const s = stateAt(.12 + .31 / 2);
  assert.equal(s.baselineReads, 150);
  assert.equal(s.baselineStep, 5);
  assert.equal(s.activeLayer, 0);
  assert.equal(s.fasterReads, 0);
  assert.equal(s.fusion, 0);
  assert.equal(s.removal, 0);
  assert.equal(stateAt(-1).baselineReads, 0);
  assert.equal(stateAt(2).fasterReads, 10);
});
