const { ORDER_STATUSES = ['pending', 'paid', 'processed', 'completed', 'cancelled'] } = require('../helpers/constants');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getOrders,
  updateOrderStatus,
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleById,
  getSettings,
  saveSettings
} = require('../helpers/store');
const { setFlash } = require('../middleware');

/* ================= HELPERS ================= */
function cleanString(value = '') {
  return String(value || '').trim();
}

function cleanRichText(value = '') {
  return String(value || '').trim();
}

function cleanNumber(value = 0) {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = String(value).replace(/[^\d.,-]/g, '').replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function normalizeCheckbox(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === 'on' || value === 'true' || value === true || value === 1 || value === '1';
}

function normalizeMultilineUrls(value = '') {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => cleanString(item))
    .filter(Boolean);
}

function normalizeKeywords(value = '') {
  return String(value || '')
    .split(',')
    .map((item) => cleanString(item))
    .filter(Boolean)
    .join(', ');
}

function buildProductSeoTitle(name, category) {
  return `${name} - Rekomendasi Kaos ${category} Terbaik`;
}

function buildProductSeoDescription(name, category, material, fit) {
  const safeMaterial = cleanString(material || 'bahan nyaman');
  const safeFit = cleanString(fit || 'fit terbaik');
  return `${name} merupakan rekomendasi kaos ${category} terbaik dengan ${safeMaterial} dan model ${safeFit} yang cocok untuk outfit pria harian.`;
}

function buildProductKeywords(name, category, material, fit) {
  return normalizeKeywords([
    name,
    `kaos ${category}`,
    'rekomendasi kaos pria',
    'kaos pria terbaik',
    material,
    fit
  ].filter(Boolean).join(', '));
}

function buildArticleKeywords(title) {
  return normalizeKeywords(`artikel fashion pria, tips outfit pria, rekomendasi kaos pria, ${title}`);
}

function adminUsername() {
  return cleanString(process.env.ADMIN_USERNAME || process.env.ADMIN_ID);
}

function adminPassword() {
  return cleanString(process.env.ADMIN_PASSWORD);
}

function safeRedirectBack(req, fallback) {
  const referer = cleanString(req.get('referer'));
  if (!referer) return fallback;

  try {
    const refererUrl = new URL(referer);
    const host = cleanString(req.get('host'));
    if (refererUrl.host === host) {
      return `${refererUrl.pathname}${refererUrl.search}`;
    }
  } catch (_) {
    return fallback;
  }

  return fallback;
}

function normalizeProductPayload(body = {}, existing = null) {
  const name = cleanString(body.name || existing?.name);
  const category = cleanString(body.category || existing?.category);
  const material = cleanString(body.material || existing?.material);
  const fit = cleanString(body.fit || existing?.fit);
  const affiliateLink = cleanString(body.affiliateLink || body.affiliate_link || existing?.affiliateLink || existing?.affiliate_link);
  const image = cleanString(body.image || body.thumbnail || existing?.image || existing?.thumbnail);
  const images = normalizeMultilineUrls(body.images !== undefined ? body.images : existing?.images);
  const shortDescription = cleanString(body.shortDescription || body.short_description || existing?.shortDescription || existing?.short_description);
  const description = cleanRichText(body.description || existing?.description);
  const details = cleanRichText(body.details || existing?.details);
  const seoTitle = cleanString(body.seoTitle || existing?.seoTitle || buildProductSeoTitle(name, category || 'Pria'));
  const seoDescription = cleanString(
    body.seoDescription ||
    existing?.seoDescription ||
    buildProductSeoDescription(name, category || 'Pria', material, fit)
  );
  const keywords = normalizeKeywords(
    body.keywords ||
    existing?.keywords ||
    buildProductKeywords(name, category || 'Pria', material, fit)
  );

  return {
    ...body,
    name,
    category,
    material,
    fit,
    affiliateLink,
    affiliate_link: affiliateLink,
    image,
    thumbnail: image,
    images,
    shortDescription,
    short_description: shortDescription,
    description,
    details,
    seoTitle,
    seoDescription,
    keywords,
    visible: normalizeCheckbox(body.visible, existing?.visible ?? true),
    featured: normalizeCheckbox(body.featured, existing?.featured ?? false),
    recommended: normalizeCheckbox(body.recommended, existing?.recommended ?? false),
    price: cleanNumber(body.price !== undefined ? body.price : existing?.price),
    compareAtPrice: cleanNumber(body.compareAtPrice !== undefined ? body.compareAtPrice : existing?.compareAtPrice),
    status: cleanString(body.status || existing?.status || 'ready') === 'sold_out' ? 'sold_out' : 'ready'
  };
}

