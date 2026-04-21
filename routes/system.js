const router = require('express').Router();
const systemController = require('../controllers/systemController');
const { getVisibleProducts, getVisibleArticles } = require('../helpers/store');
const { generateSeoPages } = require('../helpers/seo-pages');

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

/* ================= CRAWL SEED (🔥 BOOST INDEX) ================= */
router.get('/crawl-seed', (req, res) => {
  try {
    const products = getVisibleProducts().slice(0, 24);
    const articles = getVisibleArticles().slice(0, 24);
    const seoPages = generateSeoPages().slice(0, 12);

    res.set({
      'Cache-Control': 'public, max-age=1800',
      'X-Robots-Tag': 'index, follow'
    });

    return res.send(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Crawl Seed</title>
<meta name="robots" content="index,follow">
</head>
<body>

<h1>Crawl Seed</h1>

<h2>Money Pages</h2>
<ul>
<li><a href="/">Home</a></li>
<li><a href="/shop">Shop</a></li>
<li><a href="/articles">Articles</a></li>
<li><a href="/kaos-oversize-pria">Kaos Oversize Pria</a></li>
<li><a href="/kaos-oversize-pria-murah">Murah</a></li>
<li><a href="/kaos-oversize-pria-premium">Premium</a></li>
<li><a href="/kaos-oversize-pria-terbaik">Terbaik</a></li>
</ul>

<h2>Products</h2>
<ul>
${products.map(p => `<li><a href="/product/${p.slug}">${p.name || p.slug}</a></li>`).join('')}
</ul>

<h2>Articles</h2>
<ul>
${articles.map(a => `<li><a href="/article/${a.slug}">${a.title || a.slug}</a></li>`).join('')}
</ul>

<h2>SEO Pages</h2>
<ul>
${seoPages.map(p => `<li><a href="/s/${p.slug}">${p.keyword || p.slug}</a></li>`).join('')}
</ul>

</body>
</html>`);
  } catch (err) {
    console.error('[CRAWL SEED ERROR]', err);
    return res.status(500).send('Error');
  }
});

/* ================= HEALTH ================= */
router.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

module.exports = router;
