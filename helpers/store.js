const {
  getCollection,
  saveCollection,
  normalizeProduct,
  normalizeArticle
} = require('./jsonDb');

/* ================= UTILS ================= */
function clean(value = '') {
  return String(value || '').trim();
}

function normalizeKey(value = '') {
  return clean(value).toLowerCase();
}

function toTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortByNewest(items = []) {
  return [...items].sort((a, b) => {
    const aTime = toTimestamp(a.updated_at || a.updatedAt || a.created_at || a.createdAt);
    const bTime = toTimestamp(b.updated_at || b.updatedAt || b.created_at || b.createdAt);
    return bTime - aTime;
  });
}

function isVisible(item = {}) {
  return item.visible !== false;
}

/* ================= SETTINGS ================= */
function getSettings() {
  const settings = getCollection('settings.json');
  return settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
}

function saveSettings(data) {
  const payload = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  return saveCollection('settings.json', payload);
}

/* ================= PRODUCTS ================= */
function getProducts() {
  const items = getCollection('products.json');
  if (!Array.isArray(items)) return [];
  return sortByNewest(items);
}

function getVisibleProducts() {
  return getProducts().filter(isVisible);
}

function getProductBySlug(slug) {
  const key = normalizeKey(slug);
  if (!key) return null;

  return getProducts().find((item) => normalizeKey(item.slug) === key) || null;
}

function getProductById(id) {
  const key = clean(id);
  if (!key) return null;

  return getProducts().find((item) => clean(item.id) === key) || null;
}

function createProduct(data) {
  const items = getProducts();
  const item = normalizeProduct(data);
  items.unshift(item);
  saveCollection('products.json', items);
  return item;
}

function updateProduct(id, data) {
  const key = clean(id);
  if (!key) return null;

  const items = getProducts();
  const index = items.findIndex((item) => clean(item.id) === key);
  if (index === -1) return null;

  items[index] = normalizeProduct(data, items[index]);
  saveCollection('products.json', items);
  return items[index];
}

function deleteProduct(id) {
  const key = clean(id);
  if (!key) return false;

  const items = getProducts();
  const filtered = items.filter((item) => clean(item.id) !== key);

  if (filtered.length === items.length) return false;

  saveCollection('products.json', filtered);
  return true;
}

/* ================= ARTICLES ================= */
function getArticles() {
  const items = getCollection('articles.json');
  if (!Array.isArray(items)) return [];
  return sortByNewest(items);
}

function getVisibleArticles() {
  return getArticles().filter(isVisible);
}

function getArticleBySlug(slug) {
  const key = normalizeKey(slug);
  if (!key) return null;

  return getArticles().find((item) => normalizeKey(item.slug) === key) || null;
}

function getArticleById(id) {
  const key = clean(id);
  if (!key) return null;

  return getArticles().find((item) => clean(item.id) === key) || null;
}

function createArticle(data) {
  const items = getArticles();
  const item = normalizeArticle(data);
  items.unshift(item);
  saveCollection('articles.json', items);
  return item;
}

function updateArticle(id, data) {
  const key = clean(id);
  if (!key) return null;

  const items = getArticles();
  const index = items.findIndex((item) => clean(item.id) === key);
  if (index === -1) return null;

  items[index] = normalizeArticle(data, items[index]);
  saveCollection('articles.json', items);
  return items[index];
}

function deleteArticle(id) {
  const key = clean(id);
  if (!key) return false;

  const items = getArticles();
  const filtered = items.filter((item) => clean(item.id) !== key);

  if (filtered.length === items.length) return false;

  saveCollection('articles.json', filtered);
  return true;
}

/* ================= ORDERS ================= */
function getOrders() {
  const items = getCollection('orders.json');
  if (!Array.isArray(items)) return [];
  return sortByNewest(items);
}

function updateOrderStatus(id, status) {
  const key = clean(id);
  if (!key) return null;

  const items = getOrders();
  const index = items.findIndex((order) => clean(order.id) === key);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    status: clean(status) || clean(items[index].status) || 'pending',
    updated_at: new Date().toISOString()
  };

  saveCollection('orders.json', items);
  return items[index];
}

/* ================= CATEGORY ================= */
function getCategories() {
  const map = new Map();

  getVisibleProducts().forEach((product) => {
    const rawName = clean(product.category || 'lainnya');
    const key = normalizeKey(rawName);

    if (!key || map.has(key)) return;

    map.set(key, {
      name: rawName,
      slug: key,
      visible: true,
      count: getVisibleProducts().filter((item) => normalizeKey(item.category || 'lainnya') === key).length
    });
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'id'));
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

  getCategories
};
