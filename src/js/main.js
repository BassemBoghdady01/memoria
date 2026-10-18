/**
 * MEMÓRIA · Bootstrap.
 * Load the catalogue from the database first, then draw the chrome and route.
 */
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/kaushan-script/400.css'; /* brand brush accent — used sparingly */
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/600.css';
import '../styles/main.css';

import { initSmoothScroll } from './motion.js';
import { register, setNotFound, initRouter, redirect } from './router.js';
import { renderRibbon, renderHeader, renderFooter } from './components/chrome.js';
import { loadCatalog, catalogState } from './data/catalog.js';
import { hydrateCart } from './store/cart.js';
import { mountWhatsAppFloat } from './components/whatsapp.js';

import homePage from './pages/home.js';
import { shopPage, womenPage, menPage } from './pages/shop.js';
import productPage from './pages/product.js';
import storyPage from './pages/story.js';
import cartPage from './pages/cart.js';
import checkoutPage from './pages/checkout.js';
import orderPage from './pages/order.js';
import { searchPage, helpPage, notFoundPage } from './pages/misc.js';

const main = document.querySelector('#main');
main.innerHTML = '<div class="boot" role="status"><span class="boot__mark">MEMÓRIA</span></div>';

await loadCatalog();

if (catalogState.error) {
  main.innerHTML = `
    <section class="container notfound">
      <h1>We couldn’t open the shop just now.</h1>
      <p>Please check your connection and try again in a moment.</p>
      <button class="btn btn--primary" onclick="location.reload()">Try again</button>
    </section>`;
} else {
  hydrateCart();
  renderRibbon();
  renderHeader();
  renderFooter();
  mountWhatsAppFloat();

  register('/', homePage);
  register('/shop', shopPage);
  register('/women', womenPage);
  register('/men', menPage);
  register('/product/:slug', productPage);
  register('/our-story', storyPage);
  register('/cart', cartPage);
  register('/checkout', checkoutPage);
  register('/order/:number', orderPage);
  register('/search', searchPage);
  register('/help', helpPage);
  redirect('/archive', '/our-story');
  redirect('/account', '/shop');
  setNotFound(notFoundPage);

  initSmoothScroll();
  initRouter();
}
