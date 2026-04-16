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
    const images = normalizeMultilineUrls(req.body.images);

    if (!name) {
      setFlash(req, 'danger', 'Nama produk wajib diisi.');
      return res.redirect('/admin/products/create');
    }

    if (!category) {
      setFlash(req, 'danger', 'Kategori produk wajib diisi.');
      return res.redirect('/admin/products/create');
    }

    if (!affiliateLink) {
      setFlash(req, 'danger', 'Link affiliate wajib diisi.');
      return res.redirect('/admin/products/create');
    }

    if (!image) {
      setFlash(req, 'danger', 'Gambar utama produk wajib diisi.');
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
      visible: normalizeCheckbox(req.body.visible),
      featured: normalizeCheckbox(req.body.featured),
      recommended: normalizeCheckbox(req.body.recommended),
      price: Number(req.body.price || 0),
      compareAtPrice: Number(req.body.compareAtPrice || 0)
    });

    setFlash(req, 'success', 'Produk berhasil dibuat.');
    return res.redirect('/admin/products');
  } catch (error) {
    console.error('[ADMIN PRODUCT STORE ERROR]', error);
    setFlash(req, 'danger', 'Gagal menambah produk. Periksa field yang diisi.');
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
    const images = normalizeMultilineUrls(req.body.images);

    if (!name) {
      setFlash(req, 'danger', 'Nama produk wajib diisi.');
      return res.redirect(`/admin/products/${req.params.id}/edit`);
    }

    if (!category) {
      setFlash(req, 'danger', 'Kategori produk wajib diisi.');
      return res.redirect(`/admin/products/${req.params.id}/edit`);
    }

    if (!affiliateLink) {
      setFlash(req, 'danger', 'Link affiliate wajib diisi.');
      return res.redirect(`/admin/products/${req.params.id}/edit`);
    }

    if (!image) {
      setFlash(req, 'danger', 'Gambar utama produk wajib diisi.');
      return res.redirect(`/admin/products/${req.params.id}/edit`);
    }

    const updated = updateProduct(req.params.id, {
      ...req.body,
      name,
      category,
      affiliateLink,
      image,
      images,
      shortDescription,
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
    console.error('[ADMIN PRODUCT UPDATE ERROR]', error);
    setFlash(req, 'danger', 'Gagal update produk.');
    return res.redirect(`/admin/products/${req.params.id}/edit`);
  }
}

function productDelete(req, res) {
  try {
    deleteProduct(req.params.id);
    setFlash(req, 'success', 'Produk berhasil dihapus.');
    return res.redirect('/admin/products');
  } catch (error) {
    console.error('[ADMIN PRODUCT DELETE ERROR]', error);
    setFlash(req, 'danger', 'Gagal menghapus produk.');
    return res.redirect('/admin/products');
  }
}

function orderList(req, res) {
  res.render('admin/orders', {
    orders: getOrders(),
    statuses: ORDER_STATUSES
  });
}

function orderUpdateStatus(req, res) {
  try {
    const status = cleanString(req.body.status);
    const updated = updateOrderStatus(req.params.id, status);

    if (!updated) {
      setFlash(req, 'danger', 'Order tidak ditemukan.');
      return res.redirect('/admin/orders');
    }

    setFlash(req, 'success', 'Status order diupdate.');
    return res.redirect('/admin/orders');
  } catch (error) {
    console.error('[ADMIN ORDER UPDATE ERROR]', error);
    setFlash(req, 'danger', 'Gagal update status order.');
    return res.redirect('/admin/orders');
  }
}

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
    const thumbnail = cleanString(req.body.thumbnail);
    const image = cleanString(req.body.image || req.body.thumbnail);

    if (!title) {
      setFlash(req, 'danger', 'Judul artikel wajib diisi.');
      return res.redirect('/admin/articles/create');
    }

    createArticle({
      ...req.body,
      title,
      excerpt,
      description,
      thumbnail,
      image,
      visible: normalizeCheckbox(req.body.visible)
    });

    setFlash(req, 'success', 'Artikel berhasil dibuat.');
    return res.redirect('/admin/articles');
  } catch (error) {
    console.error('[ADMIN ARTICLE STORE ERROR]', error);
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

  return res.render('admin/article-form', { item });
}

function articleUpdate(req, res) {
  try {
    const title = cleanString(req.body.title);
    const excerpt = cleanString(req.body.excerpt);
    const description = cleanString(req.body.description || req.body.excerpt);
    const thumbnail = cleanString(req.body.thumbnail);
    const image = cleanString(req.body.image || req.body.thumbnail);

    if (!title) {
      setFlash(req, 'danger', 'Judul artikel wajib diisi.');
      return res.redirect(`/admin/articles/${req.params.id}/edit`);
    }

    const updated = updateArticle(req.params.id, {
      ...req.body,
      title,
      excerpt,
      description,
      thumbnail,
      image,
      visible: normalizeCheckbox(req.body.visible)
    });

    if (!updated) {
      setFlash(req, 'danger', 'Artikel tidak ditemukan.');
      return res.redirect('/admin/articles');
    }

    setFlash(req, 'success', 'Artikel berhasil diupdate.');
    return res.redirect('/admin/articles');
  } catch (error) {
    console.error('[ADMIN ARTICLE UPDATE ERROR]', error);
    setFlash(req, 'danger', 'Gagal update artikel.');
    return res.redirect(`/admin/articles/${req.params.id}/edit`);
  }
}

function articleDelete(req, res) {
  try {
    deleteArticle(req.params.id);
    setFlash(req, 'success', 'Artikel berhasil dihapus.');
    return res.redirect('/admin/articles');
  } catch (error) {
    console.error('[ADMIN ARTICLE DELETE ERROR]', error);
    setFlash(req, 'danger', 'Gagal menghapus artikel.');
    return res.redirect('/admin/articles');
  }
}

function settingsPage(req, res) {
  const current = getSettings() || {};

  res.render('admin/settings', {
    settings: {
      ...current,
      phone: current.phone || '',
      telegram: current.telegram || '',
      telegramChannel: current.telegramChannel || '',
      seo: {
        metaTitle: current.seo?.metaTitle || '',
        metaDescription: current.seo?.metaDescription || '',
        ogImage: current.seo?.ogImage || '',
        keywords: current.seo?.keywords || ''
      }
    }
  });
}

function settingsUpdate(req, res) {
  try {
    const current = getSettings() || {};

    const payload = {
      storeName: cleanString(req.body.storeName),
      logo: cleanString(req.body.logo),
      phone: cleanString(req.body.phone),
      whatsapp: cleanString(req.body.whatsapp),
      telegram: cleanString(req.body.telegram),
      telegramChannel: cleanString(req.body.telegramChannel),
      email: cleanString(req.body.email),
      address: cleanString(req.body.address),
      seo: {
        metaTitle: cleanString(req.body.metaTitle),
        metaDescription: cleanString(req.body.metaDescription),
        ogImage: cleanString(req.body.ogImage),
        keywords: cleanString(req.body.keywords)
      }
    };

    saveSettings({
      ...current,
      ...payload
    });

    setFlash(req, 'success', 'Settings berhasil disimpan.');
    return res.redirect('/admin/settings');
  } catch (error) {
    console.error('[ADMIN SETTINGS UPDATE ERROR]', error);
    setFlash(req, 'danger', 'Gagal menyimpan settings.');
    return res.redirect('/admin/settings');
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
