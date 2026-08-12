/**
 * MEMÓRIA · UI icon set — thin, consistent 24px strokes.
 */
const wrap = (body, label) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${
    label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'
  }>${body}</svg>`;

export const icons = {
  search: (label) => wrap(`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>`, label),
  bag: (label) =>
    wrap(`<path d="M6 8h12l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20.5Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>`, label),
  account: (label) => wrap(`<circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-3.6 4.3-5.5 8-5.5s6.6 1.9 8 5.5"/>`, label),
  menu: (label) => wrap(`<path d="M4 7h16M4 12h16M4 17h16"/>`, label),
  close: (label) => wrap(`<path d="M6 6l12 12M18 6 6 18"/>`, label),
  arrowRight: (label) => wrap(`<path d="M4 12h16M13 5l7 7-7 7"/>`, label),
  check: (label) => wrap(`<path d="M4 12.5 10 18 20 6"/>`, label),
  truck: (label) =>
    wrap(`<path d="M2 7h12v9H2zM14 10h4l3 3v3h-7"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="16.5" cy="18" r="1.8"/>`, label),
  seal: (label) =>
    wrap(`<path d="M12 3l2 2.6 3.2-.5.6 3.2 3 1.2-1.5 2.9 1.5 2.9-3 1.2-.6 3.2-3.2-.5L12 21l-2-2.6-3.2.5-.6-3.2-3-1.2 1.5-2.9L3.2 8.7l3-1.2.6-3.2 3.2.5Z"/><path d="m9 12 2.2 2.2L15.5 10"/>`, label),
  returns: (label) => wrap(`<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H8"/>`, label),
  sparkle: (label) =>
    wrap(`<path d="M12 3c.8 4.5 2.7 6.4 7.2 7.2-4.5.8-6.4 2.7-7.2 7.2-.8-4.5-2.7-6.4-7.2-7.2C9.3 9.4 11.2 7.5 12 3Z"/><path d="M19 15.5c.35 1.96 1.2 2.8 3.1 3.1-1.9.35-2.75 1.2-3.1 3.1-.35-1.9-1.2-2.75-3.1-3.1 1.9-.3 2.75-1.15 3.1-3.1Z" stroke-opacity="0.6"/>`, label),
  bottle: (label) =>
    wrap(`<path d="M10 3h4v3h-4zM9 8h6M8 10v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9c0-1-1-2-2.5-2h-3C9 8 8 9 8 10Z"/>`, label),
};
