const {
  getCollection,
  saveCollection,
  normalizeProduct,
  normalizeArticle,
  uid,
  nowIso
} = require('./jsonDb');

/* ================= HELPERS ================= */

function cleanString(v = '') {
  return String(v || '').trim();
}

function cleanUrl(v = '') {
  return String(v || '').trim();
}

function cleanNumber(v = 0) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ================= SEO GENERATOR ================= */

function buildProductSeo(product = {}) {
  const name = cleanString(product.name);
  const category = cleanString(product.category || 'kaos pria');
  const brand = cleanString(product.brand || process.env.APP_NAME || 'Store');
  const material = cleanString(product.material);
  const fit = cleanString(product.fit);

  const seoTitle =
    cleanString(product.seoTitle) ||
    `${name} ${category} Premium - ${brand}`;

  const seoDescription =
    cleanString(product.seoDescription) ||
    cleanString(product.shortDescription) ||
    `${name} adalah ${category} dengan bahan ${material || 'premium'} dan model ${fit || 'modern'}. Cocok untuk outfit harian.`;

  const keywords = [
    name,
    category,
    brand,
    material,
    fit,
    'kaos pria',
    'kaos oversize',
    'outfit pria'
  ]
    .filter(Boolean)
    .join(', ');

  return { seoTitle, seoDescription, keywords };
}

function buildArticleSeo(article = {}) {
  const title = cleanString(article.title);

  const seoTitle =
    cleanString(article.seoTitle) ||
    `${title} - ${process.env.APP_NAME || 'Blog'}`;

  const seoDescription =
    cleanString(article.seoDescription) ||
    cleanString(article.description) ||
    cleanString(article.excerpt) ||
    `Baca ${title} secara lengkap.`;

  const keywords =
    cleanString(article.keywords) ||
    title;

  return { seoTitle, seoDescription, keywords };
}

/* ================= NORMALIZER ================= */

function prepareProduct(item = {}) {
  const images =
    Array.isArray(item.images)
      ? item.images
      : String(item.images || '')
          .split('\n')
          .map(cleanUrl)
          .filter(Boolean);

  const image = images[0] || cleanUrl(item.image);

  const base = {
    ...item,
    id: cleanString(item.id || uid()),
    name: cleanString(item.name),
    slug: cleanString(item.slug) || slugify(item.name),
    category: cleanString(item.category),
    brand: cleanString(item.brand || process.env.APP_NAME),
    material: cleanString(item.material),
    fit: cleanString(item.fit),
    image,
    images,
    affiliateLink: cleanUrl(item.affiliateLink),
    shortDescription: cleanString(item.shortDescription),
    description: cleanString(item.description),
    visible: typeof item.visible === 'boolean' ? item.visible : true,
    price: cleanNumber(item.price),
    compareAtPrice: cleanNumber(item.compareAtPrice),
    created_at: item.created_at || nowIso(),
    updated_at: nowIso()
  };

  const seo = buildProductSeo(base);

  base.seoTitle = seo.seoTitle;
  base.seoDescription = seo.seoDescription;
  base.keywords = cleanString(item.keywords) || seo.keywords;
  base.ogImage = cleanUrl(item.ogImage || base.image);
  base.canonical = `/product/${base.slug}`;

  return base;
}

function prepareArticle(item = {}) {
  const base = {
    ...item,
    id: cleanString(item.id || uid()),
    title: cleanString(item.title),
    slug: cleanString(item.slug) || slugify(item.title),
    excerpt: cleanString(item.excerpt),
    description: cleanString(item.description || item.excerpt),
    content: cleanString(item.content),
    image: cleanUrl(item.image || item.thumbnail),
    visible: typeof item.visible === 'boolean' ? item.visible : true,
    created_at: item.created_at || nowIso(),
    updated_at: nowIso()
  };

  const seo = buildArticleSeo(base);

  base.seoTitle = seo.seoTitle;
  base.seoDescription = seo.seoDescription;
  base.keywords = seo.keywords;
  base.ogImage = cleanUrl(item.ogImage || base.image);
  base.canonical = `/article/${base.slug}`;

  return base;
}

/* ================= PRODUCTS ================= */

function getProducts() {
  return getCollection('products.json').map(prepareProduct);
}

function saveProducts(items) {
  return saveCollection('products.json', items.map(prepareProduct));
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
  saveProducts(items);
  return item;
}

function updateProduct(id, payload) {
  const items = getProducts();
  const i = items.findIndex(p => p.id === id);
  if (i === -1) return null;

  items[i] = prepareProduct({ ...items[i], ...payload });
  saveProducts(items);
  return items[i];
}

function deleteProduct(id) {
  saveProducts(getProducts().filter(p => p.id !== id));
}

/* ================= ARTICLES ================= */

function getArticles() {
  return getCollection('articles.json').map(prepareArticle);
}

function saveArticles(items) {
  return saveCollection('articles.json', items.map(prepareArticle));
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
  saveArticles(items);
  return item;
}

function updateArticle(id, payload) {
  const items = getArticles();
  const i = items.findIndex(a => a.id === id);
  if (i === -1) return null;

  items[i] = prepareArticle({ ...items[i], ...payload });
  saveArticles(items);
  return items[i];
}

function deleteArticle(id) {
  saveArticles(getArticles().filter(a => a.id !== id));
}

/* ================= SETTINGS ================= */

function getSettings() {
  return getCollection('settings.json');
}

function saveSettings(data) {
  return saveCollection('settings.json', data);
}

module.exports = {
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

  getSettings,
  saveSettings,

  slugify
};
