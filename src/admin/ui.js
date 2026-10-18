/**
 * MEMÓRIA dashboard · small UI helpers.
 */
export const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const money = (n) => (n === null || n === undefined || n === '' ? '—' : `EGP ${Number(n).toLocaleString('en-EG', { maximumFractionDigits: 2 })}`);
export const num = (n) => Number(n || 0).toLocaleString('en-EG');
export const date = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'partially_refunded', 'refunded', 'failed'];
export const label = (s) => String(s || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
export const pill = (s) => `<span class="pill pill--${esc(s)}">${esc(label(s))}</span>`;

let toastTimer;
export function toast(msg, kind = 'ok') {
  let t = document.querySelector('.a-toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'a-toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.dataset.kind = kind;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
}

export function fail(e) {
  console.error(e);
  toast(e?.message || 'Something went wrong.', 'error');
}

/** Side panel for editing; returns { el, close }. */
export function panel(title, html, { wide = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'a-panel';
  wrap.innerHTML = `
    <div class="a-panel__scrim" data-close></div>
    <section class="a-panel__box ${wide ? 'a-panel__box--wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="a-panel__head"><h2>${esc(title)}</h2><button class="a-icon" data-close aria-label="Close">✕</button></header>
      <div class="a-panel__body">${html}</div>
    </section>`;
  document.body.appendChild(wrap);
  const prev = document.activeElement;
  const close = () => {
    wrap.remove();
    document.removeEventListener('keydown', onKey);
    prev?.focus?.();
  };
  const onKey = (e) => e.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);
  wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  wrap.querySelector('.a-panel__box').focus?.();
  setTimeout(() => wrap.querySelector('input, select, textarea, button:not([data-close])')?.focus(), 30);
  return { el: wrap.querySelector('.a-panel__body'), close };
}

export function confirmDialog(message) {
  return Promise.resolve(window.confirm(message));
}

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((v) => {
          const s = v === null || v === undefined ? '' : String(v);
          /* neutralise spreadsheet formula injection */
          const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
          return /[",\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const formData = (form) => Object.fromEntries(new FormData(form).entries());
export const list = (s) =>
  String(s || '')
    .split(/[,\n·]/)
    .map((x) => x.trim())
    .filter(Boolean);
export const nullable = (v) => (v === '' || v === undefined ? null : v);
export const nullableNum = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

/** Simple dependency-free bar chart (SVG). */
export function barChart(rows, { valueKey, labelKey, format = num, height = 160 } = {}) {
  if (!rows.length) return '<p class="a-empty">No data in this period.</p>';
  const max = Math.max(...rows.map((r) => Number(r[valueKey] || 0)), 1);
  const w = 100 / rows.length;
  return `<div class="a-chart" style="--h:${height}px">
    ${rows
      .map(
        (r) => `<div class="a-chart__col" style="width:${w}%" title="${esc(r[labelKey])}: ${esc(format(r[valueKey]))}">
          <span class="a-chart__bar" style="height:${(Number(r[valueKey] || 0) / max) * 100}%"></span>
          <span class="a-chart__lbl">${esc(r[labelKey])}</span>
        </div>`
      )
      .join('')}
  </div>`;
}
