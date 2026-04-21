const router = require('express').Router();
const systemController = require('../controllers/systemController');

/* ================= ROBOTS ================= */
router.get('/robots.txt', (req, res, next) => {
  res.type('text/plain; charset=utf-8');

  res.set({
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    'X-Robots-Tag': 'index, follow'
  });

  return systemController.robots(req, res, next);
});

/* ================= SITEMAP ================= */
router.get('/sitemap.xml', (req, res, next) => {
  res.type('application/xml; charset=utf-8');

  res.set({
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    'X-Robots-Tag': 'noindex'
  });

  return systemController.sitemap(req, res, next);
});

/* ================= HEALTH CHECK (BONUS INDEX TRUST) ================= */
router.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

module.exports = router;
