/**
 * Invoices — find by order or invoice number, view, print, download PDF.
 * An invoice is a frozen snapshot made by admin_issue_invoice(); it never
 * changes when the order or the catalogue does.
 *
 * Compliance note: this is a branded sales invoice/receipt. It is not an
 * Egyptian Tax Authority e-invoice; tax fields print only when the owner
 * has entered them in Store settings.
 */
import { sb, q } from '../api.js';
import { esc, money, date, panel, fail, label } from '../ui.js';

export default async function invoices(root) {
  root.innerHTML = `
    <header class="a-head"><h1>Invoices</h1></header>
    <form class="a-toolbar" data-f><input type="search" name="s" placeholder="Invoice or order number" aria-label="Search invoices" /></form>
    <p class="a-muted">Invoices are generated from an order (Orders → open an order → Generate invoice).</p>
    <div class="a-card a-card--flush" data-list></div>`;
  const listEl = root.querySelector('[data-list]');
  async function load(s = '') {
    let qb = sb.from('invoices').select('*').order('issued_at', { ascending: false }).limit(200);
    const clean = s.trim().replace(/[%,()]/g, '');
    if (clean) qb = qb.or(`invoice_number.ilike.%${clean}%,totals_snapshot->>order_number.ilike.%${clean}%`);
    const rows = await q(qb);
    listEl.innerHTML = rows.length
      ? `<table class="a-table a-table--rows"><thead><tr><th>Invoice</th><th>Order</th><th>Customer</th><th>Issued</th><th>Total</th><th></th></tr></thead><tbody>
        ${rows
          .map(
            (r) => `<tr data-id="${esc(r.id)}" tabindex="0"><td><b>${esc(r.invoice_number)}</b>${r.void ? ' <span class="pill pill--cancelled">Void</span>' : ''}</td><td>${esc(r.totals_snapshot.order_number)}</td>
            <td>${esc(r.customer_snapshot.name)}</td><td>${date(r.issued_at)}</td><td>${money(r.totals_snapshot.total)}</td><td><span class="a-link">Open</span></td></tr>`
          )
          .join('')}</tbody></table>`
      : '<p class="a-empty a-pad">No invoices yet.</p>';
    listEl.querySelectorAll('[data-id]').forEach((tr) => {
      const open = () => openInvoice(rows.find((r) => r.id === tr.dataset.id));
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => e.key === 'Enter' && open());
    });
  }
  let t;
  root.querySelector('[data-f]').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => load(e.target.value).catch(fail), 250);
  });
  root.querySelector('[data-f]').addEventListener('submit', (e) => e.preventDefault());
  await load();
}

function invoiceHtml(inv) {
  const c = inv.company_snapshot || {};
  const cu = inv.customer_snapshot || {};
  const t = inv.totals_snapshot || {};
  const items = inv.items_snapshot || [];
  return `
  <article class="inv" id="invoice-print">
    <header class="inv__head">
      <img src="/brand/logo-brown-560.png" alt="MEMÓRIA" width="170" />
      <div class="inv__title"><h2>Invoice</h2><p><b>${esc(inv.invoice_number)}</b><br/>Issued ${date(inv.issued_at)}<br/>Order ${esc(t.order_number)} · ${date(t.order_date)}</p></div>
    </header>
    ${inv.void ? '<p class="inv__void">VOID</p>' : ''}
    <section class="inv__parties">
      <div><h3>From</h3><p><b>${esc(c.legal_name || c.trade_name || 'MEMÓRIA')}</b>${c.address ? `<br/>${esc(c.address)}` : ''}${c.phone ? `<br/>${esc(c.phone)}` : ''}${c.email ? `<br/>${esc(c.email)}` : ''}
        ${c.tax_registration_number ? `<br/>Tax registration no. ${esc(c.tax_registration_number)}` : ''}${c.commercial_register ? `<br/>Commercial register ${esc(c.commercial_register)}` : ''}</p></div>
      <div><h3>Billed to</h3><p><b>${esc(cu.name)}</b><br/>+${esc(cu.phone)}${cu.email ? `<br/>${esc(cu.email)}` : ''}<br/>${esc(cu.address)}${cu.city ? `, ${esc(cu.city)}` : ''}${cu.governorate ? `<br/>${esc(cu.governorate)}` : ''}</p></div>
    </section>
    <table class="inv__table">
      <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>
      <tbody>${items.map((i) => `<tr><td>${esc(i.product_name)} · ${esc(i.variant_label)}</td><td>${i.quantity}</td><td>${money(i.unit_price)}</td><td>${money(i.line_total)}</td></tr>`).join('')}</tbody>
      <tfoot>
        <tr><td colspan="3">Subtotal</td><td>${money(t.subtotal)}</td></tr>
        ${Number(t.discount_total) ? `<tr><td colspan="3">Discount${t.discount_code ? ` (${esc(t.discount_code)})` : ''}</td><td>−${money(t.discount_total)}</td></tr>` : ''}
        <tr><td colspan="3">Delivery</td><td>${money(t.shipping_fee)}</td></tr>
        <tr class="inv__total"><td colspan="3">Total</td><td>${money(t.total)}</td></tr>
      </tfoot>
    </table>
    <p class="inv__pay">Payment: ${esc(label(t.payment_method))} · ${esc(label(t.payment_status))} at time of issue</p>
    ${t.tax_note ? `<p class="inv__foot">${esc(t.tax_note)}</p>` : ''}
  </article>`;
}

