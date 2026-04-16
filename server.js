require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const https = require('https');

const { ensureDataFiles } = require('./helpers/jsonDb');
const { viewGlobals } = require('./middleware');
const { cartCount } = require('./helpers/cart');

ensureDataFiles();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

/* ================= CONFIG ================= */
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ================= VIEW ================= */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ================= BODY ================= */
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

/* ================= STATIC ================= */
app.use('/assets', express.static(path.join(__dirname, 'public'), {
  maxAge: IS_PROD ? '7d' : 0,
  etag: true,
  lastModified: true
}));

/* ================= SESSION ================= */
app.use(session({
  name: process.env.SESSION_NAME || 'store.sid',
  secret: process.env.SESSION_SECRET || 'change-this-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

/* ================= GLOBAL SEO ================= */
app.use((req, res, next) => {
  const cart = Array.isArray(req.session.cart) ? req.session.cart : [];

  const appName = process.env.APP_NAME || 'Ozerra';
  const baseUrl = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

  res.locals.cartCount = cartCount(cart);
  res.locals.baseUrl = baseUrl;
  res.locals.appName = appName;
  res.locals.currentPath = req.originalUrl || '/';
  res.locals.currentUrl = `${baseUrl}${req.originalUrl || '/'}`;

  res.locals.seo = {
    title: `${appName} - Kaos Oversize Pria & Distro Premium`,
    description: 'Jual kaos oversize pria, kaos distro premium, dan outfit pria kekinian.',
    keywords: 'kaos oversize pria, kaos distro pria, outfit pria',
    image: `${baseUrl}/assets/images/og-image.jpg`,
    canonical: `${baseUrl}${req.path}`,
    type: 'website',
    robots: req.originalUrl.startsWith('/admin')
      ? 'noindex,nofollow'
      : 'index,follow'
  };

  res.locals.site = {
    name: appName,
    url: baseUrl,
    locale: 'id_ID',
    currency: 'IDR',
    logo: `${baseUrl}/assets/images/logo.png`
  };

  next();
});

/* ================= GLOBAL VIEW ================= */
app.use(viewGlobals);

/* ================= ROUTES ================= */
app.use('/', require('./routes/system'));
app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));

/* ================= 404 ================= */
app.use((req, res) => {
  res.status(404);

  res.locals.seo.title = `Halaman Tidak Ditemukan - ${res.locals.appName}`;
  res.locals.seo.robots = 'noindex,follow';

  return res.render('404');
});

/* ================= ERROR ================= */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500);

  res.locals.seo.title = `Server Error - ${res.locals.appName}`;
  res.locals.seo.robots = 'noindex,follow';

  return res.render('500');
});

/* ================= AUTO INDEX ================= */
function pingGoogle() {
  const base = process.env.BASE_URL;
  if (!base) return;

  const url = `https://www.google.com/ping?sitemap=${base}/sitemap.xml`;

  https.get(url, () => {
    console.log('Ping Google OK');
  }).on('error', () => {});
}

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  pingGoogle();
});
