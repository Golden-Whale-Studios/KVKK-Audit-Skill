// Verdict rule: any critical -> serious_risk; else any high/medium -> fixes_needed; else looks_ready.
// Findings with certainty "needs_verification" count the same as confirmed ones.
export function computeVerdict(findings) {
  if (findings.some((f) => f.severity === 'critical')) return 'serious_risk';
  if (findings.some((f) => f.severity === 'high' || f.severity === 'medium')) return 'fixes_needed';
  return 'looks_ready';
}
