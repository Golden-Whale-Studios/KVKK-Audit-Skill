import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanProject, loadPatterns } from '../skills/kvkk-audit/scripts/lib/scan.mjs';

const RULE_IDS = new Set([
  'KVKK-PD-001', 'KVKK-SP-001', 'KVKK-CON-001', 'KVKK-NOT-001', 'KVKK-RET-001', 'KVKK-RET-002',
  'KVKK-SEC-001', 'KVKK-SEC-002', 'KVKK-SEC-003', 'KVKK-SEC-004', 'KVKK-LOG-001', 'KVKK-XB-001',
  'KVKK-CK-001', 'KVKK-DSR-001', 'KVKK-IYS-001',
]);
const cli = fileURLToPath(new URL('../skills/kvkk-audit/scripts/scan-patterns.mjs', import.meta.url));
const fixtureSrc = fileURLToPath(new URL('./fixtures/scan-project', import.meta.url));

let root;
let candidates;
const patterns = loadPatterns();

// Work on a temp copy so git-ignored dirs, the 1.1 MB file and the binary never touch the repo tree.
before(() => {
  root = mkdtempSync(join(tmpdir(), 'kvkk-scan-'));
  cpSync(fixtureSrc, root, { recursive: true });
  const leak = 'console.log(user.email); // a@example.com\n';
  const skipped = ['node_modules/x', 'kvkk-report', 'build', 'vendor', '.git', '.next', 'coverage', '.superpowers', 'pkg/node_modules/y'];
  for (const d of skipped) {
    mkdirSync(join(root, d), { recursive: true });
    writeFileSync(join(root, d, 'leak.js'), leak);
  }
  writeFileSync(join(root, 'kvkk-report', 'report.md'), 'contact: a@example.com\n');
  writeFileSync(join(root, 'big.js'), 'console.log(user.email);\n' + '// padding\n'.repeat(110000));
  writeFileSync(join(root, 'logo.png'), Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0]), Buffer.from('user@example.com')]));
  writeFileSync(join(root, 'src', 'crlf.js'), 'const a = 1;\r\nconst b = 2;\r\nlogger.info(user.email);\r\n');
  writeFileSync(join(root, 'src', 'long.js'), 'x'.repeat(500) + ' user.email\n');
  candidates = scanProject(root, patterns);
});

after(() => rmSync(root, { recursive: true, force: true }));

test('finds LOG-001 and PD-001 candidates in src/user.js', () => {
  const inUser = candidates.filter((c) => c.file === 'src/user.js');
  const log = inUser.find((c) => c.ruleId === 'KVKK-LOG-001');
  assert.ok(log);
  assert.equal(log.line, 3);
  assert.ok(inUser.some((c) => c.ruleId === 'KVKK-PD-001' && /tcKimlikNo/.test(c.match)));
  assert.ok(inUser.some((c) => c.patternId === 'pd-national-id-value'));
});

