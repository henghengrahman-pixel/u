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
    product.short_description,
    product.description,
    product.material,
    product.fit,
    product.keywords
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function buildMetaPayload(res, payload = {}) {
  const appName = res.locals.appName || 'Ozerra';
  const baseUrl = res.locals.baseUrl || '';
  const title = safeText(payload.title) || appName;
  const description =
    safeText(payload.description) ||
    'Temukan koleksi fashion pilihan dengan informasi lengkap dan tampilan yang nyaman untuk dijelajahi.';
  const image = safeText(payload.image) || `${baseUrl}/assets/images/og-image.jpg`;
  const url = safeText(payload.url) || baseUrl;
  const keywords = safeText(payload.keywords);

  return makeMeta(
    {
      title,
      description,
      image,
      url,
      keywords
    },
    res.locals.settings
  );
}

function applySeoLocals(res, seo = {}) {
  const appName = res.locals.appName || 'Ozerra';
  const baseUrl = res.locals.baseUrl || '';

  res.locals.seo = {
    ...res.locals.seo,
    title: safeText(seo.title) || `${appName} - Koleksi Fashion Pilihan`,
    description:
      safeText(seo.description) ||
      'Temukan koleksi fashion pilihan dengan informasi lengkap dan tampilan yang nyaman untuk dijelajahi.',
    keywords:
      safeText(seo.keywords) ||
      'kaos oversize, kaos pria, fashion pria, rekomendasi kaos, outfit harian',
    image: safeText(seo.image) || `${baseUrl}/assets/images/og-image.jpg`,
    canonical: safeText(seo.canonical) || baseUrl,
    type: safeText(seo.type) || 'website',
    robots: safeText(seo.robots) || 'index,follow'
  };
}

function home(req, res) {
  const products = getVisibleProducts();
  const featured = products.filter(item => item.featured).slice(0, 8);
  const recommended = products.filter(item => item.recommended).slice(0, 8);
  const latestArticles = getVisibleArticles().slice(0, 3);

  const pageTitle = `Koleksi Fashion Pilihan - ${res.locals.appName}`;
  const pageDescription =
    'Temukan koleksi fashion pilihan dengan tampilan rapi, informasi lengkap, dan referensi produk yang nyaman untuk kebutuhan harian.';

  res.locals.meta = buildMetaPayload(res, {
    title: pageTitle,
    description: pageDescription,
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    url: `${res.locals.baseUrl}/`,
    keywords: 'kaos oversize, kaos pria, fashion pria, rekomendasi kaos, outfit harian'
  });

  applySeoLocals(res, {
    title: pageTitle,
    description: pageDescription,
    keywords: 'kaos oversize, kaos pria, fashion pria, rekomendasi kaos, outfit harian',
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    canonical: `${res.locals.baseUrl}/`,
    type: 'website'
  });

  return res.render('home', {
    featured,
    recommended,
    products,
    articles: latestArticles
  });
}

