/**
 * Discounts — codes and automatic offers. All rules (dates, minimums,
 * usage limits, eligibility) are enforced by the database at checkout;
 * the browser never decides whether a code is valid.
 */
import { sb, q } from '../api.js';
import { esc, money, date, panel, toast, fail, nullable, nullableNum, confirmDialog, formData } from '../ui.js';

export default async function discounts(root) {
  const [products, categories] = await Promise.all([
    q(sb.from('products').select('id, name').neq('status', 'archived').order('sort_order')),
    q(sb.from('categories').select('id, name').order('sort_order')),
  ]);
  root.innerHTML = `
    <header class="a-head"><h1>Discounts</h1><button class="a-btn a-btn--primary" data-new>Create discount</button></header>
    <div class="a-card a-card--flush" data-list><p class="a-loading">Loading…</p></div>`;
  const listEl = root.querySelector('[data-list]');

  const now = new Date();
  const state = (d) => {
    if (!d.active) return ['Inactive', 'draft'];
    if (d.starts_at && new Date(d.starts_at) > now) return ['Scheduled', 'pending'];
    if (d.ends_at && new Date(d.ends_at) <= now) return ['Ended', 'cancelled'];
    if (d.usage_limit && d.times_used >= d.usage_limit) return ['Used up', 'cancelled'];
    return ['Live', 'paid'];
  };

  async function load() {
    const rows = await q(sb.from('discounts').select('*').order('created_at', { ascending: false }));
    listEl.innerHTML = rows.length
      ? `<table class="a-table a-table--rows"><thead><tr><th>Code / name</th><th>Value</th><th>Applies to</th><th>Rules</th><th>Used</th><th>Status</th></tr></thead><tbody>
      ${rows
        .map((d) => {
          const [st, cls] = state(d);
          const scope = d.scope === 'order' ? 'Whole order' : d.scope === 'product' ? `${d.product_ids.length} product(s)` : `${d.category_ids.length} category(ies)`;
          const rules = [d.min_order_amount && `Min ${money(d.min_order_amount)}`, d.starts_at && `From ${date(d.starts_at)}`, d.ends_at && `Until ${date(d.ends_at)}`, d.per_customer_limit && `${d.per_customer_limit}× per customer`]
            .filter(Boolean)
            .join(' · ');
          return `<tr data-id="${esc(d.id)}" tabindex="0"><td><b>${esc(d.code || 'Automatic offer')}</b><br/><small class="a-muted">${esc(d.name)}</small></td>
            <td>${d.kind === 'percentage' ? `${Number(d.value)}%` : money(d.value)}</td><td>${scope}</td><td>${rules || '—'}</td>
            <td>${d.times_used}${d.usage_limit ? ` / ${d.usage_limit}` : ''}</td><td><span class="pill pill--${cls}">${st}</span></td></tr>`;
        })
        .join('')}</tbody></table>`
      : '<p class="a-empty a-pad">No discounts yet. Codes such as MEMORIA10 or WELCOME15 can be created here; none are live until you create and activate them.</p>';
    listEl.querySelectorAll('[data-id]').forEach((tr) => {
      const open = () => edit(rows.find((r) => r.id === tr.dataset.id));
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => e.key === 'Enter' && open());
    });
  }

  const local = (ts) => (ts ? new Date(new Date(ts).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

  function edit(d = {}) {
    const { el, close } = panel(d.id ? `Edit ${d.code || d.name}` : 'New discount', `
      <form class="a-form" data-form>
        <div class="a-grid2">
          <label>Code <input name="code" value="${esc(d.code || '')}" pattern="[A-Za-z0-9_-]{3,32}" placeholder="e.g. WELCOME15 (leave empty for an automatic offer)" /></label>
          <label>Internal name <input name="name" required maxlength="120" value="${esc(d.name || '')}" /></label>
          <label>Type <select name="kind"><option value="percentage" ${d.kind !== 'fixed' ? 'selected' : ''}>Percentage off</option><option value="fixed" ${d.kind === 'fixed' ? 'selected' : ''}>Fixed amount off (EGP)</option></select></label>
          <label>Value <input name="value" type="number" min="0.01" step="0.01" required value="${d.value ?? ''}" /></label>
          <label>Applies to <select name="scope">
            <option value="order" ${!d.scope || d.scope === 'order' ? 'selected' : ''}>Whole order</option>
            <option value="product" ${d.scope === 'product' ? 'selected' : ''}>Specific products</option>
            <option value="category" ${d.scope === 'category' ? 'selected' : ''}>Specific categories</option></select></label>
          <label>Minimum order (EGP) <input name="min_order_amount" type="number" min="0" step="0.01" value="${d.min_order_amount ?? ''}" /></label>
          <label>Starts <input name="starts_at" type="datetime-local" value="${local(d.starts_at)}" /></label>
          <label>Ends <input name="ends_at" type="datetime-local" value="${local(d.ends_at)}" /></label>
          <label>Total usage limit <input name="usage_limit" type="number" min="1" value="${d.usage_limit ?? ''}" /></label>
          <label>Uses per customer (by phone) <input name="per_customer_limit" type="number" min="1" value="${d.per_customer_limit ?? ''}" /></label>
        </div>
        <fieldset data-products ${d.scope === 'product' ? '' : 'hidden'}><legend>Products</legend>
          ${products.map((p) => `<label class="a-check"><input type="checkbox" name="product_ids" value="${p.id}" ${(d.product_ids || []).includes(p.id) ? 'checked' : ''}/> ${esc(p.name)}</label>`).join('')}</fieldset>
        <fieldset data-categories ${d.scope === 'category' ? '' : 'hidden'}><legend>Categories</legend>
          ${categories.map((c) => `<label class="a-check"><input type="checkbox" name="category_ids" value="${c.id}" ${(d.category_ids || []).includes(c.id) ? 'checked' : ''}/> ${esc(c.name)}</label>`).join('')}</fieldset>
        <label class="a-check"><input type="checkbox" name="active" ${d.active ? 'checked' : ''}/> Active</label>
        <p class="a-muted">One discount applies per order. Without a code, the best eligible automatic offer is applied.</p>
        <div class="a-actions"><button class="a-btn a-btn--primary">Save</button>${d.id ? '<button type="button" class="a-btn a-btn--danger" data-del>Delete</button>' : ''}</div>
      </form>`);
    const form = el.querySelector('[data-form]');
    form.scope.addEventListener('change', () => {
      el.querySelector('[data-products]').hidden = form.scope.value !== 'product';
      el.querySelector('[data-categories]').hidden = form.scope.value !== 'category';
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = formData(form);
      const fd = new FormData(form);
      const row = {
        code: nullable(f.code.trim().toUpperCase()),
        name: f.name.trim(),
        kind: f.kind,
        value: Number(f.value),
        scope: f.scope,
        product_ids: f.scope === 'product' ? fd.getAll('product_ids') : [],
        category_ids: f.scope === 'category' ? fd.getAll('category_ids') : [],
        min_order_amount: nullableNum(f.min_order_amount),
        starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null,
        ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
        usage_limit: nullableNum(f.usage_limit),
        per_customer_limit: nullableNum(f.per_customer_limit),
        active: Boolean(f.active),
      };
      if (row.kind === 'percentage' && row.value > 100) return toast('A percentage can’t exceed 100.', 'error');
      if (row.starts_at && row.ends_at && row.starts_at >= row.ends_at) return toast('The end must be after the start.', 'error');
      if (row.scope !== 'order' && !row.product_ids.length && !row.category_ids.length) return toast('Choose at least one product or category.', 'error');
      try {
        if (d.id) await q(sb.from('discounts').update(row).eq('id', d.id));
        else await q(sb.from('discounts').insert(row));
        toast('Discount saved.');
        close();
        load();
      } catch (err) {
        fail(/duplicate key/.test(err.message) ? new Error('That code already exists.') : err);
      }
    });
    el.querySelector('[data-del]')?.addEventListener('click', async () => {
      if (!(await confirmDialog('Delete this discount? Past orders keep their discount record.'))) return;
      try {
        if (d.times_used > 0) await q(sb.from('discounts').update({ active: false }).eq('id', d.id));
        else await q(sb.from('discounts').delete().eq('id', d.id));
        toast(d.times_used > 0 ? 'It has been used, so it was deactivated instead.' : 'Deleted.');
        close();
        load();
      } catch (err) {
        fail(err);
      }
    });
  }

  root.querySelector('[data-new]').addEventListener('click', () => edit());
  await load();
}
