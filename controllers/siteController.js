const {
  getVisibleProducts,
  getProductBySlug,
  getVisibleArticles,
  getArticleBySlug
} = require('../helpers/store');

function safeText(value = '') {
  return String(value || '').trim();
}

function safeLower(value = '') {
  return safeText(value).toLowerCase();
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
      .flatMap((item) => String(item || '').split(','))
      .map((item) => safeLower(item))
      .filter(Boolean)
  )].join(', ');
}

function getBrand(res) {
  return safeText(
    res.locals.settings?.storeName ||
    process.env.STORE_NAME ||
    process.env.APP_NAME ||
    'MWG Oversize'
  );
}

function getLogo(res) {
  return absoluteUrl(
    res.locals.baseUrl,
    res.locals.settings?.logo || '/assets/images/logo.png'
  );
}

function getDefaultOgImage(res) {
  return absoluteUrl(
    res.locals.baseUrl,
    res.locals.settings?.seo?.ogImage ||
    '/assets/images/og-image.jpg'
  );
}

function getDefaultMetaDescription(res) {
  return truncate(
    res.locals.settings?.seo?.metaDescription ||
    'Temukan rekomendasi kaos pria terbaik dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk style harian.',
    160
  );
}

function getDefaultMetaKeywords(res) {
  return uniqueKeywords([
    res.locals.settings?.seo?.keywords,
    'rekomendasi kaos pria',
    'kaos oversize pria',
    'kaos pria terbaik'
  ]);
}

function setRobotsHeader(res, robotsValue = '') {
  const robots = safeLower(robotsValue);
  if (!robots) return;

  if (robots.startsWith('noindex')) {
    res.setHeader('X-Robots-Tag', robotsValue);
    return;
  }

  if (!safeText(res.req?.path).startsWith('/admin')) {
    res.removeHeader('X-Robots-Tag');
  }
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
    article.keywords,
    article.seoTitle,
    article.seoDescription
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function productCanonicalPath(product = {}) {
  return `/product/${safeText(product.slug)}`;
}

function articleCanonicalPath(article = {}) {
  return `/article/${safeText(article.slug)}`;
}

function applySeo(res, seo = {}) {
  const brand = getBrand(res);
  const baseUrl = safeText(res.locals.baseUrl);
  const currentUrl = safeText(res.locals.currentUrl || absoluteUrl(baseUrl, '/'));
  const canonical = absoluteUrl(baseUrl, seo.canonical || currentUrl);
  const image = absoluteUrl(baseUrl, seo.image || getDefaultOgImage(res));
  const robots = safeText(seo.robots || 'index,follow');

  res.locals.meta = {
    ...(res.locals.meta || {}),
    title: safeText(seo.title) || `${brand} - Rekomendasi Kaos Pria Terbaik`,
    description: truncate(seo.description || getDefaultMetaDescription(res), 160),
    keywords: safeText(seo.keywords) || getDefaultMetaKeywords(res),
    image,
    url: canonical,
    canonical,
    robots
  };

  setRobotsHeader(res, robots);
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

function buildOrganizationSchema(baseUrl, res) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: getBrand(res),
    url: absoluteUrl(baseUrl, '/'),
    logo: getLogo(res)
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

function buildSearchResultsPageSchema({ baseUrl, name, description, query }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: safeText(name),
    description: truncate(description, 160),
    url: `${absoluteUrl(baseUrl, '/shop')}?q=${encodeURIComponent(safeText(query))}`
  };
}

function buildItemListSchema(baseUrl, items = [], type = 'product') {
  const normalized = items
    .filter(Boolean)
    .map((item, index) => {
      const url = type === 'article'
        ? absoluteUrl(baseUrl, articleCanonicalPath(item))
        : absoluteUrl(baseUrl, productCanonicalPath(item));

      return {
        '@type': 'ListItem',
        position: index + 1,
        url,
        name: safeText(item.title || item.name || '')
      };
    })
    .filter((item) => item.url && item.name);

  if (!normalized.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: normalized
  };
}

function buildProductSchema(baseUrl, res, product = {}) {
  const name = safeText(product.name);
  const description = truncate(
    product.seoDescription ||
    product.shortDescription ||
    product.description ||
    `${name} merupakan rekomendasi kaos pria terbaik dengan material nyaman dan potongan modern.`,
    160
  );
  const productUrl = absoluteUrl(baseUrl, productCanonicalPath(product));
  const image = absoluteUrl(baseUrl, product.ogImage || product.image || getDefaultOgImage(res));
  const brand = safeText(product.brand || getBrand(res));
  const affiliateUrl = absoluteUrl(baseUrl, `/go/${safeText(product.slug)}`);
  const isSoldOut = safeLower(product.status) === 'sold_out';

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
      availability: isSoldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: affiliateUrl
    };
  } else if (safeText(product.affiliateLink)) {
    schema.offers = {
      '@type': 'Offer',
      availability: isSoldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: affiliateUrl,
      priceCurrency: safeText(product.currency || 'IDR')
    };
  }

  return schema;
}

