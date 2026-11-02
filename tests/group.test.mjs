import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupFindings } from '../skills/kvkk-audit/scripts/lib/group.mjs';

const mk = (id, ruleId, severity, certainty, n = 1) => ({
  id, ruleId, title: ruleId, severity, certainty, legalRefs: [], description: 'd', recommendation: 'r',
  occurrences: [{ file: `f${id}.js`, line: n }], occurrenceCount: 1,
});

test('groups by ruleId with highest severity, merged certainty, capped examples', () => {
  const input = [
    mk('F-001', 'KVKK-LOG-001', 'low', 'needs_verification'),
    mk('F-002', 'KVKK-LOG-001', 'high', 'needs_verification'),
    mk('F-003', 'KVKK-LOG-001', 'low', 'confirmed'),
    mk('F-004', 'KVKK-LOG-001', 'low', 'needs_verification'),
    mk('F-005', 'KVKK-LOG-001', 'low', 'needs_verification'),
    mk('F-006', 'KVKK-SEC-001', 'critical', 'confirmed'),
  ];
  const out = groupFindings(input);
  assert.equal(out.length, 2);
  assert.equal(out[0].ruleId, 'KVKK-SEC-001'); // critical sorts first
  const log = out[1];
  assert.equal(log.severity, 'high');
  assert.equal(log.certainty, 'confirmed');
  assert.equal(log.occurrences.length, 3);
  assert.equal(log.occurrenceCount, 5);
  assert.equal(log.id, 'F-002'); // id comes from the most severe member
});

test('sorts by severity then ruleId; honours maxExamples', () => {
  const out = groupFindings([
    mk('A', 'KVKK-B', 'medium', 'confirmed'),
    mk('B', 'KVKK-A', 'medium', 'confirmed'),
    mk('C', 'KVKK-B', 'medium', 'confirmed'),
  ], { maxExamples: 1 });
  assert.deepEqual(out.map((x) => x.ruleId), ['KVKK-A', 'KVKK-B']);
  assert.equal(out[1].occurrences.length, 1);
  assert.equal(out[1].occurrenceCount, 2);
});

test('occurrenceCount sums existing counts and input is not mutated', () => {
  const a = mk('A', 'R', 'low', 'confirmed');
  a.occurrenceCount = 4;
  const b = mk('B', 'R', 'low', 'confirmed');
  const out = groupFindings([a, b]);
  assert.equal(out[0].occurrenceCount, 5);
  assert.equal(a.occurrences.length, 1);
});

test('empty input', () => assert.deepEqual(groupFindings([]), []));

test('grouped title/description/examples come from the most severe member', () => {
  const md5 = { ...mk('F-001', 'KVKK-SEC-001', 'high', 'confirmed'), title: 'MD5 hashing', description: 'md5 desc' };
  const plain = { ...mk('F-002', 'KVKK-SEC-001', 'critical', 'confirmed'), title: 'Plaintext passwords', description: 'plain desc' };
  const out = groupFindings([md5, plain]);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, 'Plaintext passwords');
  assert.equal(out[0].description, 'plain desc');
  assert.equal(out[0].severity, 'critical');
  assert.equal(out[0].occurrences[0].file, 'fF-002.js');
  assert.equal(out[0].occurrences.length, 2);
});
