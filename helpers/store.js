const {
  getCollection,
  saveCollection,
  normalizeProduct,
  normalizeArticle,
  uid,
  nowIso
} = require('./jsonDb');

/* ================= HELPER ================= */
function cleanString(value = '') {
  return String(value || '').trim();
}

function cleanUrl(value = '') {
  return String(value || '').trim();
}

function cleanNumber(value = 0) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function cleanBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (['true', 'on', '1', 1].includes(value)) return true;
  if (['false', 'off', '0', 0].includes(value)) return false;
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

/* ================= IMAGE ================= */
function normalizeImageList(payload = {}) {
  if (Array.isArray(payload.images)) {
    return payload.images.map(cleanUrl).filter(Boolean);
  }

  if (typeof payload.images === 'string') {
    return payload.images.split(/\r?\n|,/).map(cleanUrl).filter(Boolean);
  }

  if (payload.image) return [cleanUrl(payload.image)];
  return [];
}

function pickPrimaryImage(item = {}) {
  const images = normalizeImageList(item);
  if (images.length > 0) return images[0];
  return cleanUrl(item.image || item.thumbnail || '');
}

/* ================= SEO PRODUCT ================= */
function buildProductSeo(product = {}) {
  const name = cleanString(product.name);
  const category = cleanString(product.category || 'pria');

  const seoTitle =
    cleanString(product.seoTitle) ||
    `${name} - Rekomendasi Kaos ${category} Terbaik`;

  const seoDescription =
    cleanString(product.seoDescription) ||
    `${name} merupakan salah satu rekomendasi kaos ${category} terbaik dengan bahan nyaman dan cocok untuk outfit pria kekinian.`;

  const keywords = [
    name,
    `kaos ${category}`,
    'rekomendasi kaos pria',
    'kaos pria terbaik',
    'kaos oversize pria'
  ].filter(Boolean).join(', ');

  return { seoTitle, seoDescription, keywords };
}

/* ================= SEO ARTICLE ================= */
function buildArticleSeo(article = {}) {
  const title = cleanString(article.title);

  return {
    seoTitle: title,
    seoDescription:
      cleanString(article.description) ||
      cleanString(article.excerpt) ||
      `Baca ${title} lengkap dengan rekomendasi terbaik.`,
    keywords: `rekomendasi kaos pria, ${title}`
  };
}

/* ================= PRODUCT ================= */
function prepareProduct(item = {}) {
  const images = normalizeImageList(item);
  const primaryImage = pickPrimaryImage(item);

  const prepared = {
    ...item,
    id: cleanString(item.id || uid()),
    name: cleanString(item.name),
    slug: cleanString(item.slug) || slugify(item.name),
    shortDescription: cleanString(item.shortDescription),
    description: cleanString(item.description),

    category: cleanString(item.category || 'pria'),
    brand: cleanString(item.brand || 'MWG Oversize'),

    fit: cleanString(item.fit || ''),
    material: cleanString(item.material || ''),

    image: primaryImage,
    images,

    affiliateLink: cleanUrl(item.affiliateLink),

    visible: cleanBoolean(item.visible, true),
    featured: cleanBoolean(item.featured, false),
    recommended: cleanBoolean(item.recommended, false),

    price: cleanNumber(item.price),
    compareAtPrice: cleanNumber(item.compareAtPrice),

    created_at: item.created_at || nowIso(),
    updated_at: nowIso()
  };

  const seo = buildProductSeo(prepared);

  prepared.seoTitle = seo.seoTitle;
  prepared.seoDescription = seo.seoDescription;
  prepared.keywords = seo.keywords;
  prepared.canonical = `/product/${prepared.slug}`;

  return prepared;
}

/* ================= ARTICLE ================= */
function prepareArticle(item = {}) {
  const primaryImage = pickPrimaryImage(item);

  const prepared = {
    ...item,
    id: cleanString(item.id || uid()),
    title: cleanString(item.title),
    slug: cleanString(item.slug) || slugify(item.title),
    excerpt: cleanString(item.excerpt),
    description: cleanString(item.description),
    content: cleanString(item.content),

    image: cleanUrl(item.image || primaryImage),

    visible: cleanBoolean(item.visible, true),

    created_at: item.created_at || nowIso(),
    updated_at: nowIso()
  };

  const seo = buildArticleSeo(prepared);

  prepared.seoTitle = seo.seoTitle;
  prepared.seoDescription = seo.seoDescription;
  prepared.keywords = seo.keywords;
  prepared.canonical = `/article/${prepared.slug}`;

  return prepared;
}

/* ================= SETTINGS ================= */
function getSettings() {
  return getCollection('settings.json') || {};
}

function saveSettings(settings) {
  return saveCollection('settings.json', settings || {});
}

/* ================= PRODUCTS ================= */
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

function createProduct(payload) {
  const items = getProducts();
  const item = prepareProduct(payload);
  items.unshift(item);
  saveCollection('products.json', items);
  return item;
}

function updateProduct(id, payload) {
  const items = getProducts();
  const index = items.findIndex(p => p.id === id);
  if (index === -1) return null;

  const updated = prepareProduct({ ...items[index], ...payload });
  items[index] = updated;
  saveCollection('products.json', items);
  return updated;
}

function deleteProduct(id) {
  saveCollection('products.json', getProducts().filter(p => p.id !== id));
}

/* ================= ARTICLES ================= */
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

function createArticle(payload) {
  const items = getArticles();
  const item = prepareArticle(payload);
  items.unshift(item);
  saveCollection('articles.json', items);
  return item;
}

function updateArticle(id, payload) {
  const items = getArticles();
  const index = items.findIndex(a => a.id === id);
  if (index === -1) return null;

  const updated = prepareArticle({ ...items[index], ...payload });
  items[index] = updated;
  saveCollection('articles.json', items);
  return updated;
}

function deleteArticle(id) {
  saveCollection('articles.json', getArticles().filter(a => a.id !== id));
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

  slugify
};
