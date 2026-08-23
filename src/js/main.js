/**
 * MEMÓRIA · Bootstrap.
 */
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/500-italic.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/kaushan-script/400.css'; /* brand brush accent — used sparingly */
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/600.css';
import '@fontsource/courier-prime/400.css';
import '../styles/main.css';

import { initSmoothScroll } from './motion.js';
import { register, setNotFound, initRouter } from './router.js';
import { renderRibbon, renderHeader, renderFooter } from './components/chrome.js';

import homePage from './pages/home.js';
import { shopPage, womenPage, menPage } from './pages/shop.js';
import productPage from './pages/product.js';
import storyPage from './pages/story.js';
import archivePage from './pages/archive.js';
import cartPage from './pages/cart.js';
import checkoutPage from './pages/checkout.js';
import { searchPage, accountPage, helpPage, notFoundPage } from './pages/misc.js';

/* — chrome — */
renderRibbon();
renderHeader();
renderFooter();

/* — routes — */
register('/', homePage);
register('/shop', shopPage);
register('/women', womenPage);
register('/men', menPage);
register('/product/:slug', productPage);
register('/our-story', storyPage);
register('/archive', archivePage);
register('/cart', cartPage);
register('/checkout', checkoutPage);
register('/search', searchPage);
register('/account', accountPage);
register('/help', helpPage);
setNotFound(notFoundPage);

/* — go — */
initSmoothScroll();
initRouter();