function buildArticleSchema(baseUrl, res, article = {}) {
  const title = safeText(article.title);
  const image = absoluteUrl(baseUrl, article.ogImage || article.image || getDefaultOgImage(res));
  const canonical = absoluteUrl(baseUrl, articleCanonicalPath(article));
  const description = truncate(
    article.seoDescription ||
    article.excerpt ||
    article.summary ||
    article.content ||
    title,
    160
  );
  const publishedTime = safeText(
    article.publishedAt ||
    article.published_at ||
    article.createdAt ||
    article.created_at ||
    article.date
  );
  const modifiedTime = safeText(
    article.updatedAt ||
    article.updated_at ||
    article.modifiedAt ||
    article.modified_at ||
    article.publishedAt ||
    article.createdAt ||
    article.created_at ||
    article.date
  );
  const brand = getBrand(res);

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
        url: getLogo(res)
      }
    }
  };

  if (publishedTime) schema.datePublished = publishedTime;
  if (modifiedTime) schema.dateModified = modifiedTime;

  return schema;
}

function productCardData(product = {}) {
  const image = safeText(product.image || product.thumbnail || '/assets/images/og-image.jpg');
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

  return {
    ...product,
    image,
    images: images.length ? images : [image],
    brand: safeText(product.brand || 'MWG Oversize'),
    shortDescription: safeText(product.shortDescription || product.short_description || product.description),
    description: safeText(product.description || product.shortDescription || product.short_description),
    seoTitle: safeText(product.seoTitle || ''),
    seoDescription: safeText(product.seoDescription || ''),
    keywords: safeText(product.keywords || '')
  };
}

function articleCardData(article = {}) {
  return {
    ...article,
    image: safeText(article.image || article.thumbnail || '/assets/images/og-image.jpg'),
    excerpt: safeText(article.excerpt || article.summary || ''),
    seoTitle: safeText(article.seoTitle || ''),
    seoDescription: safeText(article.seoDescription || ''),
    keywords: safeText(article.keywords || '')
  };
}

