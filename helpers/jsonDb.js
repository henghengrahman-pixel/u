const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./constants');
const { slugify } = require('./slug');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJsonAtomic(filePath, data) {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJsonAtomic(filePath, fallback);
      return clone(fallback);
    }

    const raw = fs.readFileSync(filePath, 'utf8');

    if (!raw.trim()) {
      writeJsonAtomic(filePath, fallback);
      return clone(fallback);
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(`[JSON READ ERROR] ${filePath}`, error);
    return clone(fallback);
  }
}

function getFilePath(fileName) {
  return path.join(DATA_DIR, fileName);
}

function nowIso() {
  return new Date().toISOString();
}

function cleanString(value = '') {
  return String(value || '').trim();
}

function cleanNumber(value = 0) {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = String(value).replace(/[^\d.,-]/g, '').replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function cleanBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
}

function cleanHtml(value = '') {
  return cleanString(value);
}

function normalizeImageArray(value, fallbackImage = '') {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => cleanString(item)).filter(Boolean))];
  }

  if (typeof value === 'string') {
    return [...new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => cleanString(item))
        .filter(Boolean)
    )];
  }

  return fallbackImage ? [cleanString(fallbackImage)].filter(Boolean) : [];
}

function appName() {
  return cleanString(process.env.STORE_NAME || process.env.APP_NAME || 'MWG Oversize');
}

function defaultSettings() {
  const brand = appName();

  return {
    storeName: brand,
    logo: cleanString(process.env.SITE_LOGO || '/assets/images/logo.png'),
    whatsapp: cleanString(process.env.SITE_WHATSAPP || '+6280000000000'),
    phone: cleanString(process.env.SITE_PHONE || '+62 800 0000 0000'),
    email: cleanString(process.env.SITE_EMAIL || 'hello@mwgoversize.com'),
    address: cleanString(process.env.SITE_ADDRESS || 'Indonesia'),
    seo: {
      metaTitle: cleanString(process.env.DEFAULT_SEO_TITLE || 'MWG Oversize - Rekomendasi Kaos Pria Terbaik'),
      metaDescription: cleanString(
        process.env.DEFAULT_SEO_DESCRIPTION ||
        'Temukan rekomendasi kaos pria terbaik, kaos oversize premium, dan fashion pria kekinian dengan bahan nyaman serta model yang cocok untuk daily outfit.'
      ),
      ogImage: cleanString(process.env.DEFAULT_OG_IMAGE || '/assets/images/og-image.jpg'),
      keywords: cleanString(
        process.env.DEFAULT_SEO_KEYWORDS ||
        'rekomendasi kaos pria, kaos oversize pria, kaos pria terbaik, kaos distro pria, fashion pria kekinian'
      )
    }
  };
}

function defaultCategories() {
  return [
    { id: 'cat-oversize', name: 'Oversize', slug: 'oversize', visible: true },
    { id: 'cat-basic', name: 'Basic', slug: 'basic', visible: true },
    { id: 'cat-casual', name: 'Casual', slug: 'casual', visible: true }
  ];
}

