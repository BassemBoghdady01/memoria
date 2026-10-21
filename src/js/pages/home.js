/**
 * MEMÓRIA · Homepage — art direction "Afternoon Light".
 *
 *  1 HERO        the real bottle on sunlit plaster, one headline, one action
 *  2 INTRO       seven scents, each named for a moment (index)
 *  3 COLLECTION  one magazine spread per scent: memory · bottle · buy
 *  4 THE LIGHT   the afternoon passes over one bottle, then its memory
 *  5 HERITAGE    25 years, in the owner's words, with details of the bottle
 *  6 WHATSAPP    help choosing
 *
 * Copy, hero product, heritage text and section visibility are store
 * settings (Dashboard → Website content). Products and prices come from
 * the database.
 */
import { products, settings, getProduct, getFeatured } from '../data/catalog.js';
import { motionOK, onPageCleanup } from '../motion.js';
import { setSeo } from '../seo.js';
import { edHero, edIntro, edCollection, edLight, edHeritage, edWhatsApp, mountEditorial } from '../components/editorial.js';
import ed from '../data/editorial.json';

const home = () => settings.home || {};
const on = (key) => home().sections?.[key] !== false;

export default {
  title: 'MEMÓRIA — Memories You Can Wear',

  render() {
    const heroP = getProduct(home().hero?.product_slug) || getFeatured();
    return [
      edHero(heroP),
      on('collection') ? edIntro(products) + edCollection(products) : '',
      on('featured') ? edLight(getProduct(ed.light?.slug)) : '',
      on('story') ? edHeritage() : '',
      on('whatsapp_band') ? edWhatsApp() : '',
    ].join('');
  },

  mount(root) {
    setSeo({
      title: 'MEMÓRIA — Memories You Can Wear',
      description: 'MEMÓRIA — 25 years of perfume craft in Cairo. Seven fragrances, each named for a moment. Order online with delivery across Egypt, or on WhatsApp.',
      path: '/',
      jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'MEMÓRIA', url: location.origin, logo: location.origin + '/brand/logo-black-560.png' },
    });
    document.body.classList.add('is-home');
    onPageCleanup(() => document.body.classList.remove('is-home'));
    mountEditorial(root, { reduced: !motionOK() });
  },
};
