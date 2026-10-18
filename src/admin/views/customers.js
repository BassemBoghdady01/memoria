/**
 * Customers — created automatically from checkout (one per phone number).
 * Private: readable by admins only (RLS).
 */
import { sb, q } from '../api.js';
import { esc, money, date, dateTime, pill, panel, toast, fail, downloadCsv } from '../ui.js';

export default async function customers(root) {
  root.innerHTML = `
    <header class="a-head"><h1>Customers</h1><button class="a-btn" data-export>Export CSV</button></header>
    <form class="a-toolbar" data-f><input type="search" name="s" placeholder="Name, phone or email" aria-label="Search customers" /></form>
    <div class="a-card a-card--flush" data-list><p class="a-loading">Loading…</p></div>`;
  const listEl = root.querySelector('[data-list]');
  let rows = [];

  async function load(s = '') {
    rows = await q(sb.rpc('admin_customers', { p_search: s || null }));
    listEl.innerHTML = rows.length
      ? `<table class="a-table a-table--rows"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Orders</th><th>Completed purchases</th><th>Last order</th></tr></thead><tbody>
      ${rows
        .map(
          (c) => `<tr data-id="${esc(c.id)}" tabindex="0"><td><b>${esc(c.full_name)}</b>${c.notes ? ' <span title="Has notes">✎</span>' : ''}</td><td>+${esc(c.phone)}</td><td>${esc(c.email || '—')}</td>
          <td>${c.orders_count}</td><td>${c.completed_count} · ${money(c.completed_value)}</td><td>${date(c.last_order_at)}</td></tr>`
        )
        .join('')}</tbody></table>`
      : '<p class="a-empty a-pad">No customers yet. Customers are added automatically when they place an order.</p>';
    listEl.querySelectorAll('[data-id]').forEach((tr) => {
      const open = () => openCustomer(rows.find((r) => r.id === tr.dataset.id), () => load(s));
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => e.key === 'Enter' && open());
    });
  }
  let t;
  root.querySelector('[data-f]').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => load(e.target.value.trim()).catch(fail), 250);
  });
  root.querySelector('[data-f]').addEventListener('submit', (e) => e.preventDefault());
  root.querySelector('[data-export]').addEventListener('click', () =>
    downloadCsv(`memoria-customers-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Name', 'Phone', 'Email', 'Orders', 'Completed orders', 'Completed value', 'Paid value', 'Last order', 'Notes'],
      ...rows.map((c) => [c.full_name, '+' + c.phone, c.email, c.orders_count, c.completed_count, c.completed_value, c.paid_value, c.last_order_at, c.notes]),
    ])
  );
  await load();
}

async function openCustomer(c, onSaved) {
  const orders = await q(sb.from('orders').select('id, order_number, total, status, payment_status, created_at').eq('customer_id', c.id).order('created_at', { ascending: false }));
  const { el } = panel(c.full_name, `
    <p>+${esc(c.phone)} · <a class="a-link" href="https://wa.me/${esc(c.phone)}" target="_blank" rel="noopener">WhatsApp ↗</a>${c.email ? `<br/>${esc(c.email)}` : ''}<br/><span class="a-muted">Customer since ${date(c.created_at)}</span></p>
    <div class="a-tiles a-tiles--small">
      <div class="a-tile"><span class="a-tile__label">Orders</span><strong class="a-tile__value">${c.orders_count}</strong></div>
      <div class="a-tile"><span class="a-tile__label">Completed purchases</span><strong class="a-tile__value">${money(c.completed_value)}</strong></div>
      <div class="a-tile"><span class="a-tile__label">Paid</span><strong class="a-tile__value">${money(c.paid_value)}</strong></div>
    </div>
    <form class="a-form" data-notes><label>Notes (private) <textarea name="notes" rows="3" maxlength="2000">${esc(c.notes || '')}</textarea></label><button class="a-btn a-btn--small">Save notes</button></form>
    <h3>Order history</h3>
    ${orders.length ? `<table class="a-table"><tbody>${orders.map((o) => `<tr><td><a href="#/orders/${esc(o.id)}">${esc(o.order_number)}</a></td><td>${dateTime(o.created_at)}</td><td>${money(o.total)}</td><td>${pill(o.status)}</td><td>${pill(o.payment_status)}</td></tr>`).join('')}</tbody></table>` : '<p class="a-empty">No orders.</p>'}`);
  el.querySelector('[data-notes]').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await q(sb.from('customers').update({ notes: e.target.notes.value.trim() || null }).eq('id', c.id));
      toast('Notes saved.');
      onSaved();
    } catch (err) {
      fail(err);
    }
  });
}