function normalizeArticlePayload(body = {}, existing = null) {
  const title = cleanString(body.title || existing?.title);
  const excerpt = cleanString(body.excerpt || existing?.excerpt);
  const content = cleanRichText(body.content || existing?.content);
  const image = cleanString(body.image || body.thumbnail || existing?.image || existing?.thumbnail);
  const seoTitle = cleanString(body.seoTitle || existing?.seoTitle || title);
  const seoDescription = cleanString(body.seoDescription || existing?.seoDescription || excerpt);
  const keywords = normalizeKeywords(body.keywords || existing?.keywords || buildArticleKeywords(title));

  return {
    ...body,
    title,
    excerpt,
    content,
    image,
    thumbnail: image,
    seoTitle,
    seoDescription,
    keywords,
    visible: normalizeCheckbox(body.visible, existing?.visible ?? true)
  };
}

function normalizeSettingsPayload(body = {}, current = {}) {
  const currentSeo = current?.seo && typeof current.seo === 'object' ? current.seo : {};

  return {
    ...current,
    ...body,
    storeName: cleanString(body.storeName || current.storeName || 'MWG Oversize'),
    logo: cleanString(body.logo || current.logo || '/assets/images/logo.png'),
    whatsapp: cleanString(body.whatsapp || current.whatsapp || ''),
    telegram: cleanString(body.telegram || current.telegram || ''),
    phone: cleanString(body.phone || current.phone || ''),
    email: cleanString(body.email || current.email || ''),
    address: cleanString(body.address || current.address || ''),
    seo: {
      ...currentSeo,
      metaTitle: cleanString(body.metaTitle || body['seo.metaTitle'] || currentSeo.metaTitle || ''),
      metaDescription: cleanString(body.metaDescription || body['seo.metaDescription'] || currentSeo.metaDescription || ''),
      ogImage: cleanString(body.ogImage || body['seo.ogImage'] || currentSeo.ogImage || ''),
      keywords: normalizeKeywords(body.keywords || body['seo.keywords'] || currentSeo.keywords || '')
    }
  };
}

/* ================= LOGIN ================= */
function loginPage(req, res) {
  const flash = req.session?.flash || null;
  if (req.session) delete req.session.flash;

  return res.render('admin/login', {
    layout: false,
    flash
  });
}

function login(req, res) {
  const username = cleanString(req.body.username);
  const password = cleanString(req.body.password);

  if (!adminUsername() || !adminPassword()) {
    setFlash(req, 'danger', 'Admin credential belum dikonfigurasi di environment.');
    return res.redirect('/admin/login');
  }

  if (username !== adminUsername() || password !== adminPassword()) {
    setFlash(req, 'danger', 'Login gagal. Username atau password salah.');
    return res.redirect('/admin/login');
  }

  return req.session.regenerate((error) => {
    if (error) {
      console.error('[ADMIN LOGIN ERROR]', error);
      setFlash(req, 'danger', 'Gagal membuat session admin.');
      return res.redirect('/admin/login');
    }

    req.session.adminUser = {
      username
    };

    setFlash(req, 'success', 'Login berhasil.');
    return res.redirect('/admin');
  });
}

function logout(req, res) {
  if (!req.session) {
    return res.redirect('/admin/login');
  }

  return req.session.destroy((error) => {
    if (error) {
      console.error('[ADMIN LOGOUT ERROR]', error);
      return res.redirect('/admin');
    }

    res.clearCookie(process.env.SESSION_NAME || 'mwg.sid');
    return res.redirect('/admin/login');
  });
}

