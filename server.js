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

/* ================= GLOBAL SECURITY + ROBOTS ================= */
app.use((req, res, next) => {
  setSecurityHeaders(res);

  const path = req.path || '';
  const isAdmin = path.startsWith('/admin');
  const isHealth = path === '/healthz';

  if (isAdmin || isHealth) {
    res.setHeader('X-Robots-Tag', 'noindex,nofollow,noarchive');
  } else {
    res.setHeader('X-Robots-Tag', 'index,follow');
  }

  next();
});

/* ================= CANONICAL HOST ================= */
app.use((req, res, next) => {
  if (!IS_PROD || !BASE_URL) return next();

  try {
    const target = new URL(BASE_URL);
    const host = req.get('host');
    const proto = (req.headers['x-forwarded-proto'] || req.protocol).split(',')[0];

    if (host !== target.host || proto !== target.protocol.replace(':', '')) {
      return res.redirect(301, BASE_URL + req.originalUrl);
    }
  } catch (e) {}

  next();
});

/* ================= TRAILING SLASH ================= */
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    return res.redirect(301, req.path.slice(0, -1));
  }
  next();
});

/* ================= BODY ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* ================= STATIC ================= */
app.use('/assets', express.static(path.join(__dirname, 'public'), {
  maxAge: IS_PROD ? '7d' : 0
}));

/* ================= SESSION ================= */
app.use(session({
  name: 'mwg.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: 'auto'
  }
}));

/* ================= VIEW GLOBALS ================= */
app.use(viewGlobals);

/* ================= ROUTES ================= */
app.use('/', require('./routes/system'));
app.use('/', require('./routes/site'));
app.use('/admin', require('./routes/admin'));

/* ================= 404 ================= */
app.use((req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex,nofollow');

  res.status(404);
  return res.render('404');
});

/* ================= ERROR ================= */
app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  res.setHeader('X-Robots-Tag', 'noindex,nofollow');

  res.status(500);
  return res.render('500');
});

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

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}
