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
  const base = res.locals.baseUrl || '';
  const brand = res.locals.settings?.storeName || 'MWG Oversize';

  res.locals.meta = {
    title: seo.title || `${brand} - Rekomendasi Kaos Pria Terbaik`,
    description: seo.description || 'Rekomendasi kaos pria terbaik dengan bahan nyaman dan model kekinian.',
    keywords: seo.keywords || 'rekomendasi kaos pria, kaos oversize pria, kaos pria terbaik',
    image: seo.image || `${base}/assets/images/og-image.jpg`,
    url: seo.canonical || `${base}/`,
  };
}

/* ================= HOME ================= */
function home(req, res) {
  const products = getVisibleProducts();
  const featured = products.filter(p => p.featured).slice(0, 8);
  const recommended = products.filter(p => p.recommended).slice(0, 8);
  const articles = getVisibleArticles().slice(0, 4);

  applySeo(res, {
    title: 'Rekomendasi Kaos Pria Terbaik & Oversize Premium',
    description: 'Temukan rekomendasi kaos pria terbaik mulai dari oversize hingga distro premium pilihan dengan bahan nyaman dan desain kekinian.',
    keywords: 'rekomendasi kaos pria, kaos oversize pria, kaos pria terbaik',
    canonical: `${res.locals.baseUrl}/`
  });

  return res.render('home', {
    products,
    featured,
    recommended,
    articles
  });
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

  const isFiltered = Boolean(query || cat);

  const title = cat
    ? `Rekomendasi Kaos ${cat} Pria Terbaik`
    : query
      ? `Hasil Pencarian ${safeText(q)}`
      : 'Rekomendasi Kaos Pria Terbaik';

  const desc = cat
    ? `Kumpulan rekomendasi kaos ${cat} pria terbaik dengan bahan nyaman dan model kekinian.`
    : query
      ? `Hasil pencarian untuk ${safeText(q)}.`
      : 'Temukan berbagai rekomendasi kaos pria terbaik yang sudah kami kurasi.';

  applySeo(res, {
    title,
    description: desc,
    keywords: `${cat}, ${safeText(q)}, rekomendasi kaos pria`,
    canonical: `${res.locals.baseUrl}/shop`,
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
  try {
    const product = getProductBySlug(req.params.slug);
    if (!product) return next();

    const recommended = getVisibleProducts()
      .filter(p => p.slug !== product.slug)
      .slice(0, 4);

    const name = safeText(product.name);
    const category = safeText(product.category || 'pria');
    const material = safeText(product.material || 'premium');
    const fit = safeText(product.fit || 'nyaman');

    applySeo(res, {
      title: `${name} - Rekomendasi Kaos ${category} Terbaik`,
      description: `${name} merupakan salah satu rekomendasi kaos ${category} terbaik dengan bahan ${material} dan fit ${fit}. Cocok untuk outfit pria kekinian.`,
      keywords: `${name}, kaos ${category}, rekomendasi kaos pria, kaos pria terbaik`,
      canonical: `${res.locals.baseUrl}/product/${product.slug}`,
      image: product.image
    });

    res.locals.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      image: product.image || '',
      description: `${name} - rekomendasi kaos pria terbaik`,
      brand: {
        '@type': 'Brand',
        name: safeText(product.brand || 'MWG Oversize')
      }
    };

    return res.render('product-detail', {
      product,
      recommended
    });
  } catch (error) {
    console.error('[PRODUCT ERROR]', error);
    return next(error);
  }
}

/* ================= ARTICLES ================= */
function articles(req, res) {
  const articles = getVisibleArticles();

  applySeo(res, {
    title: 'Artikel Fashion Pria & Rekomendasi Outfit',
    description: 'Tips outfit dan rekomendasi kaos pria terbaik untuk gaya kekinian.',
    keywords: 'artikel fashion pria, outfit pria, rekomendasi kaos',
    canonical: `${res.locals.baseUrl}/articles`
  });

  return res.render('articles', { articles });
}

/* ================= ARTICLE DETAIL ================= */
function articleDetail(req, res, next) {
  try {
    const article = getArticleBySlug(req.params.slug);
    if (!article) return next();

    const articles = getVisibleArticles()
      .filter(item => item.slug !== article.slug)
      .slice(0, 4);

    const products = getVisibleProducts().slice(0, 4);

    applySeo(res, {
      title: article.title,
      description: article.excerpt,
      keywords: `artikel fashion pria, ${article.title}`,
      canonical: `${res.locals.baseUrl}/article/${article.slug}`,
      image: article.image
    });

    return res.render('article-detail', {
      article,
      articles,
      products
    });
  } catch (error) {
    console.error('[ARTICLE ERROR]', error);
    return next(error);
  }
}

/* ================= CONTACT ================= */
function contact(req, res) {
  applySeo(res, {
    title: 'Kontak Kami',
    description: 'Hubungi kami untuk informasi lebih lanjut.',
    keywords: 'kontak',
    canonical: `${res.locals.baseUrl}/contact`
  });

  return res.render('contact');
}

/* ================= SEO LANDING ================= */
function seoKaosOversizePria(req, res, next) {
  try {
    const allProducts = getVisibleProducts();
    const articles = getVisibleArticles().slice(0, 4);

    const products = allProducts
      .filter(p => normalizeSearchText(p).includes('oversize'))
      .slice(0, 12);

    applySeo(res, {
      title: 'Rekomendasi Kaos Oversize Pria Terbaik',
      description: 'Temukan rekomendasi kaos oversize pria terbaik dengan bahan nyaman dan model kekinian.',
      keywords: 'kaos oversize pria, rekomendasi kaos oversize',
      canonical: `${res.locals.baseUrl}/kaos-oversize-pria`
    });

    return res.render('seo-kaos-oversize', {
      products,
      articles
    });
  } catch (error) {
    console.error('[SEO LANDING ERROR]', error);
    return next(error);
  }
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
