require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');

const { ensureDataFiles } = require('./helpers/jsonDb');
const { viewGlobals } = require('./middleware');
const { generateSeoPages } = require('./helpers/seo-pages');

ensureDataFiles();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'mwg-secret-change-this';
const BASE_URL = normalizeBaseUrl(process.env.BASE_URL || '');

const SEO_PAGES = generateSeoPages();

/* ================= CONFIG ================= */
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ================= FORCE INDEX ================= */
app.use((req, res, next) => {
  if (!req.path.startsWith('/go/')) {
    res.setHeader('X-Robots-Tag', 'index, follow');
  }
  next();
});

/* ================= BODY ================= */
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

/* ================= STATIC ================= */
app.use(express.static(path.join(__dirname, 'public'), {
  index: false,
  redirect: false,
  etag: true,
  lastModified: true,
  maxAge: IS_PROD ? '7d' : 0
}));

app.use('/assets', express.static(path.join(__dirname, 'public')));

/* ================= SESSION ================= */
app.use(session({
  name: process.env.SESSION_NAME || 'mwg.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: 'auto',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

/* ================= DEFAULT LOCALS ================= */
app.use((req, res, next) => {
  const baseUrl = BASE_URL || `${req.protocol}://${req.get('host')}`;
  const currentUrl = `${baseUrl}${req.originalUrl || '/'}`;
  const storeName = process.env.STORE_NAME || 'MWG Oversize';

  res.locals.baseUrl = baseUrl;
  res.locals.currentUrl = currentUrl;

  res.locals.meta = {
    title: `Kaos Oversize Pria Premium Original | ${storeName}`,
    description: 'Beli kaos oversize pria premium kualitas distro. Bahan tebal, nyaman, trendy.',
    keywords: 'kaos oversize pria, kaos distro pria, baju oversize pria',
    image: `${baseUrl}/assets/images/og-image.jpg`,
    url: currentUrl,
    canonical: currentUrl,
    robots: 'index,follow'
  };

  next();
});

/* ================= VIEW GLOBALS ================= */
app.use(viewGlobals);

/* ================= 🔥 SITEMAP INDEX ================= */
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = BASE_URL || `${req.protocol}://${req.get('host')}`;
  const total = Math.ceil(SEO_PAGES.length / 500);

  res.set('Content-Type', 'application/xml');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (let i = 1; i <= total; i++) {
    xml += `<sitemap><loc>${baseUrl}/sitemap-${i}.xml</loc></sitemap>\n`;
  }

  xml += `</sitemapindex>`;

  res.send(xml);
});

/* ================= 🔥 SITEMAP PART ================= */
app.get('/sitemap-:page.xml', (req, res) => {
  const baseUrl = BASE_URL || `${req.protocol}://${req.get('host')}`;
  const page = parseInt(req.params.page) || 1;

  const start = (page - 1) * 500;
  const chunk = SEO_PAGES.slice(start, start + 500);

  const staticUrls = page === 1 ? [
    '/',
    '/shop',
    '/articles',
    '/contact',
    '/kaos-oversize-pria'
  ] : [];

  const urls = [
    ...staticUrls,
    ...chunk.map(p => `/s/${p.slug}`)
  ];

  res.set('Content-Type', 'application/xml');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  urls.forEach(url => {
    xml += `<url><loc>${baseUrl}${url}</loc><priority>0.7</priority></url>\n`;
  });

  xml += `</urlset>`;

  res.send(xml);
});

/* ================= ROUTES ================= */
app.use('/', require('./routes/system'));
app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ================= HELPER ================= */
function normalizeBaseUrl(value) {
  const clean = String(value || '').trim().replace(/\/+$/, '');
  if (!clean) return '';

  try {
    return new URL(clean).toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}
