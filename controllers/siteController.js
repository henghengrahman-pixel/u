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

  res.locals.seo = {
    ...res.locals.seo,
    title: seo.title || res.locals.seo?.title || '',
    description: seo.description || res.locals.seo?.description || '',
    keywords: seo.keywords || res.locals.seo?.keywords || '',
    image: seo.image || `${base}/assets/images/og-image.jpg`,
    canonical: seo.canonical || `${base}/`,
    type: seo.type || 'website',
    robots: seo.robots || 'index,follow'
  };
}

/* ================= HOME ================= */
function home(req, res) {
  const products = getVisibleProducts();
  const featured = products.filter(p => p.featured).slice(0, 8);
  const recommended = products.filter(p => p.recommended).slice(0, 8);
  const articles = getVisibleArticles().slice(0, 4);

  applySeo(res, {
    title: `Kaos Oversize Pria & Distro Premium Terbaru - ${res.locals.appName}`,
    description: 'Jual kaos oversize pria, kaos distro premium, dan outfit pria kekinian.',
    keywords: 'kaos oversize pria, kaos distro pria, outfit pria',
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
    ? `Kaos ${cat} Pria Terbaru`
    : query
      ? `Hasil Pencarian ${safeText(q)}`
      : 'Shop Kaos Oversize & Distro Pria';

  const desc = cat
    ? `Temukan kaos ${cat} pria terbaik dengan bahan nyaman.`
    : query
      ? `Hasil pencarian ${safeText(q)}.`
      : 'Jelajahi koleksi kaos oversize pria terbaik.';

  applySeo(res, {
    title: `${title} - ${res.locals.appName}`,
    description: desc,
    keywords: `${cat}, ${safeText(q)}, kaos pria`,
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

    const title = `${name} - Kaos ${category} Premium`;
    const desc = `${name} adalah kaos ${category} dengan bahan ${material} dan fit ${fit}.`;

    applySeo(res, {
      title,
      description: desc,
      keywords: `${name}, kaos ${category}, kaos pria`,
      canonical: `${res.locals.baseUrl}/product/${product.slug}`,
      type: 'product',
      image: product.image || `${res.locals.baseUrl}/assets/images/og-image.jpg`
    });

    res.locals.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      image: product.image || '',
      description: desc,
      brand: {
        '@type': 'Brand',
        name: safeText(product.brand || res.locals.appName)
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'IDR',
        price: String(product.price || 0),
        availability: product.status === 'sold_out'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock'
      }
    };

    return res.render('product-detail', {
      product,
      recommended
    });
  } catch (error) {
    console.error('[PRODUCT DETAIL ERROR]', error);
    return next(error);
  }
}

/* ================= ARTICLES ================= */
function articles(req, res) {
  const articles = getVisibleArticles();

  applySeo(res, {
    title: `Artikel Fashion Pria - ${res.locals.appName}`,
    description: 'Tips outfit dan rekomendasi kaos oversize pria.',
    keywords: 'artikel fashion pria, outfit pria',
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
      title: `${safeText(article.title)} - ${res.locals.appName}`,
      description: article.description || article.excerpt || '',
      keywords: article.keywords || '',
      canonical: `${res.locals.baseUrl}/article/${article.slug}`,
      type: 'article',
      image: article.image || `${res.locals.baseUrl}/assets/images/og-image.jpg`
    });

    res.locals.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title || '',
      image: article.image || '',
      author: {
        '@type': 'Organization',
        name: res.locals.appName
      },
      publisher: {
        '@type': 'Organization',
        name: res.locals.appName,
        logo: {
          '@type': 'ImageObject',
          url: res.locals.site?.logo || `${res.locals.baseUrl}/assets/images/logo.png`
        }
      }
    };

    return res.render('article-detail', {
      article,
      articles,
      products
    });
  } catch (error) {
    console.error('[ARTICLE DETAIL ERROR]', error);
    return next(error);
  }
}

/* ================= CONTACT ================= */
function contact(req, res) {
  applySeo(res, {
    title: `Kontak ${res.locals.appName}`,
    description: 'Hubungi kami.',
    keywords: 'kontak',
    canonical: `${res.locals.baseUrl}/contact`
  });

  return res.render('contact');
}

/* ================= LANDING SEO ================= */
function seoKaosOversizePria(req, res, next) {
  try {
    const allProducts = getVisibleProducts();
    const articles = getVisibleArticles().slice(0, 4);

    const products = allProducts
      .filter(p => normalizeSearchText(p).includes('oversize'))
      .slice(0, 12);

    applySeo(res, {
      title: `Kaos Oversize Pria Terbaik 2026 - ${res.locals.appName}`,
      description: 'Rekomendasi kaos oversize pria terbaik dengan bahan nyaman dan model kekinian.',
      keywords: 'kaos oversize pria, kaos oversize terbaik, outfit pria',
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
