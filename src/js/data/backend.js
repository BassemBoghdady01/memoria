/**
 * MEMÓRIA · Storefront ↔ database bridge.
 *
 * The storefront only ever calls four public database functions
 * (storefront_catalog, quote_cart, place_order, get_order_confirmation)
 * through Supabase's REST endpoint with the public anon key. Prices,
 * discounts, shipping and stock are decided in the database — never here.
 *
 * Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY the site runs in
 * "preview" mode: the catalogue is read from the seed files and checkout
 * is honestly unavailable.
 */
const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const backendConfigured = Boolean(URL_ && KEY);

export async function rpc(name, args = {}) {
  if (!backendConfigured) throw new Error('backend-not-configured');
  const res = await fetch(`${URL_}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      msg = (await res.json()).message || msg;
    } catch {
      /* keep generic */
    }
    throw new Error(msg);
  }
  return res.json();
}
