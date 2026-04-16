const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware');

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/
router.get('/login', adminController.loginPage);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

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
| Untuk model affiliate, ini bisa tetap dipakai sebagai arsip data lama.
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