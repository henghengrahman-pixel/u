const {
  getSettings,
  getCategories,
  getVisibleProducts,
  getVisibleArticles
} = require('./helpers/store');

const { makeMeta } = require('./helpers/seo');
const { getCart, cartCount, cartTotals } = require('./helpers/cart');

function viewGlobals(req, res, next) {
  const settings = getSettings() || {};
  const cart = getCart(req);

  const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`)
    .replace(/\/$/, '');

  const currentUrl = `${baseUrl}${req.originalUrl || '/'}`;

  /* ================= SETTINGS ================= */
  res.locals.settings = {
    storeName: settings.storeName || 'MWG Oversize',
    logo: settings.logo || `${baseUrl}/assets/images/logo.png`,
    ...settings
  };

  res.locals.baseUrl = baseUrl;
  res.locals.currentPath = req.path || '/';
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

  /* ================= SEO META FIX ================= */
  const defaultMeta = {
    title: `Kaos Oversize Pria Premium Original | ${res.locals.settings.storeName}`,
    description: 'Beli kaos oversize pria premium kualitas distro. Bahan tebal, nyaman, stylish. Order sekarang.',
    keywords: 'kaos oversize pria, kaos distro pria, baju oversize pria kekinian',
    image: `${baseUrl}/assets/images/og-image.jpg`,
    url: currentUrl,
    canonical: currentUrl,
    robots: req.path.startsWith('/admin')
      ? 'noindex,nofollow,noarchive'
      : 'index,follow'
  };

  res.locals.meta = makeMeta(
    { ...defaultMeta, ...(res.locals.meta || {}) },
    res.locals.settings
  );

  /* ================= ROBOTS HEADER SYNC ================= */
  if (res.locals.meta.robots.startsWith('noindex')) {
    res.setHeader('X-Robots-Tag', res.locals.meta.robots);
  }

  /* ================= STRUCTURED DATA INIT ================= */
  res.locals.structuredData = null;

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
