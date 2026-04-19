const {
  getVisibleProducts,
  getProductBySlug,
  getVisibleArticles,
  getArticleBySlug
} = require('../helpers/store');

const {
  makeMeta
} = require('../helpers/seo');

function safeText(value = '') {
  return String(value || '').trim();
}

function safeLower(value = '') {
  return safeText(value).toLowerCase();
}

function normalizeSearchText(product = {}) {
  return [
    product.name,
    product.brand,
    product.category,
    product.shortDescription,
    product.description,
    product.material,
    product.fit,
    product.keywords,
    product.seoTitle,
    product.seoDescription
  ].filter(Boolean).join(' ').toLowerCase();
}

function normalizeArticleText(article = {}) {
  return [
    article.title,
    article.excerpt,
    article.content,
    article.category,
    article.keywords,
    article.seoTitle,
    article.seoDescription
  ].filter(Boolean).join(' ').toLowerCase();
}

function productPath(slug) {
  return `/product/${safeText(slug)}`;
}

function articlePath(slug) {
  return `/article/${safeText(slug)}`;
}

function applySeo(res, data = {}) {
  res.locals.meta = makeMeta(data, res.locals.settings);
}

function setStructuredData(res, items = []) {
  const filtered = items.filter(Boolean);
  res.locals.structuredData = filtered.length <= 1 ? (filtered[0] || null) : filtered;
}

/* ================= HOME ================= */
function home(req, res) {
  const products = getVisibleProducts();
  const articles = getVisibleArticles().slice(0, 4);

  applySeo(res, {
    title: 'Rekomendasi Kaos Pria Terbaik, Oversize Premium & Fashion Kekinian',
    description: 'Temukan rekomendasi kaos pria terbaik, kaos oversize premium, dan pilihan fashion pria kekinian yang nyaman dipakai untuk daily outfit.',
    canonical: '/'
  });

  return res.render('home', {
    products,
    articles
  });
}

/* ================= SHOP ================= */
function shop(req, res) {
  const { q = '', category = '' } = req.query;

  let products = getVisibleProducts();

  if (category) {
    products = products.filter(p => safeLower(p.category) === safeLower(category));
  }

  if (q) {
    products = products.filter(p => normalizeSearchText(p).includes(safeLower(q)));
  }

  const isFiltered = Boolean(q || category);

  applySeo(res, {
    title: 'Shop Rekomendasi Kaos Pria Terbaik',
    description: 'Jelajahi koleksi rekomendasi kaos pria terbaik, oversize premium, dan fashion pria kekinian.',
    canonical: '/shop',
    robots: isFiltered ? 'noindex,follow' : 'index,follow'
  });

  return res.render('shop', {
    products,
    query: q,
    category
  });
}

/* ================= PRODUCT DETAIL ================= */
function productDetail(req, res, next) {
  const product = getProductBySlug(req.params.slug);

  if (!product) return next();

  applySeo(res, {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription,
    canonical: productPath(product.slug),
    image: product.image
  });

  return res.render('product-detail', { product });
}

/* ================= ARTICLES ================= */
function articles(req, res) {
  const items = getVisibleArticles();

  applySeo(res, {
    title: 'Artikel Fashion Pria',
    description: 'Baca artikel fashion pria dan tips outfit terbaik.',
    canonical: '/articles'
  });

  return res.render('articles', { articles: items });
}

/* ================= ARTICLE DETAIL ================= */
function articleDetail(req, res, next) {
  const article = getArticleBySlug(req.params.slug);

  if (!article) return next();

  applySeo(res, {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    canonical: articlePath(article.slug),
    image: article.image
  });

  return res.render('article-detail', { article });
}

/* ================= CONTACT ================= */
function contact(req, res) {
  applySeo(res, {
    title: 'Kontak',
    description: 'Hubungi kami untuk informasi lebih lanjut.',
    canonical: '/contact'
  });

  return res.render('contact');
}

/* ================= SEO LANDING ================= */
function seoKaosOversizePria(req, res) {
  const products = getVisibleProducts();

  applySeo(res, {
    title: 'Kaos Oversize Pria Terbaik',
    description: 'Rekomendasi kaos oversize pria terbaik dengan bahan nyaman dan model kekinian.',
    canonical: '/kaos-oversize-pria'
  });

  return res.render('seo-kaos-oversize', { products });
}

module.exports = {
  home,
  shop,
  productDetail,
  articles,
  articleDetail,
  contact,
  seoKaosOversizePria
};
