/**
 * Orders — search, filter, export; open an order to change its status
 * (history is recorded by the database), record payments, add notes and
 * issue an invoice.
 */
import { sb, q, state } from '../api.js';
import { esc, money, dateTime, pill, label, panel, toast, fail, downloadCsv, ORDER_STATUSES, PAYMENT_STATUSES } from '../ui.js';
import { openInvoice } from './invoices.js';

const PAGE = 50;

export default async function orders(root, [openId]) {
  const methods = (await q(sb.from('store_settings').select('value').eq('key', 'payments')))[0]?.value?.methods || [];
  const methodLabel = (id) => methods.find((m) => m.id === id)?.label || id;
  let page = 0;

  root.innerHTML = `
    <header class="a-head"><h1>Orders</h1><button class="a-btn" data-export>Export CSV</button></header>
    <form class="a-toolbar" data-filters>
      <input type="search" name="search" placeholder="Order number, name or phone" aria-label="Search orders" />
      <select name="status" aria-label="Order status"><option value="">All statuses</option>${ORDER_STATUSES.map((s) => `<option value="${s}">${label(s)}</option>`).join('')}</select>
      <select name="payment" aria-label="Payment status"><option value="">All payments</option>${PAYMENT_STATUSES.map((s) => `<option value="${s}">${label(s)}</option>`).join('')}</select>
      <label class="a-inline">From <input type="date" name="from" /></label>
      <label class="a-inline">To <input type="date" name="to" /></label>
    </form>
    <div class="a-card a-card--flush" data-list><p class="a-loading">Loading…</p></div>
    <div class="a-pager" data-pager></div>`;

  const form = root.querySelector('[data-filters]');
  const listEl = root.querySelector('[data-list]');

  function query(forExport = false) {
    const f = Object.fromEntries(new FormData(form).entries());
    let qb = sb
      .from('orders')
      .select('id, order_number, customer_name, phone, total, discount_total, shipping_fee, payment_method, payment_status, status, created_at, governorates(name_en)', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (f.status) qb = qb.eq('status', f.status);
    if (f.payment) qb = qb.eq('payment_status', f.payment);
    if (f.from) qb = qb.gte('created_at', new Date(f.from + 'T00:00:00').toISOString());
    if (f.to) qb = qb.lt('created_at', new Date(new Date(f.to + 'T00:00:00').getTime() + 864e5).toISOString());
    const s = f.search.trim().replace(/[%,()]/g, '');
    if (s) {
      const digits = s.replace(/\D/g, '');
      const ors = [`order_number.ilike.%${s}%`, `customer_name.ilike.%${s}%`];
      if (digits.length >= 4) ors.push(`phone.like.%${digits.replace(/^0/, '')}%`);
      qb = qb.or(ors.join(','));
    }
    return forExport ? qb.limit(5000) : qb.range(page * PAGE, page * PAGE + PAGE - 1);
  }

  async function load() {
    listEl.innerHTML = '<p class="a-loading">Loading…</p>';
    const { data, count } = await q(query());
    if (!data.length) {
      listEl.innerHTML = '<p class="a-empty a-pad">No orders match. New orders from checkout appear here automatically.</p>';
      root.querySelector('[data-pager]').innerHTML = '';
      return;
    }
    listEl.innerHTML = `<table class="a-table a-table--rows">
      <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Phone</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
      <tbody>${data
        .map(
          (o) => `<tr data-open="${esc(o.id)}" tabindex="0">
            <td><b>${esc(o.order_number)}</b></td><td>${dateTime(o.created_at)}</td><td>${esc(o.customer_name)}</td>
            <td>${esc(o.phone)}</td><td>${money(o.total)}</td>
            <td>${pill(o.payment_status)}<br/><small class="a-muted">${esc(methodLabel(o.payment_method))}</small></td><td>${pill(o.status)}</td></tr>`
        )
        .join('')}</tbody></table>`;
    listEl.querySelectorAll('[data-open]').forEach((tr) => {
      const go = () => (location.hash = `#/orders/${tr.dataset.open}`);
      tr.addEventListener('click', go);
      tr.addEventListener('keydown', (e) => e.key === 'Enter' && go());
    });
    const pages = Math.ceil(count / PAGE);
    root.querySelector('[data-pager]').innerHTML = pages > 1
      ? `<button class="a-btn a-btn--small" data-prev ${page === 0 ? 'disabled' : ''}>← Newer</button><span>Page ${page + 1} of ${pages} · ${count} orders</span><button class="a-btn a-btn--small" data-next ${page >= pages - 1 ? 'disabled' : ''}>Older →</button>`
      : `<span>${count} order${count === 1 ? '' : 's'}</span>`;
    root.querySelector('[data-prev]')?.addEventListener('click', () => { page--; load().catch(fail); });
    root.querySelector('[data-next]')?.addEventListener('click', () => { page++; load().catch(fail); });
  }

  let t;
  form.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { page = 0; load().catch(fail); }, 250);
  });
  form.addEventListener('submit', (e) => e.preventDefault());

  root.querySelector('[data-export]').addEventListener('click', async () => {
    try {
      const { data } = await q(query(true));
      const ids = data.map((o) => o.id);
      const items = ids.length ? await q(sb.from('order_items').select('order_id, product_name, variant_label, quantity').in('order_id', ids)) : [];
      const full = ids.length ? await q(sb.from('orders').select('id, email, city, address_line, address_notes, discount_code').in('id', ids)) : [];
      const rows = [['Order', 'Date', 'Customer', 'Phone', 'Email', 'Governorate', 'City', 'Address', 'Items', 'Discount code', 'Discount', 'Shipping', 'Total', 'Payment method', 'Payment status', 'Status']];
      data.forEach((o) => {
        const x = full.find((f) => f.id === o.id) || {};
        rows.push([
          o.order_number, new Date(o.created_at).toISOString(), o.customer_name, o.phone, x.email, o.governorates?.name_en, x.city,
          [x.address_line, x.address_notes].filter(Boolean).join(' — '),
          items.filter((i) => i.order_id === o.id).map((i) => `${i.product_name} ${i.variant_label} x${i.quantity}`).join('; '),
          x.discount_code, o.discount_total, o.shipping_fee, o.total, methodLabel(o.payment_method), o.payment_status, o.status,
        ]);
      });
      downloadCsv(`memoria-orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    } catch (e) {
      fail(e);
    }
  });

  await load();
  if (openId) openOrder(openId, { methodLabel, onChange: () => load().catch(fail) });
}

export async function openOrder(id, { methodLabel = (x) => x, onChange = () => {} } = {}) {
  const [o] = await q(sb.from('orders').select('*, governorates(name_en, name_ar), shipping_zones(name)').eq('id', id));
  if (!o) return toast('Order not found.', 'error');
  const [items, history, payments, invoices] = await Promise.all([
    q(sb.from('order_items').select('*').eq('order_id', id)),
    q(sb.from('order_status_history').select('*').eq('order_id', id).order('created_at')),
    q(sb.from('payments').select('*').eq('order_id', id).order('received_at')),
    q(sb.from('invoices').select('id, invoice_number, issued_at, void').eq('order_id', id).order('issued_at')),
  ]);
  const paid = payments.filter((p) => p.status === 'received').reduce((n, p) => n + Number(p.amount), 0);
  const { el, close } = panel(`Order ${o.order_number}`, `
    <div class="a-order">
      <div class="a-order__meta">${pill(o.status)} ${pill(o.payment_status)} <span class="a-muted">Placed ${dateTime(o.created_at)} · ${esc(label(o.source))}</span></div>
      <section class="a-grid2">
        <div>
          <h3>Customer</h3>
          <p><b>${esc(o.customer_name)}</b><br/><a href="tel:+${esc(o.phone)}">+${esc(o.phone)}</a>${o.email ? `<br/>${esc(o.email)}` : ''}</p>
          <p><a class="a-link" href="https://wa.me/${esc(o.phone)}" target="_blank" rel="noopener">WhatsApp the customer ↗</a></p>
        </div>
        <div>
          <h3>Delivery</h3>
          <p>${esc(o.address_line)}${o.city ? `<br/>${esc(o.city)}` : ''}<br/>${esc(o.governorates?.name_en || '')} ${o.governorates ? `· ${esc(o.governorates.name_ar)}` : ''}${o.address_notes ? `<br/><i>${esc(o.address_notes)}</i>` : ''}</p>
          <p class="a-muted">${o.shipping_zones ? `Zone: ${esc(o.shipping_zones.name)}` : 'No shipping zone'}${o.shipping_to_confirm ? ' · <b>delivery fee to confirm</b>' : ''}</p>
        </div>
      </section>
      ${o.customer_note ? `<p class="a-note">Customer note: ${esc(o.customer_note)}</p>` : ''}
      <table class="a-table">
        <thead><tr><th>Item</th><th>Unit price</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>${items.map((i) => `<tr><td>${esc(i.product_name)} · ${esc(i.variant_label)}</td><td>${money(i.unit_price)}</td><td>${i.quantity}</td><td>${money(i.line_total)}</td></tr>`).join('')}</tbody>
        <tfoot>
          <tr><td colspan="3">Subtotal</td><td>${money(o.subtotal)}</td></tr>
          ${Number(o.discount_total) ? `<tr><td colspan="3">Discount ${o.discount_code ? `(${esc(o.discount_code)})` : ''}</td><td>−${money(o.discount_total)}</td></tr>` : ''}
          <tr><td colspan="3">Shipping</td><td>${o.shipping_to_confirm ? 'To confirm' : money(o.shipping_fee)}</td></tr>
          <tr class="a-total"><td colspan="3">Total</td><td>${money(o.total)}</td></tr>
        </tfoot>
      </table>

      <section class="a-grid2">
        <form class="a-form" data-status>
          <h3>Order status</h3>
          <select name="status">${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${label(s)}</option>`).join('')}</select>
          <input name="note" placeholder="Note (optional)" maxlength="500" />
          <button class="a-btn a-btn--primary">Update status</button>
          <p class="a-muted">Cancelling or returning puts the stock back.</p>
        </form>
        <form class="a-form" data-payment>
          <h3>Payments · ${money(paid)} received</h3>
          <p class="a-muted">Payment method: ${esc(methodLabel(o.payment_method))}. Record money only once it has actually been received.</p>
          <div class="a-row">
            <input name="amount" type="number" min="0.01" step="0.01" value="${Math.max(0, Number(o.total) - paid) || ''}" aria-label="Amount" required />
            <select name="status" aria-label="Type"><option value="received">Received</option><option value="refunded">Refund</option></select>
          </div>
          <input name="provider_ref" placeholder="Reference (e.g. courier receipt, InstaPay ref)" maxlength="120" />
          <button class="a-btn">Record</button>
          ${payments.length ? `<ul class="a-list">${payments.map((p) => `<li>${dateTime(p.received_at)} · ${esc(label(p.status))} ${money(p.amount)} ${p.provider_ref ? `· ${esc(p.provider_ref)}` : ''}</li>`).join('')}</ul>` : ''}
        </form>
      </section>

      <form class="a-form" data-internal>
        <h3>Internal note</h3>
        <textarea name="internal_note" rows="2" maxlength="2000">${esc(o.internal_note || '')}</textarea>
        <button class="a-btn a-btn--small">Save note</button>
      </form>

      <div class="a-actions">
        <button class="a-btn" data-invoice>${invoices.some((i) => !i.void) ? 'View invoice' : 'Generate invoice'}</button>
        ${invoices.length ? `<span class="a-muted">${invoices.map((i) => esc(i.invoice_number) + (i.void ? ' (void)' : '')).join(', ')}</span>` : ''}
      </div>

      <h3>History</h3>
      <ol class="a-timeline">${history
        .map((h) => `<li><span>${dateTime(h.created_at)}</span> ${h.field === 'note' ? 'Note' : `${esc(label(h.field))}: ${h.from_value ? `${esc(label(h.from_value))} → ` : ''}<b>${esc(label(h.to_value))}</b>`}${h.note ? ` — ${esc(h.note)}` : ''}</li>`)
        .join('')}</ol>
    </div>`, { wide: true });

  const refresh = () => {
    close();
    onChange();
    openOrder(id, { methodLabel, onChange });
  };
  el.querySelector('[data-status]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      if (f.status.value !== o.status) await q(sb.from('orders').update({ status: f.status.value }).eq('id', id));
      if (f.note.value.trim())
        await q(sb.from('order_status_history').insert({ order_id: id, field: 'note', to_value: f.status.value, note: f.note.value.trim(), changed_by: state.user.id }));
      toast('Order updated.');
      refresh();
    } catch (err) {
      fail(err);
    }
  });
  el.querySelector('[data-payment]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await q(sb.from('payments').insert({ order_id: id, method: o.payment_method, amount: Number(f.amount.value), status: f.status.value, provider_ref: f.provider_ref.value.trim() || null, created_by: state.user.id }));
      toast('Payment recorded.');
      refresh();
    } catch (err) {
      fail(err);
    }
  });
  el.querySelector('[data-internal]').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await q(sb.from('orders').update({ internal_note: e.target.internal_note.value.trim() || null }).eq('id', id));
      toast('Note saved.');
    } catch (err) {
      fail(err);
    }
  });
  el.querySelector('[data-invoice]').addEventListener('click', async () => {
    try {
      const inv = await q(sb.rpc('admin_issue_invoice', { p_order_id: id }));
      openInvoice(inv);
    } catch (err) {
      fail(err);
    }
  });
}
