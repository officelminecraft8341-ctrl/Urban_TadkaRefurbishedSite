/**
 * Urban Tadka — secure admin Worker (source, bundled to deploy/worker.js).
 *
 * Public site stays static in dist/ (Astro). This Worker adds, in front of
 * ASSETS:
 *   - Sign in with Freebuff (/auth/freebuff/*, via SDK wrap)
 *   - Public live APIs: GET /api/menu, GET /api/gallery, GET /images/:key
 *   - Hidden admin UI: GET /admin/ (unlinked, noindex, 404 for non-admins)
 *   - Admin APIs: /api/admin/* (server-gated, same-origin, validated)
 *
 * Security properties (do not weaken):
 *   - No credentials, emails, or allowlists in code or in dist/. The admin
 *     allowlist comes ONLY from the ADMIN_EMAILS secret env (set via
 *     Sites Secrets, never committed). It is never logged or returned.
 *   - Every admin route calls getUser(request) server-side. UI hiding is not
 *     authorization. Non-admins (including signed-out) get 404, not 401, so
 *     scanners cannot confirm /admin exists.
 *   - All mutating routes require isSameOriginRequest + POST/PUT/DELETE.
 *   - Personalized responses are Cache-Control: private, no-store with
 *     X-Robots-Tag: noindex. Public live APIs are short-cache public.
 *   - Inputs validated server-side: prices, lengths, MIME, size. HTML is
 *     escaped by the admin UI via textContent (never innerHTML with data).
 *   - No cookies, tokens, or /auth/* URLs are logged.
 */

import { createFreebuffAuth, isSameOriginRequest } from '@freebuff/auth';

const IMAGE_KEY_RE = /^[a-z0-9][a-z0-9-]{0,80}\.(jpg|jpeg|png|webp)$/;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

let auth = null;
let app = null;

function getAuth(env) {
  if (!auth) {
    auth = createFreebuffAuth({
      clientId: env.FREEBUFF_CLIENT_ID,
      issuer: env.FREEBUFF_ISSUER,
      baseUrl: env.APP_ORIGIN,
    });
  }
  return auth;
}

