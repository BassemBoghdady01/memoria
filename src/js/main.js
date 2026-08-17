/**
 * MEMÓRIA · Bootstrap.
 */
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/jost/600.css';
import '@fontsource/courier-prime/400.css';
/* handwriting face retired with the 2026 creative reset */
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
import { searchPage, accountPage, notFoundPage } from './pages/misc.js';

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
setNotFound(notFoundPage);

/* — go — */
initSmoothScroll();
initRouter();
