const router = require('express').Router();
const siteController = require('../controllers/siteController');
const { getProductBySlug } = require('../helpers/store');

/*
|--------------------------------------------------------------------------
| MAIN PAGES (TETAP)
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
| AFFILIATE REDIRECT (PENTING)
|--------------------------------------------------------------------------
| Ini pengganti checkout/cart
*/
router.get('/go/:slug', (req, res) => {
  try {
    const product = getProductBySlug(req.params.slug);

    if (!product || !product.affiliateLink) {
      return res.redirect('/');
    }

    // (Optional) tracking klik
    console.log(`Affiliate click: ${product.slug}`);

    return res.redirect(product.affiliateLink);
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }
});

/*
|--------------------------------------------------------------------------
| LEGACY ROUTES (DISABLE / REDIRECT)
|--------------------------------------------------------------------------
| Supaya tidak error kalau masih ada link lama
*/
router.get('/cart', (req, res) => res.redirect('/'));
router.post('/cart/add', (req, res) => res.redirect('/'));
router.post('/buy-now', (req, res) => res.redirect('/'));
router.post('/cart/update', (req, res) => res.redirect('/'));
router.post('/cart/remove/:productId', (req, res) => res.redirect('/'));

router.get('/checkout', (req, res) => res.redirect('/'));
router.post('/checkout', (req, res) => res.redirect('/'));

module.exports = router;