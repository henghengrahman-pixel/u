const { ORDER_STATUSES } = require('../helpers/constants');
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

/* ================= HELPER ================= */
function cleanString(value = '') {
  return String(value || '').trim();
}

function normalizeCheckbox(value) {
  return value === 'on' || value === 'true' || value === true;
}

function normalizeMultilineUrls(value = '') {
  return String(value || '')
    .split(/\r?\n|,/)
    .map(item => cleanString(item))
    .filter(Boolean);
}

/* ================= LOGIN ================= */
function loginPage(req, res) {
  res.render('admin/login', {
    layout: false,
    flash: req.session.flash || null
  });
  delete req.session.flash;
}

function login(req, res) {
  const username = cleanString(req.body.username);
  const password = cleanString(req.body.password);

  if (
    username === cleanString(process.env.ADMIN_USERNAME) &&
    password === cleanString(process.env.ADMIN_PASSWORD)
  ) {
    req.session.adminUser = { username };
    return res.redirect('/admin');
  }

  setFlash(req, 'danger', 'Login gagal.');
  return res.redirect('/admin/login');
}

function logout(req, res) {
  req.session.destroy(() => res.redirect('/admin/login'));
}

/* ================= DASHBOARD ================= */
function dashboard(req, res) {
  const products = getProducts();
  const orders = getOrders();
  const articles = getArticles();

  res.render('admin/dashboard', {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalArticles: articles.length,
    recentOrders: orders.slice(0, 10)
  });
}

/* ================= PRODUCT ================= */
function productList(req, res) {
  res.render('admin/products', {
    products: getProducts()
  });
}

function productCreatePage(req, res) {
  res.render('admin/product-form', { item: null });
}

function productStore(req, res) {
  try {
    const name = cleanString(req.body.name);
    const category = cleanString(req.body.category);
    const affiliateLink = cleanString(req.body.affiliateLink || req.body.affiliate_link);
    const image = cleanString(req.body.image);
    const shortDescription = cleanString(req.body.shortDescription || req.body.short_description);
    const description = cleanString(req.body.description);
    const images = normalizeMultilineUrls(req.body.images);

    if (!name || !category || !affiliateLink || !image) {
      setFlash(req, 'danger', 'Semua field wajib diisi.');
      return res.redirect('/admin/products/create');
    }

    createProduct({
      ...req.body,
      name,
      category,
      affiliateLink,
      image,
      images,
      shortDescription,
      description,

      // 🔥 SEO AUTO (PENTING)
      seoTitle: `${name} - Rekomendasi Kaos ${category} Terbaik`,
      seoDescription: `${name} merupakan rekomendasi kaos ${category} terbaik dengan bahan nyaman dan cocok untuk outfit pria kekinian.`,

      visible: normalizeCheckbox(req.body.visible),
      featured: normalizeCheckbox(req.body.featured),
      recommended: normalizeCheckbox(req.body.recommended),
      price: Number(req.body.price || 0),
      compareAtPrice: Number(req.body.compareAtPrice || 0)
    });

    setFlash(req, 'success', 'Produk berhasil dibuat.');
    return res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    setFlash(req, 'danger', 'Gagal tambah produk.');
    return res.redirect('/admin/products/create');
  }
}

function productEditPage(req, res) {
  const item = getProductById(req.params.id) || null;

  if (!item) {
    setFlash(req, 'danger', 'Produk tidak ditemukan.');
    return res.redirect('/admin/products');
  }

  return res.render('admin/product-form', { item });
}

function productUpdate(req, res) {
  try {
    const name = cleanString(req.body.name);
    const category = cleanString(req.body.category);
    const affiliateLink = cleanString(req.body.affiliateLink || req.body.affiliate_link);
    const image = cleanString(req.body.image);
    const shortDescription = cleanString(req.body.shortDescription || req.body.short_description);
    const description = cleanString(req.body.description);
    const images = normalizeMultilineUrls(req.body.images);

    const updated = updateProduct(req.params.id, {
      ...req.body,
      name,
      category,
      affiliateLink,
      image,
      images,
      shortDescription,
      description,

      // 🔥 SEO AUTO
      seoTitle: `${name} - Rekomendasi Kaos ${category} Terbaik`,
      seoDescription: `${name} merupakan rekomendasi kaos ${category} terbaik dengan bahan nyaman dan cocok untuk outfit pria kekinian.`,

      visible: normalizeCheckbox(req.body.visible),
      featured: normalizeCheckbox(req.body.featured),
      recommended: normalizeCheckbox(req.body.recommended),
      price: Number(req.body.price || 0),
      compareAtPrice: Number(req.body.compareAtPrice || 0)
    });

    if (!updated) {
      setFlash(req, 'danger', 'Produk tidak ditemukan.');
      return res.redirect('/admin/products');
    }

    setFlash(req, 'success', 'Produk berhasil diupdate.');
    return res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    setFlash(req, 'danger', 'Gagal update produk.');
    return res.redirect(`/admin/products/${req.params.id}/edit`);
  }
}

function productDelete(req, res) {
  deleteProduct(req.params.id);
  setFlash(req, 'success', 'Produk dihapus.');
  return res.redirect('/admin/products');
}

/* ================= ORDER ================= */
function orderList(req, res) {
  res.render('admin/orders', {
    orders: getOrders(),
    statuses: ORDER_STATUSES
  });
}

function orderUpdateStatus(req, res) {
  updateOrderStatus(req.params.id, cleanString(req.body.status));
  setFlash(req, 'success', 'Status diupdate.');
  return res.redirect('/admin/orders');
}

/* ================= ARTICLE ================= */
function articleList(req, res) {
  res.render('admin/articles', {
    articles: getArticles()
  });
}

function articleCreatePage(req, res) {
  res.render('admin/article-form', { item: null });
}

function articleStore(req, res) {
  try {
    const title = cleanString(req.body.title);
    const excerpt = cleanString(req.body.excerpt);
    const description = cleanString(req.body.description || req.body.excerpt);
    const image = cleanString(req.body.image);

    createArticle({
      ...req.body,
      title,
      excerpt,
      description,
      image,

      // 🔥 SEO AUTO
      keywords: `rekomendasi kaos pria, ${title}`,

      visible: normalizeCheckbox(req.body.visible)
    });

    setFlash(req, 'success', 'Artikel dibuat.');
    return res.redirect('/admin/articles');
  } catch (error) {
    console.error(error);
    setFlash(req, 'danger', 'Gagal buat artikel.');
    return res.redirect('/admin/articles/create');
  }
}

function articleEditPage(req, res) {
  const item = getArticleById(req.params.id) || null;
  if (!item) return res.redirect('/admin/articles');
  return res.render('admin/article-form', { item });
}

function articleUpdate(req, res) {
  updateArticle(req.params.id, {
    ...req.body,
    keywords: `rekomendasi kaos pria, ${req.body.title}`
  });

  setFlash(req, 'success', 'Artikel diupdate.');
  return res.redirect('/admin/articles');
}

function articleDelete(req, res) {
  deleteArticle(req.params.id);
  setFlash(req, 'success', 'Artikel dihapus.');
  return res.redirect('/admin/articles');
}

/* ================= SETTINGS ================= */
function settingsPage(req, res) {
  res.render('admin/settings', {
    settings: getSettings()
  });
}

function settingsUpdate(req, res) {
  const current = getSettings();

  saveSettings({
    ...current,
    ...req.body,
    storeName: cleanString(req.body.storeName) || 'MWG Oversize'
  });

  setFlash(req, 'success', 'Settings disimpan.');
  return res.redirect('/admin/settings');
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
