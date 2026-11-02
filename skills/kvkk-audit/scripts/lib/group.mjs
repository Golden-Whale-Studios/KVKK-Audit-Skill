const RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

// Collapse findings to one per ruleId (summary report). Does not mutate the input.
export function groupFindings(findings, { maxExamples = 3 } = {}) {
  const groups = new Map();
  const ordered = [...findings].sort((a, b) => RANK[a.severity] - RANK[b.severity]); // stable: most severe member leads the group
  for (const f of ordered) {
    const g = groups.get(f.ruleId);
    if (!g) {
      groups.set(f.ruleId, {
        ...f,
        occurrences: [...f.occurrences],
        occurrenceCount: f.occurrenceCount ?? f.occurrences.length,
      });
      continue;
    }
    if (RANK[f.severity] < RANK[g.severity]) g.severity = f.severity;
    if (f.certainty === 'confirmed') g.certainty = 'confirmed';
    g.occurrences.push(...f.occurrences);
    g.occurrenceCount += f.occurrenceCount ?? f.occurrences.length;
  }
  return [...groups.values()]
    .map((g) => ({ ...g, occurrences: g.occurrences.slice(0, maxExamples) }))
    .sort((a, b) => RANK[a.severity] - RANK[b.severity] || (a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0));
}
