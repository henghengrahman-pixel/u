const { stripHtml } = require('./format');

/* ================= BASIC ================= */
function clean(v = '') {
  return String(v || '').trim();
}

function truncate(text = '', max = 155) {
  text = clean(stripHtml(text));
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '...';
}

function absoluteUrl(url = '') {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = (process.env.BASE_URL || '').replace(/\/+$/, '');
  return base + '/' + url.replace(/^\/+/, '');
}

/* ================= CORE META ================= */
function makeMeta(input = {}, settings = {}) {
  const storeName =
    settings?.storeName ||
    process.env.APP_NAME ||
    'MWG Oversize';

  const titleRaw = clean(input.title);
  const descRaw = clean(input.description);
  const keywordsRaw = clean(input.keywords);

  // 🔥 FIX TITLE (ANTI MY ONLINE STORE)
  const title = titleRaw
    ? `${titleRaw} | ${storeName}`
    : `${storeName} - Rekomendasi Kaos Pria Terbaik`;

  // 🔥 FIX DESCRIPTION SEO
  const description = truncate(
    descRaw ||
    'Temukan rekomendasi kaos pria terbaik, oversize dan distro premium pilihan dengan bahan nyaman dan model kekinian.'
  );

  const image = absoluteUrl(
    input.image ||
    settings?.seo?.ogImage ||
    '/assets/images/og-image.jpg'
  );

  const url = absoluteUrl(input.url || '');

  return {
    title,
    description,
    keywords: keywordsRaw,
    image,
    canonical: url,
    url,
    robots: 'index,follow'
  };
}

/* ================= PRODUCT META ================= */
function productMeta(product = {}, baseUrl = '', settings = {}) {
  if (!product) return makeMeta({}, settings);

  const name = clean(product.name);
  const category = clean(product.category || 'pria');
  const material = clean(product.material || 'premium');
  const fit = clean(product.fit || 'nyaman');

  // 🔥 SEO TITLE (REKOMENDASI STYLE)
  const title =
    product.seoTitle ||
    `${name} - Rekomendasi Kaos ${category} Terbaik`;

  // 🔥 SEO DESCRIPTION (NARIK + JUALAN HALUS)
  const description =
    product.seoDescription ||
    `${name} merupakan salah satu rekomendasi kaos ${category} terbaik dengan bahan ${material} dan fit ${fit}. Cocok untuk outfit pria kekinian dan nyaman dipakai sehari-hari.`;

  const keywords =
    product.keywords ||
    `${name}, kaos ${category}, kaos pria terbaik, rekomendasi kaos pria, kaos oversize pria`;

  return makeMeta({
    title,
    description,
    keywords,
    image: product.image,
    url: `/product/${product.slug}`
  }, settings);
}

/* ================= HOME META ================= */
function homeMeta(settings = {}) {
  return makeMeta({
    title: 'Rekomendasi Kaos Pria Terbaik & Oversize Premium',
    description:
      'Temukan rekomendasi kaos pria terbaik mulai dari oversize hingga distro premium pilihan dengan bahan nyaman dan desain kekinian.',
    keywords:
      'rekomendasi kaos pria, kaos oversize pria, kaos pria terbaik, kaos distro pria'
  }, settings);
}

/* ================= SHOP META ================= */
function shopMeta(settings = {}) {
  return makeMeta({
    title: 'Pilihan Kaos Pria Terbaik Hari Ini',
    description:
      'Kumpulan rekomendasi kaos pria terbaik yang sudah kami kurasi berdasarkan kualitas bahan, model, dan kenyamanan.',
    keywords:
      'kaos pria terbaik, rekomendasi kaos pria, kaos distro pria, kaos oversize'
  }, settings);
}

/* ================= ARTICLE META ================= */
function articleMeta(article = {}, settings = {}) {
  return makeMeta({
    title: article.title,
    description: article.excerpt,
    keywords: `artikel fashion pria, ${article.title}, outfit pria`
  }, settings);
}

/* ================= SEO LANDING ================= */
function landingMeta({ title, description, keywords }, settings = {}) {
  return makeMeta({
    title,
    description,
    keywords
  }, settings);
}

/* ================= SCHEMA ================= */
function organizationSchema(settings = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings?.storeName || 'MWG Oversize',
    url: process.env.BASE_URL || '',
    logo: settings?.logo || ''
  };
}

module.exports = {
  makeMeta,
  productMeta,
  homeMeta,
  shopMeta,
  articleMeta,
  landingMeta,
  organizationSchema
};
