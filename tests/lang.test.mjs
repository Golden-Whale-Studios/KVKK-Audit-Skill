import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveLanguage } from '../skills/kvkk-audit/scripts/lib/lang.mjs';

const cli = fileURLToPath(new URL('../skills/kvkk-audit/scripts/detect-language.mjs', import.meta.url));

test('conversation language wins over everything', () =>
  assert.equal(resolveLanguage({ conversationLang: 'de', env: { LANG: 'tr_TR.UTF-8' } }), 'de'));
test('LANG tr_TR.UTF-8 yields tr', () =>
  assert.equal(resolveLanguage({ env: { LANG: 'tr_TR.UTF-8' } }), 'tr'));
test('LANG C is ignored and falls back to intl locale', () =>
  assert.equal(resolveLanguage({ env: { LANG: 'C' }, intlLocale: 'fr-FR' }), 'fr'));
test('nothing known falls back to en', () => assert.equal(resolveLanguage({}), 'en'));
test('LANGUAGE uses its first element', () =>
  assert.equal(resolveLanguage({ env: { LANGUAGE: 'pt_BR:en' } }), 'pt'));
test('LC_ALL beats LC_MESSAGES, LANG and LANGUAGE', () =>
  assert.equal(resolveLanguage({ env: { LC_ALL: 'de_DE.UTF-8', LC_MESSAGES: 'fr_FR', LANG: 'tr_TR', LANGUAGE: 'pt' } }), 'de'));
test('LC_MESSAGES beats LANG', () =>
  assert.equal(resolveLanguage({ env: { LC_MESSAGES: 'fr_FR', LANG: 'tr_TR' } }), 'fr'));
test('empty env values are treated as missing', () =>
  assert.equal(resolveLanguage({ env: { LC_ALL: '', LANG: '', LANGUAGE: '' }, intlLocale: 'es-ES' }), 'es'));
test('POSIX and C.UTF-8 are ignored at every env step', () =>
  assert.equal(resolveLanguage({ env: { LC_ALL: 'POSIX', LC_MESSAGES: 'C.UTF-8', LANG: 'C', LANGUAGE: 'POSIX' }, intlLocale: 'it-IT' }), 'it'));
test('LANGUAGE skips ignored leading entries', () =>
  assert.equal(resolveLanguage({ env: { LANGUAGE: 'C:tr_TR' } }), 'tr'));
test('result is lowercased primary subtag', () =>
  assert.equal(resolveLanguage({ conversationLang: 'EN-GB' }), 'en'));
test('invalid conversationLang falls through', () =>
  assert.equal(resolveLanguage({ conversationLang: '  ', env: { LANG: 'tr_TR' } }), 'tr'));
test('CLI prints tr for LANG=tr_TR.UTF-8', () => {
  const env = { ...process.env, LANG: 'tr_TR.UTF-8' };
  delete env.LC_ALL;
  delete env.LC_MESSAGES;
  delete env.LANGUAGE;
  const r = spawnSync(process.execPath, [cli], { env, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), 'tr');
});