test('skipped directories, minified, big and binary files are not scanned', () => {
  const files = new Set(candidates.map((c) => c.file));
  for (const f of files) {
    assert.doesNotMatch(f, /^(node_modules|kvkk-report|dist|build|vendor|\.git|\.next|coverage|\.superpowers)\//);
    assert.doesNotMatch(f, /(^|\/)(node_modules|vendor|dist)\//);
    assert.doesNotMatch(f, /\.min\.js$/);
  }
  assert.ok(!files.has('big.js'));
  assert.ok(!files.has('logo.png'));
});

test('file paths are relative and use forward slashes', () => {
  assert.ok(candidates.length > 0);
  for (const c of candidates) {
    assert.ok(!c.file.includes('\\'), c.file);
    assert.doesNotMatch(c.file, /^([a-zA-Z]:|\/)/);
  }
});

test('line numbers are 1-based and handle CRLF', () => {
  const c = candidates.find((x) => x.file === 'src/crlf.js' && x.ruleId === 'KVKK-LOG-001');
  assert.equal(c.line, 3);
  assert.ok(!c.match.includes('\r'));
});

test('match is capped at 200 characters and keeps the hit visible', () => {
  const long = candidates.filter((c) => c.file === 'src/long.js');
  assert.ok(long.length > 0);
  for (const c of long) assert.ok(c.match.length <= 200);
  assert.ok(long.some((c) => /email/.test(c.match)));
});

test('empty directory gives []', () => {
  const empty = mkdtempSync(join(tmpdir(), 'kvkk-empty-'));
  try {
    assert.deepEqual(scanProject(empty, patterns), []);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

test('every candidate has a known ruleId and the expected shape', () => {
  for (const c of candidates) {
    assert.ok(RULE_IDS.has(c.ruleId), c.ruleId);
    assert.deepEqual(Object.keys(c).sort(), ['file', 'line', 'match', 'patternId', 'ruleId']);
  }
});

test('patterns.json: regexes compile, ids unique, ruleIds known, all groups covered', () => {
  assert.ok(Array.isArray(patterns));
  const ids = new Set();
  for (const p of patterns) {
    assert.doesNotThrow(() => new RegExp(p.regex, p.flags ?? ''), p.id);
    assert.ok(RULE_IDS.has(p.ruleId), `${p.id}: ${p.ruleId}`);
    assert.ok(p.description);
    assert.ok(!ids.has(p.id), `duplicate ${p.id}`);
    ids.add(p.id);
  }
  for (const r of ['KVKK-PD-001', 'KVKK-SP-001', 'KVKK-LOG-001', 'KVKK-SEC-001', 'KVKK-SEC-002', 'KVKK-SEC-003', 'KVKK-XB-001', 'KVKK-CK-001']) {
    assert.ok(patterns.some((p) => p.ruleId === r), r);
  }
});

test('patterns detect representative lines and skip localhost http', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kvkk-pat-'));
  try {
    writeFileSync(join(dir, 'a.js'), [
      'const url = "http://api.example.org/v1";',
      'const dev = "http://localhost:3000/x";',
      'const apiKey = "abcd1234efgh5678";',
      'hash = md5(password);',
      'if (user.password === input) {}',
      'import * as Sentry from "@sentry/node";',
      'document.cookie = "a=b";',
      'const diagnosis = patient.bloodType;',
      'const iban = "TR330006100519786457841326";',
      'fbq("track", "PageView");',
    ].join('\n'));
    const found = scanProject(dir, patterns);
    const has = (ruleId, line) => found.some((c) => c.ruleId === ruleId && c.line === line);
    assert.ok(has('KVKK-SEC-002', 1));
    assert.ok(!found.some((c) => c.ruleId === 'KVKK-SEC-002' && c.line === 2));
    assert.ok(has('KVKK-SEC-003', 3));
    assert.ok(has('KVKK-SEC-001', 4));
    assert.ok(has('KVKK-SEC-001', 5));
    assert.ok(has('KVKK-XB-001', 6));
    assert.ok(has('KVKK-CK-001', 7));
    assert.ok(has('KVKK-SP-001', 8));
    assert.ok(has('KVKK-PD-001', 9));
    assert.ok(has('KVKK-CK-001', 10));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('extensions restricts a pattern to matching files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kvkk-ext-'));
  try {
    writeFileSync(join(dir, 'a.js'), 'foo secret\n');
    writeFileSync(join(dir, 'b.py'), 'foo secret\n');
    const only = [{ id: 't', ruleId: 'KVKK-PD-001', description: 'd', regex: 'secret', extensions: ['.js'] }];
    assert.deepEqual(scanProject(dir, only).map((c) => c.file), ['a.js']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('CLI prints Candidate[] JSON; no args exits non-zero', () => {
  const res = spawnSync(process.execPath, [cli, root], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.equal(res.status, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.length, candidates.length);
  assert.notEqual(spawnSync(process.execPath, [cli], { encoding: 'utf8' }).status, 0);
});

const SIZE = 500000;
const longCases = {
  hex: 'deadbeef0123456789abcdef'.repeat(Math.ceil(SIZE / 24)),
  'a repeated': 'a'.repeat(SIZE),
  'password repeated': 'password'.repeat(SIZE / 8),
  dotted: 'a.b'.repeat(SIZE / 3),
  'authtoken repeated': 'authtoken'.repeat(Math.ceil(SIZE / 9)),
  'short words': 'console.log(a);var password=b;function f(x){return x+1}md5('.repeat(9000),
};

for (const [name, content] of Object.entries(longCases)) {
  test(`500 KB single line (${name}) scans in under 2 s`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'kvkk-long-'));
    try {
      writeFileSync(join(dir, 'main.chunk.js'), content + '\n');
      const t0 = Date.now();
      const found = scanProject(dir, patterns);
      const ms = Date.now() - t0;
      assert.ok(ms < 2000, `took ${ms} ms`);
      assert.ok(found.every((c) => c.line === 1 && c.match.length <= 200));
      const keys = found.map((c) => c.patternId);
      assert.equal(new Set(keys).size, keys.length, 'one candidate per pattern and line');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('a real match deep inside a long line is found with the right line number', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kvkk-deep-'));
  try {
    // Position 300 000 straddles a window boundary on purpose (step 3700).
    const pad = (n) => 'x = 1; '.repeat(Math.ceil(n / 7)).slice(0, n);
    const line2 = pad(299990) + ' mail "user@example.com" ' + pad(200000);
    writeFileSync(join(dir, 'bundle.js'), `// first\n${line2}\n// third\n`);
    const found = scanProject(dir, patterns);
    const hit = found.find((c) => c.patternId === 'pd-email-value');
    assert.ok(hit);
    assert.equal(hit.line, 2);
    assert.match(hit.match, /user@example\.com/);
    assert.ok(hit.match.length <= 200);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
