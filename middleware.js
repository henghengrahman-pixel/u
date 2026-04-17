const { getSettings, getCategories, getVisibleProducts, getVisibleArticles } = require('./helpers/store');
const { makeMeta } = require('./helpers/seo');
const { getCart, cartCount, cartTotals } = require('./helpers/cart');

function viewGlobals(req, res, next) {
  const settings = getSettings();
  const cart = getCart(req);

  const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

  // 🔥 SETTINGS GLOBAL (PRIORITAS)
  res.locals.settings = settings;
  res.locals.baseUrl = baseUrl;
  res.locals.currentPath = req.path;

  // 🔥 CART
  res.locals.cart = cart;
  res.locals.cartCount = cartCount(cart);
  res.locals.cartTotals = cartTotals(cart);

  // 🔥 CATEGORY + NAV
  res.locals.categories = getCategories().filter(item => item.visible !== false);
  res.locals.featuredNavProducts = getVisibleProducts().slice(0, 6);
  res.locals.latestArticles = getVisibleArticles().slice(0, 4);

  // 🔥 SEO DEFAULT (PAKAI SETTINGS ADMIN)
  res.locals.meta = makeMeta({}, settings);

  // 🔥 FLASH
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;

  next();
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function requireAdmin(req, res, next) {
  if (!req.session.adminUser) {
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
