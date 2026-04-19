const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware');

/*
|--------------------------------------------------------------------------
| ADMIN SECURITY HEADERS
|--------------------------------------------------------------------------
*/
router.use((req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  return next();
});

/*
|--------------------------------------------------------------------------
| GUEST ONLY
|--------------------------------------------------------------------------
*/
function requireGuest(req, res, next) {
  if (req.session && req.session.adminUser) {
    return res.redirect('/admin');
  }
  return next();
}

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/
router.get('/login', requireGuest, adminController.loginPage);
router.post('/login', requireGuest, adminController.login);
router.get('/logout', requireAdmin, adminController.logout);
router.post('/logout', requireAdmin, adminController.logout);

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/
router.get('/', requireAdmin, adminController.dashboard);

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/
router.get('/products', requireAdmin, adminController.productList);
router.get('/products/create', requireAdmin, adminController.productCreatePage);
router.post('/products/create', requireAdmin, adminController.productStore);
router.get('/products/:id/edit', requireAdmin, adminController.productEditPage);
router.post('/products/:id/edit', requireAdmin, adminController.productUpdate);
router.post('/products/:id/delete', requireAdmin, adminController.productDelete);

/*
|--------------------------------------------------------------------------
| ORDERS
|--------------------------------------------------------------------------
| Tetap dipakai sebagai arsip / data lama affiliate.
|--------------------------------------------------------------------------
*/
router.get('/orders', requireAdmin, adminController.orderList);
router.post('/orders/:id/status', requireAdmin, adminController.orderUpdateStatus);

/*
|--------------------------------------------------------------------------
| ARTICLES
|--------------------------------------------------------------------------
*/
router.get('/articles', requireAdmin, adminController.articleList);
router.get('/articles/create', requireAdmin, adminController.articleCreatePage);
router.post('/articles/create', requireAdmin, adminController.articleStore);
router.get('/articles/:id/edit', requireAdmin, adminController.articleEditPage);
router.post('/articles/:id/edit', requireAdmin, adminController.articleUpdate);
router.post('/articles/:id/delete', requireAdmin, adminController.articleDelete);

/*
|--------------------------------------------------------------------------
| SETTINGS
|--------------------------------------------------------------------------
*/
router.get('/settings', requireAdmin, adminController.settingsPage);
router.post('/settings', requireAdmin, adminController.settingsUpdate);

module.exports = router;
