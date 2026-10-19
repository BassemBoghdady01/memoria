/**
 * Products — catalogue, sizes & prices, stock, photos, publishing.
 * Everything saved here appears on the storefront on its next load.
 */
import { sb, q, uploadImage } from '../api.js';
import { esc, money, pill, panel, toast, fail, list, nullable, nullableNum, confirmDialog, formData } from '../ui.js';

export default async function products(root, [openId]) {
  root.innerHTML = `
    <header class="a-head"><h1>Products</h1><button class="a-btn a-btn--primary" data-new>Add product</button></header>
    <form class="a-toolbar" data-f>
      <input type="search" name="s" placeholder="Search products" aria-label="Search products" />
      <select name="status" aria-label="Status"><option value="">All (not archived)</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
    </form>
    <div class="a-card a-card--flush" data-list><p class="a-loading">Loading…</p></div>`;
  const listEl = root.querySelector('[data-list]');
  const form = root.querySelector('[data-f]');
  const categories = await q(sb.from('categories').select('*').order('sort_order'));

  async function load() {
    const f = formData(form);
    let qb = sb
      .from('products')
      .select('id, slug, name, status, featured, sort_order, categories(name), product_variants(id, label, price, sale_price, active, inventory(quantity, low_stock_threshold, track_inventory)), product_images(url, kind, sort_order)')
      .order('sort_order')
      .order('name');
    if (f.status) qb = qb.eq('status', f.status);
    else qb = qb.neq('status', 'archived');
    if (f.s.trim()) qb = qb.ilike('name', `%${f.s.trim().replace(/[%,]/g, '')}%`);
    const rows = await q(qb);
    listEl.innerHTML = rows.length
      ? `<table class="a-table a-table--rows"><thead><tr><th></th><th>Product</th><th>Category</th><th>Sizes &amp; prices</th><th>Stock</th><th>Status</th></tr></thead><tbody>
      ${rows
        .map((p) => {
          const img = p.product_images.filter((i) => i.kind === 'gallery').sort((a, b) => a.sort_order - b.sort_order)[0];
          const vs = p.product_variants.filter((v) => v.active);
          const stock = vs.map((v) => (v.inventory?.track_inventory === false ? '∞' : v.inventory?.quantity ?? 0));
          return `<tr data-id="${esc(p.id)}" tabindex="0">
            <td>${img ? `<img class="a-thumb" src="${esc(img.url)}" alt="" loading="lazy"/>` : '<span class="a-thumb a-thumb--empty"></span>'}</td>
            <td><b>${esc(p.name)}</b>${p.featured ? ' <span class="pill pill--featured">Featured</span>' : ''}<br/><small class="a-muted">/${esc(p.slug)}</small></td>
            <td>${esc(p.categories?.name || '—')}</td>
            <td>${vs.length ? vs.map((v) => `${esc(v.label)}: ${v.price === null ? '<b class="a-bad">no price</b>' : v.sale_price !== null ? `<s>${money(v.price)}</s> ${money(v.sale_price)}` : money(v.price)}`).join('<br/>') : '<b class="a-bad">No sizes yet</b>'}</td>
            <td>${stock.length ? stock.join(' / ') : '—'}</td>
            <td>${pill(p.status)}</td></tr>`;
        })
        .join('')}</tbody></table>`
      : '<p class="a-empty a-pad">No products found.</p>';
    listEl.querySelectorAll('[data-id]').forEach((tr) => {
      const open = () => editProduct(tr.dataset.id, categories, () => load().catch(fail));
      tr.addEventListener('click', open);
      tr.addEventListener('keydown', (e) => e.key === 'Enter' && open());
    });
  }
  let t;
  form.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => load().catch(fail), 250);
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  root.querySelector('[data-new]').addEventListener('click', () => editProduct(null, categories, () => load().catch(fail)));
  await load();
  if (openId) editProduct(openId, categories, () => load().catch(fail));
}

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function editProduct(id, categories, onSaved) {
  let p = {
    name: '', slug: '', status: 'draft', featured: false, sort_order: 0, category_id: null, short_description: '', description: '',
    top_notes: [], heart_notes: [], base_notes: [], fragrance_family: '', concentration: '', story: {}, seo_title: '', seo_description: '',
    product_variants: [], product_images: [],
  };
  if (id) {
    const [row] = await q(sb.from('products').select('*, product_variants(*, inventory(*)), product_images(*)').eq('id', id));
    if (!row) return toast('Product not found.', 'error');
    p = row;
  }
  const variants = [...p.product_variants].sort((a, b) => a.sort_order - b.sort_order);
  const images = [...p.product_images].filter((i) => i.kind === 'gallery').sort((a, b) => a.sort_order - b.sort_order);
  const cutouts = p.product_images.filter((i) => i.kind === 'cutout');

  const { el, close } = panel(id ? `Edit ${p.name}` : 'New product', `
    <form class="a-form" data-product>
      <div class="a-grid2">
        <label>Name <input name="name" required maxlength="120" value="${esc(p.name)}" /></label>
        <label>Web address <input name="slug" required pattern="[a-z0-9-]+" maxlength="80" value="${esc(p.slug)}" placeholder="auto from name" /></label>
        <label>Category <select name="category_id"><option value="">—</option>${categories.map((c) => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        <label>Status <select name="status">${['draft', 'published', 'archived'].map((s) => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></label>
        <label>Fragrance family <input name="fragrance_family" maxlength="80" value="${esc(p.fragrance_family || '')}" /></label>
        <label>Concentration <input name="concentration" maxlength="60" value="${esc(p.concentration || '')}" placeholder="e.g. Eau de Parfum" /></label>
        <label>Display order <input name="sort_order" type="number" value="${p.sort_order ?? 0}" /></label>
        <label class="a-check"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}/> Featured product</label>
      </div>
      <label>Short description <textarea name="short_description" rows="2" maxlength="300">${esc(p.short_description || '')}</textarea></label>
      <label>Description <textarea name="description" rows="4" maxlength="3000">${esc(p.description || '')}</textarea></label>
      <div class="a-grid3">
        <label>Top notes <textarea name="top_notes" rows="2" placeholder="comma separated">${esc((p.top_notes || []).join(', '))}</textarea></label>
        <label>Heart notes <textarea name="heart_notes" rows="2">${esc((p.heart_notes || []).join(', '))}</textarea></label>
        <label>Base notes <textarea name="base_notes" rows="2">${esc((p.base_notes || []).join(', '))}</textarea></label>
      </div>
      <details class="a-details" ${p.story?.draft ? 'open' : ''}><summary>Tagline, memory story &amp; SEO${p.story?.draft ? ' — <b>draft copy, please review</b>' : ''}</summary>
        <label>Tagline (gallery and product page) <input name="story_tagline" maxlength="160" value="${esc(p.story?.tagline || '')}" /></label>
        <label>Gallery scene <select name="story_scene">${['', 'nile-dusk', 'curtain', 'city-window', 'vanity', 'open-window', 'radio', 'cairo-sunset', 'armchair', 'arcade', 'attic'].map((x) => `<option value="${x}" ${(p.story?.scene || '') === x ? 'selected' : ''}>${x || 'Default'}</option>`).join('')}</select></label>
        <label>Memory place (heading) <input name="story_place" maxlength="120" value="${esc(p.story?.place || '')}" /></label>
        <label>Memory story <textarea name="story_text" rows="3" maxlength="1500">${esc(p.story?.text || '')}</textarea></label>
        <label>SEO title <input name="seo_title" maxlength="70" value="${esc(p.seo_title || '')}" /></label>
        <label>SEO description <textarea name="seo_description" rows="2" maxlength="160">${esc(p.seo_description || '')}</textarea></label>
      </details>

      <h3>Sizes, prices &amp; stock</h3>
      <p class="a-muted">A size without a price can’t be bought. Sale price must be lower than the price.</p>
      <table class="a-table a-variants"><thead><tr><th>Label</th><th>ml</th><th>Price (EGP)</th><th>Sale price</th><th>SKU</th><th>In stock</th><th>Low at</th><th>Track</th><th>Active</th><th></th></tr></thead>
        <tbody data-variants>${variants.map(variantRow).join('')}</tbody></table>
      <button type="button" class="a-btn a-btn--small" data-add-variant>Add size</button>

      <div class="a-actions a-actions--sticky">
        <button class="a-btn a-btn--primary" type="submit">Save product</button>
        ${id ? `<button class="a-btn a-btn--danger" type="button" data-delete>Delete</button>` : ''}
        ${id && p.status !== 'archived' ? `<button class="a-btn" type="button" data-archive>Archive</button>` : ''}
        ${id && p.status === 'published' ? `<a class="a-link" href="/product/${esc(p.slug)}" target="_blank" rel="noopener">View on store ↗</a>` : ''}
      </div>
    </form>

    ${
      id
        ? `<section class="a-images">
      <h3>Photos</h3>
      <p class="a-muted">The first photo is the main one. Use the arrows to reorder. Only upload real photographs of this product.</p>
      <div class="a-imgs" data-imgs>${images.map(imageTile).join('') || '<p class="a-empty">No photos yet.</p>'}</div>
      <label class="a-upload">Upload photos <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple data-upload /></label>
      ${cutouts.length ? `<p class="a-muted">${cutouts.length} transparent cut-out(s) used for the homepage hero and collection row.</p>` : ''}
    </section>`
        : '<p class="a-muted">Save the product first, then add photos.</p>'
    }`, { wide: true });

  const form = el.querySelector('[data-product]');
  form.elements.namedItem('name').addEventListener('input', () => {
    if (!id && !form.slug.dataset.touched) form.slug.value = slugify(form.elements.namedItem('name').value);
  });
  form.slug.addEventListener('input', () => (form.slug.dataset.touched = '1'));
  el.querySelector('[data-add-variant]').addEventListener('click', () => {
    el.querySelector('[data-variants]').insertAdjacentHTML('beforeend', variantRow({}));
  });
  el.querySelector('[data-variants]').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-remove-variant]');
    if (!b) return;
    const tr = b.closest('tr');
    if (tr.dataset.id && !(await confirmDialog('Remove this size? If it has orders, it will be deactivated instead.'))) return;
    tr.dataset.removed = '1';
    tr.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = formData(form);
    const row = {
      name: f.name.trim(),
      slug: (f.slug || slugify(f.name)).trim(),
      category_id: nullable(f.category_id),
      status: f.status,
      featured: Boolean(f.featured),
      sort_order: Number(f.sort_order || 0),
      fragrance_family: nullable(f.fragrance_family.trim()),
      concentration: nullable(f.concentration.trim()),
      short_description: nullable(f.short_description.trim()),
      description: nullable(f.description.trim()),
      top_notes: list(f.top_notes),
      heart_notes: list(f.heart_notes),
      base_notes: list(f.base_notes),
      story: { ...(p.story || {}), draft: false, tagline: f.story_tagline.trim() || undefined, scene: f.story_scene || undefined, place: f.story_place.trim() || undefined, text: f.story_text.trim() || undefined },
      seo_title: nullable(f.seo_title.trim()),
      seo_description: nullable(f.seo_description.trim()),
    };
    /* validate sizes before writing anything */
    const vrows = [...el.querySelectorAll('[data-variants] tr')];
    for (const tr of vrows) {
      if (tr.dataset.removed) continue;
      const g = (n) => tr.querySelector(`[name=${n}]`);
      const price = nullableNum(g('price').value);
      const sale = nullableNum(g('sale_price').value);
      if (!g('label').value.trim()) return toast('Every size needs a label, e.g. “100 ml”.', 'error');
      if (sale !== null && (price === null || sale >= price)) return toast(`Sale price for ${g('label').value} must be lower than its price.`, 'error');
    }
    try {
      let pid = id;
      if (id) await q(sb.from('products').update(row).eq('id', id));
      else pid = (await q(sb.from('products').insert(row).select('id')))[0].id;
      if (row.featured) await q(sb.from('products').update({ featured: false }).neq('id', pid).eq('featured', true));

      for (const [i, tr] of vrows.entries()) {
        const g = (n) => tr.querySelector(`[name=${n}]`);
        const vid = tr.dataset.id;
        if (tr.dataset.removed) {
          if (vid) {
            const { error } = await sb.from('product_variants').delete().eq('id', vid);
            if (error) await q(sb.from('product_variants').update({ active: false }).eq('id', vid));
          }
          continue;
        }
        const v = {
          product_id: pid,
          label: g('label').value.trim(),
          size_ml: nullableNum(g('size_ml').value),
          price: nullableNum(g('price').value),
          sale_price: nullableNum(g('sale_price').value),
          sku: nullable(g('sku').value.trim()),
          active: g('active').checked,
          sort_order: i,
        };
        let variantId = vid;
        if (vid) await q(sb.from('product_variants').update(v).eq('id', vid));
        else variantId = (await q(sb.from('product_variants').insert(v).select('id')))[0].id;
        await q(
          sb.from('inventory').upsert({
            variant_id: variantId,
            quantity: Math.max(0, Number(g('quantity').value || 0)),
            low_stock_threshold: Math.max(0, Number(g('low').value || 0)),
            track_inventory: g('track').checked,
          })
        );
      }
      toast('Product saved.');
      close();
      onSaved();
      if (!id) editProduct(pid, categories, onSaved);
    } catch (err) {
      fail(/duplicate key.*slug/.test(err.message) ? new Error('That web address is already used by another product.') : err);
    }
  });

  el.querySelector('[data-archive]')?.addEventListener('click', async () => {
    try {
      await q(sb.from('products').update({ status: 'archived', featured: false }).eq('id', id));
      toast('Archived. It no longer appears on the store.');
      close();
      onSaved();
    } catch (err) {
      fail(err);
    }
  });
  el.querySelector('[data-delete]')?.addEventListener('click', async () => {
    if (!(await confirmDialog(`Delete ${p.name} permanently? Products with orders can only be archived.`))) return;
    try {
      await q(sb.from('products').delete().eq('id', id));
      toast('Product deleted.');
      close();
      onSaved();
    } catch (err) {
      fail(err);
    }
  });

  /* — photos — */
  const imgs = el.querySelector('[data-imgs]');
  if (!imgs) return;
  const reload = async () => {
    const rows = await q(sb.from('product_images').select('*').eq('product_id', id).eq('kind', 'gallery').order('sort_order'));
    images.splice(0, images.length, ...rows);
    imgs.innerHTML = images.map(imageTile).join('') || '<p class="a-empty">No photos yet.</p>';
    onSaved();
  };
  imgs.addEventListener('click', async (e) => {
    const tile = e.target.closest('[data-img]');
    if (!tile) return;
    const i = images.findIndex((x) => x.id === tile.dataset.img);
    try {
      if (e.target.closest('[data-move]')) {
        const j = i + Number(e.target.closest('[data-move]').dataset.move);
        if (j < 0 || j >= images.length) return;
        [images[i], images[j]] = [images[j], images[i]];
        await Promise.all(images.map((im, k) => q(sb.from('product_images').update({ sort_order: k }).eq('id', im.id))));
        await reload();
      } else if (e.target.closest('[data-del-img]')) {
        if (!(await confirmDialog('Remove this photo?'))) return;
        await q(sb.from('product_images').delete().eq('id', images[i].id));
        if (images[i].storage_path) await sb.storage.from('media').remove([images[i].storage_path]);
        await reload();
      }
    } catch (err) {
      fail(err);
    }
  });
  imgs.addEventListener('change', async (e) => {
    const input = e.target.closest('[data-alt]');
    if (!input) return;
    try {
      await q(sb.from('product_images').update({ alt: input.value.trim() || null }).eq('id', input.dataset.alt));
      toast('Description saved.');
    } catch (err) {
      fail(err);
    }
  });
  el.querySelector('[data-upload]').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    for (const file of files) {
      try {
        toast(`Uploading ${file.name}…`);
        const up = await uploadImage(file, `products/${p.slug || id}`);
        await q(sb.from('product_images').insert({ product_id: id, url: up.url, storage_path: up.path, alt: `${p.name} by MEMÓRIA`, kind: 'gallery', sort_order: images.length }));
        await reload();
      } catch (err) {
        fail(err);
      }
    }
    toast('Photos uploaded.');
  });
}

