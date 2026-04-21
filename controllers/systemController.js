const { getVisibleProducts, getVisibleArticles } = require('../helpers/store');
const { generateSeoPages } = require('../helpers/seo-pages');

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

function uniqueByUrl(items = []) {
  const map = new Map();

  for (const item of items) {
    if (!item || !item.url) continue;
    map.set(item.url, item);
  }

  return [...map.values()];
}

function sitemap(req, res) {
  try {
    const baseUrl = normalizeBaseUrl(res.locals.baseUrl || process.env.BASE_URL || '');
    if (!baseUrl) {
      return res.status(500).send('Base URL is not configured');
    }

    const seoPages = generateSeoPages().slice(0, 12);

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/shop', priority: '0.9', changefreq: 'daily' },
      { url: '/articles', priority: '0.8', changefreq: 'daily' },
      { url: '/kaos-oversize-pria', priority: '0.9', changefreq: 'weekly' },
      { url: '/kaos-oversize-pria-murah', priority: '0.8', changefreq: 'weekly' },
      { url: '/kaos-oversize-pria-premium', priority: '0.8', changefreq: 'weekly' },
      { url: '/kaos-oversize-pria-terbaik', priority: '0.8', changefreq: 'weekly' }
    ];

    const dynamicSeoPages = seoPages
      .filter((item) => item && item.slug)
      .map((item) => ({
        url: `/s/${String(item.slug).trim()}`,
        priority: '0.6',
        changefreq: 'weekly'
      }));

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
      ...dynamicSeoPages,
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

# Block private/system areas
Disallow: /admin
Disallow: /api
Disallow: /go/
Disallow: /cart
Disallow: /checkout

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
