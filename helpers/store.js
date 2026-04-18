const {
  getCollection,
  saveCollection,
  normalizeProduct,
  normalizeArticle
} = require('./jsonDb');

/* ================= SETTINGS ================= */
function getSettings() {
  return getCollection('settings.json') || {};
}

function saveSettings(data) {
  return saveCollection('settings.json', data || {});
}

/* ================= PRODUCTS ================= */
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
  const item = normalizeProduct(data); // 🔥 FIX UTAMA
  items.unshift(item);
  saveCollection('products.json', items);
  return item;
}

function updateProduct(id, data) {
  const items = getProducts();
  const i = items.findIndex(p => p.id === id);
  if (i === -1) return null;

  items[i] = normalizeProduct(data, items[i]); // 🔥 FIX UTAMA
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
  const item = normalizeArticle(data); // 🔥 FIX
  items.unshift(item);
  saveCollection('articles.json', items);
  return item;
}

function updateArticle(id, data) {
  const items = getArticles();
  const i = items.findIndex(a => a.id === id);
  if (i === -1) return null;

  items[i] = normalizeArticle(data, items[i]); // 🔥 FIX
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
    status: String(status || '').trim() || items[index].status || 'pending',
    updated_at: new Date().toISOString()
  };

  saveCollection('orders.json', items);
  return items[index];
}

/* ================= CATEGORY ================= */
function getCategories() {
  const products = getProducts();
  const map = {};

  products.forEach(p => {
    const name = (p.category || 'lainnya').toLowerCase().trim();
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

  getCategories
};
