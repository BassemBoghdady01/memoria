/**
 * MEMÓRIA · Rubber-stamp marks. Typographic ink impressions (with a
 * turbulence filter for uneven ink), used sparingly as archival detail.
 * They carry no dates or claims.
 */
let uid = 0;

export function roundStamp({ top = 'MEMÓRIA', bottom = 'CAIRO', center = 'ARCHIVE', cls = '' } = {}) {
  const id = `st${++uid}`;
  return `<svg class="inkstamp ${cls}" viewBox="0 0 160 160" aria-hidden="true">
    <defs>
      <filter id="${id}f"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${uid}"/><feDisplacementMap in="SourceGraphic" scale="2.4"/>
        <feComponentTransfer><feFuncA type="discrete" tableValues="0 .9 1 1 .85 1"/></feComponentTransfer></filter>
      <path id="${id}t" d="M80,80 m-56,0 a56,56 0 1,1 112,0"/>
      <path id="${id}b" d="M80,80 m-56,0 a56,56 0 0,0 112,0"/>
    </defs>
    <g filter="url(#${id}f)" fill="none" stroke="currentColor">
      <circle cx="80" cy="80" r="74" stroke-width="2.4"/>
      <circle cx="80" cy="80" r="44" stroke-width="1.2"/>
      <text font-family="Georgia, serif" font-size="15" letter-spacing="4" fill="currentColor" stroke="none"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">${top}</textPath></text>
      <text font-family="Georgia, serif" font-size="13" letter-spacing="5" fill="currentColor" stroke="none"><textPath href="#${id}b" startOffset="50%" text-anchor="middle" dominant-baseline="hanging">${bottom}</textPath></text>
      <text x="80" y="86" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="2" fill="currentColor" stroke="none">${center}</text>
    </g>
  </svg>`;
}

export function rectStamp({ lines = ['MEMÓRIA', 'ARCHIVE'], foot = 'CAIRO', cls = '' } = {}) {
  const id = `st${++uid}`;
  return `<svg class="inkstamp inkstamp--rect ${cls}" viewBox="0 0 170 150" aria-hidden="true">
    <defs><filter id="${id}f"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${uid + 7}"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></defs>
    <g filter="url(#${id}f)" fill="none" stroke="currentColor">
      <rect x="6" y="6" width="158" height="138" rx="4" stroke-width="2.4" stroke-dasharray="6 3"/>
      <rect x="16" y="16" width="138" height="118" rx="2" stroke-width="1"/>
      ${lines.map((l, i) => `<text x="85" y="${52 + i * 24}" text-anchor="middle" font-family="Georgia, serif" font-size="${i ? 15 : 19}" letter-spacing="3" fill="currentColor" stroke="none">${l}</text>`).join('')}
      <line x1="40" y1="${66 + (lines.length - 1) * 24}" x2="130" y2="${66 + (lines.length - 1) * 24}" stroke-width="1"/>
      <text x="85" y="${92 + (lines.length - 1) * 24}" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="6" fill="currentColor" stroke="none">${foot}</text>
    </g>
  </svg>`;
}
