const { getSettings, getCategories, getVisibleProducts, getVisibleArticles } = require('./helpers/store');
const { makeMeta, absoluteUrl } = require('./helpers/seo');
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
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || res.locals.baseUrl || fallbackBaseUrl);
  const currentPath = req.path || '/';
  const currentUrl = `${baseUrl}${req.originalUrl || '/'}`;

  const mergedSettings = {
    ...settings,
    storeName: clean(settings.storeName || process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize'),
    logo: absoluteUrl(settings.logo || '/assets/images/logo.png', baseUrl),
    seo: {
      metaTitle: clean(settings?.seo?.metaTitle || ''),
      metaDescription: clean(settings?.seo?.metaDescription || ''),
      ogImage: absoluteUrl(settings?.seo?.ogImage || '/assets/images/og-image.jpg', baseUrl),
      keywords: clean(settings?.seo?.keywords || '')
    }
  };

  res.locals.settings = mergedSettings;
  res.locals.baseUrl = baseUrl;
  res.locals.currentPath = currentPath;
  res.locals.currentUrl = currentUrl;

  res.locals.cart = cart;
  res.locals.cartCount = cartCount(cart);
  res.locals.cartTotals = cartTotals(cart);

  const categories = (getCategories() || []).filter((item) => item && item.visible !== false);
  res.locals.categories = categories;

  const products = getVisibleProducts() || [];
  const articles = getVisibleArticles() || [];

  res.locals.featuredNavProducts = products.slice(0, 6);
  res.locals.latestArticles = articles.slice(0, 4);

  res.locals.meta = makeMeta({
    ...(res.locals.meta || {}),
    canonical: res.locals.meta?.canonical || currentUrl,
    url: res.locals.meta?.url || currentUrl,
    image: res.locals.meta?.image || mergedSettings.seo.ogImage,
    description: res.locals.meta?.description || mergedSettings.seo.metaDescription,
    keywords: res.locals.meta?.keywords || mergedSettings.seo.keywords,
    title: res.locals.meta?.title || mergedSettings.seo.metaTitle,
    robots: res.locals.meta?.robots || 'index,follow'
  }, mergedSettings);

  res.locals.structuredData = res.locals.structuredData || null;

  res.locals.flash = req.session?.flash || null;
  if (req.session) {
    delete req.session.flash;
  }

  return next();
}

function setFlash(req, type, message) {
  if (!req.session) return;

  req.session.flash = {
    type: clean(type) || 'info',
    message: clean(message)
  };
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminUser) {
    setFlash(req, 'danger', 'Silakan login terlebih dahulu.');
    return res.redirect('/admin/login');
  }

  return next();
}

module.exports = {
  viewGlobals,
  requireAdmin,
  setFlash
};
