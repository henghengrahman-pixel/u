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

function absoluteUrl(value = '', baseUrl = '') {
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

  const baseUrl =
    normalizeBaseUrl(settings?.baseUrl) ||
    normalizeBaseUrl(process.env.BASE_URL || '');

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

/* ================= PRODUCT SCHEMA ================= */
function productSchema(product = {}, baseUrl = '') {
  if (!product || !product.name) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image],
    description: stripHtml(product.description || product.shortDescription || ''),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'MWG Oversize'
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: product.price,
      availability: product.status === 'sold_out'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      url: absoluteUrl(`/product/${product.slug}`, baseUrl)
    }
  };
}

module.exports = {
  clean,
  truncate,
  absoluteUrl,
  makeMeta,
  productSchema
};
