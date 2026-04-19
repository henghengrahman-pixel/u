const router = require('express').Router();
const systemController = require('../controllers/systemController');

router.get('/robots.txt', (req, res, next) => {
  res.type('text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return systemController.robots(req, res, next);
});

router.get('/sitemap.xml', (req, res, next) => {
  res.type('application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return systemController.sitemap(req, res, next);
});

module.exports = router;
