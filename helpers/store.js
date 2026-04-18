const {
  getCollection,
  saveCollection,
  uid,
  nowIso
} = require('./jsonDb');

/* ================= BASIC ================= */
function cleanString(v = '') {
  return String(v || '').trim();
}

function cleanNumber(v = 0) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function cleanBoolean(v, fallback = true) {
  if (typeof v === 'boolean') return v;
  if (['true', 'on', '1', 1].includes(v)) return true;
  if (['false', 'off', '0', 0].includes(v)) return false;
  return fallback;
}

function cleanUrl(v = '') {
  return String(v || '').trim();
}

function slugify(text = '') {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeImages(input = {}) {
  if (Array.isArray(input.images)) {
    return input.map(cleanUrl).filter(Boolean);
  }

  if (typeof input.images === 'string') {
    return input.images
      .split(/\r?\n|,/)
      .map(cleanUrl)
      .filter(Boolean);
  }

  if (input.image) return [cleanUrl(input.image)];
  return [];
}

/* ================= SETTINGS ================= */
function getSettings() {
  return getCollection('settings.json') || {};
}

function saveSettings(data) {
  const clean = {
    storeName: cleanString(data.storeName || 'MWG Oversize'),
    logo: cleanUrl(data.logo || ''),
    ...data
  };
  return saveCollection('settings.json', clean);
}

/* ================= PRODUCTS ================= */
function prepareProduct(p = {}) {
  const name = cleanString(p.name);
  const category = cleanString(p.category || 'pria');
  const images = normalizeImages(p);
  const image = cleanUrl(p.image || images[0] || '');

  return {
    ...p,
    id: p.id || uid(),
    name,
    slug: p.slug || slugify(name),
    category,
    brand: cleanString(p.brand || 'MWG Oversize'),

    image,
    images,

    affiliateLink: cleanUrl(p.affiliateLink || p.affiliate_link || p.link),

    shortDescription: cleanString(p.shortDescription || p.short_description),
    description: cleanString(p.description),

    material: cleanString(p.material),
    fit: cleanString(p.fit),

    price: cleanNumber(p.price),
    compareAtPrice: cleanNumber(p.compareAtPrice),

    visible: cleanBoolean(p.visible, true),
    featured: cleanBoolean(p.featured, false),
    recommended: cleanBoolean(p.recommended, false),

    seoTitle: p.seoTitle || `${name} - Rekomendasi Kaos ${category} Terbaik`,
    seoDescription:
      p.seoDescription ||
      `${name} merupakan rekomendasi kaos ${category} terbaik dengan bahan nyaman dan cocok untuk outfit pria kekinian.`,

    keywords:
      p.keywords ||
      `${name}, kaos ${category}, rekomendasi kaos pria, kaos pria terbaik`,

    created_at: p.created_at || nowIso(),
    updated_at: nowIso()
  };
}

function getProducts() {
  return getCollection('products.json') || [];
}

function getVisibleProducts() {
  return getProducts().filter(p => p.visible !== false);
}

function getProductBySlug(slug) {
  return getProducts().find(p => p.slug === slug);
}

function getProductById(id) {
  return getProducts().find(p => p.id === id);
}

function createProduct(data) {
  const items = getProducts();
  const item = prepareProduct(data);
  items.unshift(item);
  saveCollection('products.json', items);
  return item;
}

function updateProduct(id, data) {
  const items = getProducts();
  const i = items.findIndex(p => p.id === id);
  if (i === -1) return null;

  items[i] = prepareProduct({
    ...items[i],
    ...data,
    id: items[i].id,
    created_at: items[i].created_at
  });

  saveCollection('products.json', items);
  return items[i];
}

function deleteProduct(id) {
  const items = getProducts();
  const filtered = items.filter(p => p.id !== id);
  saveCollection('products.json', filtered);
  return items.length !== filtered.length;
}

/* ================= ARTICLES ================= */
function prepareArticle(a = {}) {
  const title = cleanString(a.title);

  return {
    ...a,
    id: a.id || uid(),
    title,
    slug: a.slug || slugify(title),

    excerpt: cleanString(a.excerpt),
    description: cleanString(a.description || a.excerpt),
    content: cleanString(a.content),

    image: cleanString(a.image || a.thumbnail),

    visible: cleanBoolean(a.visible, true),

    seoTitle: title,
    seoDescription:
      a.description || a.excerpt || `Baca ${title} lengkap.`,

    keywords: `rekomendasi kaos pria, ${title}`,

    created_at: a.created_at || nowIso(),
    updated_at: nowIso()
  };
}

function getArticles() {
  return getCollection('articles.json') || [];
}

function getVisibleArticles() {
  return getArticles().filter(a => a.visible !== false);
}

function getArticleBySlug(slug) {
  return getArticles().find(a => a.slug === slug);
}

function getArticleById(id) {
  return getArticles().find(a => a.id === id);
}

function createArticle(data) {
  const items = getArticles();
  const item = prepareArticle(data);
  items.unshift(item);
  saveCollection('articles.json', items);
  return item;
}

function updateArticle(id, data) {
  const items = getArticles();
  const i = items.findIndex(a => a.id === id);
  if (i === -1) return null;

  items[i] = prepareArticle({
    ...items[i],
    ...data,
    id: items[i].id,
    created_at: items[i].created_at
  });

  saveCollection('articles.json', items);
  return items[i];
}

function deleteArticle(id) {
  const items = getArticles();
  const filtered = items.filter(a => a.id !== id);
  saveCollection('articles.json', filtered);
  return items.length !== filtered.length;
}

/* ================= ORDERS ================= */
function getOrders() {
  return getCollection('orders.json') || [];
}

function updateOrderStatus(id, status) {
  const items = getOrders();
  const index = items.findIndex(order => order.id === id);

  if (index === -1) return null;

  items[index] = {
    ...items[index],
    status: cleanString(status) || items[index].status || 'pending',
    updated_at: nowIso()
  };

  saveCollection('orders.json', items);
  return items[index];
}

/* ================= CATEGORY ================= */
function getCategories() {
  const products = getProducts();
  const map = {};

  products.forEach(p => {
    const name = cleanString(p.category || 'lainnya').toLowerCase();
    if (!map[name]) {
      map[name] = { name, visible: true };
    }
  });

  return Object.values(map);
}

/* ================= EXPORT ================= */
module.exports = {
  getSettings,
  saveSettings,

  getProducts,
  getVisibleProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,

  getArticles,
  getVisibleArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,

  getOrders,
  updateOrderStatus,

  slugify,
  getCategories
};
