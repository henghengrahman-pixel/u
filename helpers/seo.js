const { stripHtml } = require('./format');

function clean(value = '') {
  return String(value || '').trim();
}

function normalizeBaseUrl(value = process.env.BASE_URL || '') {
  const raw = clean(value).replace(/\/+$/, '');
  if (!raw) return '';

  try {
    return new URL(raw).toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function absoluteUrl(value = '', baseUrl = process.env.BASE_URL || '') {
  const raw = clean(value);
  const base = normalizeBaseUrl(baseUrl);

  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!base) return raw.startsWith('/') ? raw : `/${raw}`;

  return `${base}/${raw.replace(/^\/+/, '')}`;
}

function truncate(text = '', max = 160) {
  const plain = clean(stripHtml(text)).replace(/\s+/g, ' ');
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).replace(/\s+\S*$/, '').trim()}...`;
}

function keywordsToString(value) {
  if (Array.isArray(value)) {
    return [...new Set(
      value
        .map((item) => clean(item).toLowerCase())
        .filter(Boolean)
    )].join(', ');
  }

  return clean(value);
}

function normalizeRobots(value = 'index,follow') {
  const robots = clean(value).toLowerCase();
  return robots || 'index,follow';
}

function siteName(settings = {}) {
  return clean(
    settings?.storeName ||
    process.env.STORE_NAME ||
    process.env.APP_NAME ||
    'MWG Oversize'
  );
}

function defaultDescription() {
  return 'Temukan rekomendasi kaos pria terbaik, oversize premium, dan pilihan fashion pria kekinian dengan bahan nyaman serta model yang mudah dipadukan.';
}

function makeMeta(input = {}, settings = {}) {
  const brand = siteName(settings);
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || '');
  const titleRaw = clean(input.title);
  const descriptionRaw = clean(input.description);
  const keywordsRaw = keywordsToString(input.keywords);
  const canonicalPath = clean(input.canonical || input.url || '/');
  const canonical = absoluteUrl(canonicalPath, baseUrl);
  const image = absoluteUrl(
    input.image ||
    settings?.seo?.ogImage ||
    '/assets/images/og-image.jpg',
    baseUrl
  );

  const title = titleRaw
    ? (titleRaw.toLowerCase().includes(brand.toLowerCase()) ? titleRaw : `${titleRaw} | ${brand}`)
    : `${brand} - Rekomendasi Kaos Pria Terbaik`;

  return {
    title,
    description: truncate(descriptionRaw || defaultDescription(), 160),
    keywords: keywordsRaw,
    image,
    canonical,
    url: canonical,
    robots: normalizeRobots(input.robots || 'index,follow')
  };
}

function productMeta(product = {}, baseUrl = '', settings = {}) {
  if (!product || typeof product !== 'object') {
    return makeMeta({}, settings);
  }

  const name = clean(product.name);
  const category = clean(product.category || 'pria');
  const material = clean(product.material || 'premium');
  const fit = clean(product.fit || 'nyaman');

  return makeMeta({
    title:
      clean(product.seoTitle) ||
      `${name} - Rekomendasi Kaos ${category} Terbaik`,
    description:
      clean(product.seoDescription) ||
      `${name} merupakan salah satu rekomendasi kaos ${category} terbaik dengan bahan ${material} dan fit ${fit}. Cocok untuk outfit pria kekinian dan nyaman dipakai sehari-hari.`,
    keywords:
      keywordsToString(product.keywords) ||
      keywordsToString([
        name,
        `kaos ${category}`,
        'kaos pria terbaik',
        'rekomendasi kaos pria',
        'kaos oversize pria',
        material,
        fit
      ]),
    image: product.image,
    canonical: `/product/${clean(product.slug)}`,
    robots: 'index,follow'
  }, settings);
}

function homeMeta(settings = {}) {
  return makeMeta({
    title: 'Rekomendasi Kaos Pria Terbaik, Oversize Premium & Fashion Kekinian',
    description: 'Temukan rekomendasi kaos pria terbaik, kaos oversize premium, dan pilihan fashion pria kekinian yang nyaman dipakai untuk daily outfit.',
    keywords: [
      'rekomendasi kaos pria',
      'kaos oversize pria',
      'kaos pria terbaik',
      'kaos distro pria',
      'fashion pria kekinian'
    ],
    canonical: '/'
  }, settings);
}

function shopMeta(settings = {}, options = {}) {
  const query = clean(options.query);
  const category = clean(options.category);
  const isFiltered = Boolean(query || category);

  const title = category
    ? `Rekomendasi Kaos ${category} Pria Terbaik`
    : query
      ? `Hasil Pencarian "${query}" - Rekomendasi Kaos Pria`
      : 'Shop Rekomendasi Kaos Pria Terbaik';

  const description = category
    ? `Kumpulan rekomendasi kaos ${category} pria terbaik dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk style harian.`
    : query
      ? `Hasil pencarian untuk "${query}" pada koleksi rekomendasi kaos pria terbaik.`
      : 'Jelajahi koleksi rekomendasi kaos pria terbaik, oversize premium, dan fashion pria kekinian yang sudah dikurasi.';

  return makeMeta({
    title,
    description,
    keywords: [
      'shop kaos pria',
      'rekomendasi kaos pria',
      'kaos oversize pria',
      'kaos pria terbaik',
      category,
      query
    ],
    canonical: '/shop',
    robots: isFiltered ? 'noindex,follow' : 'index,follow'
  }, settings);
}

function articleMeta(article = {}, settings = {}) {
  const title = clean(article.title);
  const description = clean(article.excerpt || article.summary || article.content);

  return makeMeta({
    title: title ? `${title} | Artikel Fashion Pria` : 'Artikel Fashion Pria',
    description,
    keywords: [
      'artikel fashion pria',
      'tips outfit pria',
      title,
      clean(article.category),
      clean(article.keywords)
    ],
    image: article.image,
    canonical: article.slug ? `/article/${clean(article.slug)}` : '/articles',
    robots: 'index,follow'
  }, settings);
}

function landingMeta(input = {}, settings = {}) {
  return makeMeta({
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    image: input.image,
    canonical: input.canonical || input.url || '/',
    robots: input.robots || 'index,follow'
  }, settings);
}

function organizationSchema(settings = {}) {
  const brand = siteName(settings);
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || '');

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand,
    url: baseUrl,
    logo: absoluteUrl(settings?.logo || '/assets/images/logo.png', baseUrl)
  };
}

function websiteSchema(settings = {}) {
  const brand = siteName(settings);
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || '');

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand,
    url: absoluteUrl('/', baseUrl),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/shop', baseUrl)}?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

function breadcrumbSchema(items = [], baseUrl = process.env.BASE_URL || '') {
  const normalizedItems = items
    .filter((item) => item && item.name && item.url)
    .map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: clean(item.name),
      item: absoluteUrl(item.url, baseUrl)
    }));

  if (!normalizedItems.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: normalizedItems
  };
}

module.exports = {
  clean,
  truncate,
  absoluteUrl,
  makeMeta,
  productMeta,
  homeMeta,
  shopMeta,
  articleMeta,
  landingMeta,
  organizationSchema,
  websiteSchema,
  breadcrumbSchema
};
