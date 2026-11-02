import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const skillDir = join(root, 'skills', 'kvkk-audit');
const read = (...p) => readFileSync(join(...p), 'utf8');

// Minimal frontmatter parser: `key: value` lines between the leading `---` fences.
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(m, 'SKILL.md must start with a --- frontmatter block');
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[kv[1]] = v;
  }
  return out;
}

// Every skill-relative path mentioned in a document, e.g. references/workflow.md or <SKILL_DIR>/scripts/x.mjs.
function skillPaths(text) {
  const found = new Set();
  for (const m of text.matchAll(/(?<![\w.-])(references|scripts|schema)\/[\w./*-]*[\w*]/g)) found.add(m[0]);
  return [...found];
}

test('SKILL.md frontmatter has name kvkk-audit and a KVKK trigger description', () => {
  const fm = frontmatter(read(skillDir, 'SKILL.md'));
  assert.equal(fm.name, 'kvkk-audit');
  assert.ok(fm.description && fm.description.length >= 1 && fm.description.length <= 1024,
    `description length ${fm.description?.length}`);
  assert.match(fm.description, /KVKK/);
  for (const phrase of [/Turkish data protection/i, /launch in Turkey/i, /kişisel veri denetimi/i]) {
    assert.match(fm.description, phrase);
  }
});

for (const doc of ['SKILL.md', join('references', 'workflow.md')]) {
  test(`every references/, scripts/, schema/ path in ${doc} exists`, () => {
    const paths = skillPaths(read(skillDir, doc));
    assert.ok(paths.length > 0, `${doc} mentions no skill paths`);
    for (const p of paths) {
      // A glob such as references/rules/*.md is checked through its directory.
      const target = p.includes('*') ? dirname(p.slice(0, p.indexOf('*')) + 'x') : p;
      assert.ok(existsSync(join(skillDir, target)), `${doc} mentions missing path ${p}`);
    }
  });
}

for (const doc of ['SKILL.md', join('references', 'workflow.md')]) {
  test(`every relative Markdown link in ${doc} resolves`, () => {
    const base = dirname(join(skillDir, doc));
    for (const m of read(skillDir, doc).matchAll(/\]\(([^)#\s]+)\)/g)) {
      if (/^[a-z]+:/i.test(m[1])) continue;
      assert.ok(existsSync(join(base, m[1])), `${doc} links to missing ${m[1]}`);
    }
  });
}

test('SKILL.md links the workflow, template, language and severity references', () => {
  const text = read(skillDir, 'SKILL.md');
  for (const p of ['references/workflow.md', 'references/report-template.md', 'references/language.md',
    'references/severity.md', 'references/checklist.md']) {
    assert.ok(text.includes(p), `SKILL.md does not mention ${p}`);
  }
});

test('plugin.json is valid JSON with matching name, version and license', () => {
  const plugin = JSON.parse(read(root, '.claude-plugin', 'plugin.json'));
  assert.equal(plugin.name, 'kvkk-audit');
  assert.equal(plugin.version, '0.1.0');
  assert.equal(plugin.license, 'MIT');
});

test('AGENTS.md and the Cursor rule point to skills/kvkk-audit/SKILL.md', () => {
  for (const p of [['AGENTS.md'], ['.cursor', 'rules', 'kvkk-audit.mdc']]) {
    assert.ok(read(root, ...p).includes('skills/kvkk-audit/SKILL.md'), `${p.join('/')} does not point to SKILL.md`);
  }
});

test('report-template.md contains the English and Turkish disclaimer', () => {
  const text = read(skillDir, 'references', 'report-template.md');
  for (const phrase of ['technical pre-screen', 'not legal advice', 'not a legal guarantee',
    'teknik bir ön tarama', 'hukuki görüş değildir', 'hukuki bir güvencesi değildir']) {
    assert.ok(text.includes(phrase), `disclaimer phrase missing: ${phrase}`);
  }
});

test('language.md contains the KVKK glossary terms', () => {
  const text = read(skillDir, 'references', 'language.md');
  for (const term of ['açık rıza', 'aydınlatma yükümlülüğü', 'veri sorumlusu', 'veri işleyen',
    'özel nitelikli kişisel veri', 'VERBİS', 'ilgili kişi', 'Kurul']) {
    assert.ok(text.includes(term), `glossary term missing: ${term}`);
  }
});

test('tool.version in workflow.md skeleton matches package.json and plugin.json', () => {
  const wf = read(skillDir, 'references', 'workflow.md');
  const m = wf.match(/"tool":\s*\{\s*"name":\s*"kvkk-audit",\s*"version":\s*"([^"]+)"/);
  assert.ok(m, 'workflow.md must contain a tool.version in the draft skeleton');
  const pkg = JSON.parse(read(root, 'package.json')).version;
  const plugin = JSON.parse(read(root, '.claude-plugin', 'plugin.json')).version;
  assert.equal(m[1], pkg);
  assert.equal(pkg, plugin);
});
