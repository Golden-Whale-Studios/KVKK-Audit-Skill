#!/usr/bin/env node
// Usage: node finalize-report.mjs <draft.json> --mode summary|detailed [--out <dir>]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateReport } from './lib/validate.mjs';
import { computeVerdict } from './lib/verdict.mjs';
import { groupFindings } from './lib/group.mjs';
import { redactSnippet } from './lib/redact.mjs';

function fail(msg, code) {
  process.stderr.write(msg + '\n');
  process.exit(code);
}

const args = process.argv.slice(2);
let draftPath;
let mode;
let outDir = 'kvkk-report';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--mode') mode = args[++i];
  else if (args[i] === '--out') outDir = args[++i];
  else if (!draftPath) draftPath = args[i];
  else fail(`Unexpected argument: ${args[i]}`, 2);
}
if (!draftPath || !outDir || (mode !== 'summary' && mode !== 'detailed')) {
  fail('Usage: node finalize-report.mjs <draft.json> --mode summary|detailed [--out <dir>]', 2);
}

let draft;
try {
  draft = JSON.parse(readFileSync(draftPath, 'utf8'));
} catch (e) {
  fail(`Cannot read draft: ${e.message}`, 2);
}

const redacted = (draft.findings ?? []).map((f) => ({
  ...f,
  occurrences: (f.occurrences ?? []).map((o) =>
    typeof o.snippet === 'string' ? { ...o, snippet: redactSnippet(o.snippet) } : o),
}));
const findings = mode === 'summary' ? groupFindings(redacted) : redacted;
const report = { ...draft, mode, findings, verdict: computeVerdict(findings) };

const errors = validateReport(report);
if (errors.length) fail(errors.join('\n'), 1);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
