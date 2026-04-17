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

function slugify(text = '') {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ================= SETTINGS ================= */
function getSettings() {
  return getCollection('settings.json') || {};
}

function saveSettings(data) {
  return saveCollection('settings.json', data || {});
}

/* ================= PRODUCTS ================= */
function prepareProduct(p = {}) {
  const name = cleanString(p.name);
  const category = cleanString(p.category || 'pria');

  return {
    ...p,
    id: p.id || uid(),
    name,
    slug: p.slug || slugify(name),
    category,
    brand: cleanString(p.brand || 'MWG Oversize'),
    image: cleanString(p.image),
    images: Array.isArray(p.images) ? p.images : [],
    affiliateLink: cleanString(p.affiliateLink),

    shortDescription: cleanString(p.shortDescription),
    description: cleanString(p.description),

    material: cleanString(p.material),
    fit: cleanString(p.fit),

    price: cleanNumber(p.price),
    compareAtPrice: cleanNumber(p.compareAtPrice),

    visible: cleanBoolean(p.visible, true),
    featured: cleanBoolean(p.featured, false),
    recommended: cleanBoolean(p.recommended, false),

    // 🔥 SEO AUTO
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
  return (getCollection('products.json') || []).map(prepareProduct);
}

function getVisibleProducts() {
  return getProducts().filter(p => p.visible);
}

function getProductBySlug(slug) {
  return getProducts().find(p => p.slug === slug && p.visible);
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

  items[i] = prepareProduct({ ...items[i], ...data });
  saveCollection('products.json', items);
  return items[i];
}

function deleteProduct(id) {
  saveCollection('products.json', getProducts().filter(p => p.id !== id));
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
    description: cleanString(a.description),
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
  return (getCollection('articles.json') || []).map(prepareArticle);
}

function getVisibleArticles() {
  return getArticles().filter(a => a.visible);
}

function getArticleBySlug(slug) {
  return getArticles().find(a => a.slug === slug && a.visible);
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

  items[i] = prepareArticle({ ...items[i], ...data });
  saveCollection('articles.json', items);
  return items[i];
}

function deleteArticle(id) {
  saveCollection('articles.json', getArticles().filter(a => a.id !== id));
}

/* ================= CATEGORY (FIX ERROR KAMU) ================= */
function getCategories() {
  const products = getProducts();
  const map = {};

  products.forEach(p => {
    const name = (p.category || 'lainnya').toLowerCase().trim();

    if (!map[name]) {
      map[name] = {
        name,
        visible: true
      };
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

  slugify,
  getCategories
};
