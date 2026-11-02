#!/usr/bin/env node
// Usage: node compare-findings.mjs <report.json> <expected-findings.json>
// File paths (`file`) are relative to the audited project's root; backslashes and a leading ./ are ignored.
// Prints { missing, unexpected, verdictOk } as JSON. Exit 1 when anything is missing, unexpected
// or the verdict differs; exit 2 on usage or read errors.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const norm = (p) => String(p).split(String.fromCharCode(92)).join('/').replace(/^(\.\/)+/, '');

export function compareFindings(report, expected) {
  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const matches = (m) =>
    findings.some(
      (f) =>
        f.ruleId === m.ruleId &&
        (m.severity === undefined || f.severity === m.severity) &&
        (m.file === undefined || (f.occurrences ?? []).some((o) => norm(o.file) === norm(m.file))),
    );
  const missing = (expected.mustFind ?? []).filter((m) => !matches(m));
  const present = new Set(findings.map((f) => f.ruleId));
  const unexpected = (expected.mustNotFind ?? []).filter((r) => present.has(r));
  return { missing, unexpected, verdictOk: report?.verdict === expected.expectedVerdict };
}

function main() {
  const [reportPath, expectedPath, ...rest] = process.argv.slice(2);
  if (!reportPath || !expectedPath || rest.length) {
    process.stderr.write('Usage: node compare-findings.mjs <report.json> <expected-findings.json>\n');
    process.exit(2);
  }
  let result;
  try {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    const expected = JSON.parse(readFileSync(expectedPath, 'utf8'));
    result = compareFindings(report, expected);
  } catch (err) {
    process.stderr.write(`Cannot read input: ${err.message}\n`);
    process.exit(2);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.missing.length || result.unexpected.length || !result.verdictOk ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
