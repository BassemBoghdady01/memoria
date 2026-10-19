/**
 * Website content — hero, featured scent, brand story, announcement bar,
 * campaign images and which homepage sections show. Saved to store
 * settings; the storefront reads them on load. No source files to edit.
 */
import { sb, q, loadSettings, saveSetting, uploadImage } from '../api.js';
import { esc, toast, fail } from '../ui.js';

const SECTIONS = [
  ['collection', 'Fragrance gallery'],
  ['featured', 'Memory Spray film'],
  ['memories', 'House archive photographs'],
  ['story', 'Heritage section'],
  ['whatsapp_band', 'WhatsApp band'],
];

export default async function content(root) {
  const [s, products] = await Promise.all([
    loadSettings(['home', 'announcement', 'offer', 'heritage']),
    q(sb.from('products').select('slug, name').eq('status', 'published').order('sort_order')),
  ]);
  const home = s.home || {};
  const hero = home.hero || {};
  const story = home.story || {};
  const ann = s.announcement || {};
  const offer = s.offer || {};
  const her = s.heritage || {};
  const opts = (sel) => products.map((p) => `<option value="${esc(p.slug)}" ${p.slug === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  const imgField = (name, url, labelText) => `
    <div class="a-imgfield" data-imgfield="${name}">
      <span>${labelText}</span>
      ${url ? `<img src="${esc(url)}" alt="" />` : '<span class="a-muted">Using the default campaign photograph.</span>'}
      <input type="hidden" name="${name}" value="${esc(url || '')}" />
      <label class="a-upload a-upload--small">Upload <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
      ${url ? '<button type="button" class="a-link" data-clear>Remove</button>' : ''}
    </div>`;

  root.innerHTML = `
    <header class="a-head"><h1>Website content</h1><a class="a-btn" href="/" target="_blank" rel="noopener">View homepage ↗</a></header>
    <form class="a-form" data-form>
      <section class="a-card">
        <h2>Hero</h2>
        <div class="a-grid2">
          <label>Small line above the headline <input name="eyebrow" maxlength="60" value="${esc(hero.eyebrow || '')}" /></label>
          <label>Bottle shown in the hero <select name="hero_product">${opts(hero.product_slug)}</select></label>
          <label>Headline <input name="headline" maxlength="90" value="${esc(hero.headline || '')}" /></label>
          <label>Word in handwritten script (must appear in the headline) <input name="script" maxlength="30" value="${esc(hero.script || '')}" /></label>
        </div>
        <label>Supporting line (optional) <input name="subline" maxlength="160" value="${esc(hero.subline || '')}" /></label>
        <div class="a-grid2">${imgField('image_url', hero.image_url, 'Desktop hero photograph')}${imgField('mobile_image_url', hero.mobile_image_url, 'Mobile hero photograph')}</div>
        <p class="a-muted">Use real, licensed photography. The bottle is always the real product photograph, placed over the scene.</p>
      </section>

      <section class="a-card">
        <h2>Featured scent</h2>
        <label>Product <select name="featured_slug">${opts(home.featured_slug)}</select></label>
      </section>

      <section class="a-card">
        <h2>Brand story</h2>
        <p class="a-muted">Shown on the homepage and the Our Story page. Separate paragraphs with a blank line.</p>
        <label>Title <input name="story_title" maxlength="120" value="${esc(story.title || '')}" /></label>
        <label>Text <textarea name="story_body" rows="8" maxlength="5000">${esc(story.body || '')}</textarea></label>
        ${imgField('story_image', story.image_url, 'Story image')}
      </section>

      <section class="a-card">
        <h2>Offer banner</h2>
        <p class="a-muted">Wording only. The price rules themselves live in Products (regular / sale price) and Discounts (quantity offer).</p>
        <label class="a-check"><input type="checkbox" name="offer_enabled" ${offer.enabled ? 'checked' : ''}/> Show the offer on the website</label>
        <label>Headline <input name="offer_headline" maxlength="80" value="${esc(offer.headline || '')}" placeholder="Choose any 2 — EGP 899 each" /></label>
        <label>Detail <input name="offer_detail" maxlength="140" value="${esc(offer.detail || '')}" /></label>
      </section>

      <section class="a-card">
        <h2>Heritage</h2>
        <label>Years of perfume making <input name="her_years" type="number" min="0" max="200" value="${her.years ?? ''}" /></label>
        <label>Title <input name="her_title" maxlength="120" value="${esc(her.title || '')}" /></label>
        <label>Handwritten line <input name="her_script" maxlength="80" value="${esc(her.script || '')}" /></label>
        <label>Text <textarea name="her_body" rows="5" maxlength="2000">${esc(her.body || '')}</textarea></label>
        <label>Steps (comma separated) <input name="her_steps" maxlength="200" value="${esc((her.steps || []).join(', '))}" /></label>
      </section>

      <section class="a-card">
        <h2>Announcement bar</h2>
        <label class="a-check"><input type="checkbox" name="ann_enabled" ${ann.enabled ? 'checked' : ''}/> Show the announcement bar</label>
        <label>Text <input name="ann_text" maxlength="140" value="${esc(ann.text || '')}" placeholder="e.g. Free delivery in Cairo over EGP …" /></label>
        <label>Link (optional) <input name="ann_link" maxlength="200" value="${esc(ann.link || '')}" placeholder="/shop" /></label>
      </section>

      <section class="a-card">
        <h2>Homepage sections</h2>
        ${SECTIONS.map(([k, l]) => `<label class="a-check"><input type="checkbox" name="sec_${k}" ${home.sections?.[k] === false ? '' : 'checked'}/> ${l}</label>`).join('')}
      </section>

      <div class="a-actions a-actions--sticky"><button class="a-btn a-btn--primary">Save content</button></div>
    </form>`;

  root.querySelectorAll('[data-imgfield]').forEach((box) => {
    const hidden = box.querySelector('input[type=hidden]');
    box.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        toast('Uploading…');
        const up = await uploadImage(file, 'site');
        hidden.value = up.url;
        box.querySelector('img')?.remove();
        box.querySelector('.a-muted')?.remove();
        box.insertAdjacentHTML('afterbegin', `<img src="${esc(up.url)}" alt="" />`);
        box.prepend(box.querySelector('span'));
        toast('Uploaded. Save to publish.');
      } catch (err) {
        fail(err);
      }
    });
    box.querySelector('[data-clear]')?.addEventListener('click', () => {
      hidden.value = '';
      box.querySelector('img')?.remove();
      toast('Removed. Save to publish.');
    });
  });

  root.querySelector('[data-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    if (f.script && !f.headline.includes(f.script)) return toast('The script word must appear in the headline.', 'error');
    const next = {
      ...home,
      hero: { ...hero, eyebrow: f.eyebrow.trim(), headline: f.headline.trim(), script: f.script.trim(), subline: f.subline.trim(), image_url: f.image_url, mobile_image_url: f.mobile_image_url, product_slug: f.hero_product },
      featured_slug: f.featured_slug,
      story: { title: f.story_title.trim(), body: f.story_body.trim(), image_url: f.story_image },
      sections: Object.fromEntries(SECTIONS.map(([k]) => [k, Boolean(f[`sec_${k}`])])),
    };
    try {
      await saveSetting('home', next, true);
      await saveSetting('offer', { enabled: Boolean(f.offer_enabled), headline: f.offer_headline.trim(), detail: f.offer_detail.trim() }, true);
      await saveSetting('heritage', { years: f.her_years ? Number(f.her_years) : null, title: f.her_title.trim(), script: f.her_script.trim(), body: f.her_body.trim(), steps: f.her_steps.split(',').map((x) => x.trim()).filter(Boolean) }, true);
      await saveSetting('announcement', { enabled: Boolean(f.ann_enabled), text: f.ann_text.trim(), link: f.ann_link.trim() }, true);
      toast('Saved. The website shows it on next load.');
    } catch (err) {
      fail(err);
    }
  });
}
