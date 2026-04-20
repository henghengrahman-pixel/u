const {
  getVisibleProducts,
  getProductBySlug,
  getVisibleArticles,
  getArticleBySlug
} = require('../helpers/store');

const {
  homeMeta,
  shopMeta,
  productMeta,
  articleMeta,
  makeMeta
} = require('../helpers/seo');

function clean(value = '') {
  return String(value || '').trim();
}

function normalizeText(value = '') {
  return clean(value).toLowerCase();
}

function applySeo(res, metaInput = {}) {
  res.locals.meta = {
    ...(res.locals.meta || {}),
    ...makeMeta(metaInput, res.locals.settings || {})
  };
}

function setSchema(res, schema) {
  res.locals.structuredData = schema || null;
}

function filterProducts(products = [], options = {}) {
  const query = normalizeText(options.query);
  const category = normalizeText(options.category);

  return products.filter((product) => {
    const haystack = [
      product?.name,
      product?.category,
      product?.material,
      product?.fit,
      product?.shortDescription,
      product?.short_description,
      product?.description,
      product?.details,
      product?.keywords,
      product?.seoTitle,
      product?.seoDescription
    ]
      .map((item) => normalizeText(item))
      .join(' ');

    const productCategory = normalizeText(product?.category);

    const matchQuery = !query || haystack.includes(query);
    const matchCategory = !category || productCategory === category;

    return matchQuery && matchCategory;
  });
}

function buildCollectionSchema(name, description, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url
  };
}

/* ================= HOME ================= */
exports.home = (req, res) => {
  const products = getVisibleProducts();
  const articles = getVisibleArticles();

  applySeo(res, homeMeta(res.locals.settings));

  setSchema(res, {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Kaos Oversize Pria Premium Original',
    url: `${res.locals.baseUrl}/`,
    description: 'Rekomendasi kaos oversize pria premium original untuk pembeli pria Indonesia yang cari bahan nyaman, model kekinian, dan look lebih rapi.'
  });

  res.render('home', {
    products,
    featured: products.filter((item) => item?.featured).slice(0, 6).length
      ? products.filter((item) => item?.featured).slice(0, 6)
      : products.slice(0, 6),
    recommended: products.filter((item) => item?.recommended).slice(0, 8).length
      ? products.filter((item) => item?.recommended).slice(0, 8)
      : products.slice(0, 8),
    articles: articles.slice(0, 4)
  });
};

/* ================= SHOP ================= */
exports.shop = (req, res) => {
  const allProducts = getVisibleProducts();
  const query = clean(req.query.q);
  const category = clean(req.query.category);

  const products = filterProducts(allProducts, { query, category });

  applySeo(res, shopMeta(res.locals.settings, { query, category }));

  setSchema(res, buildCollectionSchema(
    category
      ? `Rekomendasi Kaos ${category} Pria`
      : query
        ? `Hasil Pencarian ${query}`
        : 'Shop Kaos Pria',
    category
      ? `Kumpulan rekomendasi kaos ${category} pria untuk pembeli Indonesia yang mencari bahan nyaman, model kekinian, dan pilihan terbaik untuk outfit harian.`
      : query
        ? `Hasil pencarian ${query} untuk rekomendasi kaos pria dan kaos oversize pria.`
        : 'Jelajahi koleksi rekomendasi kaos pria, kaos oversize premium, dan pilihan fashion pria terbaik.',
    `${res.locals.baseUrl}/shop`
  ));

  res.render('shop', { products, query, category });
};

/* ================= PRODUCT ================= */
exports.productDetail = (req, res) => {
  const product = getProductBySlug(req.params.slug);

  if (!product) {
    return res.redirect(301, '/shop');
  }

  applySeo(res, productMeta(product, res.locals.settings));

  res.locals.structuredData = null;

  res.render('product-detail', {
    product,
    recommended: getVisibleProducts()
      .filter((item) => item.slug !== product.slug)
      .slice(0, 4)
  });
};