/* ================= HOME ================= */
function home(req, res) {
  const baseUrl = res.locals.baseUrl;
  const brand = getBrand(res);
  const products = getVisibleProducts().map(productCardData);
  const featured = products.filter((item) => item.featured).slice(0, 8);
  const recommended = products.filter((item) => item.recommended).slice(0, 8);
  const latestArticles = getVisibleArticles().map(articleCardData).slice(0, 4);

  applySeo(res, {
    title: 'Rekomendasi Kaos Pria Terbaik, Oversize Premium & Fashion Kekinian',
    description: 'Temukan rekomendasi kaos pria terbaik, kaos oversize premium, dan pilihan fashion pria kekinian yang nyaman dipakai untuk daily outfit.',
    keywords: uniqueKeywords([
      res.locals.settings?.seo?.keywords,
      'rekomendasi kaos pria',
      'kaos oversize pria',
      'kaos pria terbaik',
      'kaos distro pria',
      'fashion pria kekinian',
      brand
    ]),
    canonical: '/',
    image: getDefaultOgImage(res)
  });

  setStructuredData(res, [
    buildWebsiteSchema(baseUrl, brand),
    buildOrganizationSchema(baseUrl, res),
    buildBreadcrumb(baseUrl, [
      { name: 'Home', url: '/' }
    ]),
    buildCollectionPageSchema({
      baseUrl,
      url: '/',
      name: 'Rekomendasi Kaos Pria Terbaik',
      description: 'Kumpulan rekomendasi kaos pria terbaik, oversize premium, dan fashion pria kekinian.'
    }),
    buildItemListSchema(baseUrl, recommended.length ? recommended : products.slice(0, 8), 'product')
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
  const rawQuery = safeText(q);
  const rawCategory = safeText(category);
  const query = safeLower(q);
  const categoryValue = safeLower(category);

  if (categoryValue) {
    products = products.filter((product) => safeLower(product.category) === categoryValue);
  }

  if (query) {
    products = products.filter((product) => normalizeSearchText(product).includes(query));
  }

  const isFiltered = Boolean(query || categoryValue);
  const pageTitle = categoryValue
    ? `Rekomendasi Kaos ${rawCategory} Pria Terbaik`
    : query
      ? `Hasil Pencarian "${rawQuery}" - Rekomendasi Kaos Pria`
      : 'Shop Rekomendasi Kaos Pria Terbaik';

  const pageDescription = categoryValue
    ? `Kumpulan rekomendasi kaos ${rawCategory} pria terbaik dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk style harian.`
    : query
      ? `Hasil pencarian untuk "${rawQuery}" pada koleksi rekomendasi kaos pria terbaik.`
      : 'Jelajahi koleksi rekomendasi kaos pria terbaik, oversize premium, dan fashion pria kekinian yang sudah dikurasi.';

  applySeo(res, {
    title: pageTitle,
    description: pageDescription,
    keywords: uniqueKeywords([
      'shop kaos pria',
      'rekomendasi kaos pria',
      rawCategory,
      rawQuery,
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
    query
      ? buildSearchResultsPageSchema({
          baseUrl,
          name: pageTitle,
          description: pageDescription,
          query: rawQuery
        })
      : buildCollectionPageSchema({
          baseUrl,
          url: '/shop',
          name: 'Shop Rekomendasi Kaos Pria',
          description: pageDescription
        }),
    buildItemListSchema(baseUrl, products.slice(0, 12), 'product')
  ]);

  return res.render('shop', {
    products,
    query: rawQuery,
    category: rawCategory
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
      .filter((item) => !product.category || safeLower(item.category) === safeLower(product.category))
      .slice(0, 4);

    const fallbackRecommended = recommended.length
      ? recommended
      : getVisibleProducts()
          .map(productCardData)
          .filter((item) => item.slug !== product.slug)
          .slice(0, 4);

    const name = safeText(product.name);
    const category = safeText(product.category || 'Pria');
    const material = safeText(product.material || 'premium');
    const fit = safeText(product.fit || 'nyaman');
    const description = truncate(
      product.seoDescription ||
      product.shortDescription ||
      product.description ||
      `${name} merupakan rekomendasi kaos ${category} terbaik dengan bahan ${material} dan fit ${fit}.`,
      160
    );

    applySeo(res, {
      title: safeText(product.seoTitle) || `${name} - Rekomendasi Kaos ${category} Terbaik`,
      description,
      keywords: uniqueKeywords([
        product.keywords,
        name,
        `kaos ${category}`,
        'rekomendasi kaos pria',
        'kaos pria terbaik',
        material,
        fit,
        safeText(product.brand)
      ]),
      canonical: productCanonicalPath(product),
      image: product.ogImage || product.image
    });

    setStructuredData(res, [
      buildBreadcrumb(baseUrl, [
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/shop' },
        { name, url: productCanonicalPath(product) }
      ]),
      buildProductSchema(baseUrl, res, product)
    ]);

    return res.render('product-detail', {
      product,
      recommended: fallbackRecommended
    });
  } catch (error) {
    console.error('[PRODUCT ERROR]', error);
    return next(error);
  }
}

/* ================= ARTICLES ================= */
function articles(req, res) {
  const baseUrl = res.locals.baseUrl;
  const items = getVisibleArticles().map(articleCardData);

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
    }),
    buildItemListSchema(baseUrl, items.slice(0, 12), 'article')
  ]);

  return res.render('articles', { articles: items });
}

/* ================= ARTICLE DETAIL ================= */
function articleDetail(req, res, next) {
  try {
    const baseUrl = res.locals.baseUrl;
    const article = articleCardData(getArticleBySlug(req.params.slug));

    if (!article || !article.slug) {
      return next();
    }

    const relatedArticles = getVisibleArticles()
      .map(articleCardData)
      .filter((item) => item.slug !== article.slug)
      .filter((item) => {
        if (safeText(article.category) && safeText(item.category)) {
          return safeLower(item.category) === safeLower(article.category);
        }

        return normalizeArticleText(item).includes(safeLower(article.title).split(' ')[0] || '');
      })
      .slice(0, 4);

    const fallbackArticles = relatedArticles.length
      ? relatedArticles
      : getVisibleArticles()
          .map(articleCardData)
          .filter((item) => item.slug !== article.slug)
          .slice(0, 4);

    const products = getVisibleProducts()
      .map(productCardData)
      .filter((item) => {
        const articleText = normalizeArticleText(article);
        return articleText.includes(safeLower(item.category)) || articleText.includes(safeLower(item.name));
      })
      .slice(0, 4);

    const fallbackProducts = products.length
      ? products
      : getVisibleProducts().map(productCardData).slice(0, 4);

    const title = safeText(article.title);
    const description = truncate(
      article.seoDescription ||
      article.excerpt ||
      article.summary ||
      article.content ||
      title,
      160
    );

    applySeo(res, {
      title: safeText(article.seoTitle) || `${title} | Artikel Fashion Pria`,
      description,
      keywords: uniqueKeywords([
        article.keywords,
        'artikel fashion pria',
        title,
        safeText(article.category),
        'tips outfit pria'
      ]),
      canonical: articleCanonicalPath(article),
      image: article.ogImage || article.image
    });

    setStructuredData(res, [
      buildBreadcrumb(baseUrl, [
        { name: 'Home', url: '/' },
        { name: 'Artikel', url: '/articles' },
        { name: title, url: articleCanonicalPath(article) }
      ]),
      buildArticleSchema(baseUrl, res, article)
    ]);

    return res.render('article-detail', {
      article,
      articles: fallbackArticles,
      products: fallbackProducts
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
    title: `Kontak | ${getBrand(res)}`,
    description: `Hubungi ${getBrand(res)} untuk pertanyaan, kerja sama, atau informasi lebih lanjut seputar rekomendasi kaos pria terbaik.`,
    keywords: uniqueKeywords([
      `kontak ${getBrand(res)}`,
      'hubungi kami',
      'rekomendasi kaos pria'
    ]),
    canonical: '/contact'
  });

  setStructuredData(res, [
    buildBreadcrumb(baseUrl, [
      { name: 'Home', url: '/' },
      { name: 'Kontak', url: '/contact' }
    ]),
    buildOrganizationSchema(baseUrl, res)
  ]);

  return res.render('contact');
}

/* ================= SEO LANDING ================= */
function seoKaosOversizePria(req, res, next) {
  try {
    const baseUrl = res.locals.baseUrl;
    const allProducts = getVisibleProducts().map(productCardData);
    const matchedArticles = getVisibleArticles()
      .map(articleCardData)
      .filter((article) => normalizeArticleText(article).includes('oversize'))
      .slice(0, 4);

    const products = allProducts
      .filter((product) => normalizeSearchText(product).includes('oversize'))
      .slice(0, 12);

    const articles = matchedArticles.length
      ? matchedArticles
      : getVisibleArticles().map(articleCardData).slice(0, 4);

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
      }),
      buildItemListSchema(baseUrl, products, 'product')
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
