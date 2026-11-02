const stars = (s) => '*'.repeat(s.length);

// Order matters: structured identifiers first, then loose digit runs.
const RULES = [
  // bearer credentials
  [/\bBearer[ \t]+["']?[^\s"',;]+["']?/gi, () => 'Bearer ***'],
  // secret-looking assignments (prefixed/compound key names, quoted or unquoted values): keep the key, mask the value.
  // The separator consumes whole comparison operators (==, ===, !=, !==) so the right-hand side is masked too.
  [/([\w.-]*(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key)[\w.-]*["']?[ \t]*(?:[!=]==?|[:=])[ \t]*)(?:(["'])(?:\\.|(?!\2).)*\2|(["'])[^\n]*|[^\s,;"'&)}\]]+)/gi,
    // closed quote: keep both quotes; unclosed quote: mask to end of line; unquoted: mask the token
    (_m, key, q, openQ) => (q ? `${key}${q}***${q}` : openQ ? `${key}${openQ}***` : `${key}***`)],
  // credentials embedded in URLs, HTTP Basic, well-known key prefixes, PEM private keys
  [/([a-z][a-z0-9+.-]*:\/\/[^\s:\/@]+:)[^\s@\/]+@/gi, (_m, pre) => `${pre}***@`],
  [/\bBasic[ \t]+[A-Za-z0-9+\/=]{8,}/g, () => 'Basic ***'],
  [/\b(?:[sr]k_(?:live|test)_[0-9A-Za-z]{8,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[abposr]-[A-Za-z0-9-]{10,})/g, () => '***'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*/g, () => '-----BEGIN PRIVATE KEY----- ***'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, () => '***@***'],
  // IBAN (Turkish): TR + 24 digits, optional spaces
  [/\bTR\d{2}(?: ?\d){22}\b/g, (m) => 'TR' + stars(m.slice(2))],
  // TCKN-like 11 digits
  [/(?<!\d)\d{11}(?!\d)/g, stars],
  // phone: optional +cc, then 3-3-2-2 digits with optional separators
  [/(?<![\d*])(?:\+\d{1,3}[ .-]?)?\(?0?\d{3}\)?[ .-]?\d{3}[ .-]?\d{2}[ .-]?\d{2}(?!\d)/g, stars],
];

export function redactSnippet(text) {
  let out = text;
  for (const [re, fn] of RULES) out = out.replace(re, fn);
  return out;
}
