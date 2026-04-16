const {
  getCollection,
  saveCollection,
  normalizeProduct,
  normalizeArticle,
  uid,
  nowIso
} = require('./jsonDb');

/*
|--------------------------------------------------------------------------
| SMALL HELPERS
|--------------------------------------------------------------------------
*/
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
  if (value === 'true' || value === 'on' || value === '1' || value === 1) return true;
  if (value === 'false' || value === 'off' || value === '0' || value === 0) return false;
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

function normalizeImageList(payload = {}) {
  if (Array.isArray(payload.images)) {
    return payload.images.map(cleanUrl).filter(Boolean);
  }

  if (typeof payload.images === 'string') {
    return payload.images
      .split(/\r?\n|,/)
      .map(cleanUrl)
      .filter(Boolean);
  }

  if (payload.image) {
    return [cleanUrl(payload.image)].filter(Boolean);
  }

  return [];
}

function pickPrimaryImage(item = {}) {
  const images = normalizeImageList(item);
  if (images.length > 0) return images[0];
  return cleanUrl(item.image || item.thumbnail || '');
}

/*
|--------------------------------------------------------------------------
| SEO BUILDERS
|--------------------------------------------------------------------------
*/
function buildProductSeo(product = {}) {
  const name = cleanString(product.name);
  const category = cleanString(product.category || 'fashion pria');
  const brand = cleanString(product.brand || process.env.APP_NAME || 'Ozerra');
  const material = cleanString(product.material);
  const fit = cleanString(product.fit);
  const shortDescription = cleanString(
    product.shortDescription ||
    product.short_description ||
    product.description
  );
  const baseTitle = name || 'Produk Pilihan';

  const seoTitle =
    cleanString(product.seoTitle) ||
    `${baseTitle} - ${brand}`;

  const seoDescription =
    cleanString(product.seoDescription) ||
    shortDescription ||
    `${baseTitle} dengan tampilan rapi, nyaman dipakai, dan cocok untuk kebutuhan harian.`;

  const keywords = [
    name,
    category,
    brand,
    material,
    fit,
    cleanString(product.targetKeyword),
    'fashion pria',
    'kaos pria',
    'kaos oversize',
    'rekomendasi kaos'
  ]
    .filter(Boolean)
    .join(', ');

  return {
    seoTitle,
    seoDescription,
    keywords
  };
}

function buildArticleSeo(article = {}) {
  const title = cleanString(article.title);

  const seoTitle =
    cleanString(article.seoTitle || article.seo_title) ||
    title;

  const seoDescription =
    cleanString(article.seoDescription || article.seo_description) ||
    cleanString(article.description) ||
    cleanString(article.excerpt) ||
    `Baca artikel ${title} secara lengkap.`;

  const keywords =
    cleanString(article.keywords) ||
    title;

  return {
    seoTitle,
    seoDescription,
    keywords
  };
}

/*
|--------------------------------------------------------------------------
| PREPARE PRODUCT
|--------------------------------------------------------------------------
*/
function prepareProduct(item = {}) {
  const images = normalizeImageList(item);
  const primaryImage = pickPrimaryImage(item);
  const brand = cleanString(item.brand || process.env.APP_NAME || 'Ozerra');
  const category = cleanString(item.category || item.categorySlug || '');
  const fit = cleanString(item.fit || '');
  const material = cleanString(item.material || '');
  const affiliateLink = cleanUrl(
    item.affiliateLink || item.affiliate_link || item.marketplaceLink || item.link
  );

  const prepared = {
    ...item,
    id: cleanString(item.id || uid()),
    name: cleanString(item.name),
    slug: cleanString(item.slug) || slugify(item.name),
    shortDescription: cleanString(item.shortDescription || item.short_description),
    description: cleanString(item.description),
    details: cleanString(item.details),
    brand,
    category,
    fit,
    material,
    image: primaryImage,
    images,
    affiliateLink,
    visible: cleanBoolean(item.visible, true),
    featured: cleanBoolean(item.featured, false),
    recommended: cleanBoolean(item.recommended, false),
    is_new: cleanBoolean(item.is_new, false),
    status: cleanString(item.status || 'ready'),
    badge: cleanString(item.badge || ''),
    price: cleanNumber(item.price || item.price_idr),
    compareAtPrice: cleanNumber(item.compareAtPrice || item.compare_at_price || item.compare_price_idr || 0),
    currency: cleanString(item.currency || 'IDR'),
    source: cleanString(item.source || 'affiliate'),
    created_at: item.created_at || nowIso(),
    updated_at: nowIso()
  };

  const seo = buildProductSeo(prepared);

  prepared.seoTitle = seo.seoTitle;
  prepared.seoDescription = seo.seoDescription;
  prepared.keywords = cleanString(item.keywords) || seo.keywords;
  prepared.ogImage = cleanUrl(item.ogImage || item.og_image || prepared.image);
  prepared.canonical = cleanString(item.canonical) || `/product/${prepared.slug}`;

  return prepared;
}

/*
|--------------------------------------------------------------------------
| PREPARE ARTICLE
|--------------------------------------------------------------------------
*/
function prepareArticle(item = {}) {
  const primaryImage = pickPrimaryImage(item);

  const prepared = {
    ...item,
    id: cleanString(item.id || uid()),
    title: cleanString(item.title),
    slug: cleanString(item.slug) || slugify(item.title),
    excerpt: cleanString(item.excerpt),
    description: cleanString(item.description || item.excerpt),
    content: cleanString(item.content),
    thumbnail: cleanUrl(item.thumbnail || primaryImage),
    image: cleanUrl(item.image || item.thumbnail || primaryImage),
    visible: cleanBoolean(item.visible, true),
    created_at: item.created_at || nowIso(),
    updated_at: nowIso()
  };

  const seo = buildArticleSeo(prepared);

  prepared.seoTitle = seo.seoTitle;
  prepared.seoDescription = seo.seoDescription;
  prepared.keywords = seo.keywords;
  prepared.ogImage = cleanUrl(item.ogImage || item.og_image || prepared.image);
  prepared.canonical = cleanString(item.canonical) || `/article/${prepared.slug}`;

  return prepared;
}