export function openInvoice(inv) {
  const { el } = panel(`Invoice ${inv.invoice_number}`, `
    <div class="a-actions"><button class="a-btn a-btn--primary" data-pdf>Download PDF</button><button class="a-btn" data-print>Print</button></div>
    ${invoiceHtml(inv)}`, { wide: true });
  el.querySelector('[data-print]').addEventListener('click', () => {
    document.body.classList.add('is-printing-invoice');
    window.print();
    setTimeout(() => document.body.classList.remove('is-printing-invoice'), 500);
  });
  el.querySelector('[data-pdf]').addEventListener('click', () => downloadPdf(inv).catch(fail));
}

async function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export async function downloadPdf(inv) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const c = inv.company_snapshot || {};
  const cu = inv.customer_snapshot || {};
  const t = inv.totals_snapshot || {};
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  const brown = [90, 53, 34];
  const fmt = (n) => `EGP ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  /* jsPDF core fonts are Latin-1: strip characters they cannot draw */
  const safe = (s) => String(s ?? '').replace(/Ó/g, 'O').replace(/[^\x20-\xFF]/g, '');

  try {
    const logo = await loadImage('/brand/logo-brown-560.png');
    const h = (140 * logo.height) / logo.width;
    doc.addImage(logo, 'PNG', M, M, 140, h);
  } catch {
    doc.setFont('times', 'bold').setFontSize(22).text('MEMORIA', M, M + 20);
  }
  doc.setTextColor(...brown).setFont('helvetica', 'bold').setFontSize(20).text('INVOICE', W - M, M + 14, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(40);
  doc.text([safe(inv.invoice_number), `Issued ${date(inv.issued_at)}`, `Order ${safe(t.order_number)} · ${date(t.order_date)}`], W - M, M + 32, { align: 'right' });
  if (inv.void) doc.setTextColor(180, 40, 40).setFontSize(28).text('VOID', W / 2, M + 40, { align: 'center' }).setTextColor(40).setFontSize(10);

  let y = M + 110;
  const block = (title, lines, x) => {
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...brown).text(title.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(40).text(lines.filter(Boolean).map(safe), x, y + 15);
  };
  block('From', [c.legal_name || c.trade_name || 'MEMORIA', c.address, c.phone, c.email, c.tax_registration_number && `Tax registration no. ${c.tax_registration_number}`, c.commercial_register && `Commercial register ${c.commercial_register}`], M);
  block('Billed to', [cu.name, cu.phone && `+${cu.phone}`, cu.email, [cu.address, cu.city].filter(Boolean).join(', '), cu.governorate], W / 2 + 10);

  y += 110;
  const cols = [M, W - M - 230, W - M - 150, W - M];
  doc.setDrawColor(...brown).setLineWidth(0.8).line(M, y, W - M, y);
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...brown);
  doc.text('ITEM', cols[0], y + 14);
  doc.text('QTY', cols[1], y + 14, { align: 'right' });
  doc.text('UNIT PRICE', cols[2] + 40, y + 14, { align: 'right' });
  doc.text('AMOUNT', cols[3], y + 14, { align: 'right' });
  y += 24;
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(40);
  for (const i of inv.items_snapshot || []) {
    const name = doc.splitTextToSize(safe(`${i.product_name} · ${i.variant_label}`), cols[1] - M - 30);
    doc.text(name, cols[0], y + 10);
    doc.text(String(i.quantity), cols[1], y + 10, { align: 'right' });
    doc.text(fmt(i.unit_price), cols[2] + 40, y + 10, { align: 'right' });
    doc.text(fmt(i.line_total), cols[3], y + 10, { align: 'right' });
    y += 14 * name.length + 8;
    if (y > 720) {
      doc.addPage();
      y = M;
    }
  }
  doc.setDrawColor(200).line(M, y, W - M, y);
  y += 18;
  const sum = (l, v, bold) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(bold ? 12 : 10);
    doc.text(l, cols[2] + 40, y, { align: 'right' });
    doc.text(v, cols[3], y, { align: 'right' });
    y += bold ? 20 : 15;
  };
  sum('Subtotal', fmt(t.subtotal));
  if (Number(t.discount_total)) sum(`Discount${t.discount_code ? ` (${safe(t.discount_code)})` : ''}`, `-${fmt(t.discount_total)}`);
  sum('Delivery', fmt(t.shipping_fee));
  sum('Total', fmt(t.total), true);
  y += 10;
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90);
  doc.text(safe(`Payment: ${label(t.payment_method)} · ${label(t.payment_status)} at time of issue`), M, y);
  if (t.tax_note) doc.text(doc.splitTextToSize(safe(t.tax_note), W - 2 * M), M, y + 16);
  doc.save(`${inv.invoice_number}.pdf`);
}