/* ================= DASHBOARD ================= */
function dashboard(req, res) {
  const products = getProducts();
  const orders = getOrders();
  const articles = getArticles();

  return res.render('admin/dashboard', {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalArticles: articles.length,
    recentOrders: orders.slice(0, 10),
    recentProducts: products.slice(0, 5),
    recentArticles: articles.slice(0, 5)
  });
}

/* ================= PRODUCTS ================= */
function productList(req, res) {
  return res.render('admin/products', {
    products: getProducts()
  });
}

function productCreatePage(req, res) {
  return res.render('admin/product-form', {
    item: null
  });
}

function productStore(req, res) {
  try {
    const payload = normalizeProductPayload(req.body);

    if (!payload.name || !payload.category || !payload.affiliateLink) {
      setFlash(req, 'danger', 'Nama produk, kategori, dan affiliate link wajib diisi.');
      return res.redirect('/admin/products/create');
    }

    createProduct(payload);

    setFlash(req, 'success', 'Produk berhasil dibuat.');
    return res.redirect('/admin/products');
  } catch (error) {
    console.error('[PRODUCT STORE ERROR]', error);
    setFlash(req, 'danger', 'Gagal menambahkan produk.');
    return res.redirect('/admin/products/create');
  }
}

function productEditPage(req, res) {
  const item = getProductById(req.params.id) || null;

  if (!item) {
    setFlash(req, 'danger', 'Produk tidak ditemukan.');
    return res.redirect('/admin/products');
  }

  return res.render('admin/product-form', {
    item
  });
}

function productUpdate(req, res) {
  try {
    const existing = getProductById(req.params.id);

    if (!existing) {
      setFlash(req, 'danger', 'Produk tidak ditemukan.');
      return res.redirect('/admin/products');
    }

    const payload = normalizeProductPayload(req.body, existing);

    if (!payload.name || !payload.category || !payload.affiliateLink) {
      setFlash(req, 'danger', 'Nama produk, kategori, dan affiliate link wajib diisi.');
      return res.redirect(`/admin/products/${req.params.id}/edit`);
    }

    const updated = updateProduct(req.params.id, payload);

    if (!updated) {
      setFlash(req, 'danger', 'Produk gagal diupdate.');
      return res.redirect('/admin/products');
    }

    setFlash(req, 'success', 'Produk berhasil diupdate.');
    return res.redirect('/admin/products');
  } catch (error) {
    console.error('[PRODUCT UPDATE ERROR]', error);
    setFlash(req, 'danger', 'Gagal update produk.');
    return res.redirect(`/admin/products/${req.params.id}/edit`);
  }
}

function productDelete(req, res) {
  try {
    const deleted = deleteProduct(req.params.id);

    if (!deleted) {
      setFlash(req, 'danger', 'Produk tidak ditemukan.');
      return res.redirect('/admin/products');
    }

    setFlash(req, 'success', 'Produk berhasil dihapus.');
    return res.redirect('/admin/products');
  } catch (error) {
    console.error('[PRODUCT DELETE ERROR]', error);
    setFlash(req, 'danger', 'Gagal menghapus produk.');
    return res.redirect('/admin/products');
  }
}

/* ================= ORDERS ================= */
function orderList(req, res) {
  return res.render('admin/orders', {
    orders: getOrders(),
    statuses: ORDER_STATUSES
  });
}

function orderUpdateStatus(req, res) {
  try {
    const nextStatus = cleanString(req.body.status);
    const updated = updateOrderStatus(req.params.id, nextStatus);

    if (!updated) {
      setFlash(req, 'danger', 'Order tidak ditemukan.');
      return res.redirect('/admin/orders');
    }

    setFlash(req, 'success', 'Status order berhasil diupdate.');
    return res.redirect('/admin/orders');
  } catch (error) {
    console.error('[ORDER UPDATE ERROR]', error);
    setFlash(req, 'danger', 'Gagal update status order.');
    return res.redirect('/admin/orders');
  }
}

