const router = require('express').Router();
const siteController = require('../controllers/siteController');
const { getProductBySlug } = require('../helpers/store');

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
| SEO LANDING PAGES (🔥 POWER RANK)
|--------------------------------------------------------------------------
*/
router.get('/kaos-oversize-pria', siteController.seoKaosOversizePria);

// 🔥 TAMBAHAN BIAR KUAT SEO
router.get('/rekomendasi-kaos-pria', siteController.home);
router.get('/kaos-pria-terbaik', siteController.home);
router.get('/kaos-distro-pria', siteController.home);

/*
|--------------------------------------------------------------------------
| AFFILIATE REDIRECT (HALUS & AMAN SEO)
|--------------------------------------------------------------------------
*/
router.get('/go/:slug', (req, res) => {
  try {
    const product = getProductBySlug(req.params.slug);

    if (!product || !product.affiliateLink) {
      return res.redirect('/');
    }

    // 🔥 TRACK CLICK (optional log)
    console.log(`Affiliate click: ${product.slug}`);

    // 🔥 REDIRECT HALUS (SEO SAFE)
    return res.redirect(302, product.affiliateLink);

  } catch (error) {
    console.error('[AFFILIATE REDIRECT ERROR]', error);
    return res.redirect('/');
  }
});

/*
|--------------------------------------------------------------------------
| LEGACY ROUTES (DISABLE TOTAL)
|--------------------------------------------------------------------------
*/
router.get('/cart', (req, res) => res.redirect('/'));
router.post('/cart/add', (req, res) => res.redirect('/'));
router.post('/buy-now', (req, res) => res.redirect('/'));
router.post('/cart/update', (req, res) => res.redirect('/'));
router.post('/cart/remove/:productId', (req, res) => res.redirect('/'));

router.get('/checkout', (req, res) => res.redirect('/'));
router.post('/checkout', (req, res) => res.redirect('/'));

/*
|--------------------------------------------------------------------------
| EXTRA SEO BOOST (OPTIONAL)
|--------------------------------------------------------------------------
*/
router.get('/sitemap.xml', (req, res) => {
  const base = process.env.BASE_URL || '';
  const urls = [
    '/',
    '/shop',
    '/kaos-oversize-pria',
    '/rekomendasi-kaos-pria',
    '/kaos-pria-terbaik',
    '/articles'
  ];

  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(u => `
      <url>
        <loc>${base}${u}</loc>
      </url>
    `).join('')}
  </urlset>`);
});

module.exports = router;
