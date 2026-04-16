const { stripHtml } = require('./format');

function cleanString(val = '') {
  return String(val || '').trim();
}

function truncate(text = '', max = 160) {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '...';
}

function makeMeta(input = {}, settings = {}) {
  const defaults = settings?.seo || {};
  const storeName = settings?.storeName || process.env.APP_NAME || 'Store';

  const rawTitle = cleanString(input.title);
  const rawDescription = cleanString(input.description);
  const rawKeywords = cleanString(input.keywords);

  const metaTitle = rawTitle
    ? `${rawTitle} | ${storeName}`
    : (defaults.metaTitle || storeName);

  const metaDescription = truncate(
    stripHtml(rawDescription || defaults.metaDescription || storeName),
    155
  );

  const ogImage = cleanString(
    input.image ||
    defaults.ogImage ||
    `${process.env.BASE_URL || ''}/assets/images/og-image.jpg`
  );

  const canonicalUrl = cleanString(input.url || '');

  const keywords = rawKeywords || defaults.keywords || '';

  return {
    title: metaTitle,
    description: metaDescription,
    image: ogImage,
    url: canonicalUrl,
    keywords,
    robots: 'index,follow'
  };
}

/*
|--------------------------------------------------------------------------
| OPTIONAL: AUTO META UNTUK PRODUCT
|--------------------------------------------------------------------------
*/
function productMeta(product = {}, baseUrl = '', settings = {}) {
  if (!product) return makeMeta({}, settings);

  return makeMeta({
    title: product.seoTitle || product.name,
    description:
      product.seoDescription ||
      product.shortDescription ||
      product.short_description ||
      '',
    image:
      product.image ||
      (product.images && product.images[0]) ||
      '',
    url: `${baseUrl}/product/${product.slug}`,
    keywords: product.keywords || ''
  }, settings);
}

/*
|--------------------------------------------------------------------------
| OPTIONAL: AUTO META UNTUK ARTICLE
|--------------------------------------------------------------------------
*/
function articleMeta(article = {}, baseUrl = '', settings = {}) {
  if (!article) return makeMeta({}, settings);

  return makeMeta({
    title: article.seoTitle || article.title,
    description:
      article.seoDescription ||
      article.excerpt ||
      '',
    image:
      article.image ||
      article.thumbnail ||
      '',
    url: `${baseUrl}/article/${article.slug}`,
    keywords: article.keywords || ''
  }, settings);
}

module.exports = {
  makeMeta,
  productMeta,
  articleMeta
};