function defaultProducts() {
  const now = nowIso();
  const brand = appName();

  return [
    {
      id: 'prd-001',
      name: 'Kaos Oversize Pria Premium Hitam',
      slug: 'kaos-oversize-pria-premium-hitam',
      category: 'Oversize',
      brand,
      status: 'ready',
      price: 129000,
      compareAtPrice: 159000,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'
      ],
      shortDescription: 'Kaos oversize pria dengan bahan adem, potongan modern, dan nyaman dipakai untuk aktivitas harian.',
      short_description: 'Kaos oversize pria dengan bahan adem, potongan modern, dan nyaman dipakai untuk aktivitas harian.',
      description: '<p>Kaos oversize pria dengan tampilan clean, bahan nyaman, dan cocok untuk outfit harian.</p>',
      details: '<ul><li>Bahan nyaman</li><li>Potongan modern</li><li>Cocok untuk daily wear</li></ul>',
      material: 'Cotton Combed 24s',
      fit: 'Oversize',
      affiliateLink: 'https://shopee.co.id/',
      featured: true,
      recommended: true,
      visible: true,
      created_at: now,
      updated_at: now,
      seoTitle: 'Kaos Oversize Pria Premium Hitam',
      seoDescription: 'Rekomendasi kaos oversize pria premium hitam dengan bahan nyaman, potongan modern, dan cocok untuk outfit harian pria.',
      keywords: 'kaos oversize pria premium hitam, kaos oversize pria, rekomendasi kaos pria'
    },
    {
      id: 'prd-002',
      name: 'Kaos Basic Pria Putih Clean Look',
      slug: 'kaos-basic-pria-putih-clean-look',
      category: 'Basic',
      brand,
      status: 'ready',
      price: 99000,
      compareAtPrice: 0,
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'
      ],
      shortDescription: 'Kaos basic pria dengan tampilan simpel, clean, dan mudah dipadukan untuk gaya harian.',
      short_description: 'Kaos basic pria dengan tampilan simpel, clean, dan mudah dipadukan untuk gaya harian.',
      description: '<p>Kaos basic pria untuk kebutuhan harian dengan gaya clean dan nyaman dipakai.</p>',
      details: '<ul><li>Tampilan clean</li><li>Nyaman untuk harian</li><li>Mudah dipadukan</li></ul>',
      material: 'Cotton Combed 30s',
      fit: 'Regular',
      affiliateLink: 'https://shopee.co.id/',
      featured: true,
      recommended: true,
      visible: true,
      created_at: now,
      updated_at: now,
      seoTitle: 'Kaos Basic Pria Putih Clean Look',
      seoDescription: 'Rekomendasi kaos basic pria putih dengan tampilan clean, bahan nyaman, dan cocok untuk daily outfit.',
      keywords: 'kaos basic pria putih, kaos pria basic, rekomendasi kaos pria'
    },
    {
      id: 'prd-003',
      name: 'Kaos Casual Pria Abu Modern',
      slug: 'kaos-casual-pria-abu-modern',
      category: 'Casual',
      brand,
      status: 'sold_out',
      price: 119000,
      compareAtPrice: 139000,
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'
      ],
      shortDescription: 'Kaos casual pria abu dengan look modern dan nyaman untuk gaya santai harian.',
      short_description: 'Kaos casual pria abu dengan look modern dan nyaman untuk gaya santai harian.',
      description: '<p>Produk contoh dengan status sold out.</p>',
      details: '<ul><li>Status sold out</li></ul>',
      material: 'Cotton Soft',
      fit: 'Regular',
      affiliateLink: 'https://shopee.co.id/',
      featured: false,
      recommended: false,
      visible: true,
      created_at: now,
      updated_at: now,
      seoTitle: 'Kaos Casual Pria Abu Modern',
      seoDescription: 'Kaos casual pria abu modern dengan bahan nyaman dan desain simpel untuk daily style.',
      keywords: 'kaos casual pria abu, kaos pria modern, kaos casual pria'
    }
  ];
}

function defaultArticles() {
  const now = nowIso();

  return [
    {
      id: 'art-001',
      title: 'Rekomendasi Kaos Oversize Pria untuk Harian',
      slug: 'rekomendasi-kaos-oversize-pria-untuk-harian',
      excerpt: 'Panduan memilih kaos oversize pria yang nyaman, rapi, dan cocok untuk kebutuhan harian.',
      content: '<p>Artikel panduan memilih kaos oversize pria untuk kebutuhan harian, style kasual, dan kenyamanan maksimal.</p>',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80',
      visible: true,
      created_at: now,
      updated_at: now,
      seoTitle: 'Rekomendasi Kaos Oversize Pria untuk Harian',
      seoDescription: 'Panduan memilih kaos oversize pria yang nyaman, rapi, dan cocok untuk outfit harian.',
      keywords: 'rekomendasi kaos oversize pria, kaos oversize pria, tips pilih kaos pria'
    }
  ];
}

function defaultOrders() {
  return [];
}

const defaults = {
  'settings.json': defaultSettings,
  'categories.json': defaultCategories,
  'products.json': defaultProducts,
  'articles.json': defaultArticles,
  'orders.json': defaultOrders
};

function ensureDataFiles() {
  ensureDir(DATA_DIR);

  Object.entries(defaults).forEach(([fileName, factory]) => {
    const filePath = getFilePath(fileName);

    if (!fs.existsSync(filePath)) {
      writeJsonAtomic(filePath, factory());
    }
  });
}

function getCollection(fileName) {
  ensureDataFiles();
  const factory = defaults[fileName];
  return readJson(getFilePath(fileName), factory ? factory() : []);
}

