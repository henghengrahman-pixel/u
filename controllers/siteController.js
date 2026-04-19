const {
  getVisibleProducts,
  getProductBySlug,
  getVisibleArticles,
  getArticleBySlug
} = require('../helpers/store');

function safeText(value = '') {
  return String(value || '').trim();
}

function absoluteUrl(baseUrl = '', value = '') {
  const base = safeText(baseUrl).replace(/\/+$/, '');
  const raw = safeText(value);

  if (!raw) return base || '';
  if (/^https?:\/\//i.test(raw)) return raw;

  return `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

function stripHtml(value = '') {
  return safeText(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(value = '', max = 160) {
  const text = stripHtml(value);
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3)).trim()}...`;
}

function uniqueKeywords(items = []) {
  return [...new Set(
    items
      .map((item) => safeText(item).toLowerCase())
      .filter(Boolean)
  )].join(', ');
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
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function normalizeArticleText(article = {}) {
  return [
    article.title,
    article.excerpt,
    article.content,
    article.category,
    article.keywords
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function applySeo(res, seo = {}) {
  const brand = safeText(res.locals.settings?.storeName || process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize');
  const baseUrl = safeText(res.locals.baseUrl);
  const currentUrl = safeText(res.locals.currentUrl || absoluteUrl(baseUrl, '/'));
  const canonical = absoluteUrl(baseUrl, seo.canonical || currentUrl);
  const image = absoluteUrl(baseUrl, seo.image || '/assets/images/og-image.jpg');

  res.locals.meta = {
    ...(res.locals.meta || {}),
    title: safeText(seo.title) || `${brand} - Rekomendasi Kaos Pria Terbaik`,
    description: truncate(seo.description || 'Temukan rekomendasi kaos pria terbaik dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk style harian.', 160),
    keywords: safeText(seo.keywords) || 'rekomendasi kaos pria, kaos oversize pria, kaos pria terbaik',
    image,
    url: canonical,
    canonical,
    robots: safeText(seo.robots || 'index,follow')
  };
}

function setStructuredData(res, items = []) {
  const filtered = items.filter(Boolean);
  res.locals.structuredData = filtered.length <= 1 ? (filtered[0] || null) : filtered;
}

function buildBreadcrumb(baseUrl, items = []) {
  const list = items
    .filter((item) => item && item.name && item.url)
    .map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: safeText(item.name),
      item: absoluteUrl(baseUrl, item.url)
    }));

  if (!list.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list
  };
}

function buildWebsiteSchema(baseUrl, brand) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: safeText(brand),
    url: absoluteUrl(baseUrl, '/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl(baseUrl, '/shop')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

function buildOrganizationSchema(baseUrl, brand) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: safeText(brand),
    url: absoluteUrl(baseUrl, '/'),
    logo: absoluteUrl(baseUrl, '/assets/images/logo.png')
  };
}

function buildCollectionPageSchema({ baseUrl, url, name, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: safeText(name),
    description: truncate(description, 160),
    url: absoluteUrl(baseUrl, url)
  };
}

function buildProductSchema(baseUrl, product = {}) {
  const name = safeText(product.name);
  const description = truncate(
    product.shortDescription || product.description || `${name} merupakan rekomendasi kaos pria terbaik dengan material nyaman dan potongan modern.`,
    160
  );
  const productUrl = absoluteUrl(baseUrl, `/product/${safeText(product.slug)}`);
  const image = absoluteUrl(baseUrl, product.image || '/assets/images/og-image.jpg');
  const brand = safeText(product.brand || process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize');
  const affiliateUrl = absoluteUrl(baseUrl, `/go/${safeText(product.slug)}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: image ? [image] : [],
    description,
    sku: safeText(product.sku || product.slug || name),
    category: safeText(product.category || 'Kaos Pria'),
    brand: {
      '@type': 'Brand',
      name: brand
    },
    url: productUrl
  };

  if (safeText(product.price)) {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: safeText(product.currency || 'IDR'),
      price: String(product.price).replace(/[^\d.,]/g, ''),
      availability: 'https://schema.org/InStock',
      url: affiliateUrl
    };
  } else if (safeText(product.affiliateLink)) {
    schema.offers = {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      url: affiliateUrl,
      priceCurrency: safeText(product.currency || 'IDR')
    };
  }

  return schema;
}

function buildArticleSchema(baseUrl, article = {}) {
  const title = safeText(article.title);
  const image = absoluteUrl(baseUrl, article.image || '/assets/images/og-image.jpg');
  const canonical = absoluteUrl(baseUrl, `/article/${safeText(article.slug)}`);
  const description = truncate(article.excerpt || article.summary || article.content || title, 160);
  const publishedTime = safeText(article.publishedAt || article.createdAt || article.date);
  const modifiedTime = safeText(article.updatedAt || article.modifiedAt || article.publishedAt || article.createdAt || article.date);
  const brand = safeText(process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : [],
    mainEntityOfPage: canonical,
    author: {
      '@type': 'Organization',
      name: brand
    },
    publisher: {
      '@type': 'Organization',
      name: brand,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(baseUrl, '/assets/images/logo.png')
      }
    }
  };

  if (publishedTime) schema.datePublished = publishedTime;
  if (modifiedTime) schema.dateModified = modifiedTime;

  return schema;
}

function productCardData(product = {}) {
  return {
    ...product,
    image: product.image || '/assets/images/og-image.jpg',
    brand: safeText(product.brand || 'MWG Oversize'),
    shortDescription: safeText(product.shortDescription || product.description),
    description: safeText(product.description || product.shortDescription)
  };
}

/* ================= HOME ================= */
function home(req, res) {
  const baseUrl = res.locals.baseUrl;
  const brand = safeText(res.locals.settings?.storeName || process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize');
  const products = getVisibleProducts().map(productCardData);
  const featured = products.filter((item) => item.featured).slice(0, 8);
  const recommended = products.filter((item) => item.recommended).slice(0, 8);
  const latestArticles = getVisibleArticles().slice(0, 4);

  applySeo(res, {
    title: 'Rekomendasi Kaos Pria Terbaik, Oversize Premium & Fashion Kekinian',
    description: 'Temukan rekomendasi kaos pria terbaik, kaos oversize premium, dan pilihan fashion pria kekinian yang nyaman dipakai untuk daily outfit.',
    keywords: uniqueKeywords([
      'rekomendasi kaos pria',
      'kaos oversize pria',
      'kaos pria terbaik',
      'kaos distro pria',
      'fashion pria kekinian',
      brand
    ]),
    canonical: '/'
  });

  setStructuredData(res, [
    buildWebsiteSchema(baseUrl, brand),
    buildOrganizationSchema(baseUrl, brand),
    buildBreadcrumb(baseUrl, [
      { name: 'Home', url: '/' }
    ]),
    buildCollectionPageSchema({
      baseUrl,
      url: '/',
      name: 'Rekomendasi Kaos Pria Terbaik',
      description: 'Kumpulan rekomendasi kaos pria terbaik, oversize premium, dan fashion pria kekinian.'
    })
  ]);

  return res.render('home', {
    products,
    featured,
    recommended,
    articles: latestArticles
  });
}

/* ================= SHOP ================= */
function shop(req, res) {
  const { q = '', category = '' } = req.query;
  const baseUrl = res.locals.baseUrl;

  let products = getVisibleProducts().map(productCardData);
  const query = safeText(q).toLowerCase();
  const categoryValue = safeText(category).toLowerCase();

  if (categoryValue) {
    products = products.filter((product) => safeText(product.category).toLowerCase() === categoryValue);
  }

  if (query) {
    products = products.filter((product) => normalizeSearchText(product).includes(query));
  }

  const isFiltered = Boolean(query || categoryValue);
  const pageTitle = categoryValue
    ? `Rekomendasi Kaos ${safeText(category)} Pria Terbaik`
    : query
      ? `Hasil Pencarian "${safeText(q)}" - Rekomendasi Kaos Pria`
      : 'Shop Rekomendasi Kaos Pria Terbaik';

  const pageDescription = categoryValue
    ? `Kumpulan rekomendasi kaos ${safeText(category)} pria terbaik dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk style harian.`
    : query
      ? `Hasil pencarian untuk "${safeText(q)}" pada koleksi rekomendasi kaos pria terbaik.`
      : 'Jelajahi koleksi rekomendasi kaos pria terbaik, oversize premium, dan fashion pria kekinian yang sudah dikurasi.';

  applySeo(res, {
    title: pageTitle,
    description: pageDescription,
    keywords: uniqueKeywords([
      'shop kaos pria',
      'rekomendasi kaos pria',
      safeText(category),
      safeText(q),
      'kaos oversize pria',
      'kaos pria terbaik'
    ]),
    canonical: '/shop',
    robots: isFiltered ? 'noindex,follow' : 'index,follow'
  });

  setStructuredData(res, [
    buildBreadcrumb(baseUrl, [
      { name: 'Home', url: '/' },
      { name: 'Shop', url: '/shop' }
    ]),
    buildCollectionPageSchema({
      baseUrl,
      url: '/shop',
      name: 'Shop Rekomendasi Kaos Pria',
      description: pageDescription
    })
  ]);

  return res.render('shop', {
    products,
    query: safeText(q),
    category: safeText(category)
  });
}

/* ================= PRODUCT DETAIL ================= */
function productDetail(req, res, next) {
  try {
    const baseUrl = res.locals.baseUrl;
    const product = productCardData(getProductBySlug(req.params.slug));

    if (!product || !product.slug) {
      return next();
    }

    const recommended = getVisibleProducts()
      .map(productCardData)
      .filter((item) => item.slug !== product.slug)
      .slice(0, 4);

    const name = safeText(product.name);
    const category = safeText(product.category || 'Pria');
    const material = safeText(product.material || 'premium');
    const fit = safeText(product.fit || 'nyaman');
    const description = truncate(
      product.shortDescription ||
      product.description ||
      `${name} merupakan rekomendasi kaos ${category} terbaik dengan bahan ${material} dan fit ${fit}.`,
      160
    );

    applySeo(res, {
      title: `${name} - Rekomendasi Kaos ${category} Terbaik`,
      description,
      keywords: uniqueKeywords([
        name,
        `kaos ${category}`,
        'rekomendasi kaos pria',
        'kaos pria terbaik',
        material,
        fit,
        safeText(product.brand)
      ]),
      canonical: `/product/${product.slug}`,
      image: product.image
    });

    setStructuredData(res, [
      buildBreadcrumb(baseUrl, [
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/shop' },
        { name, url: `/product/${product.slug}` }
      ]),
      buildProductSchema(baseUrl, product)
    ]);

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
  const baseUrl = res.locals.baseUrl;
  const items = getVisibleArticles();

  applySeo(res, {
    title: 'Artikel Fashion Pria, Tips Outfit & Rekomendasi Kaos Terbaik',
    description: 'Baca artikel fashion pria, tips outfit, dan rekomendasi kaos terbaik untuk membantu memilih style yang pas dan nyaman dipakai.',
    keywords: uniqueKeywords([
      'artikel fashion pria',
      'tips outfit pria',
      'rekomendasi kaos pria',
      'kaos oversize pria',
      'fashion pria'
    ]),
    canonical: '/articles'
  });

  setStructuredData(res, [
    buildBreadcrumb(baseUrl, [
      { name: 'Home', url: '/' },
      { name: 'Artikel', url: '/articles' }
    ]),
    buildCollectionPageSchema({
      baseUrl,
      url: '/articles',
      name: 'Artikel Fashion Pria',
      description: 'Kumpulan artikel fashion pria, tips outfit, dan rekomendasi kaos terbaik.'
    })
  ]);

  return res.render('articles', { articles: items });
}

/* ================= ARTICLE DETAIL ================= */
function articleDetail(req, res, next) {
  try {
    const baseUrl = res.locals.baseUrl;
    const article = getArticleBySlug(req.params.slug);

    if (!article || !article.slug) {
      return next();
    }

    const relatedArticles = getVisibleArticles()
      .filter((item) => item.slug !== article.slug)
      .slice(0, 4);

    const products = getVisibleProducts()
      .map(productCardData)
      .slice(0, 4);

    const title = safeText(article.title);
    const description = truncate(article.excerpt || article.summary || article.content || title, 160);

    applySeo(res, {
      title: `${title} | Artikel Fashion Pria`,
      description,
      keywords: uniqueKeywords([
        'artikel fashion pria',
        title,
        safeText(article.category),
        safeText(article.keywords),
        'tips outfit pria'
      ]),
      canonical: `/article/${article.slug}`,
      image: article.image
    });

    setStructuredData(res, [
      buildBreadcrumb(baseUrl, [
        { name: 'Home', url: '/' },
        { name: 'Artikel', url: '/articles' },
        { name: title, url: `/article/${article.slug}` }
      ]),
      buildArticleSchema(baseUrl, article)
    ]);

    return res.render('article-detail', {
      article,
      articles: relatedArticles,
      products
    });
  } catch (error) {
    console.error('[ARTICLE ERROR]', error);
    return next(error);
  }
}

/* ================= CONTACT ================= */
function contact(req, res) {
  const baseUrl = res.locals.baseUrl;

  applySeo(res, {
    title: 'Kontak | MWG Oversize',
    description: 'Hubungi MWG Oversize untuk pertanyaan, kerja sama, atau informasi lebih lanjut seputar rekomendasi kaos pria terbaik.',
    keywords: uniqueKeywords([
      'kontak mwg oversize',
      'hubungi kami',
      'rekomendasi kaos pria'
    ]),
    canonical: '/contact'
  });

  setStructuredData(res, [
    buildBreadcrumb(baseUrl, [
      { name: 'Home', url: '/' },
      { name: 'Kontak', url: '/contact' }
    ])
  ]);

  return res.render('contact');
}

/* ================= SEO LANDING ================= */
function seoKaosOversizePria(req, res, next) {
  try {
    const baseUrl = res.locals.baseUrl;
    const allProducts = getVisibleProducts().map(productCardData);
    const articles = getVisibleArticles().filter((article) => normalizeArticleText(article).includes('oversize')).slice(0, 4);

    const products = allProducts
      .filter((product) => normalizeSearchText(product).includes('oversize'))
      .slice(0, 12);

    applySeo(res, {
      title: 'Kaos Oversize Pria Terbaik: Rekomendasi, Tips Pilih & Model Kekinian',
      description: 'Temukan rekomendasi kaos oversize pria terbaik dengan bahan nyaman, cutting modern, dan pilihan model kekinian untuk outfit harian.',
      keywords: uniqueKeywords([
        'kaos oversize pria',
        'rekomendasi kaos oversize pria',
        'kaos pria terbaik',
        'oversize premium pria',
        'kaos distro oversize'
      ]),
      canonical: '/kaos-oversize-pria'
    });

    setStructuredData(res, [
      buildBreadcrumb(baseUrl, [
        { name: 'Home', url: '/' },
        { name: 'Kaos Oversize Pria', url: '/kaos-oversize-pria' }
      ]),
      buildCollectionPageSchema({
        baseUrl,
        url: '/kaos-oversize-pria',
        name: 'Rekomendasi Kaos Oversize Pria Terbaik',
        description: 'Landing page rekomendasi kaos oversize pria terbaik, model kekinian, dan bahan nyaman.'
      })
    ]);

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
