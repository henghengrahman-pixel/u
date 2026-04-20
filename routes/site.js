const router = require('express').Router();
const siteController = require('../controllers/siteController');
const { getProductBySlug, getVisibleProducts } = require('../helpers/store');
const { generateSeoPages } = require('../helpers/seo-pages');

const PRIMARY_SEO_LANDING = '/kaos-oversize-pria';

/*
|--------------------------------------------------------------------------
| 🔥 CACHE SEO PAGES (ANTI BERAT)
|--------------------------------------------------------------------------
*/
const seoPages = generateSeoPages();
const seoMap = {};
seoPages.forEach(p => {
  seoMap[p.slug] = p;
});

/*
|--------------------------------------------------------------------------
| 🔥 SNIPER KEYWORDS (LOW COMP)
|--------------------------------------------------------------------------
*/
const sniperKeywords = [
  'kaos oversize pria bahan tebal murah',
  'kaos oversize pria terbaik untuk nongkrong',
  'kaos pria keren untuk sehari hari',
  'kaos oversize pria nyaman dipakai harian',
  'kaos pria kekinian harga terjangkau'
];

/*
|--------------------------------------------------------------------------
| MAIN PAGES
|--------------------------------------------------------------------------
*/
router.get('/', siteController.home);
router.get('/shop', siteController.shop);
router.get('/product/:slug', siteController.productDetail);
router.get('/articles', siteController.articles);
router.get('/article/:slug', siteController.articleDetail);
router.get('/contact', siteController.contact);

/*
|--------------------------------------------------------------------------
| SEO LANDING (MONEY PAGE)
|--------------------------------------------------------------------------
*/
router.get(PRIMARY_SEO_LANDING, siteController.seoKaosOversizePria);

/*
|--------------------------------------------------------------------------
| 🔥 AUTO SEO 1000 PAGE
|--------------------------------------------------------------------------
*/
router.get('/s/:slug', (req, res) => {
  const page = seoMap[req.params.slug];

  if (!page) {
    return res.redirect(301, PRIMARY_SEO_LANDING);
  }

  const products = getVisibleProducts();
  return siteController.seoDynamic(req, res, page, products);
});

/*
|--------------------------------------------------------------------------
| 🔥 SNIPER ROUTES (FAST RANKING)
|--------------------------------------------------------------------------
*/
sniperKeywords.forEach(keyword => {
  const slug = keyword.replace(/\s+/g, '-');

  router.get(`/sniper/${slug}`, (req, res) => {
    return siteController.seoSniper(req, res, keyword);
  });
});

/*
|--------------------------------------------------------------------------
| SEO ALIAS → CENTRAL LANDING
|--------------------------------------------------------------------------
*/
[
  '/rekomendasi-kaos-pria',
  '/kaos-pria-terbaik',
  '/kaos-distro-pria',
  '/kaos-oversize-pria-murah',
  '/kaos-oversize-pria-premium',
  '/kaos-pria-murah',
  '/kaos-pria-kekinian'
].forEach((path) => {
  router.get(path, (req, res) => {
    return res.redirect(301, PRIMARY_SEO_LANDING);
  });
});

/*
|--------------------------------------------------------------------------
| AFFILIATE REDIRECT (SEO SAFE)
|--------------------------------------------------------------------------
*/
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
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');

    return res.redirect(302, targetUrl);
  } catch (error) {
    console.error('[AFFILIATE ERROR]', error);
    return res.redirect(302, '/shop');
  }
});

/*
|--------------------------------------------------------------------------
| LEGACY CLEAN
|--------------------------------------------------------------------------
*/
['/cart', '/checkout'].forEach((path) => {
  router.get(path, (req, res) => res.redirect(301, '/shop'));
});

['/cart/add', '/buy-now', '/cart/update', '/checkout'].forEach((path) => {
  router.post(path, (req, res) => res.redirect(301, '/shop'));
});

router.post('/cart/remove/:productId', (req, res) => {
  return res.redirect(301, '/shop');
});

module.exports = router;

/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/
function normalizeAffiliateUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') return '';
    return parsed.toString();
  } catch (_) {
    return '';
  }
}
