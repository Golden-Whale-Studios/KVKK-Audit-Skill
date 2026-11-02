import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateReport } from '../skills/kvkk-audit/scripts/lib/validate.mjs';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const schema = load('../skills/kvkk-audit/schema/report.schema.json');
const fixture = () => load('./fixtures/valid-report.json');

const variants = {
  badVerdict: (r) => { r.verdict = 'ok'; return r; },
  missingDisclaimer: (r) => { delete r.disclaimer; return r; },
  badSeverity: (r) => { r.findings[0].severity = 'urgent'; return r; },
  extraTopLevel: (r) => { r.foo = 1; return r; },
};

test('valid fixture passes', () => {
  assert.deepEqual(validateReport(fixture()), []);
});

test('bad verdict reports "verdict"', () => {
  const errs = validateReport(variants.badVerdict(fixture()));
  assert.ok(errs.some((e) => e.includes('verdict')), errs.join('\n'));
});

test('missing disclaimer is an error', () => {
  const errs = validateReport(variants.missingDisclaimer(fixture()));
  assert.ok(errs.some((e) => e.includes('disclaimer')), errs.join('\n'));
});

test('bad severity reports findings[0].severity', () => {
  const errs = validateReport(variants.badSeverity(fixture()));
  assert.ok(errs.some((e) => e.includes('findings[0].severity')), errs.join('\n'));
});

test('extra top-level property is an error', () => {
  const errs = validateReport(variants.extraTopLevel(fixture()));
  assert.ok(errs.some((e) => e.includes('foo')), errs.join('\n'));
});

test('non-object input is an error', () => {
  assert.ok(validateReport(null).length > 0);
  assert.ok(validateReport([]).length > 0);
});

test('agrees with ajv on fixture and all invalid variants', () => {
  const validate = new Ajv2020({ allErrors: true }).compile(schema);
  assert.equal(validate(fixture()), validateReport(fixture()).length === 0);
  for (const [name, mutate] of Object.entries(variants)) {
    const ajvOk = validate(mutate(fixture()));
    const ours = validateReport(mutate(fixture())).length === 0;
    assert.equal(ours, ajvOk, name);
    assert.equal(ajvOk, false, name);
  }
});
