const { getSettings, getCategories, getVisibleProducts, getVisibleArticles } = require('./helpers/store');
const { makeMeta } = require('./helpers/seo');
const { getCart, cartCount, cartTotals } = require('./helpers/cart');

function clean(value = '') {
  return String(value || '').trim();
}

function normalizeBaseUrl(value = '') {
  const raw = clean(value).replace(/\/+$/, '');
  if (!raw) return '';

  try {
    return new URL(raw).toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function viewGlobals(req, res, next) {
  const settings = getSettings() || {};
  const cart = getCart(req);

  const fallbackBaseUrl = `${req.protocol}://${req.get('host')}`;
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || fallbackBaseUrl);

  const currentPath = req.path || '/';
  const currentUrl = `${baseUrl}${req.originalUrl || '/'}`;

  /* ================= SETTINGS ================= */
  res.locals.settings = {
    ...settings,
    baseUrl,
    storeName: settings.storeName || 'MWG Oversize',
    logo: settings.logo || `${baseUrl}/assets/images/logo.png`
  };

  res.locals.baseUrl = baseUrl;
  res.locals.currentPath = currentPath;
  res.locals.currentUrl = currentUrl;

  /* ================= CART ================= */
  res.locals.cart = cart;
  res.locals.cartCount = cartCount(cart);
  res.locals.cartTotals = cartTotals(cart);

  /* ================= CATEGORY ================= */
  const categories = getCategories() || [];
  res.locals.categories = categories.filter(item => item && item.visible !== false);

  /* ================= NAV DATA ================= */
  const products = getVisibleProducts() || [];
  const articles = getVisibleArticles() || [];

  res.locals.featuredNavProducts = products.slice(0, 6);
  res.locals.latestArticles = articles.slice(0, 4);

  /* ================= META FIX ================= */
  res.locals.meta = makeMeta({
    ...(res.locals.meta || {}),
    canonical: currentUrl,
    url: currentUrl
  }, res.locals.settings);

  /* ================= FLASH ================= */
  res.locals.flash = req.session?.flash || null;
  if (req.session) delete req.session.flash;

  next();
}

function setFlash(req, type, message) {
  if (!req.session) return;
  req.session.flash = { type, message };
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminUser) {
    setFlash(req, 'danger', 'Silakan login terlebih dahulu.');
    return res.redirect('/admin/login');
  }
  next();
}

module.exports = {
  viewGlobals,
  requireAdmin,
  setFlash
};
