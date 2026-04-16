const { stripHtml } = require('./format');

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
  const storeName = settings?.storeName || process.env.APP_NAME || 'Store';

  const titleRaw = clean(input.title);
  const descRaw = clean(input.description);
  const keywordsRaw = clean(input.keywords);

  const title = titleRaw
    ? `${titleRaw} | ${storeName}`
    : storeName;

  const description = truncate(descRaw || storeName);

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
  const category = clean(product.category);
  const material = clean(product.material);
  const fit = clean(product.fit);

  const title = product.seoTitle ||
    `${name} - Kaos ${category} Pria Premium`;

  const description = product.seoDescription ||
    `${name} adalah kaos ${category} pria dengan bahan ${material || 'premium'} dan fit ${fit || 'nyaman'}. Cocok untuk outfit harian.`;

  const keywords = product.keywords ||
    `${name}, kaos ${category}, kaos pria, outfit pria`;

  return makeMeta({
    title,
    description,
    image: product.image || (product.images && product.images[0]),
    url: `${baseUrl}/product/${product.slug}`,
    keywords
  }, settings);
}

/* ================= ARTICLE META ================= */
function articleMeta(article = {}, baseUrl = '', settings = {}) {
  if (!article) return makeMeta({}, settings);

  const title = article.seoTitle || article.title;

  const description = article.seoDescription ||
    article.excerpt ||
    `Baca ${article.title} lengkap hanya di ${settings?.storeName || 'website kami'}.`;

  const keywords = article.keywords ||
    `${article.title}, artikel fashion pria, outfit pria`;

  return makeMeta({
    title,
    description,
    image: article.image || article.thumbnail,
    url: `${baseUrl}/article/${article.slug}`,
    keywords
  }, settings);
}

module.exports = {
  makeMeta,
  productMeta,
  articleMeta
};
