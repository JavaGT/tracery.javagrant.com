// Tracery Utilities - ES Module port

export const pluralFix = (str) => {
  const last = str[str.length - 1];
  if (last === 's' || last === 'x' || last === 'z') return str + 'es';
  if (str.endsWith('ch') || str.endsWith('sh')) return str + 'es';
  if (str.endsWith('ry') && str.length > 2) return str.slice(0, -1) + 'ies';
  return str + 's';
};

export const modifiers = {
  capitalize: (s) => s.length === 0 ? s : s[0].toUpperCase() + s.slice(1),
  capitalizeAll: (s) => s.replace(/\b\w/g, c => c.toUpperCase()),
  allCaps: (s) => s.toUpperCase(),
  a: (s) => {
    if (s.length > 0 && 'aeiouAEIOU'.includes(s[0])) return 'an ' + s;
    return 'a ' + s;
  },
  s: (s) => pluralFix(s),
  ed: (s) => {
    const last = s[s.length - 1];
    if (last === 'e') return s + 'd';
    if (last === 'y' && s.length > 1 && !'aeiou'.includes(s[s.length - 2])) return s.slice(0, -1) + 'ied';
    return s + 'ed';
  },
  ing: (s) => {
    const last = s[s.length - 1];
    if (last === 'e' && s.length > 1) return s.slice(0, -1) + 'ing';
    return s + 'ing';
  },
  comma: (s, arr) => arr ? arr.join(', ') : s,
  bq: (s) => `"${s}"`,
  titleCase: (s) => s.replace(/\b\w+/g, w => {
    const small = ['a','an','the','and','but','or','for','nor','on','at','to','by','in'];
    return small.includes(w.toLowerCase()) ? w : w[0].toUpperCase() + w.slice(1);
  }),
};