/* ================= ARTICLES ================= */
function articleList(req, res) {
  return res.render('admin/articles', {
    articles: getArticles()
  });
}

function articleCreatePage(req, res) {
  return res.render('admin/article-form', {
    item: null
  });
}

function articleStore(req, res) {
  try {
    const payload = normalizeArticlePayload(req.body);

    if (!payload.title || !payload.excerpt || !payload.content) {
      setFlash(req, 'danger', 'Judul, excerpt, dan konten artikel wajib diisi.');
      return res.redirect('/admin/articles/create');
    }

    createArticle(payload);

    setFlash(req, 'success', 'Artikel berhasil dibuat.');
    return res.redirect('/admin/articles');
  } catch (error) {
    console.error('[ARTICLE STORE ERROR]', error);
    setFlash(req, 'danger', 'Gagal membuat artikel.');
    return res.redirect('/admin/articles/create');
  }
}

function articleEditPage(req, res) {
  const item = getArticleById(req.params.id) || null;

  if (!item) {
    setFlash(req, 'danger', 'Artikel tidak ditemukan.');
    return res.redirect('/admin/articles');
  }

  return res.render('admin/article-form', {
    item
  });
}

function articleUpdate(req, res) {
  try {
    const existing = getArticleById(req.params.id);

    if (!existing) {
      setFlash(req, 'danger', 'Artikel tidak ditemukan.');
      return res.redirect('/admin/articles');
    }

    const payload = normalizeArticlePayload(req.body, existing);

    if (!payload.title || !payload.excerpt || !payload.content) {
      setFlash(req, 'danger', 'Judul, excerpt, dan konten artikel wajib diisi.');
      return res.redirect(`/admin/articles/${req.params.id}/edit`);
    }

    const updated = updateArticle(req.params.id, payload);

    if (!updated) {
      setFlash(req, 'danger', 'Artikel gagal diupdate.');
      return res.redirect('/admin/articles');
    }

    setFlash(req, 'success', 'Artikel berhasil diupdate.');
    return res.redirect('/admin/articles');
  } catch (error) {
    console.error('[ARTICLE UPDATE ERROR]', error);
    setFlash(req, 'danger', 'Gagal update artikel.');
    return res.redirect(`/admin/articles/${req.params.id}/edit`);
  }
}

function articleDelete(req, res) {
  try {
    const deleted = deleteArticle(req.params.id);

    if (!deleted) {
      setFlash(req, 'danger', 'Artikel tidak ditemukan.');
      return res.redirect('/admin/articles');
    }

    setFlash(req, 'success', 'Artikel berhasil dihapus.');
    return res.redirect('/admin/articles');
  } catch (error) {
    console.error('[ARTICLE DELETE ERROR]', error);
    setFlash(req, 'danger', 'Gagal menghapus artikel.');
    return res.redirect('/admin/articles');
  }
}

/* ================= SETTINGS ================= */
function settingsPage(req, res) {
  return res.render('admin/settings', {
    settings: getSettings()
  });
}

function settingsUpdate(req, res) {
  try {
    const current = getSettings();
    const payload = normalizeSettingsPayload(req.body, current);

    saveSettings(payload);

    setFlash(req, 'success', 'Settings berhasil disimpan.');
    return res.redirect('/admin/settings');
  } catch (error) {
    console.error('[SETTINGS UPDATE ERROR]', error);
    setFlash(req, 'danger', 'Gagal menyimpan settings.');
    return res.redirect(safeRedirectBack(req, '/admin/settings'));
  }
}

module.exports = {
  loginPage,
  login,
  logout,
  dashboard,
  productList,
  productCreatePage,
  productStore,
  productEditPage,
  productUpdate,
  productDelete,
  orderList,
  orderUpdateStatus,
  articleList,
  articleCreatePage,
  articleStore,
  articleEditPage,
  articleUpdate,
  articleDelete,
  settingsPage,
  settingsUpdate
};
