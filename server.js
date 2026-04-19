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

if (IS_PROD && SESSION_SECRET === 'mwg-secret-change-this') {
  console.warn('[SECURITY] SESSION_SECRET masih default. Ganti di environment production.');
}

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  setSecurityHeaders(res);

  if (!IS_PROD) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  next();
});

app.use((req, res, next) => {
  if (!IS_PROD || !BASE_URL) return next();

  try {
    const target = new URL(BASE_URL);
    const forwardedProto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http')
      .split(',')[0]
      .trim()
      .toLowerCase();
    const requestHost = String(req.get('host') || '').trim().toLowerCase();
    const targetHost = String(target.host || '').trim().toLowerCase();
    const targetProto = String(target.protocol || 'https:').replace(':', '').toLowerCase();

    if (requestHost && (requestHost !== targetHost || forwardedProto !== targetProto)) {
      const redirectUrl = new URL(req.originalUrl || '/', BASE_URL).toString();
      return res.redirect(301, redirectUrl);
    }
  } catch (error) {
    console.error('[BASE_URL REDIRECT ERROR]', error);
  }

  return next();
});

app.use((req, res, next) => {
  if (req.path.length > 1 && /\/$/.test(req.path)) {
    const cleanPath = req.path.replace(/\/+$/, '');
    const queryIndex = req.originalUrl.indexOf('?');
    const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
    return res.redirect(301, `${cleanPath}${query}`);
  }

  return next();
});

app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

app.use('/assets', express.static(path.join(__dirname, 'public'), {
  index: false,
  redirect: false,
  etag: true,
  lastModified: true,
  maxAge: IS_PROD ? '7d' : 0,
  setHeaders(res, filePath) {
    if (!IS_PROD) return;

    if (/\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    }
  }
}));

app.use(session({
  name: process.env.SESSION_NAME || 'mwg.sid',
  secret: SESSION_SECRET,
  proxy: IS_PROD,
  resave: false,
  saveUninitialized: false,
  rolling: false,
  unset: 'destroy',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: 'auto',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use((req, res, next) => {
  const baseUrl = BASE_URL || `${req.protocol}://${req.get('host')}`.replace(/\/+$/, '');
  const currentPath = req.path || '/';
  const currentUrl = `${baseUrl}${req.originalUrl || '/'}`;
  const storeName = process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize';

  res.locals.baseUrl = baseUrl;
  res.locals.currentPath = currentPath;
  res.locals.currentUrl = currentUrl;
  res.locals.meta = {
    title: `${storeName} - Rekomendasi Kaos Pria Terbaik`,
    description: 'Temukan rekomendasi kaos pria terbaik mulai dari oversize hingga distro premium dengan bahan nyaman dan desain kekinian.',
    keywords: 'rekomendasi kaos pria, kaos oversize pria, kaos pria terbaik',
    image: `${baseUrl}/assets/images/og-image.jpg`,
    url: currentUrl,
    canonical: currentUrl,
    robots: 'index,follow'
  };

  return next();
});

app.use(viewGlobals);

app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/', require('./routes/system'));
app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => {
  const storeName = res.locals.settings?.storeName || process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize';

  res.status(404);
  res.locals.meta = {
    ...res.locals.meta,
    title: `Halaman Tidak Ditemukan | ${storeName}`,
    description: 'Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.',
    canonical: res.locals.currentUrl,
    url: res.locals.currentUrl,
    robots: 'noindex,follow'
  };

  return res.render('404');
});

app.use((err, req, res, next) => {
  const storeName = res.locals.settings?.storeName || process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize';

  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500);
  res.locals.meta = {
    ...res.locals.meta,
    title: `Server Error | ${storeName}`,
    description: 'Terjadi kesalahan pada server.',
    canonical: res.locals.currentUrl,
    url: res.locals.currentUrl,
    robots: 'noindex,nofollow'
  };

  return res.render('500');
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`[SERVER] ${signal} received. Closing server...`);

  server.close(() => {
    console.log('[SERVER] Closed cleanly.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[SERVER] Force shutdown.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

function normalizeBaseUrl(value) {
  const clean = String(value || '').trim().replace(/\/+$/, '');
  if (!clean) return '';

  try {
    return new URL(clean).toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'accelerometer=(), autoplay=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()');

  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}
