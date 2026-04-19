const { getVisibleProducts, getVisibleArticles } = require('../helpers/store');

function normalizeBaseUrl(value = '') {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return '';

  try {
    return new URL(raw).toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function absoluteUrl(baseUrl, pathname = '/') {
  const base = normalizeBaseUrl(baseUrl);
  const path = String(pathname || '/').startsWith('/')
    ? String(pathname || '/')
    : `/${String(pathname || '/')}`;
  return `${base}${path}`;
}

function escapeXml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toIsoDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString();
}

function nowIso() {
  return new Date().toISOString();
}

function uniqueByUrl(items = []) {
  const map = new Map();

  for (const item of items) {
    if (!item || !item.url) continue;
    map.set(item.url, item);
  }

  return [...map.values()];
}

/*
|--------------------------------------------------------------------------
| SITEMAP XML (FIX)
|--------------------------------------------------------------------------
*/
function sitemap(req, res) {
  try {
    const baseUrl = normalizeBaseUrl(res.locals.baseUrl || process.env.BASE_URL || '');
    if (!baseUrl) {
      return res.status(500).send('Base URL is not configured');
    }

    const now = nowIso();

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily', lastmod: now },
      { url: '/shop', priority: '0.9', changefreq: 'daily', lastmod: now },
      { url: '/kaos-oversize-pria', priority: '0.9', changefreq: 'weekly', lastmod: now },
      { url: '/articles', priority: '0.8', changefreq: 'daily', lastmod: now },
      { url: '/contact', priority: '0.5', changefreq: 'monthly', lastmod: now }
    ];

    const productPages = getVisibleProducts()
      .filter((item) => item && item.slug)
      .map((item) => ({
        url: `/product/${String(item.slug).trim()}`,
        lastmod: toIsoDate(item.updated_at || item.updatedAt || item.created_at || item.createdAt),
        priority: '0.8',
        changefreq: 'weekly'
      }));

    const articlePages = getVisibleArticles()
      .filter((item) => item && item.slug)
      .map((item) => ({
        url: `/article/${String(item.slug).trim()}`,
        lastmod: toIsoDate(item.updated_at || item.updatedAt || item.created_at || item.createdAt || item.date || item.publishedAt),
        priority: '0.7',
        changefreq: 'weekly'
      }));

    const urls = uniqueByUrl([
      ...staticPages,
      ...productPages,
      ...articlePages
    ]);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => {
  const loc = escapeXml(absoluteUrl(baseUrl, item.url));
  const lastmod = item.lastmod ? `\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>` : '';
  return `  <url>
    <loc>${loc}</loc>${lastmod}
    <changefreq>${escapeXml(item.changefreq || 'weekly')}</changefreq>
    <priority>${escapeXml(item.priority || '0.5')}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

    res.status(200).send(xml);
  } catch (error) {
    console.error('[SITEMAP ERROR]', error);
    return res.status(500).send('Sitemap error');
  }
}

/*
|--------------------------------------------------------------------------
| ROBOTS.TXT (FIX)
|--------------------------------------------------------------------------
*/
function robots(req, res) {
  try {
    const baseUrl = normalizeBaseUrl(res.locals.baseUrl || process.env.BASE_URL || '');
    const isProd = (process.env.NODE_ENV || 'development') === 'production';

    if (!isProd || !baseUrl) {
      return res.status(200).send(`User-agent: *
Disallow: /`);
    }

    return res.status(200).send(`User-agent: *
Allow: /

# Private areas
Disallow: /admin
Disallow: /api
Disallow: /go/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`);
  } catch (error) {
    console.error('[ROBOTS ERROR]', error);
    return res.status(500).send('Robots error');
  }
}

module.exports = {
  sitemap,
  robots
};
