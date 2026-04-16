const {
  getVisibleProducts,
  getProductBySlug,
  getVisibleArticles,
  getArticleBySlug
} = require('../helpers/store');

function safeText(v = '') {
  return String(v || '').trim();
}

function normalizeSearchText(p = {}) {
  return [
    p.name,
    p.brand,
    p.category,
    p.shortDescription,
    p.description,
    p.material,
    p.fit,
    p.keywords
  ].filter(Boolean).join(' ').toLowerCase();
}

function applySeo(res, seo = {}) {
  const base = res.locals.baseUrl;

  res.locals.seo = {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    image: seo.image || `${base}/assets/images/og-image.jpg`,
    canonical: seo.canonical,
    type: seo.type || 'website',
    robots: seo.robots || 'index,follow'
  };
}

/* ================= HOME ================= */
function home(req, res) {
  const products = getVisibleProducts();
  const featured = products.filter(p => p.featured).slice(0, 8);
  const recommended = products.filter(p => p.recommended).slice(0, 8);
  const articles = getVisibleArticles().slice(0, 3);

  applySeo(res, {
    title: `Kaos Oversize Pria & Distro Premium Terbaru`,
    description: `Jual kaos oversize pria, kaos distro premium dan outfit pria kekinian.`,
    keywords: 'kaos oversize pria, kaos distro pria, outfit pria',
    canonical: `${res.locals.baseUrl}/`
  });

  return res.render('home', { products, featured, recommended, articles });
}

/* ================= SHOP ================= */
function shop(req, res) {
  const { q = '', category = '' } = req.query;

  let products = getVisibleProducts();
  const query = safeText(q).toLowerCase();
  const cat = safeText(category);

  if (cat) {
    products = products.filter(p =>
      safeText(p.category).toLowerCase() === cat.toLowerCase()
    );
  }

  if (query) {
    products = products.filter(p => normalizeSearchText(p).includes(query));
  }

  const isFiltered = query || cat;

  const title = cat
    ? `Kaos ${cat} Pria Terbaru`
    : query
    ? `Hasil Pencarian ${q}`
    : `Shop Kaos Oversize & Distro Pria`;

  const desc = cat
    ? `Temukan kaos ${cat} pria terbaik dengan bahan nyaman.`
    : query
    ? `Hasil pencarian ${q}.`
    : `Jelajahi koleksi kaos oversize pria terbaik.`;

  applySeo(res, {
    title: `${title} - ${res.locals.appName}`,
    description: desc,
    keywords: `${cat}, ${q}, kaos pria`,
    canonical: `${res.locals.baseUrl}/shop`,
    robots: isFiltered ? 'noindex,follow' : 'index,follow'
  });

  return res.render('shop', { products, query: q, category });
}

/* ================= PRODUCT (FIX ERROR) ================= */
function productDetail(req, res, next) {
  const product = getProductBySlug(req.params.slug);
  if (!product) return next();

  // 🔥 FIX: wajib ada recommended
  const recommended = getVisibleProducts()
    .filter(p => p.slug !== product.slug)
    .slice(0, 4);

  const name = safeText(product.name);
  const category = safeText(product.category);

  const title = `${name} - Kaos ${category} Pria Premium`;
  const desc = `${name} adalah kaos ${category} pria dengan bahan ${product.material || 'premium'} dan fit ${product.fit || 'nyaman'}.`;

  applySeo(res, {
    title,
    description: desc,
    keywords: `${name}, kaos ${category}, kaos pria`,
    canonical: `${res.locals.baseUrl}/product/${product.slug}`,
    type: 'product'
  });

  // 🔥 schema aman
  res.locals.structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "image": product.image || '',
    "description": desc,
    "brand": {
      "@type": "Brand",
      "name": res.locals.appName
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "IDR",
      "price": product.price || "0",
      "availability": "https://schema.org/InStock"
    }
  };

  return res.render('product-detail', {
    product,
    recommended // 🔥 ini yang bikin error tadi
  });
}

/* ================= ARTICLES ================= */
function articles(req, res) {
  const articles = getVisibleArticles();

  applySeo(res, {
    title: `Artikel Fashion Pria`,
    description: `Tips outfit dan rekomendasi kaos oversize pria.`,
    keywords: 'artikel fashion pria, outfit pria',
    canonical: `${res.locals.baseUrl}/articles`
  });

  return res.render('articles', { articles });
}

/* ================= ARTICLE DETAIL ================= */
function articleDetail(req, res, next) {
  const article = getArticleBySlug(req.params.slug);
  if (!article) return next();

  applySeo(res, {
    title: article.title || '',
    description: article.description || '',
    keywords: article.keywords || '',
    canonical: `${res.locals.baseUrl}/article/${article.slug}`,
    type: 'article'
  });

  res.locals.structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "image": article.image || '',
    "author": {
      "@type": "Organization",
      "name": res.locals.appName
    }
  };

  return res.render('article-detail', { article });
}

/* ================= CONTACT ================= */
function contact(req, res) {
  applySeo(res, {
    title: `Kontak ${res.locals.appName}`,
    description: `Hubungi kami.`,
    keywords: 'kontak',
    canonical: `${res.locals.baseUrl}/contact`
  });

  return res.render('contact');
}

/* ================= LANDING ================= */
function seoKaosOversizePria(req, res) {
  const products = getVisibleProducts()
    .filter(p => normalizeSearchText(p).includes('oversize'))
    .slice(0, 12);

  applySeo(res, {
    title: 'Kaos Oversize Pria Terbaik 2026',
    description: 'Rekomendasi kaos oversize pria terbaik.',
    keywords: 'kaos oversize pria',
    canonical: `${res.locals.baseUrl}/kaos-oversize-pria`
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
