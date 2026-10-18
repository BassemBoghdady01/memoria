/**
 * Shipping — zones with fees, free-shipping thresholds and delivery
 * estimates, and which governorates belong to each zone. Nothing is
 * pre-filled: a governorate without a zone shows "delivery fee confirmed
 * by phone" at checkout rather than an invented price.
 */
import { sb, q } from '../api.js';
import { esc, money, panel, toast, fail, nullableNum, confirmDialog, formData } from '../ui.js';

export default async function shipping(root) {
  async function render() {
    const [zones, govs] = await Promise.all([
      q(sb.from('shipping_zones').select('*').order('sort_order').order('name')),
      q(sb.from('governorates').select('*').order('sort_order')),
    ]);
    root.innerHTML = `
      <header class="a-head"><h1>Shipping</h1><button class="a-btn a-btn--primary" data-new>Add zone</button></header>
      <div class="a-card">
        <h2>Zones</h2>
        ${zones.length ? `<table class="a-table a-table--rows"><thead><tr><th>Zone</th><th>Fee</th><th>Free over</th><th>Estimated delivery</th><th>Governorates</th><th>Active</th></tr></thead><tbody>
          ${zones.map((z) => `<tr data-id="${esc(z.id)}" tabindex="0"><td><b>${esc(z.name)}</b></td><td>${money(z.fee)}</td><td>${z.free_shipping_threshold !== null ? money(z.free_shipping_threshold) : '—'}</td><td>${esc(z.estimated_delivery || '—')}</td><td>${govs.filter((g) => g.zone_id === z.id).length}</td><td>${z.active ? 'Yes' : 'No'}</td></tr>`).join('')}
        </tbody></table>` : '<p class="a-empty">No zones yet. Add one (e.g. “Greater Cairo”) with your real delivery fee, then assign governorates below.</p>'}
      </div>
      <form class="a-card a-form" data-govs>
        <h2>Governorates</h2>
        <p class="a-muted">Assign each governorate to a zone. Unassigned governorates can still order; the fee is confirmed by phone. Untick to stop delivering there.</p>
        <table class="a-table"><thead><tr><th>Governorate</th><th>Zone</th><th>Deliver</th></tr></thead><tbody>
          ${govs.map((g) => `<tr><td>${esc(g.name_en)} · ${esc(g.name_ar)}</td><td><select name="zone_${g.id}"><option value="">Unassigned</option>${zones.map((z) => `<option value="${z.id}" ${z.id === g.zone_id ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select></td><td><input type="checkbox" name="active_${g.id}" ${g.active ? 'checked' : ''} aria-label="Deliver to ${esc(g.name_en)}"/></td></tr>`).join('')}
        </tbody></table>
        <div class="a-actions"><button class="a-btn a-btn--primary">Save governorates</button></div>
      </form>`;

    root.querySelector('[data-new]').addEventListener('click', () => editZone({}));
    root.querySelectorAll('[data-id]').forEach((tr) => {
      const open = () => editZone(zones.find((z) => z.id === tr.dataset.id));
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => e.key === 'Enter' && open());
    });
    root.querySelector('[data-govs]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const changed = govs.filter((g) => (fd.get(`zone_${g.id}`) || null) !== g.zone_id || fd.has(`active_${g.id}`) !== g.active);
        await Promise.all(changed.map((g) => q(sb.from('governorates').update({ zone_id: fd.get(`zone_${g.id}`) || null, active: fd.has(`active_${g.id}`) }).eq('id', g.id))));
        toast(changed.length ? `Saved ${changed.length} change(s).` : 'Nothing changed.');
        render();
      } catch (err) {
        fail(err);
      }
    });
  }

  function editZone(z) {
    const { el, close } = panel(z.id ? `Edit ${z.name}` : 'New zone', `
      <form class="a-form" data-form>
        <label>Name <input name="name" required maxlength="80" value="${esc(z.name || '')}" /></label>
        <label>Delivery fee (EGP) <input name="fee" type="number" min="0" step="0.01" required value="${z.fee ?? ''}" /></label>
        <label>Free delivery for orders over (EGP, optional) <input name="free_shipping_threshold" type="number" min="0" step="0.01" value="${z.free_shipping_threshold ?? ''}" /></label>
        <label>Estimated delivery (shown at checkout) <input name="estimated_delivery" maxlength="80" value="${esc(z.estimated_delivery || '')}" placeholder="e.g. 2–3 working days" /></label>
        <label>Order <input name="sort_order" type="number" value="${z.sort_order ?? 0}" /></label>
        <label class="a-check"><input type="checkbox" name="active" ${z.active === false ? '' : 'checked'}/> Active</label>
        <div class="a-actions"><button class="a-btn a-btn--primary">Save</button>${z.id ? '<button type="button" class="a-btn a-btn--danger" data-del>Delete</button>' : ''}</div>
      </form>`);
    el.querySelector('[data-form]').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = formData(e.target);
      const row = { name: f.name.trim(), fee: Number(f.fee), free_shipping_threshold: nullableNum(f.free_shipping_threshold), estimated_delivery: f.estimated_delivery.trim() || null, sort_order: Number(f.sort_order || 0), active: Boolean(f.active) };
      try {
        if (z.id) await q(sb.from('shipping_zones').update(row).eq('id', z.id));
        else await q(sb.from('shipping_zones').insert(row));
        toast('Zone saved.');
        close();
        render();
      } catch (err) {
        fail(err);
      }
    });
    el.querySelector('[data-del]')?.addEventListener('click', async () => {
      if (!(await confirmDialog('Delete this zone? Its governorates become unassigned.'))) return;
      try {
        await q(sb.from('shipping_zones').delete().eq('id', z.id));
        close();
        render();
      } catch (err) {
        fail(/foreign key/.test(err.message) ? new Error('This zone is used by past orders. Deactivate it instead.') : err);
      }
    });
  }

  await render();
}
