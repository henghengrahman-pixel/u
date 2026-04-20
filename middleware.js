const {
  getSettings,
  getCategories,
  getVisibleProducts,
  getVisibleArticles
} = require('./helpers/store');

const { makeMeta } = require('./helpers/seo');
const { getCart, cartCount, cartTotals } = require('./helpers/cart');

function normalizeBaseUrl(value = '') {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return '';

  try {
    return new URL(raw).toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function normalizePath(value = '/') {
  const raw = String(value || '/').trim();
  if (!raw) return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function buildCleanUrl(baseUrl = '', path = '/') {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const cleanPath = normalizePath(path);
  return `${cleanBase}${cleanPath}`;
}

function resolveRobots(req) {
  const path = req.path || '/';
  const hasQuery = !!(req.query && Object.keys(req.query).length);

  if (path.startsWith('/admin')) return 'noindex,nofollow,noarchive';
  if (path.startsWith('/go/')) return 'noindex,nofollow,noarchive';
  if (path.startsWith('/cart')) return 'noindex,nofollow,noarchive';
  if (path.startsWith('/checkout')) return 'noindex,nofollow,noarchive';
  if (path === '/contact') return 'noindex,follow';
  if (hasQuery) return 'noindex,follow';

  return 'index,follow';
}

function viewGlobals(req, res, next) {
  const settings = getSettings() || {};
  const cart = getCart(req);

  const baseUrl = normalizeBaseUrl(
    process.env.BASE_URL || `${req.protocol}://${req.get('host')}`
  );

  const currentPath = normalizePath(req.path || '/');
  const currentUrl = buildCleanUrl(baseUrl, currentPath);
  const robots = resolveRobots(req);

  /* ================= SETTINGS ================= */
  res.locals.settings = {
    ...settings,
    storeName: settings.storeName || process.env.STORE_NAME || 'MWG Oversize',
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
  res.locals.categories = categories.filter((item) => item && item.visible !== false);

  /* ================= NAV DATA ================= */
  const products = getVisibleProducts() || [];
  const articles = getVisibleArticles() || [];

  res.locals.featuredNavProducts = products.slice(0, 6);
  res.locals.latestArticles = articles.slice(0, 4);

  /* ================= SEO META ================= */
  const defaultMeta = {
    title: `Kaos Oversize Pria Premium Original | ${res.locals.settings.storeName}`,
    description: 'Beli kaos oversize pria premium kualitas distro. Bahan tebal, nyaman, stylish, dan cocok untuk outfit harian pria Indonesia.',
    keywords: 'kaos oversize pria, kaos distro pria, baju oversize pria, kaos pria kekinian, kaos pria indonesia',
    image: `${baseUrl}/assets/images/og-image.jpg`,
    url: currentUrl,
    canonical: currentPath,
    robots
  };

  res.locals.meta = makeMeta(
    { ...defaultMeta, ...(res.locals.meta || {}) },
    res.locals.settings
  );

  /* ================= ROBOTS HEADER ================= */
  if (res.locals.meta && res.locals.meta.robots) {
    res.setHeader('X-Robots-Tag', res.locals.meta.robots);
  }

  /* ================= INTERNAL LINKS ================= */
  res.locals.internalLinks = [];

  /* ================= STRUCTURED DATA ================= */
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
