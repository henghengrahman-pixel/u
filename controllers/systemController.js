const { getVisibleProducts, getVisibleArticles } = require('../helpers/store');

function sitemap(req, res) {
  const baseUrl = res.locals.baseUrl;
  const urls = [
    '', '/shop', '/cart', '/checkout', '/articles', '/contact',
    ...getVisibleProducts().map(item => `/product/${item.slug}`),
    ...getVisibleArticles().map(item => `/article/${item.slug}`)
  ];
  res.type('application/xml');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${baseUrl}${url}</loc></url>`).join('\n')}
</urlset>`;
  res.send(xml);
}

function robots(req, res) {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${res.locals.baseUrl}/sitemap.xml`);
}

module.exports = { sitemap, robots };
