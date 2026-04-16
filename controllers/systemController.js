const { getVisibleProducts, getVisibleArticles } = require('../helpers/store');

/*
|--------------------------------------------------------------------------
| SITEMAP XML
|--------------------------------------------------------------------------
*/
function sitemap(req, res) {
  try {
    const baseUrl = res.locals.baseUrl || '';

    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/shop', priority: '0.9', changefreq: 'daily' },
      { url: '/articles', priority: '0.9', changefreq: 'daily' },
      { url: '/contact', priority: '0.6', changefreq: 'monthly' }
    ];

    const productPages = getVisibleProducts().map(item => ({
      url: `/product/${item.slug}`,
      lastmod: item.updated_at || item.created_at,
      priority: '0.8',
      changefreq: 'weekly'
    }));

    const articlePages = getVisibleArticles().map(item => ({
      url: `/article/${item.slug}`,
      lastmod: item.updated_at || item.created_at,
      priority: '0.7',
      changefreq: 'weekly'
    }));

    const urls = [
      ...staticPages,
      ...productPages,
      ...articlePages
    ];

    res.type('application/xml');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(item => `
  <url>
    <loc>${baseUrl}${item.url}</loc>
    ${item.lastmod ? `<lastmod>${new Date(item.lastmod).toISOString()}</lastmod>` : ''}
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>
`).join('')}
</urlset>`;

    res.send(xml);
  } catch (err) {
    console.error('[SITEMAP ERROR]', err);
    res.status(500).send('Sitemap error');
  }
}

/*
|--------------------------------------------------------------------------
| ROBOTS.TXT
|--------------------------------------------------------------------------
*/
function robots(req, res) {
  try {
    const baseUrl = res.locals.baseUrl || '';

    res.type('text/plain');
    res.send(`User-agent: *
Allow: /

# BLOCK ADMIN & SYSTEM
Disallow: /admin
Disallow: /api
Disallow: /cart
Disallow: /checkout

# SITEMAP
Sitemap: ${baseUrl}/sitemap.xml`);
  } catch (err) {
    console.error('[ROBOTS ERROR]', err);
    res.status(500).send('Robots error');
  }
}

module.exports = {
  sitemap,
  robots
};
