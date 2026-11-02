// Masks a contact value before it is written anywhere near a log.
export function maskContact(value) {
  const s = String(value);
  return s.length <= 2 ? '**' : s[0] + '*'.repeat(s.length - 2) + s[s.length - 1];
}
