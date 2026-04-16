const router = require('express').Router();
const systemController = require('../controllers/systemController');
router.get('/sitemap.xml', systemController.sitemap);
router.get('/robots.txt', systemController.robots);
module.exports = router;
