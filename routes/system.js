const {
  getVisibleProducts,
  getVisibleArticles
} = require('../helpers/store');

/* ================= SITEMAP ================= */
exports.sitemap = (req, res) => {
  const baseUrl = res.locals.baseUrl;

  const products = getVisibleProducts();
  const articles = getVisibleArticles();

  const urls = [];

  // STATIC
  urls.push({ loc: `${baseUrl}/`, priority: '1.0' });
  urls.push({ loc: `${baseUrl}/shop`, priority: '0.9' });
  urls.push({ loc: `${baseUrl}/articles`, priority: '0.8' });
  urls.push({ loc: `${baseUrl}/contact`, priority: '0.7' });
  urls.push({ loc: `${baseUrl}/kaos-oversize-pria`, priority: '0.9' });

  // PRODUCTS
  products.forEach(p => {
    urls.push({
      loc: `${baseUrl}/product/${p.slug}`,
      priority: '0.8'
    });
  });

  // ARTICLES
  articles.forEach(a => {
    urls.push({
      loc: `${baseUrl}/article/${a.slug}`,
      priority: '0.7'
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <changefreq>daily</changefreq>
    <priority>${u.priority}</priority>
  </url>
`).join('')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
};

/* ================= ROBOTS ================= */
exports.robots = (req, res) => {
  const baseUrl = res.locals.baseUrl;

  const txt = `
User-agent: *
Allow: /

Disallow: /admin
Disallow: /api

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.send(txt);
};