/** Admin allowlist from secret env only. Never logged, never returned. */
function adminEmails(env) {
  const raw = env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminUser(user, env) {
  if (!user || !user.email) return false;
  // Per SDK docs: treat email_verified as false when absent.
  if (user.email_verified !== true) return false;
  const allow = adminEmails(env);
  if (allow.length === 0) return false;
  return allow.includes(String(user.email).toLowerCase());
}

function notFound() {
  return new Response('Not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function json(data, status = 200, extra = {}) {
  return Response.json(data, { status, headers: { ...extra } });
}

function privateHeaders() {
  return { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };
}

function ensureSameOrigin(request, env) {
  try {
    if (!isSameOriginRequest(request, env.APP_ORIGIN)) return false;
    return true;
  } catch {
    return false;
  }
}

/* ---------------- D1 schema ---------------- */

async function ensureSchema(db) {
  if (!db) return;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS menu_categories (slug TEXT PRIMARY KEY, title TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      price_cents INTEGER,
      description TEXT,
      image_key TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_menu_items_cat ON menu_items(category_slug, sort_order, id);
    CREATE TABLE IF NOT EXISTS gallery_images (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS admin_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL DEFAULT (datetime('now')),
      sub TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT ''
    );
  `);
}

async function audit(db, sub, action, detail) {
  try {
    if (!db) return;
    await db.prepare('INSERT INTO admin_audit (sub, action, detail) VALUES (?, ?, ?)').bind(sub, action, String(detail || '').slice(0, 2000)).run();
  } catch {
    // Audit must never break the mutation itself.
  }
}

function centsToDollars(c) {
  if (c === null || c === undefined) return null;
  return Math.round(c) / 100;
}

/* ---------------- public live APIs ---------------- */

async function handlePublicMenu(env) {
  try {
    if (!env.MENU_DB) return json({ live: false }, 200, { 'Cache-Control': 'public, max-age=60' });
    await ensureSchema(env.MENU_DB);
    const cats = await env.MENU_DB.prepare('SELECT slug, title FROM menu_categories ORDER BY rowid').all();
    if (!cats.results || cats.results.length === 0) {
      return json({ live: false }, 200, { 'Cache-Control': 'public, max-age=60' });
    }
    const items = await env.MENU_DB.prepare(
      'SELECT id, category_slug, name, price_cents, description, image_key FROM menu_items ORDER BY category_slug, sort_order, id'
    ).all();
    const byCat = new Map();
    for (const c of cats.results) byCat.set(c.slug, { slug: c.slug, title: c.title, items: [] });
    for (const r of items.results || []) {
      const bucket = byCat.get(r.category_slug);
      if (!bucket) continue;
      bucket.items.push({
        id: r.id,
        name: r.name,
        price: centsToDollars(r.price_cents),
        description: r.description,
        image: r.image_key ? `/images/${r.image_key}` : null,
      });
    }
    return json(
      { live: true, categories: [...byCat.values()] },
      200,
      { 'Cache-Control': 'public, max-age=30' }
    );
  } catch {
    return json({ live: false }, 200, { 'Cache-Control': 'public, max-age=60' });
  }
}

async function handlePublicGallery(env) {
  try {
    if (!env.MENU_DB) return json({ live: false, images: [] }, 200, { 'Cache-Control': 'public, max-age=60' });
    await ensureSchema(env.MENU_DB);
    const rows = await env.MENU_DB.prepare('SELECT key, label, r2_key FROM gallery_images ORDER BY key').all();
    const images = (rows.results || []).map((r) => ({ key: r.key, label: r.label, url: `/images/${r.r2_key}` }));
    return json({ live: true, images }, 200, { 'Cache-Control': 'public, max-age=60' });
  } catch {
    return json({ live: false, images: [] }, 200, { 'Cache-Control': 'public, max-age=60' });
  }
}

async function handleImage(request, env) {
  const url = new URL(request.url);
  const key = url.pathname.slice('/images/'.length);
  if (!IMAGE_KEY_RE.test(key)) return notFound();
  if (!env.MENU_IMAGES) return notFound();
  const obj = await env.MENU_IMAGES.get(key);
  if (!obj) return notFound();
  const ct = obj.httpMetadata?.contentType || 'application/octet-stream';
  return new Response(obj.body, {
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/* ---------------- admin gate ---------------- */

async function requireAdmin(request, env) {
  const sdk = getAuth(env);
  const user = await sdk.getUser(request);
  if (!user || !isAdminUser(user, env)) return null;
  return user;
}

/* ---------------- validation ---------------- */

function cleanText(v, max) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.length > max) return null;
  if (/[<>]/.test(s)) return null; // no markup in menu text
  return s;
}

function validPrice(p) {
  if (p === null || p === undefined || p === '') return null; // Ask-us
  const n = Number(p);
  if (!Number.isFinite(n) || n < 0 || n > 999) return false;
  return Math.round(n * 100);
}

/* ---------------- admin APIs ---------------- */

async function handleAdminMenu(env) {
  await ensureSchema(env.MENU_DB);
  const cats = await env.MENU_DB.prepare('SELECT slug, title FROM menu_categories ORDER BY rowid').all();
  const items = await env.MENU_DB.prepare(
    'SELECT id, category_slug, name, price_cents, description, image_key, sort_order FROM menu_items ORDER BY category_slug, sort_order, id'
  ).all();
  const auditRows = await env.MENU_DB.prepare('SELECT ts, action, detail FROM admin_audit ORDER BY id DESC LIMIT 20').all();
  return json(
    { categories: cats.results || [], items: (items.results || []).map((r) => ({ ...r, price: centsToDollars(r.price_cents) })), audit: auditRows.results || [] },
    200,
    privateHeaders()
  );
}

async function handleSeed(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, privateHeaders());
  }
  const cats = body?.categories;
  if (!Array.isArray(cats) || cats.length === 0 || cats.length > 50) {
    return json({ error: 'categories must be a non-empty array (max 50)' }, 400, privateHeaders());
  }
  let total = 0;
  for (const c of cats) {
    if (!c || typeof c.slug !== 'string' || typeof c.title !== 'string' || !Array.isArray(c.items)) {
      return json({ error: 'Invalid category shape' }, 400, privateHeaders());
    }
    if (!/^[a-z0-9-]{1,40}$/.test(c.slug) || c.title.length > 80) {
      return json({ error: 'Invalid category slug/title' }, 400, privateHeaders());
    }
    total += c.items.length;
  }
  if (total > 600) return json({ error: 'Too many items (max 600)' }, 400, privateHeaders());

  await ensureSchema(env.MENU_DB);
  await env.MENU_DB.exec('DELETE FROM menu_items; DELETE FROM menu_categories;');
  for (const c of cats) {
    await env.MENU_DB.prepare('INSERT INTO menu_categories (slug, title) VALUES (?, ?)').bind(c.slug, c.title.slice(0, 80)).run();
    let order = 0;
    for (const it of c.items) {
      order += 1;
      const name = cleanText(it?.name, 100);
      if (!name) return json({ error: `Invalid item name in ${c.slug}` }, 400, privateHeaders());
      const cents = validPrice(it?.price);
      if (cents === false) return json({ error: `Invalid price for ${name}` }, 400, privateHeaders());
      const desc = cleanText(it?.description, 500);
      await env.MENU_DB.prepare(
        'INSERT INTO menu_items (category_slug, name, price_cents, description, sort_order) VALUES (?, ?, ?, ?, ?)'
      ).bind(c.slug, name, cents, desc, order).run();
    }
  }
  await audit(env.MENU_DB, user.sub, 'menu.seed', `${cats.length} categories, ${total} items`);
  return json({ ok: true, categories: cats.length, items: total }, 200, privateHeaders());
}

async function handleUpdateItem(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, privateHeaders());
  }
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: 'Invalid id' }, 400, privateHeaders());
  const updates = {};
  if ('name' in body) {
    const name = cleanText(body.name, 100);
    if (!name) return json({ error: 'Invalid name' }, 400, privateHeaders());
    updates.name = name;
  }
  if ('price' in body) {
    const cents = validPrice(body.price);
    if (cents === false) return json({ error: 'Invalid price (0–999)' }, 400, privateHeaders());
    updates.price_cents = cents;
  }
  if ('description' in body) {
    if (body.description === null || body.description === '') updates.description = null;
    else {
      const d = cleanText(body.description, 500);
      if (body.description && !d) return json({ error: 'Invalid description' }, 400, privateHeaders());
      updates.description = d;
    }
  }
  if (Object.keys(updates).length === 0) return json({ error: 'Nothing to update' }, 400, privateHeaders());
  await ensureSchema(env.MENU_DB);
  const sets = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
  const vals = [...Object.values(updates), id];
  const res = await env.MENU_DB.prepare(`UPDATE menu_items SET ${sets}, updated_at = datetime('now') WHERE id = ?`).bind(...vals).run();
  if ((res.meta?.changes || 0) === 0) return json({ error: 'Item not found' }, 404, privateHeaders());
  await audit(env.MENU_DB, user.sub, 'menu.update', `id=${id} ${Object.keys(updates).join(',')}`);
  return json({ ok: true }, 200, privateHeaders());
}

async function handleCreateItem(request, env, user) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, privateHeaders());
  }
  const slug = String(body?.category_slug || '');
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return json({ error: 'Invalid category' }, 400, privateHeaders());
  const name = cleanText(body?.name, 100);
  if (!name) return json({ error: 'Invalid name' }, 400, privateHeaders());
  const cents = validPrice(body?.price);
  if (cents === false) return json({ error: 'Invalid price' }, 400, privateHeaders());
  const desc = cleanText(body?.description, 500);
  if (body?.description && !desc) return json({ error: 'Invalid description' }, 400, privateHeaders());
  await ensureSchema(env.MENU_DB);
  const cat = await env.MENU_DB.prepare('SELECT slug FROM menu_categories WHERE slug = ?').bind(slug).first();
  if (!cat) return json({ error: 'Category not found' }, 404, privateHeaders());
  const max = await env.MENU_DB.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM menu_items WHERE category_slug = ?').bind(slug).first();
  const res = await env.MENU_DB.prepare(
    'INSERT INTO menu_items (category_slug, name, price_cents, description, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).bind(slug, name, cents, desc, (max?.m || 0) + 1).run();
  await audit(env.MENU_DB, user.sub, 'menu.create', `${slug} / ${name}`);
  return json({ ok: true, id: res.meta?.last_row_id || null }, 200, privateHeaders());
}

async function handleDeleteItem(request, env, user) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return json({ error: 'Invalid id' }, 400, privateHeaders());
  await ensureSchema(env.MENU_DB);
  const res = await env.MENU_DB.prepare('DELETE FROM menu_items WHERE id = ?').bind(id).run();
  if ((res.meta?.changes || 0) === 0) return json({ error: 'Item not found' }, 404, privateHeaders());
  await audit(env.MENU_DB, user.sub, 'menu.delete', `id=${id}`);
  return json({ ok: true }, 200, privateHeaders());
}

async function handleUpload(request, env, user) {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('multipart/form-data')) return json({ error: 'Use multipart upload' }, 400, privateHeaders());
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Invalid form' }, 400, privateHeaders());
  }
  const file = form.get('file');
  const label = cleanText(form.get('label'), 80);
  const slot = String(form.get('slot') || 'gallery').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'gallery';
  if (!label) return json({ error: 'Label is required (max 80 chars, no < >)' }, 400, privateHeaders());
  if (!(file instanceof File)) return json({ error: 'No file' }, 400, privateHeaders());
  if (!ALLOWED_MIME.has(file.type)) return json({ error: 'Only JPEG, PNG, or WebP' }, 400, privateHeaders());
  if (file.size > MAX_IMAGE_BYTES) return json({ error: 'Image must be 5 MB or less' }, 400, privateHeaders());
  if (!env.MENU_IMAGES) return json({ error: 'Image storage not attached' }, 503, privateHeaders());
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `${slot}-${Date.now().toString(36)}-${rand}.${ext}`;
  if (!IMAGE_KEY_RE.test(key)) return json({ error: 'Key error' }, 500, privateHeaders());
  const buf = new Uint8Array(await file.arrayBuffer());
  await env.MENU_IMAGES.put(key, buf, { httpMetadata: { contentType: file.type } });
  await ensureSchema(env.MENU_DB);
  await env.MENU_DB.prepare('INSERT OR REPLACE INTO gallery_images (key, label, r2_key) VALUES (?, ?, ?)').bind(key, label, key).run();
  await audit(env.MENU_DB, user.sub, 'image.upload', `${label} -> ${key}`);
  return json({ ok: true, key, url: `/images/${key}` }, 200, privateHeaders());
}

async function handleDeleteImage(request, env, user) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!IMAGE_KEY_RE.test(key)) return json({ error: 'Invalid key' }, 400, privateHeaders());
  if (env.MENU_IMAGES) await env.MENU_IMAGES.delete(key);
  await ensureSchema(env.MENU_DB);
  await env.MENU_DB.prepare('DELETE FROM gallery_images WHERE r2_key = ?').bind(key).run();
  await audit(env.MENU_DB, user.sub, 'image.delete', key);
  return json({ ok: true }, 200, privateHeaders());
}

/* ---------------- hidden admin UI ---------------- */

function adminPage() {
  // Served ONLY by the Worker after the server-side admin check. Never in
  // dist/, never linked, never in the sitemap. All dynamic text uses
  // textContent (see script) so menu text cannot become markup.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Site admin</title>
<style>
:root{color-scheme:light}
body{font-family:system-ui,sans-serif;max-width:56rem;margin:0 auto;padding:1.5rem;line-height:1.5}
h1{font-size:1.4rem}h2{font-size:1.1rem;margin-top:2rem}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:.4rem;text-align:left;font-size:.9rem}
input,select,textarea{font:inherit;padding:.35rem;border:1px solid #999;border-radius:.3rem;width:100%;box-sizing:border-box}
button{font:inherit;padding:.45rem .9rem;border-radius:.4rem;border:1px solid #333;background:#111;color:#fff;cursor:pointer}
button.secondary{background:#fff;color:#111}
.row{display:grid;gap:.6rem;grid-template-columns:2fr 1fr 3fr auto;align-items:end}
.notice{background:#f6f1e7;border:1px solid #d8cfae;padding:.8rem;border-radius:.5rem}
.muted{color:#666;font-size:.85rem}
</style>
</head>
<body>
<h1>Site admin</h1>
<p class="muted" id="who">Checking access…</p>
<p><form method="post" action="/auth/freebuff/signout"><button class="secondary" type="submit">Sign out</button></form></p>

<div class="notice">
<strong>First run:</strong> press “Load live menu”, then “Publish full menu to live”.
This copies the public <span>/menu-data.json</span> into the live database once.
After that every price/description edit below publishes instantly.
</div>
<p>
<button id="load" type="button" class="secondary">Load live menu</button>
<button id="seed" type="button">Publish full menu to live</button>
<span class="muted" id="seedStatus"></span>
</p>

<h2>Edit prices &amp; descriptions (live instantly)</h2>
<p class="muted">Change a price or description and press Save on that row. Empty price shows as “Ask us”.</p>
<div id="menu"></div>

<h2>Add a dish</h2>
<div class="row">
<label>Category slug<br><input id="nc" placeholder="appetizers"></label>
<label>Name<br><input id="nn" placeholder="Samosa"></label>
<label>Price<br><input id="np" placeholder="7.99"></label>
<label>Description<br><input id="nd" placeholder="Short description"></label>
<button id="create" type="button">Add</button>
</div>

<h2>Upload a picture (live instantly)</h2>
<p class="muted">JPEG, PNG, or WebP, 5 MB max. Short label required; it becomes the alt text.</p>
<p><input id="imgLabel" placeholder="Front of restaurant, daytime"></p>
<p><input id="imgFile" type="file" accept="image/jpeg,image/png,image/webp"></p>
<p><button id="upload" type="button">Upload</button> <span class="muted" id="upStatus"></span></p>
<div id="images"></div>

<h2>Recent changes</h2>
<div id="audit" class="muted"></div>

<script>
const $ = (s) => document.querySelector(s);
async function api(path, opts) {
  const r = await fetch(path, { credentials: 'same-origin', ...(opts || {}) });
  if (r.status === 404) throw new Error('Not found (are you signed in as admin?)');
  let j = null;
  try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error((j && j.error) || ('Request failed: ' + r.status));
  return j;
}
async function refresh() {
  const me = await api('/api/admin/me');
  $('#who').textContent = 'Signed in as ' + (me.user.name || me.user.email || 'admin');
  const data = await api('/api/admin/menu');
  const box = $('#menu'); box.textContent = '';
  const cats = new Map(data.categories.map((c) => [c.slug, c.title]));
  const byCat = new Map();
  for (const it of data.items) {
    if (!byCat.has(it.category_slug)) byCat.set(it.category_slug, []);
    byCat.get(it.category_slug).push(it);
  }
  for (const [slug, items] of byCat) {
    const h = document.createElement('h3'); h.textContent = cats.get(slug) || slug; box.appendChild(h);
    const t = document.createElement('table');
    for (const it of items) {
      const tr = document.createElement('tr');
      const tdN = document.createElement('td'); tdN.textContent = it.name; tr.appendChild(tdN);
      const tdP = document.createElement('td');
      const inp = document.createElement('input'); inp.value = it.price == null ? '' : String(it.price); inp.setAttribute('aria-label', 'Price for ' + it.name);
      tdP.appendChild(inp); tr.appendChild(tdP);
      const tdD = document.createElement('td');
      const ind = document.createElement('input'); ind.value = it.description || ''; ind.setAttribute('aria-label', 'Description for ' + it.name);
      tdD.appendChild(ind); tr.appendChild(tdD);
      const tdB = document.createElement('td');
      const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Save';
      b.onclick = async () => {
        b.disabled = true;
        try {
          await api('/api/admin/menu/item', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, price: inp.value === '' ? null : inp.value, description: ind.value }) });
          b.textContent = 'Saved';
        } catch (e) { b.textContent = 'Error'; alert(e.message); }
        setTimeout(() => { b.disabled = false; b.textContent = 'Save'; }, 1200);
      };
      tdB.appendChild(b); tr.appendChild(tdB);
      t.appendChild(tr);
    }
    box.appendChild(t);
  }
  const au = $('#audit'); au.textContent = '';
  for (const r of data.audit || []) {
    const p = document.createElement('p'); p.textContent = r.ts + ' — ' + r.action + ' ' + (r.detail || '');
    au.appendChild(p);
  }
  const gal = await api('/api/gallery');
  const im = $('#images'); im.textContent = '';
  for (const g of gal.images || []) {
    const p = document.createElement('p');
    const a = document.createElement('a'); a.href = g.url; a.textContent = g.label + ' (' + g.url + ')'; a.target = '_blank'; a.rel = 'noopener';
    p.appendChild(a); im.appendChild(p);
  }
}
$('#load').onclick = () => refresh().catch((e) => alert(e.message));
$('#seed').onclick = async () => {
  try {
    $('#seedStatus').textContent = 'Reading public menu…';
    const pub = await (await fetch('/menu-data.json')).json();
    $('#seedStatus').textContent = 'Publishing…';
    const res = await api('/api/admin/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: pub.categories.map((c) => ({ slug: c.slug, title: c.sourceTitle || c.slug, items: c.items })) }) });
    $('#seedStatus').textContent = 'Live: ' + res.items + ' dishes.';
    await refresh();
  } catch (e) { $('#seedStatus').textContent = ''; alert(e.message); }
};
$('#create').onclick = async () => {
  try {
    await api('/api/admin/menu/item-new', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_slug: $('#nc').value.trim(), name: $('#nn').value, price: $('#np').value === '' ? null : $('#np').value, description: $('#nd').value }) });
    await refresh();
  } catch (e) { alert(e.message); }
};
$('#upload').onclick = async () => {
  try {
    const f = $('#imgFile').files[0];
    if (!f) { alert('Choose a file first'); return; }
    const fd = new FormData();
    fd.append('file', f); fd.append('label', $('#imgLabel').value); fd.append('slot', 'gallery');
    $('#upStatus').textContent = 'Uploading…';
    const res = await api('/api/admin/upload', { method: 'POST', body: fd });
    $('#upStatus').textContent = 'Live: ' + res.url;
    await refresh();
  } catch (e) { $('#upStatus').textContent = ''; alert(e.message); }
};
refresh().catch((e) => { $('#who').textContent = e.message; });
</script>
</body>
</html>`;
}

/* ---------------- main ---------------- */

function setup(env) {
  const sdk = getAuth(env);
  if (app) return app;
  app = sdk.wrap(async (request, env2) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Hidden admin UI — 404 for anyone not an admin (hides existence).
    if (path === '/admin' || path === '/admin/') {
      const user = await sdk.getUser(request).catch(() => null);
      if (!user || !isAdminUser(user, env2)) return notFound();
      return new Response(adminPage(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex, nofollow',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Public live data (short cache = instant publish).
    if (path === '/api/menu' && request.method === 'GET') return handlePublicMenu(env2);
    if (path === '/api/gallery' && request.method === 'GET') return handlePublicGallery(env2);
    if (path.startsWith('/images/') && request.method === 'GET') return handleImage(request, env2);

    // Admin APIs — hidden behind the same 404 gate.
    if (path.startsWith('/api/admin/')) {
      const user = await sdk.getUser(request).catch(() => null);
      if (!user || !isAdminUser(user, env2)) return notFound();
      if (!env2.MENU_DB) return json({ error: 'Database not attached' }, 503, privateHeaders());

      if (path === '/api/admin/me' && request.method === 'GET') {
        return json({ isAdmin: true, user: { sub: user.sub, name: user.name || null, email: user.email || null } }, 200, privateHeaders());
      }
      if (path === '/api/admin/menu' && request.method === 'GET') return handleAdminMenu(env2);
      if (path === '/api/admin/seed' && request.method === 'POST') {
        if (!ensureSameOrigin(request, env2)) return new Response(null, { status: 403 });
        return handleSeed(request, env2, user);
      }
      if (path === '/api/admin/menu/item' && request.method === 'PUT') {
        if (!ensureSameOrigin(request, env2)) return new Response(null, { status: 403 });
        return handleUpdateItem(request, env2, user);
      }
      if (path === '/api/admin/menu/item-new' && request.method === 'POST') {
        if (!ensureSameOrigin(request, env2)) return new Response(null, { status: 403 });
        return handleCreateItem(request, env2, user);
      }
      if (path === '/api/admin/menu/item' && request.method === 'DELETE') {
        if (!ensureSameOrigin(request, env2)) return new Response(null, { status: 403 });
        return handleDeleteItem(request, env2, user);
      }
      if (path === '/api/admin/upload' && request.method === 'POST') {
        if (!ensureSameOrigin(request, env2)) return new Response(null, { status: 403 });
        return handleUpload(request, env2, user);
      }
      if (path === '/api/admin/image' && request.method === 'DELETE') {
        if (!ensureSameOrigin(request, env2)) return new Response(null, { status: 403 });
        return handleDeleteImage(request, env2, user);
      }
      return notFound();
    }

    return env2.ASSETS.fetch(request);
  });
  return app;
}

export default {
  fetch(request, env) {
    return setup(env)(request, env);
  },
};
