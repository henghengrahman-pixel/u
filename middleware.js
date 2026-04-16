const { getSettings, getCategories, getVisibleProducts, getVisibleArticles } = require('./helpers/store');
const { makeMeta } = require('./helpers/seo');
const { getCart, cartCount, cartTotals } = require('./helpers/cart');

function viewGlobals(req, res, next) {
  const settings = getSettings();
  const cart = getCart(req);
  res.locals.settings = settings;
  res.locals.categories = getCategories().filter(item => item.visible !== false);
  res.locals.cart = cart;
  res.locals.cartCount = cartCount(cart);
  res.locals.cartTotals = cartTotals(cart);
  res.locals.baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.locals.currentPath = req.path;
  res.locals.meta = makeMeta({}, settings);
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.featuredNavProducts = getVisibleProducts().slice(0, 6);
  res.locals.latestArticles = getVisibleArticles().slice(0, 4);
  next();
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function requireAdmin(req, res, next) {
  if (!req.session.adminUser) {
    setFlash(req, 'danger', 'Please login first.');
    return res.redirect('/admin/login');
  }
  next();
}

module.exports = { viewGlobals, requireAdmin, setFlash };
