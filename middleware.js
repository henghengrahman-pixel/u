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
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || fallbackBaseUrl);

  const currentUrl = `${baseUrl}${req.originalUrl || '/'}`;

  const mergedSettings = {
    ...settings,
    baseUrl,
    seo: settings.seo || {}
  };

  res.locals.baseUrl = baseUrl;
  res.locals.currentUrl = currentUrl;

  res.locals.meta = makeMeta({
    ...(res.locals.meta || {}),
    canonical: res.locals.meta?.canonical || currentUrl,
    url: currentUrl
  }, mergedSettings);

  return next();
}

module.exports = {
  viewGlobals
};
