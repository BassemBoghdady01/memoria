/**
 * MEMÓRIA dashboard · shell, sign-in and routing.
 *
 * Sign-in only: there is no sign-up. A signed-in user who has no row in
 * admin_profiles sees nothing and is signed out — and the database
 * refuses their requests regardless of what this page shows.
 */
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/600.css';
import '@fontsource/fraunces/500.css';
import './admin.css';
import { sb, configured, state, q } from './api.js';
import { esc, fail } from './ui.js';

const VIEWS = {
  overview: { label: 'Overview', load: () => import('./views/overview.js') },
  orders: { label: 'Orders', load: () => import('./views/orders.js') },
  products: { label: 'Products', load: () => import('./views/products.js') },
  discounts: { label: 'Discounts', load: () => import('./views/discounts.js') },
  invoices: { label: 'Invoices', load: () => import('./views/invoices.js') },
  customers: { label: 'Customers', load: () => import('./views/customers.js') },
  memories: { label: 'Memories', load: () => import('./views/memories.js') },
  shipping: { label: 'Shipping', load: () => import('./views/shipping.js') },
  content: { label: 'Website content', load: () => import('./views/content.js') },
  settings: { label: 'Store settings', load: () => import('./views/settings.js') },
};

const app = document.getElementById('app');

function notConfigured() {
  app.innerHTML = `
    <main class="a-gate">
      <img src="/brand/logo-brown-320.png" alt="MEMÓRIA" width="160" />
      <h1>The dashboard isn’t connected to a database yet.</h1>
      <p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see <code>DEPLOYMENT.md</code>), then reload.</p>
    </main>`;
}

function loginView(message = '') {
  app.innerHTML = `
    <main class="a-gate">
      <img src="/brand/logo-brown-320.png" alt="MEMÓRIA" width="160" />
      <h1>Dashboard sign-in</h1>
      <form class="a-form a-gate__form" data-login>
        <label>Email <input name="email" type="email" autocomplete="username" required /></label>
        <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
        <p class="a-error" data-msg role="alert">${esc(message)}</p>
        <button class="a-btn a-btn--primary" type="submit">Sign in</button>
      </form>
      <p class="a-muted">Access is by invitation from the store owner.</p>
    </main>`;
  app.querySelector('[data-login]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button');
    btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    btn.disabled = false;
    if (error) f.querySelector('[data-msg]').textContent = 'Those details didn’t work. Please try again.';
  });
}

function shell() {
  app.innerHTML = `
    <div class="a-shell">
      <aside class="a-side">
        <a class="a-side__logo" href="#/overview"><img src="/brand/logo-brown-320.png" alt="MEMÓRIA" width="120" /><span>Dashboard</span></a>
        <nav class="a-nav" aria-label="Dashboard">
          ${Object.entries(VIEWS)
            .map(([k, v]) => `<a href="#/${k}" data-nav="${k}">${esc(v.label)}</a>`)
            .join('')}
        </nav>
        <div class="a-side__foot">
          <span class="a-muted">${esc(state.profile.full_name || state.user.email)} · ${esc(state.profile.role)}</span>
          <a href="/" target="_blank" rel="noopener">View store ↗</a>
          <button class="a-link" data-signout>Sign out</button>
        </div>
      </aside>
      <button class="a-menu" data-menu aria-label="Menu">☰</button>
      <main class="a-main" id="view" tabindex="-1"></main>
    </div>`;
  app.querySelector('[data-signout]').addEventListener('click', () => sb.auth.signOut());
  app.querySelector('[data-menu]').addEventListener('click', () => app.querySelector('.a-side').classList.toggle('is-open'));
  app.querySelectorAll('.a-nav a').forEach((a) => a.addEventListener('click', () => app.querySelector('.a-side').classList.remove('is-open')));
}

let renderSeq = 0;
async function route() {
  if (!state.profile) return;
  const [name, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  const key = VIEWS[name] ? name : 'overview';
  app.querySelectorAll('[data-nav]').forEach((a) => a.toggleAttribute('aria-current', a.dataset.nav === key));
  const view = document.getElementById('view');
  const mine = ++renderSeq;
  view.innerHTML = '<p class="a-loading">Loading…</p>';
  document.title = `${VIEWS[key].label} · MEMÓRIA Dashboard`;
  try {
    const mod = await VIEWS[key].load();
    if (mine !== renderSeq) return;
    await mod.default(view, rest);
  } catch (e) {
    if (mine === renderSeq) view.innerHTML = `<div class="a-card a-error-card"><h2>Couldn’t load ${esc(VIEWS[key].label)}</h2><p>${esc(e.message)}</p></div>`;
    fail(e);
  }
  view.focus({ preventScroll: true });
}

async function onSession(session) {
  state.user = session?.user || null;
  state.profile = null;
  if (!state.user) return loginView();
  try {
    const rows = await q(sb.from('admin_profiles').select('*').eq('user_id', state.user.id).eq('active', true));
    if (!rows.length) {
      await sb.auth.signOut();
      return loginView('This account doesn’t have dashboard access.');
    }
    state.profile = rows[0];
    shell();
    route();
  } catch (e) {
    loginView(e.message);
  }
}

if (!configured) notConfigured();
else {
  window.addEventListener('hashchange', route);
  let lastUser;
  sb.auth.onAuthStateChange((_evt, session) => {
    const id = session?.user?.id || null;
    if (id === lastUser) return;
    lastUser = id;
    onSession(session);
  });
}
