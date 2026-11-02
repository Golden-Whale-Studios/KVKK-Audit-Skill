import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReport } from '../skills/kvkk-audit/scripts/lib/validate.mjs';

const cli = fileURLToPath(new URL('../skills/kvkk-audit/scripts/finalize-report.mjs', import.meta.url));
const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/valid-report.json', import.meta.url), 'utf8'));
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const tmp = () => mkdtempSync(join(tmpdir(), 'kvkk-fin-'));

function finding(id, ruleId, severity, snippet) {
  return {
    id, ruleId, title: ruleId, severity, certainty: 'confirmed',
    legalRefs: [{ label: 'KVKK md. 12', url: 'https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6698.pdf' }],
    description: 'd', recommendation: 'r',
    occurrences: [{ file: `src/${id}.js`, line: 1, snippet }], occurrenceCount: 1,
  };
}

test('summary mode groups, redacts, sets verdict and mode', () => {
  const dir = tmp();
  const draft = fixture();
  delete draft.verdict;
  draft.mode = 'detailed';
  draft.findings = [
    finding('F-001', 'KVKK-LOG-001', 'low', 'log("tc: 12345678901")'),
    finding('F-002', 'KVKK-LOG-001', 'high', 'send(a@b.com)'),
    finding('F-003', 'KVKK-SEC-001', 'low', 'x'),
  ];
  const p = join(dir, 'draft.json');
  writeFileSync(p, JSON.stringify(draft));
  const res = run(p, '--mode', 'summary', '--out', join(dir, 'out'));
  assert.equal(res.status, 0, res.stderr);
  const rep = JSON.parse(readFileSync(join(dir, 'out', 'report.json'), 'utf8'));
  assert.deepEqual(validateReport(rep), []);
  assert.equal(rep.mode, 'summary');
  assert.equal(rep.verdict, 'fixes_needed');
  assert.equal(rep.findings.length, 2);
  const text = JSON.stringify(rep);
  assert.ok(!text.includes('12345678901'));
  assert.ok(!text.includes('a@b.com'));
});

test('detailed mode keeps findings ungrouped but redacted', () => {
  const dir = tmp();
  const draft = fixture();
  draft.findings = [finding('F-001', 'R', 'low', 'a@b.com'), finding('F-002', 'R', 'low', 'b@c.com')];
  const p = join(dir, 'd.json');
  writeFileSync(p, JSON.stringify(draft));
  const res = run(p, '--mode', 'detailed', '--out', join(dir, 'o'));
  assert.equal(res.status, 0, res.stderr);
  const rep = JSON.parse(readFileSync(join(dir, 'o', 'report.json'), 'utf8'));
  assert.equal(rep.mode, 'detailed');
  assert.equal(rep.findings.length, 2);
  assert.equal(rep.findings[0].occurrences[0].snippet, '***@***');
  assert.equal(rep.verdict, 'looks_ready');
});

test('empty findings gives looks_ready', () => {
  const dir = tmp();
  const draft = fixture();
  draft.findings = [];
  draft.verdict = 'serious_risk';
  const p = join(dir, 'd.json');
  writeFileSync(p, JSON.stringify(draft));
  const res = run(p, '--mode', 'summary', '--out', join(dir, 'o'));
  assert.equal(res.status, 0, res.stderr);
  assert.equal(JSON.parse(readFileSync(join(dir, 'o', 'report.json'), 'utf8')).verdict, 'looks_ready');
});

test('invalid draft exits 1 and writes nothing', () => {
  const dir = tmp();
  const draft = fixture();
  delete draft.disclaimer;
  const p = join(dir, 'd.json');
  writeFileSync(p, JSON.stringify(draft));
  const res = run(p, '--mode', 'summary', '--out', join(dir, 'o'));
  assert.equal(res.status, 1);
  assert.match(res.stderr, /disclaimer/);
  assert.equal(existsSync(join(dir, 'o', 'report.json')), false);
});

test('bad usage exits non-zero', () => {
  assert.notEqual(run().status, 0);
  const dir = tmp();
  const p = join(dir, 'd.json');
  writeFileSync(p, JSON.stringify(fixture()));
  assert.notEqual(run(p, '--mode', 'weird').status, 0);
});

test('overwrites existing report.json', () => {
  const dir = tmp();
  const out = join(dir, 'o');
  mkdirSync(out);
  writeFileSync(join(out, 'report.json'), 'stale');
  const p = join(dir, 'd.json');
  writeFileSync(p, JSON.stringify(fixture()));
  const res = run(p, '--mode', 'summary', '--out', out);
  assert.equal(res.status, 0, res.stderr);
  assert.notEqual(readFileSync(join(out, 'report.json'), 'utf8'), 'stale');
});
