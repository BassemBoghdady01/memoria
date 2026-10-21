/**
 * MEMÓRIA · A round postmark in Nile Teal ink, the kind stamped over a
 * letter from Cairo. Pure SVG, decorative only (aria-hidden).
 */
let uid = 0;
export function postmark({ ring = 'MEMÓRIA · CAIRO · MEMÓRIA · CAIRO ·', top = 'CAIRO', middle = '25', bottom = 'YEARS', cls = '' } = {}) {
  const id = `pm${++uid}`;
  return `<svg class="postmark ${cls}" viewBox="0 0 220 120" aria-hidden="true" focusable="false">
    <defs><path id="${id}" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0"/></defs>
    <g fill="none" stroke="currentColor">
      <circle cx="60" cy="60" r="56" stroke-width="2.2"/>
      <circle cx="60" cy="60" r="36" stroke-width="1.3"/>
      <path d="M118 38 q12 -8 24 0 t24 0 t24 0 t24 0 M118 52 q12 -8 24 0 t24 0 t24 0 t24 0 M118 66 q12 -8 24 0 t24 0 t24 0 t24 0 M118 80 q12 -8 24 0 t24 0 t24 0 t24 0" stroke-width="2"/>
    </g>
    <g fill="currentColor" font-family="'Courier Prime', 'Courier New', monospace">
      <text font-size="10.5" letter-spacing="2.2"><textPath href="#${id}">${ring}</textPath></text>
      <text x="60" y="51" font-size="9" text-anchor="middle" letter-spacing="2">${top}</text>
      <text x="60" y="71" font-size="21" text-anchor="middle" font-weight="700">${middle}</text>
      <text x="60" y="84" font-size="8" text-anchor="middle" letter-spacing="2">${bottom}</text>
    </g>
  </svg>`;
}
