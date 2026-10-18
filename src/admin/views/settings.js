/**
 * Store settings — WhatsApp number, contact, social links, delivery text,
 * payment methods, company details for invoices, invoice numbering, team.
 */
import { sb, q, state, loadSettings, saveSetting } from '../api.js';
import { esc, toast, fail } from '../ui.js';

export default async function settings(root) {
  const s = await loadSettings(['whatsapp', 'contact', 'social', 'shipping_info', 'payments', 'company', 'invoice']);
  const team = await q(sb.from('admin_profiles').select('*').order('created_at'));
  const wa = s.whatsapp || {};
  const c = s.contact || {};
  const so = s.social || {};
  const sh = s.shipping_info || {};
  const methods = s.payments?.methods || [];
  const co = s.company || {};
  const inv = s.invoice || {};
  const v = (x) => esc(x || '');

  root.innerHTML = `
    <header class="a-head"><h1>Store settings</h1></header>
    <form class="a-form" data-form>
      <section class="a-card">
        <h2>WhatsApp ordering</h2>
        <div class="a-grid2">
          <label>Number (international, digits only) <input name="wa_number" inputmode="numeric" pattern="[0-9]{10,15}" value="${v(wa.number)}" placeholder="201500007544" /></label>
          <label>Shown to customers as <input name="wa_display" value="${v(wa.display)}" placeholder="+20 150 000 7544" /></label>
        </div>
        <label class="a-check"><input type="checkbox" name="wa_enabled" ${wa.enabled === false ? '' : 'checked'}/> Show WhatsApp ordering on the website</label>
        <p class="a-muted">WhatsApp messages are not orders: nothing is recorded or marked paid until you create or confirm it.</p>
      </section>

      <section class="a-card">
        <h2>Contact &amp; social</h2>
        <div class="a-grid2">
          <label>Email <input name="c_email" type="email" value="${v(c.email)}" /></label>
          <label>Phone <input name="c_phone" value="${v(c.phone)}" /></label>
          <label>Address <input name="c_address" value="${v(c.address)}" /></label>
          <label>Opening hours <input name="c_hours" value="${v(c.hours)}" /></label>
          <label>Instagram URL <input name="s_instagram" type="url" value="${v(so.instagram)}" placeholder="https://instagram.com/…" /></label>
          <label>Facebook URL <input name="s_facebook" type="url" value="${v(so.facebook)}" /></label>
          <label>TikTok URL <input name="s_tiktok" type="url" value="${v(so.tiktok)}" /></label>
        </div>
      </section>

      <section class="a-card">
        <h2>Delivery information</h2>
        <p class="a-muted">Fees per governorate are set under Shipping. This text appears on the Customer care page.</p>
        <label>Summary <input name="sh_summary" maxlength="200" value="${v(sh.summary)}" /></label>
        <label>Details <textarea name="sh_details" rows="4" maxlength="2000">${v(sh.details)}</textarea></label>
      </section>

      <section class="a-card">
        <h2>Payment methods at checkout</h2>
        <p class="a-muted">Only enable methods the business actually accepts. Card payments need a configured gateway (Paymob, Fawry or Kashier merchant account) and cannot be switched on here.</p>
        ${methods
          .map(
            (m, i) => `<div class="a-paymethod">
            <label class="a-check"><input type="checkbox" name="pm_${i}" ${m.enabled ? 'checked' : ''} ${m.requires_gateway ? 'disabled' : ''}/> <b>${esc(m.label)}</b></label>
            <input name="pmd_${i}" value="${v(m.description)}" aria-label="${esc(m.label)} description" />
            ${m.requires_gateway ? '<span class="a-muted">Not available until a gateway is integrated.</span>' : ''}
          </div>`
          )
          .join('')}
      </section>

      <section class="a-card">
        <h2>Company details (invoices)</h2>
        <p class="a-muted">Printed on invoices. Leave tax fields empty until you have verified registration numbers; invoices are sales receipts, not Tax Authority e-invoices.</p>
        <div class="a-grid2">
          <label>Legal name <input name="co_legal_name" value="${v(co.legal_name)}" /></label>
          <label>Trade name <input name="co_trade_name" value="${v(co.trade_name)}" /></label>
          <label>Address <input name="co_address" value="${v(co.address)}" /></label>
          <label>Phone <input name="co_phone" value="${v(co.phone)}" /></label>
          <label>Email <input name="co_email" type="email" value="${v(co.email)}" /></label>
          <label>Tax registration number <input name="co_tax_registration_number" value="${v(co.tax_registration_number)}" /></label>
          <label>Commercial register <input name="co_commercial_register" value="${v(co.commercial_register)}" /></label>
        </div>
        <h3>Invoice numbering</h3>
        <div class="a-grid3">
          <label>Prefix <input name="inv_prefix" maxlength="20" value="${v(inv.prefix)}" /></label>
          <label>Next number <input name="inv_next" type="number" min="1" value="${inv.next_number ?? 1}" /></label>
          <label>Digits <input name="inv_padding" type="number" min="1" max="10" value="${inv.padding ?? 5}" /></label>
        </div>
        <label>Invoice footer note <textarea name="inv_footer" rows="2" maxlength="500">${v(inv.footer_note)}</textarea></label>
      </section>

      <div class="a-actions a-actions--sticky"><button class="a-btn a-btn--primary">Save settings</button></div>
    </form>

    <section class="a-card">
      <h2>Team</h2>
      <table class="a-table"><thead><tr><th>Name</th><th>Role</th><th>Active</th></tr></thead><tbody>
        ${team.map((t) => `<tr><td>${esc(t.full_name || t.user_id)}</td><td>${esc(t.role)}</td><td>${t.active ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody></table>
      <p class="a-muted">New team members are invited from the Supabase dashboard (Authentication → Invite user), then given access with one SQL line; see DEPLOYMENT.md. There is no public sign-up.</p>
    </section>`;

  root.querySelector('[data-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    const digits = (f.wa_number || '').replace(/\D/g, '');
    if (digits && digits.length < 10) return toast('The WhatsApp number looks too short.', 'error');
    try {
      await Promise.all([
        saveSetting('whatsapp', { number: digits, display: f.wa_display.trim(), enabled: Boolean(f.wa_enabled) }, true),
        saveSetting('contact', { email: f.c_email.trim(), phone: f.c_phone.trim(), address: f.c_address.trim(), hours: f.c_hours.trim() }, true),
        saveSetting('social', { instagram: f.s_instagram.trim(), facebook: f.s_facebook.trim(), tiktok: f.s_tiktok.trim() }, true),
        saveSetting('shipping_info', { summary: f.sh_summary.trim(), details: f.sh_details.trim() }, true),
        saveSetting('payments', { methods: methods.map((m, i) => ({ ...m, enabled: m.requires_gateway ? false : Boolean(f[`pm_${i}`]), description: (f[`pmd_${i}`] ?? m.description).trim() })) }, true),
        saveSetting('company', Object.fromEntries(['legal_name', 'trade_name', 'address', 'phone', 'email', 'tax_registration_number', 'commercial_register'].map((k) => [k, (f[`co_${k}`] || '').trim()])), false),
        saveSetting('invoice', { prefix: f.inv_prefix.trim(), next_number: Math.max(1, Number(f.inv_next || 1)), padding: Math.min(10, Math.max(1, Number(f.inv_padding || 5))), footer_note: f.inv_footer.trim() }, false),
      ]);
      toast('Settings saved.');
    } catch (err) {
      fail(err);
    }
  });
  void state;
}
