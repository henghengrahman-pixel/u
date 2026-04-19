const router = require('express').Router();
const siteController = require('../controllers/siteController');
const { getProductBySlug } = require('../helpers/store');

const PRIMARY_SEO_LANDING = '/kaos-oversize-pria';

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
| SEO LANDING PAGES
|--------------------------------------------------------------------------
*/
router.get(PRIMARY_SEO_LANDING, siteController.seoKaosOversizePria);

/*
|--------------------------------------------------------------------------
| SEO ALIAS -> CANONICAL REDIRECT
|--------------------------------------------------------------------------
| Hindari duplicate content. Semua keyword alias diarahkan ke 1 landing utama.
*/
[
  '/rekomendasi-kaos-pria',
  '/kaos-pria-terbaik',
  '/kaos-distro-pria'
].forEach((path) => {
  router.get(path, (req, res) => {
    return res.redirect(301, PRIMARY_SEO_LANDING);
  });
});

/*
|--------------------------------------------------------------------------
| AFFILIATE REDIRECT
|--------------------------------------------------------------------------
| 302 tetap, aman untuk affiliate clickout dan tidak mengalihkan equity.
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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    console.log(`[AFFILIATE CLICK] ${product.slug} -> ${targetUrl}`);

    return res.redirect(302, targetUrl);
  } catch (error) {
    console.error('[AFFILIATE REDIRECT ERROR]', error);
    return res.redirect(302, '/shop');
  }
});

/*
|--------------------------------------------------------------------------
| LEGACY ROUTES -> PERMANENT REDIRECT
|--------------------------------------------------------------------------
*/
[
  '/cart',
  '/checkout'
].forEach((path) => {
  router.get(path, (req, res) => res.redirect(301, '/shop'));
});

[
  '/cart/add',
  '/buy-now',
  '/cart/update',
  '/checkout'
].forEach((path) => {
  router.post(path, (req, res) => res.redirect(301, '/shop'));
});

router.post('/cart/remove/:productId', (req, res) => {
  return res.redirect(301, '/shop');
});

module.exports = router;

function normalizeAffiliateUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== 'http:' && protocol !== 'https:') {
      return '';
    }

    return parsed.toString();
  } catch (_) {
    return '';
  }
}
