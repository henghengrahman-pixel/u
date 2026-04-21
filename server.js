require('dotenv').config();

const path = require('path');
const https = require('https');
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

/* ================= CONFIG ================= */
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ================= ROBOTS HEADER ================= */
app.use((req, res, next) => {
  const pathUrl = req.path || '/';
  const hasQuery = !!(req.query && Object.keys(req.query).length > 0);

  if (
    pathUrl.startsWith('/admin') ||
    pathUrl.startsWith('/go/') ||
    pathUrl.startsWith('/cart') ||
    pathUrl.startsWith('/checkout')
  ) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  } else if (pathUrl === '/contact') {
    res.setHeader('X-Robots-Tag', 'noindex, follow');
  } else if (hasQuery) {
    res.setHeader('X-Robots-Tag', 'noindex, follow');
  } else {
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

/* ================= URL NORMALIZATION ================= */
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  const originalUrl = req.originalUrl || '/';

  if (originalUrl.length > 1 && originalUrl.endsWith('/')) {
    return res.redirect(301, originalUrl.replace(/\/+$/, ''));
  }

  next();
});

/* ================= DEFAULT LOCALS ================= */
app.use((req, res, next) => {
  const baseUrl = BASE_URL || `${req.protocol}://${req.get('host')}`;
  const cleanUrl = `${baseUrl}${req.path}`;
  const storeName = process.env.STORE_NAME || 'MWG Oversize';

  res.locals.baseUrl = baseUrl;
  res.locals.currentUrl = cleanUrl;

  res.locals.meta = {
    title: `Kaos Oversize Pria Premium Original | ${storeName}`,
    description: 'Beli kaos oversize pria premium kualitas distro. Bahan tebal, nyaman, trendy.',
    keywords: 'kaos oversize pria, kaos distro pria, baju oversize pria',
    image: `${baseUrl}/assets/images/og-image.jpg`,
    url: cleanUrl,
    canonical: cleanUrl,
    robots: 'index,follow'
  };

  next();
});

/* ================= VIEW GLOBALS ================= */
app.use(viewGlobals);

/* ================= BOOST INDEXING ================= */
app.get('/ping-search', async (req, res) => {
  try {
    const baseUrl = BASE_URL || `${req.protocol}://${req.get('host')}`;
    const sitemapUrl = `${baseUrl}/sitemap.xml`;

    const targets = [
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ];

    const results = [];
    for (const target of targets) {
      const result = await pingUrl(target);
      results.push({
        target,
        ok: result.ok,
        statusCode: result.statusCode
      });
    }

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
      success: true,
      sitemap: sitemapUrl,
      results
    });
  } catch (error) {
    console.error('[PING SEARCH ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Ping search error'
    });
  }
});

/* ================= ROUTES ================= */
app.use('/', require('./routes/system'));
app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ================= HELPERS ================= */
function normalizeBaseUrl(value) {
  const clean = String(value || '').trim().replace(/\/+$/, '');
  if (!clean) return '';

  try {
    return new URL(clean).toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function pingUrl(url) {
  return new Promise((resolve) => {
    try {
      https
        .get(url, (response) => {
          response.resume();
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 400,
            statusCode: response.statusCode || 0
          });
        })
        .on('error', () => {
          resolve({ ok: false, statusCode: 0 });
        });
    } catch (_) {
      resolve({ ok: false, statusCode: 0 });
    }
  });
}