function shop(req, res) {
  const { q = '', category = '' } = req.query;

  let products = getVisibleProducts();
  const query = safeText(q).toLowerCase();
  const selectedCategory = safeText(category);

  if (selectedCategory) {
    products = products.filter(item =>
      safeText(item.category).toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  if (query) {
    products = products.filter(item => normalizeSearchText(item).includes(query));
  }

  const titleParts = ['Shop'];
  if (selectedCategory) titleParts.push(selectedCategory);
  if (query) titleParts.push(`"${safeText(q)}"`);

  const pageTitle = `${titleParts.join(' ')} - ${res.locals.appName}`;
  const pageDescription =
    query || selectedCategory
      ? `Jelajahi koleksi fashion pilihan untuk pencarian ${safeText(q || selectedCategory)} dengan informasi produk yang lebih lengkap.`
      : 'Jelajahi koleksi fashion pilihan dengan informasi produk lengkap dan tampilan yang nyaman untuk dijelajahi.';

  const canonicalUrl = `${res.locals.baseUrl}/shop`;

  res.locals.meta = buildMetaPayload(res, {
    title: pageTitle,
    description: pageDescription,
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    url: canonicalUrl,
    keywords:
      selectedCategory || query
        ? `${safeText(selectedCategory)}, ${safeText(q)}, kaos pria, fashion pria`
        : 'shop kaos pria, shop fashion pria, koleksi kaos oversize, rekomendasi kaos'
  });

  applySeoLocals(res, {
    title: pageTitle,
    description: pageDescription,
    keywords:
      selectedCategory || query
        ? `${safeText(selectedCategory)}, ${safeText(q)}, kaos pria, fashion pria`
        : 'shop kaos pria, shop fashion pria, koleksi kaos oversize, rekomendasi kaos',
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    canonical: canonicalUrl,
    type: 'website'
  });

  return res.render('shop', {
    products,
    query: q,
    category
  });
}

function productDetail(req, res, next) {
  const product = getProductBySlug(req.params.slug);
  if (!product) return next();

  const recommended = getVisibleProducts()
    .filter(item =>
      item.slug !== product.slug &&
      (item.recommended || safeText(item.category) === safeText(product.category))
    )
    .slice(0, 4);

  res.locals.meta = productMeta(product, res.locals.baseUrl, res.locals.settings);

  applySeoLocals(res, {
    title: res.locals.meta.title,
    description: res.locals.meta.description,
    keywords:
      safeText(product.keywords) ||
      `${safeText(product.name)}, ${safeText(product.category)}, kaos pria, fashion pria`,
    image:
      safeText(product.image) ||
      (Array.isArray(product.images) && product.images.length ? safeText(product.images[0]) : '') ||
      `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    canonical: `${res.locals.baseUrl}/product/${product.slug}`,
    type: 'product'
  });

  return res.render('product-detail', {
    product,
    recommended
  });
}

function articles(req, res) {
  const articles = getVisibleArticles();

  const pageTitle = `Artikel & Inspirasi - ${res.locals.appName}`;
  const pageDescription =
    'Baca artikel, inspirasi outfit, dan panduan memilih produk dengan informasi yang rapi dan mudah dipahami.';

  res.locals.meta = buildMetaPayload(res, {
    title: pageTitle,
    description: pageDescription,
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    url: `${res.locals.baseUrl}/articles`,
    keywords: 'artikel fashion pria, inspirasi outfit, panduan kaos oversize, rekomendasi kaos'
  });

  applySeoLocals(res, {
    title: pageTitle,
    description: pageDescription,
    keywords: 'artikel fashion pria, inspirasi outfit, panduan kaos oversize, rekomendasi kaos',
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    canonical: `${res.locals.baseUrl}/articles`,
    type: 'website'
  });

  return res.render('articles', { articles });
}

function articleDetail(req, res, next) {
  const article = getArticleBySlug(req.params.slug);
  if (!article) return next();

  res.locals.meta = articleMeta(article, res.locals.baseUrl, res.locals.settings);

  applySeoLocals(res, {
    title: res.locals.meta.title,
    description: res.locals.meta.description,
    keywords:
      safeText(article.keywords) ||
      `${safeText(article.title)}, artikel fashion, rekomendasi kaos`,
    image:
      safeText(article.image) ||
      safeText(article.thumbnail) ||
      `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    canonical: `${res.locals.baseUrl}/article/${article.slug}`,
    type: 'article'
  });

  return res.render('article-detail', { article });
}

function contact(req, res) {
  const pageTitle = `Contact - ${res.locals.appName}`;
  const pageDescription =
    'Hubungi kami untuk pertanyaan, informasi produk, dan kebutuhan lainnya.';

  res.locals.meta = buildMetaPayload(res, {
    title: pageTitle,
    description: pageDescription,
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    url: `${res.locals.baseUrl}/contact`,
    keywords: 'contact toko fashion, hubungi toko, layanan pelanggan'
  });

  applySeoLocals(res, {
    title: pageTitle,
    description: pageDescription,
    keywords: 'contact toko fashion, hubungi toko, layanan pelanggan',
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    canonical: `${res.locals.baseUrl}/contact`,
    type: 'website',
    robots: 'index,follow'
  });

  return res.render('contact');
}

function seoKaosOversizePria(req, res) {
  const allProducts = getVisibleProducts();

  const oversizeProducts = allProducts
    .filter(item => {
      const haystack = normalizeSearchText(item);
      return haystack.includes('oversize') || safeText(item.fit).toLowerCase() === 'oversize';
    })
    .slice(0, 12);

  const articles = getVisibleArticles().slice(0, 3);

  const pageTitle = 'Kaos Oversize Pria - Rekomendasi Model Nyaman dan Stylish';
  const pageDescription =
    'Temukan rekomendasi kaos oversize pria dengan tampilan clean, bahan nyaman, dan pilihan model yang cocok untuk kebutuhan harian serta gaya casual modern.';
  const canonicalUrl = `${res.locals.baseUrl}/kaos-oversize-pria`;

  res.locals.meta = buildMetaPayload(res, {
    title: pageTitle,
    description: pageDescription,
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    url: canonicalUrl,
    keywords: 'kaos oversize pria, rekomendasi kaos oversize pria, kaos oversize pria terbaik, kaos oversize pria premium'
  });

  applySeoLocals(res, {
    title: pageTitle,
    description: pageDescription,
    keywords: 'kaos oversize pria, rekomendasi kaos oversize pria, kaos oversize pria terbaik, kaos oversize pria premium',
    image: `${res.locals.baseUrl}/assets/images/og-image.jpg`,
    canonical: canonicalUrl,
    type: 'website'
  });

  return res.render('seo-kaos-oversize', {
    products: oversizeProducts,
    articles
  });
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
