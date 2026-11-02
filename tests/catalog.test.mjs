import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const refs = fileURLToPath(new URL('../skills/kvkk-audit/references', import.meta.url));
const rulesDir = join(refs, 'rules');

const RULE_IDS = [
  'KVKK-PD-001', 'KVKK-SP-001', 'KVKK-CON-001', 'KVKK-NOT-001', 'KVKK-RET-001', 'KVKK-RET-002',
  'KVKK-SEC-001', 'KVKK-SEC-002', 'KVKK-SEC-003', 'KVKK-SEC-004', 'KVKK-LOG-001', 'KVKK-XB-001',
  'KVKK-CK-001', 'KVKK-DSR-001', 'KVKK-IYS-001',
];
const RULE_FILES = [
  'personal-data', 'special-categories', 'consent', 'notice', 'retention', 'security', 'logging',
  'cross-border', 'cookies', 'data-subject-rights', 'commercial-messages',
];
const SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);
const ROLES = new Set(['controller', 'processor', 'both']);
const REQUIRED_HEADINGS = [
  '**Default severity:**', '**Applies to:**', '**Legal basis:**',
  '### What to look for', '### Common patterns', '### Needs-verification when', '### Recommendation',
];
const CONTROLLER_ONLY = ['KVKK-CON-001', 'KVKK-NOT-001', 'KVKK-DSR-001'];

const read = (p) => readFileSync(p, 'utf8');
const ruleFiles = () => (existsSync(rulesDir) ? readdirSync(rulesDir).filter((f) => f.endsWith('.md')) : []);
const urlsIn = (text) => [...text.matchAll(/https:\/\/[^\s)<>\]"'`]+/g)].map((m) => m[0].replace(/[.,;:]+$/, ''));

// Split every rule file into { id, file, body } sections starting at "## <ID>:".
function ruleSections() {
  const out = [];
  for (const f of ruleFiles()) {
    const parts = read(join(rulesDir, f)).split(/^(?=## KVKK-[A-Z]+-\d{3}:)/m);
    for (const part of parts) {
      const m = part.match(/^## (KVKK-[A-Z]+-\d{3}):/);
      if (m) out.push({ id: m[1], file: f, body: part });
    }
  }
  return out;
}

test('all planned rule files exist', () => {
  for (const name of RULE_FILES) assert.ok(existsSync(join(rulesDir, `${name}.md`)), `missing rules/${name}.md`);
});

test('each of the 15 rule IDs is defined exactly once across rule files', () => {
  const sections = ruleSections();
  for (const id of RULE_IDS) {
    const hits = sections.filter((s) => s.id === id);
    assert.equal(hits.length, 1, `${id} defined ${hits.length} times (${hits.map((h) => h.file).join(', ')})`);
  }
  for (const s of sections) assert.ok(RULE_IDS.includes(s.id), `unknown rule id ${s.id} in ${s.file}`);
});

test('every rule has all required headings', () => {
  const sections = ruleSections();
  assert.ok(sections.length >= RULE_IDS.length);
  for (const s of sections) {
    for (const h of REQUIRED_HEADINGS) assert.ok(s.body.includes(h), `${s.id} missing "${h}"`);
  }
});

test('default severity is a valid enum; KVKK-XB-001 is info', () => {
  for (const s of ruleSections()) {
    const m = s.body.match(/\*\*Default severity:\*\*\s*`?([a-z_]+)`?/);
    assert.ok(m, `${s.id} has no parsable severity`);
    assert.ok(SEVERITIES.has(m[1]), `${s.id} severity "${m[1]}" invalid`);
    if (s.id === 'KVKK-XB-001') assert.equal(m[1], 'info');
  }
});

test('applies-to is controller|processor|both; controller-only rules say controller', () => {
  for (const s of ruleSections()) {
    const m = s.body.match(/\*\*Applies to:\*\*\s*`?([a-z]+)`?/);
    assert.ok(m && ROLES.has(m[1]), `${s.id} has invalid Applies to`);
    if (CONTROLLER_ONLY.includes(s.id)) assert.equal(m[1], 'controller', `${s.id} must apply to controller`);
  }
});

test('legal basis of every rule carries an official link', () => {
  for (const s of ruleSections()) {
    const line = s.body.split('\n').find((l) => l.includes('**Legal basis:**'));
    assert.match(line, /https:\/\/(www\.)?(mevzuat\.gov\.tr|kvkk\.gov\.tr|resmigazete\.gov\.tr|([a-z]+\.)?ticaret\.gov\.tr)/, `${s.id} legal basis has no official link`);
  }
});

test('KVKK-XB-001 states the grouping, checklist and escalation policy', () => {
  const xb = ruleSections().find((s) => s.id === 'KVKK-XB-001');
  assert.ok(xb);
  assert.match(xb.body, /single (grouped )?finding/i);
  assert.match(xb.body, /CL-XB-SAFEGUARDS/);
  assert.match(xb.body, /`high`/);
  assert.match(xb.body, /special[- ]category/i);
});

test('every https link in rule files and checklist is listed in sources.md', () => {
  const sources = read(join(refs, 'sources.md'));
  const listed = new Set(urlsIn(sources));
  const files = [...ruleFiles().map((f) => join(rulesDir, f)), join(refs, 'checklist.md')];
  for (const p of files) {
    for (const url of urlsIn(read(p))) assert.ok(listed.has(url), `${url} (in ${p}) not listed in sources.md`);
  }
});

test('sources.md has a Last verified line', () => {
  assert.match(read(join(refs, 'sources.md')), /^Last verified: 2026-\d{2}-\d{2}/m);
});

test('checklist.md contains the required items with roles', () => {
  const cl = read(join(refs, 'checklist.md'));
  for (const id of ['CL-VERBIS', 'CL-PROCESSOR-CONTRACTS', 'CL-BREACH-72H', 'CL-PRIVACY-NOTICE-CONTENT', 'CL-RETENTION-POLICY', 'CL-XB-SAFEGUARDS']) {
    assert.match(cl, new RegExp(`^## ${id}\\b`, 'm'), `checklist missing ${id}`);
  }
  const verbis = cl.split(/^(?=## CL-)/m).find((p) => p.startsWith('## CL-VERBIS'));
  assert.match(verbis, /\*\*Applies to:\*\*\s*`?controller`?/);
});

test('severity.md restates the verdict rule and enums', () => {
  const sev = read(join(refs, 'severity.md'));
  for (const v of ['critical', 'high', 'medium', 'low', 'info', 'confirmed', 'needs_verification', 'serious_risk', 'fixes_needed', 'looks_ready', 'KVKK-XB-001']) {
    assert.ok(sev.includes(`\`${v}\``), `severity.md missing \`${v}\``);
  }
});