/*
|--------------------------------------------------------------------------
| SETTINGS & CATEGORIES
|--------------------------------------------------------------------------
*/
function getSettings() {
  return getCollection('settings.json') || {};
}

function saveSettings(settings) {
  return saveCollection('settings.json', settings || {});
}

function getCategories() {
  return getCollection('categories.json') || [];
}

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/
function getProducts() {
  const items = getCollection('products.json') || [];
  return items.map(prepareProduct);
}

function saveProducts(items) {
  const normalizedItems = (Array.isArray(items) ? items : []).map(prepareProduct);
  return saveCollection('products.json', normalizedItems);
}

function getVisibleProducts() {
  return getProducts().filter(item => item.visible);
}

function getProductBySlug(slug) {
  return getProducts().find(item => item.slug === slug && item.visible);
}

function getProductById(id) {
  return getProducts().find(item => item.id === id);
}

function createProduct(payload) {
  const items = getProducts();

  let item = typeof normalizeProduct === 'function'
    ? normalizeProduct(payload)
    : payload;

  item = prepareProduct(item);

  items.unshift(item);
  saveProducts(items);
  return item;
}

function updateProduct(id, payload) {
  const items = getProducts();
  const index = items.findIndex(item => item.id === id);

  if (index === -1) return null;

  const existing = items[index];

  let merged = {
    ...existing,
    ...payload,
    id: existing.id,
    created_at: existing.created_at
  };

  merged = typeof normalizeProduct === 'function'
    ? normalizeProduct(merged, existing)
    : merged;

  items[index] = prepareProduct(merged);
  saveProducts(items);
  return items[index];
}

function deleteProduct(id) {
  const items = getProducts().filter(item => item.id !== id);
  saveProducts(items);
}

/*
|--------------------------------------------------------------------------
| ARTICLES
|--------------------------------------------------------------------------
*/
function getArticles() {
  const items = getCollection('articles.json') || [];
  return items.map(prepareArticle);
}

function saveArticles(items) {
  const normalizedItems = (Array.isArray(items) ? items : []).map(prepareArticle);
  return saveCollection('articles.json', normalizedItems);
}

function getVisibleArticles() {
  return getArticles().filter(item => item.visible);
}

function getArticleBySlug(slug) {
  return getArticles().find(item => item.slug === slug && item.visible);
}

function getArticleById(id) {
  return getArticles().find(item => item.id === id);
}

function createArticle(payload) {
  const items = getArticles();

  let item = typeof normalizeArticle === 'function'
    ? normalizeArticle(payload)
    : payload;

  item = prepareArticle(item);

  items.unshift(item);
  saveArticles(items);
  return item;
}

function updateArticle(id, payload) {
  const items = getArticles();
  const index = items.findIndex(item => item.id === id);

  if (index === -1) return null;

  const existing = items[index];

  let merged = {
    ...existing,
    ...payload,
    id: existing.id,
    created_at: existing.created_at
  };

  merged = typeof normalizeArticle === 'function'
    ? normalizeArticle(merged, existing)
    : merged;

  items[index] = prepareArticle(merged);
  saveArticles(items);
  return items[index];
}

function deleteArticle(id) {
  saveArticles(getArticles().filter(item => item.id !== id));
}

/*
|--------------------------------------------------------------------------
| ORDERS
|--------------------------------------------------------------------------
*/
function getOrders() {
  return getCollection('orders.json') || [];
}

function saveOrders(items) {
  return saveCollection('orders.json', Array.isArray(items) ? items : []);
}

function getOrderById(id) {
  return getOrders().find(item => item.id === id);
}

function createOrder(payload) {
  const items = getOrders();

  const order = {
    id: `ORD-${Date.now()}`,
    customer_name: cleanString(payload.customer_name),
    whatsapp: cleanString(payload.whatsapp),
    telegram: cleanString(payload.telegram).replace(/^@+/, ''),
    address: cleanString(payload.address),
    note: cleanString(payload.note),
    items: Array.isArray(payload.items) ? payload.items : [],
    total_items: cleanNumber(payload.total_items),
    total_idr: cleanNumber(payload.total_idr || payload.total),
    total_thb: 0,
    status: cleanString(payload.status || 'pending'),
    source: cleanString(payload.source || 'manual'),
    created_at: nowIso(),
    updated_at: nowIso()
  };

  items.unshift(order);
  saveOrders(items);
  return order;
}

function updateOrderStatus(id, status) {
  const items = getOrders();
  const index = items.findIndex(item => item.id === id);

  if (index === -1) return null;

  items[index].status = cleanString(status || items[index].status || 'pending');
  items[index].updated_at = nowIso();

  saveOrders(items);
  return items[index];
}

module.exports = {
  getSettings,
  saveSettings,
  getCategories,

  getProducts,
  saveProducts,
  getVisibleProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,

  getArticles,
  saveArticles,
  getVisibleArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,

  getOrders,
  saveOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,

  prepareProduct,
  prepareArticle,
  buildProductSeo,
  buildArticleSeo,
  slugify
};
