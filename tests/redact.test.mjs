import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactSnippet } from '../skills/kvkk-audit/scripts/lib/redact.mjs';

test('masks 11-digit TCKN-like numbers preserving length', () => {
  assert.equal(redactSnippet('tc: 12345678901'), 'tc: ***********');
});
test('masks email', () => assert.equal(redactSnippet('a@b.com'), '***@***'));
test('masks email inside text', () => assert.equal(redactSnippet('to=john.doe+x@mail.example.org;'), 'to=***@***;'));
test('masks IBAN keeping TR prefix', () => {
  const out = redactSnippet('TR330006100519786457841326');
  assert.match(out, /^TR\*+$/);
  assert.equal(out.length, 26);
});
test('masks spaced IBAN', () => {
  const out = redactSnippet('iban TR33 0006 1005 1978 6457 8413 26 end');
  assert.ok(!/\d/.test(out), out);
  assert.ok(out.startsWith('iban TR'));
  assert.ok(out.endsWith(' end'));
});
test('masks phone numbers', () => {
  assert.ok(!/\d/.test(redactSnippet('+90 532 123 45 67')));
  assert.ok(!/\d/.test(redactSnippet('call 0532 123 45 67 now')));
  assert.ok(!/\d/.test(redactSnippet('05321234567')));
});
test('masks secret values', () => {
  const a = redactSnippet('password = "hunter2"');
  assert.ok(!a.includes('hunter2'), a);
  assert.ok(a.startsWith('password'));
  const b = redactSnippet("api_key: 'sk-abcdef123456'");
  assert.ok(!b.includes('sk-abcdef123456'), b);
  assert.ok(b.startsWith('api_key'));
  assert.ok(!redactSnippet('{"token":"abc.def.ghi"}').includes('abc.def.ghi'));
});
test('masks prefixed and compound secret key names, keeping the key', () => {
  for (const [input, key, secret] of [
    ['DB_PASSWORD="hunter2"', 'DB_PASSWORD', 'hunter2'],
    ['access_token = "abc123"', 'access_token', 'abc123'],
    ['client_secret: "zzz"', 'client_secret', 'zzz'],
    ['secretKey: "k99"', 'secretKey', 'k99'],
    ['private_key = "pk-777"', 'private_key', 'pk-777'],
  ]) {
    const out = redactSnippet(input);
    assert.ok(out.startsWith(key), out);
    assert.ok(!out.includes(secret), out);
  }
});
test('masks unquoted secret values up to delimiter', () => {
  assert.equal(redactSnippet('password=hunter2'), 'password=***');
  assert.equal(redactSnippet('API_KEY=sk-abc123'), 'API_KEY=***');
  assert.equal(redactSnippet('token: abc, other: 1'), 'token: ***, other: 1');
  assert.equal(redactSnippet('a=1;secret=xyz;b=2'), 'a=1;secret=***;b=2');
});
test('masks Bearer credentials', () => {
  const out = redactSnippet('Authorization: Bearer eyJhbGciOi.eyJzdWIi.sig');
  assert.equal(out, 'Authorization: Bearer ***');
});
test('masks unclosed quoted secret to end of line, keeping opening quote', () => {
  assert.equal(redactSnippet('password = "abc'), 'password = "***');
  assert.equal(redactSnippet("api_key: 'sk-12"), "api_key: '***");
});
test('masks quoted Bearer token', () => {
  assert.equal(redactSnippet('Authorization: Bearer "abc123"'), 'Authorization: Bearer ***');
  assert.equal(redactSnippet('Authorization: Bearer "abc'), 'Authorization: Bearer ***');
});
test('secret masking never crosses a newline', () => {
  assert.equal(redactSnippet('password=\nnext line'), 'password=\nnext line');
  assert.equal(redactSnippet('password = "abc\nnext'), 'password = "***\nnext');
  assert.equal(redactSnippet('token=abc\nother=1'), 'token=***\nother=1');
});
test('leaves field names alone', () => {
  assert.equal(redactSnippet('user.password'), 'user.password');
  assert.equal(redactSnippet('hash(password)'), 'hash(password)');
  assert.equal(redactSnippet('user.email'), 'user.email');
  assert.equal(redactSnippet('console.log(user.email)'), 'console.log(user.email)');
});

test('masks the right-hand side of comparisons', () => {
  assert.equal(redactSnippet('if (user.password === "hunter2")'), 'if (user.password === "***")');
  assert.equal(redactSnippet("password == 'x'"), "password == '***'");
  assert.equal(redactSnippet('if (password !== "x") {'), 'if (password !== "***") {');
  assert.equal(redactSnippet('password != "x"'), 'password != "***"');
});
test('escaped quotes cannot leak a tail', () => {
  const out = redactSnippet('{"password":"ab\\"cd"}');
  assert.ok(!out.includes('cd'), out);
  assert.ok(!out.includes('ab'), out);
});

test('credential formats must never appear in output', () => {
  const cases = [
    ['postgres://admin:s3cretpw@db.internal/app', 's3cretpw'],
    ['Authorization: Basic dXNlcjpwYXNzd29yZA==', 'dXNlcjpwYXNzd29yZA'],
    ['key sk_live_abcdef12345678', 'abcdef12345678'],
    ['key sk_test_abcdef12345678', 'abcdef12345678'],
    ['key rk_live_abcdef12345678', 'abcdef12345678'],
    ['aws AKIAIOSFODNN7EXAMPLE', 'AKIAIOSFODNN7EXAMPLE'],
    ['google AIzaSyA1234567890abcdefghijklmnopqrstuv', 'AIzaSyA1234567890'],
    ['gh ghp_abcdefghijklmnopqrstuvwxyz0123', 'ghp_abcdefghijklmnopqrstuvwxyz0123'],
    ['slack xoxb-1234567890-abcdefghij', 'xoxb-1234567890'],
    ['-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA\n-----END RSA PRIVATE KEY-----', 'MIIEowIBAAKCAQEA'],
    ['-----BEGIN PRIVATE KEY-----MIIEvQIBADAN', 'MIIEvQIBADAN'],
  ];
  for (const [input, secret] of cases) {
    const out = redactSnippet(input);
    assert.ok(!out.includes(secret), `${input} -> ${out}`);
  }
  assert.equal(redactSnippet('postgres://admin:s3cretpw@db.internal/app'), 'postgres://admin:***@db.internal/app');
  assert.equal(redactSnippet('Basic dXNlcjpwYXNzd29yZA=='), 'Basic ***');
});
