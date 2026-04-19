const { getSettings, getCategories, getVisibleProducts, getVisibleArticles } = require('./helpers/store');
const { makeMeta } = require('./helpers/seo');
const { getCart, cartCount, cartTotals } = require('./helpers/cart');

function viewGlobals(req, res, next) {
  const settings = getSettings() || {};
  const cart = getCart(req);

  const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

  // 🔥 SETTINGS GLOBAL FIX
  res.locals.settings = {
    storeName: settings.storeName || 'MWG Oversize',
    logo: settings.logo || `${baseUrl}/assets/images/logo.png`,
    ...settings
  };

  res.locals.baseUrl = baseUrl;
  res.locals.currentPath = req.originalUrl || '/';

  // 🔥 CART FIX
  res.locals.cart = cart;
  res.locals.cartCount = cartCount(cart);
  res.locals.cartTotals = cartTotals(cart);

  // 🔥 CATEGORY FIX (ANTI ERROR UNDEFINED)
  const categories = getCategories() || [];
  res.locals.categories = categories.filter(item => item && item.visible !== false);

  // 🔥 NAV DATA FIX
  const products = getVisibleProducts() || [];
  const articles = getVisibleArticles() || [];

  res.locals.featuredNavProducts = products.slice(0, 6);
  res.locals.latestArticles = articles.slice(0, 4);

  // 🔥 META FIX (ANTI KOSONG)
  res.locals.meta = makeMeta(res.locals.meta || {}, res.locals.settings);

  // 🔥 FLASH FIX
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