function variantRow(v) {
  const inv = v.inventory || {};
  return `<tr ${v.id ? `data-id="${esc(v.id)}"` : ''}>
    <td><input name="label" value="${esc(v.label || '')}" placeholder="100 ml" aria-label="Size label" required /></td>
    <td><input name="size_ml" type="number" min="1" value="${v.size_ml ?? ''}" aria-label="Millilitres" /></td>
    <td><input name="price" type="number" min="0" step="0.01" value="${v.price ?? ''}" aria-label="Price" /></td>
    <td><input name="sale_price" type="number" min="0" step="0.01" value="${v.sale_price ?? ''}" aria-label="Sale price" /></td>
    <td><input name="sku" value="${esc(v.sku || '')}" aria-label="SKU" /></td>
    <td><input name="quantity" type="number" min="0" value="${inv.quantity ?? 0}" aria-label="In stock" /></td>
    <td><input name="low" type="number" min="0" value="${inv.low_stock_threshold ?? 3}" aria-label="Low stock at" /></td>
    <td><input name="track" type="checkbox" ${inv.track_inventory === false ? '' : 'checked'} aria-label="Track stock" /></td>
    <td><input name="active" type="checkbox" ${v.active === false ? '' : 'checked'} aria-label="Active" /></td>
    <td><button type="button" class="a-icon" data-remove-variant aria-label="Remove size">✕</button></td>
  </tr>`;
}

function imageTile(im, i) {
  return `<figure class="a-img" data-img="${esc(im.id)}">
    <img src="${esc(im.url)}" alt="" loading="lazy" />
    <figcaption>
      ${i === 0 ? '<b>Main</b>' : `#${i + 1}`} ${im.view_label ? `· ${esc(im.view_label)}` : ''}
      <input data-alt="${esc(im.id)}" value="${esc(im.alt || '')}" placeholder="Description for screen readers" aria-label="Image description" />
      <span class="a-imgbtns"><button type="button" data-move="-1" aria-label="Move earlier">←</button><button type="button" data-move="1" aria-label="Move later">→</button><button type="button" data-del-img aria-label="Remove photo">✕</button></span>
    </figcaption>
  </figure>`;
}
