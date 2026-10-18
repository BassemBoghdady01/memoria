/**
 * Overview — every figure is computed in the database (admin_dashboard)
 * from real orders and payments. Revenue counts recorded payments only;
 * unpaid, cancelled and refunded orders are shown separately.
 */
import { sb, q } from '../api.js';
import { esc, money, num, dateTime, pill, barChart, label } from '../ui.js';

const RANGES = {
  today: ['Today', () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }],
  '7d': ['Last 7 days', () => new Date(Date.now() - 7 * 864e5)],
  '30d': ['Last 30 days', () => new Date(Date.now() - 30 * 864e5)],
};

export default async function overview(root) {
  let range = sessionStorage.getItem('memoria.range') || '30d';
  let custom = JSON.parse(sessionStorage.getItem('memoria.custom') || 'null');

  root.innerHTML = `
    <header class="a-head">
      <h1>Overview</h1>
      <div class="a-filters" role="group" aria-label="Date range">
        ${Object.entries(RANGES).map(([k, [l]]) => `<button class="a-chip" data-range="${k}">${l}</button>`).join('')}
        <button class="a-chip" data-range="custom">Custom</button>
        <span class="a-custom" data-custom hidden>
          <input type="date" data-from aria-label="From" /> – <input type="date" data-to aria-label="To" />
          <button class="a-btn a-btn--small" data-apply>Apply</button>
        </span>
      </div>
    </header>
    <div data-body><p class="a-loading">Loading…</p></div>`;

  const body = root.querySelector('[data-body]');
  const customBox = root.querySelector('[data-custom]');

  async function load() {
    root.querySelectorAll('[data-range]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.range === range)));
    customBox.hidden = range !== 'custom';
    let from, to;
    if (range === 'custom' && custom) {
      from = new Date(custom.from + 'T00:00:00');
      to = new Date(custom.to + 'T00:00:00');
      to.setDate(to.getDate() + 1);
      root.querySelector('[data-from]').value = custom.from;
      root.querySelector('[data-to]').value = custom.to;
    } else {
      if (range === 'custom') range = '30d';
      from = RANGES[range][1]();
      to = new Date(Date.now() + 60_000);
    }
    body.innerHTML = '<p class="a-loading">Loading…</p>';
    const d = await q(sb.rpc('admin_dashboard', { p_from: from.toISOString(), p_to: to.toISOString() }));
    render(d);
  }

  function render(d) {
    const pay = d.by_payment_status || {};
    const tiles = [
      ['Confirmed revenue', money(d.confirmed_revenue), 'Payments recorded, minus refunds'],
      ['Total orders', num(d.orders_total), 'All orders placed in this period'],
      ['Pending orders', num(d.pending_orders), 'Awaiting confirmation'],
      ['Completed orders', num(d.completed_orders), 'Delivered'],
      ['Cancelled orders', num(d.cancelled_orders), `${num(d.returned_orders)} returned`],
      ['Average order value', money(d.avg_order_value), 'Excludes cancelled and returned'],
      ['Awaiting payment', money(d.unpaid_value), 'Unpaid or pending, not cancelled'],
      ['Paid orders', num(d.paid_orders), ''],
    ];
    body.innerHTML = `
      <section class="a-tiles">
        ${tiles.map(([t, v, s]) => `<div class="a-tile"><span class="a-tile__label">${t}</span><strong class="a-tile__value">${v}</strong>${s ? `<span class="a-tile__sub">${s}</span>` : ''}</div>`).join('')}
      </section>
      ${d.orders_total === 0 ? '<p class="a-note">No orders in this period yet. Figures appear here as real orders come in.</p>' : ''}

      <section class="a-grid2">
        <div class="a-card">
          <h2>Orders by day</h2>
          ${barChart((d.trend || []).map((t) => ({ ...t, label: new Date(t.day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) })), { valueKey: 'order_value', labelKey: 'label', format: money })}
          ${(d.trend || []).length ? `<details class="a-details"><summary>Show as table</summary><table class="a-table"><thead><tr><th>Day</th><th>Orders</th><th>Order value</th><th>Paid</th></tr></thead><tbody>
            ${d.trend.map((t) => `<tr><td>${esc(t.day)}</td><td>${num(t.orders)}</td><td>${money(t.order_value)}</td><td>${money(t.paid_value || 0)}</td></tr>`).join('')}</tbody></table></details>` : ''}
        </div>
        <div class="a-card">
          <h2>Payment status</h2>
          <table class="a-table">
            <thead><tr><th>Status</th><th>Orders</th><th>Value</th></tr></thead>
            <tbody>${Object.keys(pay).length ? Object.entries(pay).map(([k, v]) => `<tr><td>${pill(k)}</td><td>${num(v.count)}</td><td>${money(v.value)}</td></tr>`).join('') : '<tr><td colspan="3" class="a-empty">No orders yet.</td></tr>'}</tbody>
          </table>
          <h3>Order status</h3>
          <div class="a-pills">${Object.entries(d.by_status || {}).map(([k, v]) => `${pill(k)} <b>${num(v)}</b>`).join(' ') || '<span class="a-empty">—</span>'}</div>
        </div>
      </section>

      <section class="a-grid2">
        <div class="a-card">
          <h2>Best-selling perfumes</h2>
          ${table(d.best_sellers, [['Perfume', (r) => esc(r.product_name)], ['Units', (r) => num(r.units)], ['Sales', (r) => money(r.revenue)]])}
        </div>
        <div class="a-card">
          <h2>Sales by category</h2>
          ${table(d.by_category, [['Category', (r) => esc(r.category)], ['Units', (r) => num(r.units)], ['Sales', (r) => money(r.revenue)]])}
        </div>
      </section>

      <section class="a-grid2">
        <div class="a-card">
          <h2>Recent orders</h2>
          ${table(d.recent_orders, [
            ['Order', (r) => `<a href="#/orders/${esc(r.id)}">${esc(r.order_number)}</a>`],
            ['Customer', (r) => esc(r.customer_name)],
            ['Total', (r) => money(r.total)],
            ['Status', (r) => pill(r.status)],
            ['Payment', (r) => pill(r.payment_status)],
            ['Placed', (r) => dateTime(r.created_at)],
          ])}
        </div>
        <div class="a-card">
          <h2>Low stock</h2>
          ${table(d.low_stock, [['Perfume', (r) => esc(r.product_name)], ['Size', (r) => esc(r.variant_label)], ['In stock', (r) => `<b class="${r.quantity === 0 ? 'a-bad' : ''}">${num(r.quantity)}</b>`]], 'Nothing is running low.')}
          <h3>Discount usage</h3>
          ${table(d.discount_usage, [['Discount', (r) => esc(r.discount)], ['Uses', (r) => num(r.uses)], ['Given', (r) => money(r.amount)]], 'No discounts used in this period.')}
        </div>
      </section>`;
  }

  function table(rows, cols, empty = 'Nothing yet.') {
    if (!rows || !rows.length) return `<p class="a-empty">${empty}</p>`;
    return `<table class="a-table"><thead><tr>${cols.map(([h]) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${cols.map(([, f]) => `<td>${f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  root.querySelectorAll('[data-range]').forEach((b) =>
    b.addEventListener('click', () => {
      range = b.dataset.range;
      sessionStorage.setItem('memoria.range', range);
      if (range === 'custom') {
        customBox.hidden = false;
        root.querySelectorAll('[data-range]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        if (!custom) return;
      }
      load().catch((e) => (body.innerHTML = `<p class="a-error">${esc(e.message)}</p>`));
    })
  );
  root.querySelector('[data-apply]').addEventListener('click', () => {
    const from = root.querySelector('[data-from]').value;
    const to = root.querySelector('[data-to]').value;
    if (!from || !to || from > to) return;
    custom = { from, to };
    sessionStorage.setItem('memoria.custom', JSON.stringify(custom));
    range = 'custom';
    load();
  });
  void label;
  await load();
}