function saveCollection(fileName, data) {
  writeJsonAtomic(getFilePath(fileName), data);
  return data;
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeProduct(payload = {}, existing = null) {
  const now = nowIso();
  const name = cleanString(payload.name || existing?.name || '');
  const rawSlug = payload.slug || name || existing?.slug || uid('product');
  const slug = slugify(rawSlug);

  const fallbackImage =
    cleanString(payload.image) ||
    cleanString(payload.thumbnail) ||
    cleanString(existing?.image) ||
    cleanString(existing?.thumbnail);

  const images = normalizeImageArray(
    payload.images !== undefined ? payload.images : existing?.images,
    fallbackImage
  );

  const image =
    cleanString(payload.image) ||
    cleanString(payload.thumbnail) ||
    images[0] ||
    cleanString(existing?.image) ||
    cleanString(existing?.thumbnail);

  const shortDescription = cleanString(
    payload.shortDescription !== undefined
      ? payload.shortDescription
      : (payload.short_description !== undefined
        ? payload.short_description
        : existing?.shortDescription || existing?.short_description)
  );

  return {
    id: existing?.id || payload.id || uid('prd'),
    name,
    slug,
    category: cleanString(payload.category || existing?.category || ''),
    brand: cleanString(payload.brand || existing?.brand || appName()),
    status: cleanString(payload.status || existing?.status || 'ready') === 'sold_out' ? 'sold_out' : 'ready',

    price: cleanNumber(
      payload.price !== undefined
        ? payload.price
        : (payload.price_idr !== undefined ? payload.price_idr : existing?.price)
    ),

    compareAtPrice: cleanNumber(
      payload.compareAtPrice !== undefined
        ? payload.compareAtPrice
        : (payload.compare_price_idr !== undefined ? payload.compare_price_idr : existing?.compareAtPrice)
    ),

    image,
    thumbnail: image,
    images: images.length ? images : (image ? [image] : []),

    shortDescription,
    short_description: shortDescription,

    description: cleanHtml(payload.description || existing?.description || ''),
    details: cleanHtml(payload.details || existing?.details || ''),
    material: cleanString(payload.material || existing?.material || ''),
    fit: cleanString(payload.fit || existing?.fit || ''),
    affiliateLink: cleanString(
      payload.affiliateLink ||
      payload.affiliate_link ||
      existing?.affiliateLink ||
      existing?.affiliate_link ||
      'https://shopee.co.id/'
    ),

    featured: cleanBoolean(payload.featured, existing?.featured ?? false),
    recommended: cleanBoolean(payload.recommended, existing?.recommended ?? false),
    visible: payload.visible === undefined
      ? (existing?.visible ?? true)
      : cleanBoolean(payload.visible, existing?.visible ?? true),

    created_at: existing?.created_at || now,
    updated_at: now,

    seoTitle: cleanString(payload.seoTitle || existing?.seoTitle || ''),
    seoDescription: cleanString(payload.seoDescription || existing?.seoDescription || ''),
    keywords: cleanString(payload.keywords || existing?.keywords || '')
  };
}

function normalizeArticle(payload = {}, existing = null) {
  const now = nowIso();
  const title = cleanString(payload.title || existing?.title || '');

  return {
    id: existing?.id || payload.id || uid('art'),
    title,
    slug: slugify(payload.slug || title || existing?.slug || uid('article')),
    excerpt: cleanString(payload.excerpt || existing?.excerpt || ''),
    content: cleanHtml(payload.content || existing?.content || ''),
    image: cleanString(payload.image || payload.thumbnail || existing?.image || existing?.thumbnail || ''),
    thumbnail: cleanString(payload.thumbnail || payload.image || existing?.thumbnail || existing?.image || ''),
    visible: payload.visible === undefined
      ? (existing?.visible ?? true)
      : cleanBoolean(payload.visible, existing?.visible ?? true),
    created_at: existing?.created_at || now,
    updated_at: now,
    seoTitle: cleanString(payload.seoTitle || existing?.seoTitle || ''),
    seoDescription: cleanString(payload.seoDescription || existing?.seoDescription || ''),
    keywords: cleanString(payload.keywords || existing?.keywords || '')
  };
}

module.exports = {
  ensureDataFiles,
  getCollection,
  saveCollection,
  uid,
  nowIso,
  normalizeProduct,
  normalizeArticle,
  defaultSettings
};
