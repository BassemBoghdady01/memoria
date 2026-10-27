/**
 * Memories — entries from the QR memory card (/memory).
 * Each entry received a personal single-use 10% code (see Discounts).
 * Private: readable by admins only (RLS).
 */
import { sb, q } from '../api.js';
import { esc, date, dateTime, fail, downloadCsv } from '../ui.js';

export default async function memories(root) {
  root.innerHTML = `
    <header class="a-head"><h1>Memories</h1><button class="a-btn" data-export>Export CSV</button></header>
    <p class="a-muted">What customers wrote after scanning the QR on the bottle. Each one received a personal 10% code for their next order.</p>
    <form class="a-toolbar" data-f><input type="search" name="s" placeholder="Name, phone or memory" aria-label="Search memories" /></form>
    <div class="a-card a-card--flush" data-list><p class="a-loading">Loading…</p></div>`;
  const listEl = root.querySelector('[data-list]');
  let rows = [];

  async function load(s = '') {
    let query = sb
      .from('memory_entries')
      .select('id, full_name, phone, birth_date, memory, code, created_at, discount:discounts(times_used)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (s) {
      const like = `%${s.replace(/[%_,()]/g, ' ')}%`;
      query = query.or(`full_name.ilike.${like},phone.ilike.${like},memory.ilike.${like}`);
    }
    rows = await q(query);
    listEl.innerHTML = rows.length
      ? `<table class="a-table a-table--rows"><thead><tr><th>Memory</th><th>Name</th><th>Phone</th><th>Birthday</th><th>Code</th><th>Received</th></tr></thead><tbody>
      ${rows
        .map(
          (m) => `<tr><td style="max-width:28rem;white-space:normal">${esc(m.memory)}</td><td><b>${esc(m.full_name)}</b></td>
          <td><a class="a-link" href="https://wa.me/${esc(m.phone)}" target="_blank" rel="noopener">+${esc(m.phone)}</a></td>
          <td>${date(m.birth_date)}</td><td><code>${esc(m.code)}</code>${m.discount?.times_used ? ' <span class="a-muted">(used)</span>' : ''}</td><td>${dateTime(m.created_at)}</td></tr>`
        )
        .join('')}</tbody></table>`
      : '<p class="a-empty a-pad">No memories yet. They appear here when someone scans the QR and fills in the card.</p>';
  }
  let t;
  root.querySelector('[data-f]').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => load(e.target.value.trim()).catch(fail), 250);
  });
  root.querySelector('[data-f]').addEventListener('submit', (e) => e.preventDefault());
  root.querySelector('[data-export]').addEventListener('click', () =>
    downloadCsv(`memoria-memories-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Received', 'Name', 'Phone', 'Birthday', 'Memory', 'Code', 'Code used'],
      ...rows.map((m) => [m.created_at, m.full_name, '+' + m.phone, m.birth_date, m.memory, m.code, m.discount?.times_used ? 'yes' : 'no']),
    ])
  );
  await load();
}
