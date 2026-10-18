/**
 * MEMÓRIA dashboard · Supabase client (anon key + the signed-in admin's
 * session). Every read and write is checked by Row Level Security in the
 * database; this file holds no secrets.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(url && key);
export const sb = configured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'memoria-admin' } })
  : null;

/** Throw on Supabase errors so views can catch one way. */
export async function q(promise) {
  const { data, error, count } = await promise;
  if (error) throw new Error(error.message);
  return count !== undefined && count !== null ? { data, count } : data;
}

export const state = { user: null, profile: null };

export async function loadSettings(keys) {
  const rows = await q(sb.from('store_settings').select('key, value, is_public').in('key', keys));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function saveSetting(key, value, isPublic) {
  const row = { key, value, updated_by: state.user?.id };
  if (isPublic !== undefined) row.is_public = isPublic;
  await q(sb.from('store_settings').upsert(row));
}

/** Upload an image to the media bucket; returns its public URL. */
export async function uploadImage(file, folder) {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new Error('Please upload a JPEG, PNG, WebP or AVIF image.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Images must be 8 MB or smaller.');
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[file.type];
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);
  return { path, url: sb.storage.from('media').getPublicUrl(path).data.publicUrl };
}