/* ================= ARTICLES ================= */
exports.articles = (req, res) => {
  const articles = getVisibleArticles();

  applySeo(res, {
    title: 'Artikel Fashion Pria, Tips Outfit & Rekomendasi Kaos Oversize',
    description: 'Baca artikel fashion pria, tips outfit harian, panduan memilih kaos oversize pria, dan rekomendasi produk terbaik untuk pembeli Indonesia.',
    keywords: [
      'artikel fashion pria',
      'tips outfit pria',
      'kaos oversize pria',
      'rekomendasi kaos pria',
      'fashion pria indonesia'
    ],
    canonical: '/articles',
    robots: 'index,follow'
  });

  setSchema(res, buildCollectionSchema(
    'Artikel Fashion Pria',
    'Kumpulan artikel fashion pria, tips outfit, dan panduan memilih kaos oversize pria terbaik.',
    `${res.locals.baseUrl}/articles`
  ));

  res.render('articles', { articles });
};

/* ================= ARTICLE DETAIL ================= */
exports.articleDetail = (req, res) => {
  const article = getArticleBySlug(req.params.slug);

  if (!article) {
    return res.redirect(301, '/articles');
  }

  const relatedArticles = getVisibleArticles()
    .filter((item) => item.slug !== article.slug)
    .slice(0, 4);

  const products = getVisibleProducts().slice(0, 4);

  applySeo(res, articleMeta(article, res.locals.settings));

  setSchema(res, {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: clean(article.title),
    description: clean(article.excerpt || article.seoDescription || article.title),
    mainEntityOfPage: `${res.locals.baseUrl}/article/${clean(article.slug)}`,
    author: {
      '@type': 'Organization',
      name: clean(res.locals.settings?.storeName || 'MWG Oversize')
    },
    publisher: {
      '@type': 'Organization',
      name: clean(res.locals.settings?.storeName || 'MWG Oversize'),
      logo: {
        '@type': 'ImageObject',
        url: `${res.locals.baseUrl}/assets/images/logo.png`
      }
    },
    image: clean(article.image || article.thumbnail || `${res.locals.baseUrl}/assets/images/og-image.jpg`),
    datePublished: clean(article.created_at || article.createdAt || ''),
    dateModified: clean(article.updated_at || article.updatedAt || article.created_at || article.createdAt || '')
  });

  res.render('article-detail', {
    article,
    articles: relatedArticles,
    products
  });
};

/* ================= CONTACT ================= */
exports.contact = (req, res) => {
  applySeo(res, {
    title: 'Kontak MWG Oversize',
    description: 'Hubungi MWG Oversize untuk informasi produk, pertanyaan pembelian, dan bantuan lebih lanjut.',
    keywords: ['kontak MWG Oversize', 'hubungi toko kaos pria'],
    canonical: '/contact',
    robots: 'noindex,follow'
  });

  setSchema(res, null);

  res.render('contact');
};

/* ================= HUB (MONEY PAGE) ================= */
exports.seoKaosOversizePria = (req, res) => {
  const products = getVisibleProducts();
  const articles = getVisibleArticles().slice(0, 4);

  applySeo(res, {
    title: 'Kaos Oversize Pria Premium Original Terbaik untuk Pria Indonesia',
    description: 'Temukan rekomendasi kaos oversize pria premium original dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk outfit harian pria Indonesia.',
    keywords: [
      'kaos oversize pria',
      'kaos oversize pria premium',
      'kaos pria original',
      'rekomendasi kaos pria',
      'kaos pria indonesia'
    ],
    canonical: '/kaos-oversize-pria',
    robots: 'index,follow'
  });

  setSchema(res, buildCollectionSchema(
    'Kaos Oversize Pria',
    'Halaman rekomendasi kaos oversize pria premium original untuk pembeli pria Indonesia.',
    `${res.locals.baseUrl}/kaos-oversize-pria`
  ));

  res.render('seo-kaos-oversize', {
    products,
    articles
  });
};

