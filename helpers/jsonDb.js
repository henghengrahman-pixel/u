const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./constants');
const { slugify } = require('./slug');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
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
      return structuredClone(fallback);
    }

    const raw = fs.readFileSync(filePath, 'utf8');

    if (!raw.trim()) {
      writeJsonAtomic(filePath, fallback);
      return structuredClone(fallback);
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read JSON: ${filePath}`, error);
    return structuredClone(fallback);
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
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function cleanBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'on' || value === 'true' || value === 1 || value === '1';
}

function normalizeImageArray(value, fallbackImage = '') {
  if (Array.isArray(value)) {
    return value.map(item => cleanString(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map(item => cleanString(item))
      .filter(Boolean);
  }

  return fallbackImage ? [cleanString(fallbackImage)].filter(Boolean) : [];
}

function defaultSettings() {
  return {
    storeName: process.env.APP_NAME || 'Ozerra',
    logo: process.env.SITE_LOGO || 'https://dummyimage.com/180x50/ffffff/111111&text=OZERRA',
    whatsapp: process.env.SITE_WHATSAPP || '+6280000000000',
    phone: process.env.SITE_PHONE || '+62 800 0000 0000',
    email: process.env.SITE_EMAIL || 'hello@example.com',
    address: process.env.SITE_ADDRESS || 'Indonesia',
    seo: {
      metaTitle: process.env.DEFAULT_SEO_TITLE || 'Ozerra - Koleksi Fashion Pilihan',
      metaDescription:
        process.env.DEFAULT_SEO_DESCRIPTION ||
        'Temukan koleksi fashion pilihan dengan informasi lengkap dan tampilan yang nyaman untuk dijelajahi.',
      ogImage:
        process.env.DEFAULT_OG_IMAGE ||
        'https://dummyimage.com/1200x630/f5f5f5/333333&text=Ozerra',
      keywords:
        process.env.DEFAULT_SEO_KEYWORDS ||
        'kaos oversize, kaos pria, fashion pria, rekomendasi kaos, outfit harian'
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

  return [
    {
      id: 'prd-001',
      name: 'Kaos Oversize Pria Premium Hitam',
      slug: 'kaos-oversize-pria-premium-hitam',
      category: 'Oversize',
      brand: process.env.APP_NAME || 'Ozerra',
      status: 'ready',
      price: 129000,
      compareAtPrice: 159000,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'
      ],
      shortDescription: 'Kaos oversize pria dengan bahan adem dan nyaman untuk dipakai harian.',
      description: '<p>Kaos oversize pria dengan tampilan clean, bahan nyaman, dan cocok untuk outfit harian.</p>',
      details: '<ul><li>Bahan nyaman</li><li>Potongan modern</li><li>Cocok untuk daily wear</li></ul>',
      material: 'Cotton Combed 24s',
      fit: 'Oversize',
      affiliateLink: 'https://shopee.co.id/',
      featured: true,
      recommended: true,
      visible: true,
      created_at: now,
      updated_at: now
    },
    {
      id: 'prd-002',
      name: 'Kaos Basic Pria Putih Clean Look',
      slug: 'kaos-basic-pria-putih-clean-look',
      category: 'Basic',
      brand: process.env.APP_NAME || 'Ozerra',
      status: 'ready',
      price: 99000,
      compareAtPrice: 0,
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'
      ],
      shortDescription: 'Kaos basic pria dengan tampilan simpel, bersih, dan mudah dipadukan.',
      description: '<p>Kaos basic pria untuk kebutuhan harian dengan gaya clean dan nyaman dipakai.</p>',
      details: '<ul><li>Tampilan clean</li><li>Nyaman untuk harian</li><li>Mudah dipadukan</li></ul>',
      material: 'Cotton Combed 30s',
      fit: 'Regular',
      affiliateLink: 'https://shopee.co.id/',
      featured: true,
      recommended: true,
      visible: true,
      created_at: now,
      updated_at: now
    },
    {
      id: 'prd-003',
      name: 'Kaos Casual Pria Abu Modern',
      slug: 'kaos-casual-pria-abu-modern',
      category: 'Casual',
      brand: process.env.APP_NAME || 'Ozerra',
      status: 'sold_out',
      price: 119000,
      compareAtPrice: 139000,
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      images: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'
      ],
      shortDescription: 'Contoh produk sold out untuk menjaga tampilan card tetap normal.',
      description: '<p>Produk contoh dengan status sold out.</p>',
      details: '<ul><li>Status sold out</li></ul>',
      material: 'Cotton Soft',
      fit: 'Regular',
      affiliateLink: 'https://shopee.co.id/',
      featured: false,
      recommended: false,
      visible: true,
      created_at: now,
      updated_at: now
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
      content: '<p>Artikel contoh untuk membangun trust, SEO, dan membantu customer memahami pilihan produk dengan lebih baik.</p>',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80',
      visible: true,
      created_at: now,
      updated_at: now
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

  return {
    id: existing?.id || payload.id || uid('prd'),
    name,
    slug,
    category: cleanString(payload.category || existing?.category || ''),
    brand: cleanString(payload.brand || existing?.brand || process.env.APP_NAME || 'Ozerra'),
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

    shortDescription: cleanString(
      payload.shortDescription !== undefined
        ? payload.shortDescription
        : (payload.short_description !== undefined ? payload.short_description : existing?.shortDescription || existing?.short_description)
    ),

    short_description: cleanString(
      payload.short_description !== undefined
        ? payload.short_description
        : (payload.shortDescription !== undefined ? payload.shortDescription : existing?.short_description || existing?.shortDescription)
    ),

    description: cleanString(payload.description || existing?.description || ''),
    details: cleanString(payload.details || existing?.details || ''),
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
    content: cleanString(payload.content || existing?.content || ''),
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