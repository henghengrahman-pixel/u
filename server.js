require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');

const { ensureDataFiles } = require('./helpers/jsonDb');
const { viewGlobals } = require('./middleware');

ensureDataFiles();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'mwg-secret-change-this';
const BASE_URL = normalizeBaseUrl(process.env.BASE_URL || '');

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ================= FORCE INDEX ================= */
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'index, follow');
  next();
});

/* ================= BODY ================= */
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

/* ================= STATIC FIX ================= */
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
    description: 'Beli kaos oversize pria premium kualitas distro. Bahan tebal, nyaman, trendy. Order sekarang.',
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

/* ================= SITEMAP ================= */
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = BASE_URL || `${req.protocol}://${req.get('host')}`;

  const urls = [
    '/',
    '/shop',
    '/articles',
    '/contact',
    '/kaos-oversize-pria'
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `
      <url>
        <loc>${baseUrl}${url}</loc>
        <priority>0.8</priority>
      </url>
    `).join('')}
  </urlset>`;

  res.header('Content-Type', 'application/xml');
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
