// Candidate pattern scanner: walks a project and reports lines matching patterns.json.
// Candidates are leads for the agent to verify, not findings.
import { readdirSync, readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, extname } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'vendor', '.next', 'coverage', 'kvkk-report', '.superpowers']);
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_MATCH_CHARS = 200;
const BINARY_PROBE_BYTES = 8192;
const WINDOW_CHARS = 4000;
const WINDOW_OVERLAP = 300;

export function loadPatterns() {
  return JSON.parse(readFileSync(new URL('../patterns.json', import.meta.url), 'utf8'));
}

function isBinary(path) {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(BINARY_PROBE_BYTES);
    const n = readSync(fd, buf, 0, BINARY_PROBE_BYTES, 0);
    return buf.subarray(0, n).includes(0);
  } finally {
    closeSync(fd);
  }
}

function* walk(dir, rel = '') {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    const relPath = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(join(dir, e.name), relPath);
    } else if (e.isFile()) {
      if (/\.min\.js$/i.test(e.name)) continue;
      yield { abs: join(dir, e.name), rel: relPath };
    }
  }
}

function compile(patterns) {
  return patterns.map((p) => {
    const flags = (p.flags ?? '').replace(/[gy]/g, '');
    return {
      ...p,
      re: new RegExp(p.regex, flags),
      exts: p.extensions ? p.extensions.map((x) => x.toLowerCase()) : null,
    };
  });
}

// Whole line for context, capped; long lines are cut around the match so the hit stays visible.
function snippetAround(line, index) {
  const start = line.length > MAX_MATCH_CHARS ? Math.max(0, index - 60) : 0;
  return line.slice(start, start + MAX_MATCH_CHARS).trim();
}

export function scanProject(rootDir, patterns) {
  const compiled = compile(patterns);
  const out = [];
  for (const f of walk(rootDir)) {
    let size;
    try {
      size = statSync(f.abs).size;
      if (size > MAX_FILE_BYTES || size === 0 || isBinary(f.abs)) continue;
    } catch {
      continue;
    }
    const ext = extname(f.rel).toLowerCase();
    const active = compiled.filter((p) => !p.exts || p.exts.includes(ext));
    if (active.length === 0) continue;
    let text;
    try {
      text = readFileSync(f.abs, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split(/\r\n|\n|\r/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      // Regexes only ever see a bounded window, so no pattern can go quadratic on huge lines.
      // Long lines use overlapping windows; each (pattern, line) yields at most one candidate.
      let pending = active;
      for (let start = 0; pending.length > 0 && start < line.length; start += WINDOW_CHARS - WINDOW_OVERLAP) {
        const win = line.length > WINDOW_CHARS ? line.slice(start, start + WINDOW_CHARS) : line;
        const still = [];
        for (const p of pending) {
          const m = p.re.exec(win);
          if (!m) {
            still.push(p);
            continue;
          }
          out.push({
            patternId: p.id,
            ruleId: p.ruleId,
            file: f.rel,
            line: i + 1,
            match: snippetAround(win, m.index),
          });
        }
        pending = still;
        if (start + WINDOW_CHARS >= line.length) break;
      }
    }
  }
  return out;
}
