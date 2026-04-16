const { getProductById } = require('../helpers/store');
const { getCart, saveCart } = require('../helpers/cart');
const { setFlash } = require('../middleware');

function cartPage(req, res) {
  const cart = getCart(req);

  const cartTotals = cart.reduce(
    (acc, item) => {
      acc.total_thb += Number(item.line_total_thb || 0);
      acc.total_idr += Number(item.line_total_idr || 0);
      return acc;
    },
    { total_thb: 0, total_idr: 0 }
  );

  res.render('cart', { cart, cartTotals });
}

function buildCartItem(product, quantity) {
  return {
    product_id: product.id,
    slug: product.slug,
    name: product.name,
    thumbnail: product.thumbnail,
    status: product.status,
    price_thb: Number(product.price_thb || 0),
    price_idr: Number(product.price_idr || 0),
    qty: quantity,
    line_total_thb: quantity * Number(product.price_thb || 0),
    line_total_idr: quantity * Number(product.price_idr || 0)
  };
}

function addOrUpdateCartItem(cart, product, quantity) {
  const existing = cart.find(item => item.product_id === product.id);

  if (existing) {
    existing.qty += quantity;
    existing.line_total_thb = existing.qty * Number(existing.price_thb || 0);
    existing.line_total_idr = existing.qty * Number(existing.price_idr || 0);
  } else {
    cart.push(buildCartItem(product, quantity));
  }

  return cart;
}

function addToCart(req, res) {
  const { product_id, qty = 1 } = req.body;
  const product = getProductById(product_id);

  if (!product || !product.visible) {
    setFlash(req, 'danger', 'Produk tidak ditemukan.');
    return res.redirect('/shop');
  }

  if (product.status === 'sold_out') {
    setFlash(req, 'danger', 'Produk sold out.');
    return res.redirect(`/product/${product.slug}`);
  }

  const quantity = Math.max(1, Number(qty || 1));
  const cart = getCart(req);

  addOrUpdateCartItem(cart, product, quantity);
  saveCart(req, cart);

  setFlash(req, 'success', 'Produk berhasil ditambahkan ke keranjang.');
  res.redirect('/cart');
}

/* BELI SEKARANG */
function buyNow(req, res) {
  const { product_id, qty = 1 } = req.body;
  const product = getProductById(product_id);

  if (!product || !product.visible) {
    setFlash(req, 'danger', 'Produk tidak ditemukan.');
    return res.redirect('/shop');
  }

  if (product.status === 'sold_out') {
    setFlash(req, 'danger', 'Produk sold out.');
    return res.redirect(`/product/${product.slug}`);
  }

  const quantity = Math.max(1, Number(qty || 1));

  // Cart diisi hanya produk ini
  const cart = [buildCartItem(product, quantity)];
  saveCart(req, cart);

  res.redirect('/checkout');
}

function updateCart(req, res) {
  const quantities = req.body.qty || {};

  const cart = getCart(req).map(item => {
    const qty = Math.max(1, Number(quantities[item.product_id] || item.qty || 1));

    return {
      ...item,
      qty,
      line_total_thb: qty * Number(item.price_thb || 0),
      line_total_idr: qty * Number(item.price_idr || 0)
    };
  });

  saveCart(req, cart);
  setFlash(req, 'success', 'Keranjang berhasil diupdate.');
  res.redirect('/cart');
}

function removeFromCart(req, res) {
  const cart = getCart(req).filter(
    item => item.product_id !== req.params.productId
  );

  saveCart(req, cart);
  setFlash(req, 'success', 'Item dihapus dari keranjang.');
  res.redirect('/cart');
}

module.exports = {
  cartPage,
  addToCart,
  buyNow,
  updateCart,
  removeFromCart
};
