require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const { ensureDataFiles } = require('./helpers/jsonDb');
const { viewGlobals } = require('./middleware');
const { cartCount } = require('./helpers/cart');

ensureDataFiles();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

/*
|--------------------------------------------------------------------------
| APP CONFIG
|--------------------------------------------------------------------------
*/
app.set('trust proxy', 1);
app.disable('x-powered-by');

/*
|--------------------------------------------------------------------------
| VIEW ENGINE
|--------------------------------------------------------------------------
*/
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/*
|--------------------------------------------------------------------------
| BODY PARSER
|--------------------------------------------------------------------------
*/
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

/*
|--------------------------------------------------------------------------
| STATIC FILES
|--------------------------------------------------------------------------
| Public files served under /assets
*/
app.use('/assets', express.static(path.join(__dirname, 'public'), {
  maxAge: IS_PROD ? '7d' : 0,
  etag: true,
  lastModified: true
}));

/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
| Current project still uses session because some old logic may still
| depend on cart/admin flow. We keep it stable for now, then later we can
| reduce unused cart/checkout logic when site is fully switched to affiliate.
*/
app.use(session({
  name: process.env.SESSION_NAME || 'store.sid',
  secret: process.env.SESSION_SECRET || 'change-this-session-secret',
  resave: false,
  saveUninitialized: false,
  rolling: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

/*
|--------------------------------------------------------------------------
| GLOBAL VARIABLES FOR ALL VIEWS
|--------------------------------------------------------------------------
| We prepare common values here so later all pages can share:
| - brand/app name
| - base url
| - basic SEO defaults
| - cart count (for old UI compatibility)
*/
app.use((req, res, next) => {
  const cart = Array.isArray(req.session.cart) ? req.session.cart : [];

  const appName = process.env.APP_NAME || 'Ozerra';
  const baseUrl = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

  res.locals.cartCount = cartCount(cart);
  res.locals.baseUrl = baseUrl;
  res.locals.appName = appName;
  res.locals.currentPath = req.originalUrl || '/';
  res.locals.currentUrl = `${baseUrl}${req.originalUrl || '/'}`;

  /*
  |--------------------------------------------------------------------------
  | DEFAULT SEO
  |--------------------------------------------------------------------------
  | Individual pages can override these values later from routes/controllers.
  */
  res.locals.seo = {
    title: process.env.DEFAULT_SEO_TITLE || `${appName} - Koleksi Fashion Pilihan`,
    description:
      process.env.DEFAULT_SEO_DESCRIPTION ||
      'Temukan koleksi fashion pilihan dengan tampilan rapi, informasi lengkap, dan pengalaman belanja yang nyaman.',
    keywords:
      process.env.DEFAULT_SEO_KEYWORDS ||
      'kaos oversize, kaos pria, fashion pria, rekomendasi kaos, outfit harian',
    image: process.env.DEFAULT_OG_IMAGE || `${baseUrl}/assets/images/og-image.jpg`,
    canonical: `${baseUrl}${req.path}`,
    type: 'website',
    robots: 'index,follow'
  };

  /*
  |--------------------------------------------------------------------------
  | SITE META / BRAND INFO
  |--------------------------------------------------------------------------
  */
  res.locals.site = {
    name: appName,
    url: baseUrl,
    locale: 'id_ID',
    currency: process.env.SITE_CURRENCY || 'IDR',
    logo: process.env.SITE_LOGO || `${baseUrl}/assets/images/logo.png`,
    email: process.env.SITE_EMAIL || '',
    phone: process.env.SITE_PHONE || '',
    instagram: process.env.SITE_INSTAGRAM || '',
    facebook: process.env.SITE_FACEBOOK || '',
    tiktok: process.env.SITE_TIKTOK || ''
  };

  next();
});

/*
|--------------------------------------------------------------------------
| VIEW GLOBALS
|--------------------------------------------------------------------------
| Flash / helpers from existing middleware
*/
app.use(viewGlobals);

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/
app.use('/', require('./routes/system'));
app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));

/*
|--------------------------------------------------------------------------
| 404 HANDLER
|--------------------------------------------------------------------------
*/
app.use((req, res) => {
  res.status(404);

  if (typeof res.locals.seo === 'object' && res.locals.seo) {
    res.locals.seo.title = `Halaman Tidak Ditemukan - ${res.locals.appName}`;
    res.locals.seo.description = 'Halaman yang kamu cari tidak ditemukan.';
    res.locals.seo.robots = 'noindex,follow';
    res.locals.seo.canonical = `${res.locals.baseUrl}${req.originalUrl || req.path}`;
  }

  return res.render('404');
});

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
app.use((error, req, res, next) => {
  console.error('[SERVER ERROR]', error);

  res.status(error.status || 500);

  if (typeof res.locals.seo === 'object' && res.locals.seo) {
    res.locals.seo.title = `Terjadi Kesalahan - ${res.locals.appName}`;
    res.locals.seo.description = 'Terjadi kesalahan pada server.';
    res.locals.seo.robots = 'noindex,follow';
    res.locals.seo.canonical = `${res.locals.baseUrl}${req.originalUrl || req.path}`;
  }

  return res.render('500', {
    error: IS_PROD ? null : error
  });
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${NODE_ENV})`);
});