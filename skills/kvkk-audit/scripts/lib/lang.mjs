// Report language: conversation -> LC_ALL -> LC_MESSAGES -> LANG -> LANGUAGE (first entry) -> Intl locale -> "en".
// Returns the lowercased primary language subtag (tr_TR.UTF-8 -> "tr", fr-FR -> "fr").
// Empty values and the C/POSIX locales are treated as missing.
const IGNORED = new Set(['c', 'posix']);

function primarySubtag(value) {
  if (typeof value !== 'string') return null;
  const tag = value.trim().split(/[_.@-]/)[0].toLowerCase();
  if (!/^[a-z]{2,3}$/.test(tag) || IGNORED.has(tag)) return null;
  return tag;
}

export function resolveLanguage({ conversationLang, env = {}, intlLocale } = {}) {
  const candidates = [
    primarySubtag(conversationLang),
    primarySubtag(env.LC_ALL),
    primarySubtag(env.LC_MESSAGES),
    primarySubtag(env.LANG),
    (env.LANGUAGE ?? '').split(':').map(primarySubtag).find(Boolean),
    primarySubtag(intlLocale),
  ];
  return candidates.find(Boolean) ?? 'en';
}
