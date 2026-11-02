import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanProject, loadPatterns } from '../skills/kvkk-audit/scripts/lib/scan.mjs';
import { compareFindings } from '../skills/kvkk-audit/scripts/compare-findings.mjs';

const examplesDir = fileURLToPath(new URL('../examples/', import.meta.url));
const cli = fileURLToPath(new URL('../skills/kvkk-audit/scripts/compare-findings.mjs', import.meta.url));
const NAMES = ['node-express-leaky', 'python-fastapi-leaky', 'android-kotlin-leaky', 'node-clean'];
const VERDICTS = ['serious_risk', 'fixes_needed', 'looks_ready'];
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const RULE_IDS = new Set([
  'KVKK-PD-001', 'KVKK-SP-001', 'KVKK-CON-001', 'KVKK-NOT-001', 'KVKK-RET-001', 'KVKK-RET-002',
  'KVKK-SEC-001', 'KVKK-SEC-002', 'KVKK-SEC-003', 'KVKK-SEC-004', 'KVKK-LOG-001', 'KVKK-XB-001',
  'KVKK-CK-001', 'KVKK-DSR-001', 'KVKK-IYS-001',
]);
const patterns = loadPatterns();
const patternRules = new Set(patterns.map((p) => p.ruleId));
const load = (n) => JSON.parse(readFileSync(join(examplesDir, n, 'expected-findings.json'), 'utf8'));

for (const name of NAMES) {
  test(`${name}: expected-findings.json is well formed`, () => {
    assert.ok(existsSync(join(examplesDir, name, 'README.md')));
    assert.ok(!existsSync(join(examplesDir, name, 'kvkk-report')));
    assert.ok(!existsSync(join(examplesDir, name, 'node_modules')));
    const e = load(name);
    assert.ok(VERDICTS.includes(e.expectedVerdict));
    assert.ok(Array.isArray(e.mustFind) && Array.isArray(e.mustNotFind));
    for (const m of e.mustFind) {
      assert.ok(RULE_IDS.has(m.ruleId), m.ruleId);
      if (m.file !== undefined) {
        assert.ok(!m.file.includes(String.fromCharCode(92)));
        assert.ok(existsSync(join(examplesDir, name, m.file)), m.file);
      }
      if (m.severity !== undefined) assert.ok(SEVERITIES.includes(m.severity));
    }
    for (const r of e.mustNotFind) assert.ok(RULE_IDS.has(r), r);
  });

  test(`${name}: scanner finds a candidate for each pattern-based mustFind`, () => {
    const e = load(name);
    const cands = scanProject(join(examplesDir, name), patterns);
    for (const m of e.mustFind.filter((x) => patternRules.has(x.ruleId))) {
      assert.ok(
        cands.some((c) => c.ruleId === m.ruleId && (!m.file || c.file === m.file)),
        `no candidate for ${m.ruleId} ${m.file ?? ''}`,
      );
    }
  });
}

test('node-clean: no candidates for mustNotFind rules, and required exclusions present', () => {
  const e = load('node-clean');
  assert.equal(e.expectedVerdict, 'looks_ready');
  assert.ok(e.mustNotFind.includes('KVKK-LOG-001') && e.mustNotFind.includes('KVKK-SEC-001'));
  const cands = scanProject(join(examplesDir, 'node-clean'), patterns);
  for (const r of e.mustNotFind) assert.deepEqual(cands.filter((c) => c.ruleId === r), [], r);
});

test('expected verdicts and key rules per example', () => {
  assert.equal(load('node-express-leaky').expectedVerdict, 'serious_risk');
  assert.equal(load('python-fastapi-leaky').expectedVerdict, 'serious_risk');
  assert.equal(load('android-kotlin-leaky').expectedVerdict, 'fixes_needed');
  const py = load('python-fastapi-leaky').mustFind;
  for (const r of ['KVKK-SP-001', 'KVKK-SEC-004', 'KVKK-XB-001']) assert.ok(py.some((m) => m.ruleId === r));
  assert.equal(py.find((m) => m.ruleId === 'KVKK-XB-001').severity, 'high');
});

const f = (ruleId, file, severity = 'medium') => ({ ruleId, severity, occurrences: [{ file, line: 1 }] });

test('compareFindings: reports missing, unexpected and verdict', () => {
  const expected = {
    expectedVerdict: 'serious_risk',
    mustFind: [{ ruleId: 'KVKK-SEC-001', file: 'src/a.js' }, { ruleId: 'KVKK-LOG-001' }, { ruleId: 'KVKK-RET-002' }],
    mustNotFind: ['KVKK-SEC-003'],
  };
  const report = {
    verdict: 'fixes_needed',
    findings: [f('KVKK-SEC-001', 'src/other.js'), f('KVKK-LOG-001', 'x.js'), f('KVKK-SEC-003', 'c.js')],
  };
  const r = compareFindings(report, expected);
  assert.deepEqual(r.missing, [{ ruleId: 'KVKK-SEC-001', file: 'src/a.js' }, { ruleId: 'KVKK-RET-002' }]);
  assert.deepEqual(r.unexpected, ['KVKK-SEC-003']);
  assert.equal(r.verdictOk, false);
});

test('compareFindings: all satisfied, severity checked when given', () => {
  const expected = {
    expectedVerdict: 'fixes_needed',
    mustFind: [{ ruleId: 'KVKK-XB-001', file: 'a.py', severity: 'high' }],
    mustNotFind: [],
  };
  const ok = compareFindings({ verdict: 'fixes_needed', findings: [f('KVKK-XB-001', 'a.py', 'high')] }, expected);
  assert.deepEqual(ok, { missing: [], unexpected: [], verdictOk: true });
  const low = compareFindings({ verdict: 'fixes_needed', findings: [f('KVKK-XB-001', 'a.py', 'info')] }, expected);
  assert.equal(low.missing.length, 1);
});

test('compareFindings: file paths are normalised', () => {
  const expected = { expectedVerdict: 'looks_ready', mustFind: [{ ruleId: 'KVKK-LOG-001', file: 'src/x.js' }], mustNotFind: [] };
  for (const file of ['./src/x.js', ['src', 'x.js'].join(String.fromCharCode(92)),'src/x.js']) {
    const r = compareFindings({ verdict: 'looks_ready', findings: [f('KVKK-LOG-001', file)] }, expected);
    assert.deepEqual(r.missing, [], file);
  }
});

test('compare-findings CLI exit codes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kvkk-cmp-'));
  try {
    const exp = join(dir, 'e.json');
    writeFileSync(exp, JSON.stringify({ expectedVerdict: 'looks_ready', mustFind: [], mustNotFind: ['KVKK-LOG-001'] }));
    const good = join(dir, 'g.json');
    writeFileSync(good, JSON.stringify({ verdict: 'looks_ready', findings: [] }));
    const bad = join(dir, 'b.json');
    writeFileSync(bad, JSON.stringify({ verdict: 'fixes_needed', findings: [f('KVKK-LOG-001', 'a.js')] }));
    const run = (r) => spawnSync(process.execPath, [cli, r, exp], { encoding: 'utf8' });
    const a = run(good);
    assert.equal(a.status, 0);
    assert.equal(JSON.parse(a.stdout).verdictOk, true);
    assert.equal(run(bad).status, 1);
    assert.equal(spawnSync(process.execPath, [cli], { encoding: 'utf8' }).status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
