import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeVerdict } from '../skills/kvkk-audit/scripts/lib/verdict.mjs';

const f = (severity, certainty = 'confirmed') => ({ severity, certainty });

test('no findings is looks_ready', () => assert.equal(computeVerdict([]), 'looks_ready'));
test('info and low only is looks_ready', () => assert.equal(computeVerdict([f('info'), f('low')]), 'looks_ready'));
test('medium is fixes_needed', () => assert.equal(computeVerdict([f('medium')]), 'fixes_needed'));
test('high plus low is fixes_needed', () => assert.equal(computeVerdict([f('high'), f('low')]), 'fixes_needed'));
test('unverified critical is serious_risk', () => assert.equal(computeVerdict([f('critical', 'needs_verification')]), 'serious_risk'));
test('critical wins over high', () => assert.equal(computeVerdict([f('high'), f('critical')]), 'serious_risk'));
