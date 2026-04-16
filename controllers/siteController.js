const {
  getVisibleProducts,
  getProductBySlug,
  getVisibleArticles,
  getArticleBySlug
} = require('../helpers/store');

const { makeMeta, productMeta, articleMeta } = require('../helpers/seo');

function safeText(value = '') {
  return String(value || '').trim();
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
    product.keywords
  ].filter(Boolean).join(' ').toLowerCase();
}

function applySeoLocals(res, seo = {}) {
  const baseUrl = res.locals.baseUrl;

  res.locals.seo = {
    ...res.locals.seo,
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    image: seo.image || `${baseUrl}/assets/images/og-image.jpg`,
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

  const title = `Kaos Oversize Pria & Distro Premium Terbaru - ${res.locals.appName}`;
  const desc = `Jual kaos oversize pria, kaos distro premium dan outfit harian terbaik. Bahan nyaman, model kekinian dan cocok untuk gaya casual modern.`;

  applySeoLocals(res, {
    title,
    description: desc,
    keywords: 'kaos oversize pria, kaos distro pria, outfit pria, kaos pria premium',
    canonical: `${res.locals.baseUrl}/`
  });

  return res.render('home', { products, featured, recommended, articles });
}

/* ================= SHOP ================= */
function shop(req, res) {
  const { q = '', category = '' } = req.query;

  let products = getVisibleProducts();
  const query = safeText(q).toLowerCase();
  const selectedCategory = safeText(category);

  if (selectedCategory) {
    products = products.filter(p =>
      safeText(p.category).toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  if (query) {
    products = products.filter(p => normalizeSearchText(p).includes(query));
  }

  const title = selectedCategory
    ? `Kaos ${selectedCategory} Pria Terbaru`
    : query
    ? `Hasil Pencarian ${q}`
    : `Shop Kaos Oversize & Distro Pria`;

  const desc = selectedCategory
    ? `Temukan koleksi kaos ${selectedCategory} pria terbaik dengan bahan nyaman dan desain modern.`
    : query
    ? `Hasil pencarian untuk ${q}. Temukan produk terbaik dengan kualitas premium.`
    : `Jelajahi koleksi kaos oversize pria, kaos distro dan outfit casual terbaik.`;

  applySeoLocals(res, {
    title: `${title} - ${res.locals.appName}`,
    description: desc,
    keywords: `${selectedCategory}, ${q}, kaos pria, outfit pria`,
    canonical: `${res.locals.baseUrl}/shop`
  });

  return res.render('shop', { products, query: q, category });
}

/* ================= PRODUCT ================= */
function productDetail(req, res, next) {
  const product = getProductBySlug(req.params.slug);
  if (!product) return next();

  const title = `${product.name} - Kaos ${product.category} Pria Premium`;
  const desc = `${product.name} adalah kaos ${product.category} pria dengan bahan ${product.material || 'premium'} dan fit ${product.fit || 'nyaman'}. Cocok untuk outfit harian.`;

  applySeoLocals(res, {
    title,
    description: desc,
    keywords: `${product.name}, kaos ${product.category}, kaos pria`,
    canonical: `${res.locals.baseUrl}/product/${product.slug}`,
    type: 'product'
  });

  // ✅ SCHEMA PRODUCT
  res.locals.structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
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

  return res.render('product-detail', { product });
}

/* ================= ARTICLES ================= */
function articles(req, res) {
  const articles = getVisibleArticles();

  applySeoLocals(res, {
    title: `Artikel Fashion Pria & Outfit - ${res.locals.appName}`,
    description: `Baca artikel fashion pria, tips outfit, dan rekomendasi kaos oversize terbaik.`,
    keywords: 'artikel fashion pria, outfit pria, kaos oversize',
    canonical: `${res.locals.baseUrl}/articles`
  });

  return res.render('articles', { articles });
}

/* ================= ARTICLE DETAIL ================= */
function articleDetail(req, res, next) {
  const article = getArticleBySlug(req.params.slug);
  if (!article) return next();

  applySeoLocals(res, {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    canonical: `${res.locals.baseUrl}/article/${article.slug}`,
    type: 'article'
  });

  // ✅ SCHEMA ARTICLE
  res.locals.structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "image": article.image,
    "author": {
      "@type": "Organization",
      "name": res.locals.appName
    },
    "publisher": {
      "@type": "Organization",
      "name": res.locals.appName,
      "logo": {
        "@type": "ImageObject",
        "url": res.locals.site.logo
      }
    },
    "datePublished": new Date().toISOString()
  };

  return res.render('article-detail', { article });
}

/* ================= CONTACT ================= */
function contact(req, res) {
  applySeoLocals(res, {
    title: `Kontak ${res.locals.appName}`,
    description: `Hubungi kami untuk informasi produk dan pemesanan.`,
    keywords: 'kontak toko, hubungi kami',
    canonical: `${res.locals.baseUrl}/contact`
  });

  return res.render('contact');
}

/* ================= SEO LANDING ================= */
function seoKaosOversizePria(req, res) {
  const products = getVisibleProducts().filter(p =>
    normalizeSearchText(p).includes('oversize')
  ).slice(0, 12);

  applySeoLocals(res, {
    title: 'Kaos Oversize Pria Terbaik 2026 - Model Kekinian & Nyaman',
    description: 'Cari kaos oversize pria terbaik dengan bahan nyaman dan desain modern. Cocok untuk outfit casual dan gaya kekinian.',
    keywords: 'kaos oversize pria, kaos oversize terbaik, kaos pria kekinian',
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
