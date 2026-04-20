const router = require('express').Router();
const siteController = require('../controllers/siteController');
const { getProductBySlug, getVisibleProducts } = require('../helpers/store');
const { generateSeoPages, slugify } = require('../helpers/seo-pages');

const PRIMARY_SEO_LANDING = '/kaos-oversize-pria';

/* ================= CACHE SEO ================= */
const seoPages = generateSeoPages();
const seoMap = new Map();
seoPages.forEach((page) => {
  if (page && page.slug) seoMap.set(page.slug, page);
});

/* ================= SNIPER (BATASI KERAS) ================= */
const sniperKeywords = [
  'kaos oversize pria bahan tebal murah',
  'kaos oversize pria terbaik untuk nongkrong',
  'kaos pria keren untuk sehari hari',
  'kaos oversize pria nyaman dipakai harian',
  'kaos pria kekinian harga terjangkau'
];

/* ================= MAIN ================= */
router.get('/', siteController.home);
router.get('/shop', siteController.shop);
router.get('/product/:slug', siteController.productDetail);
router.get('/articles', siteController.articles);
router.get('/article/:slug', siteController.articleDetail);
router.get('/contact', siteController.contact);

/* ================= HUB (MONEY PAGE) ================= */
router.get(PRIMARY_SEO_LANDING, siteController.seoKaosOversizePria);

/* ================= CATEGORY (TOPICAL CORE) ================= */
router.get('/kaos-oversize-pria-murah', siteController.seoCategoryMurah);
router.get('/kaos-oversize-pria-premium', siteController.seoCategoryPremium);
router.get('/kaos-oversize-pria-terbaik', siteController.seoCategoryTerbaik);

/* ================= LIMITED SEO PAGES ================= */
router.get('/s/:slug', (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  const page = seoMap.get(slug);

  if (!page) {
    return res.redirect(301, PRIMARY_SEO_LANDING);
  }

  const products = getVisibleProducts();
  return siteController.seoDynamic(req, res, page, products);
});

/* ================= SNIPER ================= */
sniperKeywords.forEach((keyword) => {
  const slug = slugify(keyword);

  router.get(`/sniper/${slug}`, (req, res) => {
    return siteController.seoSniper(req, res, keyword);
  });
});

/* ================= SEO ALIAS ================= */
[
  '/rekomendasi-kaos-pria',
  '/kaos-pria-terbaik',
  '/kaos-distro-pria',
  '/kaos-oversize',
  '/kaos-oversize-pria-original'
].forEach((routePath) => {
  router.get(routePath, (req, res) => {
    return res.redirect(301, PRIMARY_SEO_LANDING);
  });
});

/* ================= AFFILIATE ================= */
router.get('/go/:slug', (req, res) => {
  try {
    const product = getProductBySlug(req.params.slug);

    if (!product || !product.affiliateLink) {
      return res.redirect(302, '/shop');
    }

    const targetUrl = normalizeAffiliateUrl(product.affiliateLink);
    if (!targetUrl) {
      return res.redirect(302, `/product/${encodeURIComponent(product.slug)}`);
    }

    res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return res.redirect(302, targetUrl);
  } catch (error) {
    console.error('[AFFILIATE ERROR]', error);
    return res.redirect(302, '/shop');
  }
});

/* ================= CLEAN LEGACY ROUTES ================= */
['/cart', '/checkout'].forEach((routePath) => {
  router.get(routePath, (req, res) => res.redirect(301, '/shop'));
});

['/cart/add', '/buy-now', '/cart/update', '/checkout'].forEach((routePath) => {
  router.post(routePath, (req, res) => res.redirect(301, '/shop'));
});

router.post('/cart/remove/:id', (req, res) => {
  return res.redirect(301, '/shop');
});

module.exports = router;

/* ================= HELPER ================= */
function normalizeAffiliateUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}
