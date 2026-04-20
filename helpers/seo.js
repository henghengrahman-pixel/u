const { stripHtml } = require('./format');

function clean(value = '') {
  return String(value || '').trim();
}

function normalizeBaseUrl(value = '') {
  const raw = clean(value).replace(/\/+$/, '');
  if (!raw) return '';

  try {
    return new URL(raw).toString().replace(/\/+$/, '');
  } catch (_) {
    return '';
  }
}

function normalizePath(value = '/') {
  const raw = clean(value);
  if (!raw) return '/';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function absoluteUrl(value = '', baseUrl = '') {
  const raw = clean(value);
  const base = normalizeBaseUrl(baseUrl);

  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!base) return normalizePath(raw);

  return `${base}${normalizePath(raw)}`;
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

  return clean(value).toLowerCase();
}

function normalizeRobots(value = 'index,follow') {
  const robots = clean(value).toLowerCase().replace(/\s+/g, '');
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
  return 'Temukan rekomendasi kaos pria terbaik, kaos oversize premium, dan pilihan fashion pria kekinian yang nyaman dipakai untuk outfit harian pria Indonesia.';
}

function resolveBaseUrl(settings = {}) {
  return normalizeBaseUrl(
    settings?.baseUrl ||
    process.env.BASE_URL ||
    ''
  );
}

function appendBrand(title = '', brand = '') {
  const safeTitle = clean(title);
  const safeBrand = clean(brand);

  if (!safeTitle) return safeBrand;
  if (!safeBrand) return safeTitle;
  if (safeTitle.toLowerCase().includes(safeBrand.toLowerCase())) return safeTitle;

  return `${safeTitle} | ${safeBrand}`;
}

function resolveCanonical(input = {}, settings = {}) {
  const baseUrl = resolveBaseUrl(settings);
  const canonicalValue = clean(input.canonical || input.url || '/');

  if (!canonicalValue) return absoluteUrl('/', baseUrl);
  return absoluteUrl(canonicalValue, baseUrl);
}

function resolveImage(input = {}, settings = {}) {
  const baseUrl = resolveBaseUrl(settings);

  return absoluteUrl(
    input.image ||
    settings?.seo?.ogImage ||
    '/assets/images/og-image.jpg',
    baseUrl
  );
}

function makeMeta(input = {}, settings = {}) {
  const brand = siteName(settings);
  const titleRaw = clean(input.title);
  const descriptionRaw = clean(input.description);
  const keywordsRaw = keywordsToString(input.keywords);
  const canonical = resolveCanonical(input, settings);
  const image = resolveImage(input, settings);

  const title = titleRaw
    ? appendBrand(titleRaw, brand)
    : appendBrand('Rekomendasi Kaos Pria Terbaik', brand);

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

/* ================= PRODUCT META ================= */
function productMeta(product = {}, settings = {}) {
  if (!product || typeof product !== 'object') {
    return makeMeta({}, settings);
  }

  const name = clean(product.name);
  const category = clean(product.category || 'pria');
  const material = clean(product.material || 'premium');
  const fit = clean(product.fit || 'nyaman');
  const slug = clean(product.slug);

  return makeMeta({
    title:
      clean(product.seoTitle) ||
      `${name} - Kaos ${category} untuk Pria Indonesia`,
    description:
      clean(product.seoDescription) ||
      `${name} adalah rekomendasi kaos ${category} dengan bahan ${material} dan fit ${fit} yang nyaman dipakai untuk outfit harian pria Indonesia.`,
    keywords:
      keywordsToString(product.keywords) ||
      keywordsToString([
        name,
        `kaos ${category}`,
        'kaos pria terbaik',
        'rekomendasi kaos pria',
        'kaos oversize pria',
        'kaos pria indonesia',
        material,
        fit
      ]),
    image: product.image,
    canonical: slug ? `/product/${slug}` : '/shop',
    robots: 'index,follow'
  }, settings);
}

/* ================= HOME ================= */
function homeMeta(settings = {}) {
  return makeMeta({
    title: 'Rekomendasi Kaos Pria Terbaik, Oversize Premium & Fashion Kekinian',
    description: 'Temukan rekomendasi kaos pria terbaik, kaos oversize premium, dan pilihan fashion pria kekinian yang nyaman dipakai untuk daily outfit pria Indonesia.',
    keywords: [
      'rekomendasi kaos pria',
      'kaos oversize pria',
      'kaos pria terbaik',
      'kaos distro pria',
      'fashion pria indonesia',
      'kaos pria indonesia'
    ],
    canonical: '/',
    robots: 'index,follow'
  }, settings);
}

/* ================= SHOP ================= */
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
    ? `Kumpulan rekomendasi kaos ${category} pria terbaik dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk outfit harian pria Indonesia.`
    : query
      ? `Hasil pencarian untuk "${query}" pada koleksi rekomendasi kaos pria terbaik dan kaos oversize pria.`
      : 'Jelajahi koleksi rekomendasi kaos pria terbaik, oversize premium, dan fashion pria kekinian yang sudah dikurasi untuk pembeli pria Indonesia.';

  return makeMeta({
    title,
    description,
    keywords: [
      'shop kaos pria',
      'rekomendasi kaos pria',
      'kaos oversize pria',
      'kaos pria terbaik',
      'kaos pria indonesia',
      category,
      query
    ],
    canonical: '/shop',
    robots: isFiltered ? 'noindex,follow' : 'index,follow'
  }, settings);
}

/* ================= ARTICLE ================= */
function articleMeta(article = {}, settings = {}) {
  const title = clean(article.title);
  const description = clean(article.excerpt || article.summary || article.content);
  const slug = clean(article.slug);

  return makeMeta({
    title: title ? `${title} - Artikel Fashion Pria` : 'Artikel Fashion Pria',
    description: description || 'Baca artikel fashion pria, tips outfit, dan panduan memilih kaos pria yang lebih tepat untuk kebutuhan harian.',
    keywords: [
      'artikel fashion pria',
      'tips outfit pria',
      'kaos pria',
      'kaos oversize pria',
      'fashion pria indonesia',
      title,
      clean(article.category),
      clean(article.keywords)
    ],
    image: article.image,
    canonical: slug ? `/article/${slug}` : '/articles',
    robots: 'index,follow'
  }, settings);
}

/* ================= SCHEMA ================= */
function organizationSchema(settings = {}) {
  const brand = siteName(settings);
  const baseUrl = resolveBaseUrl(settings);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand,
    url: absoluteUrl('/', baseUrl),
    logo: absoluteUrl(settings?.logo || '/assets/images/logo.png', baseUrl)
  };
}

function websiteSchema(settings = {}) {
  const brand = siteName(settings);
  const baseUrl = resolveBaseUrl(settings);

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

function breadcrumbSchema(items = [], settings = {}) {
  const baseUrl = resolveBaseUrl(settings);

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
  organizationSchema,
  websiteSchema,
  breadcrumbSchema
};
