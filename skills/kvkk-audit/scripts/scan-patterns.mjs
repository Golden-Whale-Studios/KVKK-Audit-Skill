#!/usr/bin/env node
// Usage: node scan-patterns.mjs <projectDir>  -> prints Candidate[] JSON to stdout.
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadPatterns, scanProject } from './lib/scan.mjs';

const dir = process.argv[2];
if (!dir || process.argv.length > 3) {
  console.error('Usage: node scan-patterns.mjs <projectDir>');
  process.exit(2);
}
try {
  if (!statSync(resolve(dir)).isDirectory()) throw new Error('not a directory');
} catch {
  console.error(`Not a readable directory: ${dir}`);
  process.exit(2);
}
process.stdout.write(JSON.stringify(scanProject(resolve(dir), loadPatterns()), null, 2) + '\n');