/* ================= CATEGORY (TOPICAL CORE) ================= */
exports.seoCategoryMurah = (req, res) => {
  const products = getVisibleProducts();

  applySeo(res, {
    title: 'Kaos Oversize Pria Murah Berkualitas untuk Harian',
    description: 'Cari kaos oversize pria murah dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk pria Indonesia yang ingin tetap stylish tanpa boros.',
    keywords: [
      'kaos oversize pria murah',
      'kaos pria murah',
      'kaos oversize pria harga terjangkau'
    ],
    canonical: '/kaos-oversize-pria-murah',
    robots: 'index,follow'
  });

  setSchema(res, buildCollectionSchema(
    'Kaos Oversize Pria Murah',
    'Kumpulan rekomendasi kaos oversize pria murah berkualitas untuk pembeli pria Indonesia.',
    `${res.locals.baseUrl}/kaos-oversize-pria-murah`
  ));

  res.render('seo-category', { products });
};

exports.seoCategoryPremium = (req, res) => {
  const products = getVisibleProducts();

  applySeo(res, {
    title: 'Kaos Oversize Pria Premium Original untuk Tampilan Lebih Rapi',
    description: 'Temukan kaos oversize pria premium original dengan bahan lebih nyaman, tampilan lebih rapi, dan kualitas yang cocok untuk pembeli pria Indonesia.',
    keywords: [
      'kaos oversize pria premium',
      'kaos pria premium original',
      'kaos oversize original'
    ],
    canonical: '/kaos-oversize-pria-premium',
    robots: 'index,follow'
  });

  setSchema(res, buildCollectionSchema(
    'Kaos Oversize Pria Premium',
    'Kumpulan rekomendasi kaos oversize pria premium original untuk pria Indonesia.',
    `${res.locals.baseUrl}/kaos-oversize-pria-premium`
  ));

  res.render('seo-category', { products });
};

exports.seoCategoryTerbaik = (req, res) => {
  const products = getVisibleProducts();

  applySeo(res, {
    title: 'Kaos Oversize Pria Terbaik untuk Outfit Harian Pria Indonesia',
    description: 'Daftar kaos oversize pria terbaik dengan bahan nyaman, model kekinian, dan pilihan yang cocok untuk outfit harian pria Indonesia.',
    keywords: [
      'kaos oversize pria terbaik',
      'rekomendasi kaos pria terbaik',
      'kaos pria terbaik'
    ],
    canonical: '/kaos-oversize-pria-terbaik',
    robots: 'index,follow'
  });

  setSchema(res, buildCollectionSchema(
    'Kaos Oversize Pria Terbaik',
    'Kumpulan rekomendasi kaos oversize pria terbaik untuk pembeli pria Indonesia.',
    `${res.locals.baseUrl}/kaos-oversize-pria-terbaik`
  ));

  res.render('seo-category', { products });
};

/* ================= AUTO SEO ================= */
exports.seoDynamic = (req, res, page, products) => {
  applySeo(res, {
    title: clean(page.title),
    description: clean(page.desc),
    keywords: clean(page.keyword),
    canonical: `/s/${clean(page.slug)}`,
    robots: 'index,follow'
  });

  setSchema(res, buildCollectionSchema(
    clean(page.title),
    clean(page.desc),
    `${res.locals.baseUrl}/s/${clean(page.slug)}`
  ));

  res.render('seo-dynamic', { products, page });
};

/* ================= SNIPER ================= */
exports.seoSniper = (req, res, keyword) => {
  const products = getVisibleProducts();
  const slug = clean(keyword).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

  applySeo(res, {
    title: `${clean(keyword)} untuk Pria Indonesia`,
    description: `Temukan ${clean(keyword)} dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk pembeli pria Indonesia.`,
    keywords: clean(keyword),
    canonical: `/sniper/${slug}`,
    robots: 'index,follow'
  });

  setSchema(res, buildCollectionSchema(
    clean(keyword),
    `Halaman rekomendasi ${clean(keyword)} untuk pembeli pria Indonesia.`,
    `${res.locals.baseUrl}/sniper/${slug}`
  ));

  res.render('seo-sniper', { products, keyword });
};
