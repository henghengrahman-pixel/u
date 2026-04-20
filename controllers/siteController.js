const {
  getVisibleProducts,
  getProductBySlug,
  getVisibleArticles,
  getArticleBySlug
} = require('../helpers/store');

/* ================= SEO APPLY ================= */
function applySeo(res, meta) {
  const base = res.locals.baseUrl;

  res.locals.meta = {
    ...(res.locals.meta || {}),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    canonical: base + meta.canonical,
    url: base + meta.canonical
  };
}

/* ================= STRUCTURED DATA ================= */
function setSchema(res, schema) {
  res.locals.structuredData = schema;
}

/* ================= HOME ================= */
exports.home = (req, res) => {
  const products = getVisibleProducts();
  const articles = getVisibleArticles();

  applySeo(res, {
    title: 'Kaos Oversize Pria Premium Terbaik 2026',
    description: 'Beli kaos oversize pria premium bahan tebal, nyaman, dan kekinian.',
    keywords: 'kaos oversize pria, kaos pria premium',
    canonical: '/'
  });

  setSchema(res, {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MWG Oversize',
    url: res.locals.baseUrl
  });

  res.render('home', {
    products,
    featured: products.slice(0, 6),
    recommended: products.slice(0, 8),
    articles: articles.slice(0, 4)
  });
};

/* ================= SHOP ================= */
exports.shop = (req, res) => {
  const products = getVisibleProducts();

  const query = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();

  applySeo(res, {
    title: 'Shop Kaos Pria Oversize Terbaik',
    description: 'Temukan kaos pria oversize terbaik bahan nyaman dan stylish.',
    keywords: 'kaos pria, kaos oversize pria',
    canonical: '/shop'
  });

  res.render('shop', { products, query, category });
};

/* ================= PRODUCT ================= */
exports.productDetail = (req, res) => {
  const product = getProductBySlug(req.params.slug);

  if (!product) return res.redirect('/shop');

  applySeo(res, {
    title: `${product.name} - Kaos Oversize Pria`,
    description: product.shortDescription || product.name,
    keywords: product.name,
    canonical: `/product/${product.slug}`
  });

  /* penting: kosongkan schema global product yang minim */
  res.locals.structuredData = null;

  res.render('product-detail', {
    product,
    recommended: getVisibleProducts()
      .filter(item => item.slug !== product.slug)
      .slice(0, 4)
  });
};

/* ================= ARTICLES ================= */
exports.articles = (req, res) => {
  const articles = getVisibleArticles();

  applySeo(res, {
    title: 'Artikel Fashion Pria & Kaos Oversize',
    description: 'Tips outfit pria dan rekomendasi kaos oversize terbaik.',
    keywords: 'fashion pria, kaos pria',
    canonical: '/articles'
  });

  res.render('articles', { articles });
};

/* ================= ARTICLE DETAIL ================= */
exports.articleDetail = (req, res) => {
  const article = getArticleBySlug(req.params.slug);

  if (!article) return res.redirect('/articles');

  const articles = getVisibleArticles()
    .filter(item => item.slug !== article.slug)
    .slice(0, 4);

  const products = getVisibleProducts().slice(0, 4);

  applySeo(res, {
    title: article.title,
    description: article.excerpt || article.title,
    keywords: article.title,
    canonical: `/article/${article.slug}`
  });

  setSchema(res, {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.title,
    mainEntityOfPage: res.locals.baseUrl + `/article/${article.slug}`
  });

  res.render('article-detail', {
    article,
    articles,
    products
  });
};

/* ================= CONTACT ================= */
exports.contact = (req, res) => {
  applySeo(res, {
    title: 'Kontak Kami',
    description: 'Hubungi kami untuk informasi lebih lanjut.',
    keywords: 'kontak',
    canonical: '/contact'
  });

  res.render('contact');
};

/* ================= HUB (MONEY PAGE) ================= */
exports.seoKaosOversizePria = (req, res) => {
  const products = getVisibleProducts();

  applySeo(res, {
    title: 'Kaos Oversize Pria Premium Terbaik 2026',
    description: 'Rekomendasi kaos oversize pria terbaik bahan tebal dan nyaman.',
    keywords: 'kaos oversize pria premium',
    canonical: '/kaos-oversize-pria'
  });

  setSchema(res, {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Kaos Oversize Pria'
  });

  res.render('seo-kaos-oversize', {
    products,
    articles: getVisibleArticles().slice(0, 4)
  });
};

/* ================= CATEGORY (TOPICAL CORE) ================= */
exports.seoCategoryMurah = (req, res) => {
  const products = getVisibleProducts();

  applySeo(res, {
    title: 'Kaos Oversize Pria Murah Terbaik 2026',
    description: 'Rekomendasi kaos oversize pria murah berkualitas bahan nyaman.',
    keywords: 'kaos oversize pria murah',
    canonical: '/kaos-oversize-pria-murah'
  });

  res.render('seo-category', { products });
};

exports.seoCategoryPremium = (req, res) => {
  const products = getVisibleProducts();

  applySeo(res, {
    title: 'Kaos Oversize Pria Premium Original Terbaik',
    description: 'Kaos oversize pria premium original kualitas terbaik.',
    keywords: 'kaos oversize pria premium',
    canonical: '/kaos-oversize-pria-premium'
  });

  res.render('seo-category', { products });
};

exports.seoCategoryTerbaik = (req, res) => {
  const products = getVisibleProducts();

  applySeo(res, {
    title: 'Kaos Oversize Pria Terbaik 2026',
    description: 'Daftar kaos oversize pria terbaik kualitas premium.',
    keywords: 'kaos oversize pria terbaik',
    canonical: '/kaos-oversize-pria-terbaik'
  });

  res.render('seo-category', { products });
};

/* ================= AUTO SEO ================= */
exports.seoDynamic = (req, res, page, products) => {
  applySeo(res, {
    title: page.title,
    description: page.desc,
    keywords: page.keyword,
    canonical: `/s/${page.slug}`
  });

  res.render('seo-dynamic', { products, page });
};

/* ================= SNIPER ================= */
exports.seoSniper = (req, res, keyword) => {
  const products = getVisibleProducts();
  const slug = keyword.replace(/\s+/g, '-');

  applySeo(res, {
    title: `${keyword} terbaik 2026`,
    description: `Temukan ${keyword} dengan kualitas terbaik.`,
    keywords: keyword,
    canonical: '/sniper/' + slug
  });

  res.render('seo-sniper', { products, keyword });
};
