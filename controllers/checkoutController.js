const { createOrder } = require('../helpers/store');
const { getCart, saveCart, cartTotals, cartCount } = require('../helpers/cart');
const { setFlash } = require('../middleware');
const { sendTelegramOrderNotification } = require('../helpers/telegram');

function checkoutPage(req, res) {
  const cart = getCart(req);

  if (!cart.length) {
    setFlash(req, 'danger', 'Keranjang masih kosong.');
    return res.redirect('/cart');
  }

  const totals = cartTotals(cart);

  return res.render('checkout', {
    cart,
    cartTotals: totals
  });
}

async function placeOrder(req, res) {
  const cart = getCart(req);

  if (!cart.length) {
    setFlash(req, 'danger', 'Keranjang masih kosong.');
    return res.redirect('/cart');
  }

  if (cart.some((item) => item.status === 'sold_out')) {
    setFlash(req, 'danger', 'Ada produk sold out di keranjang.');
    return res.redirect('/cart');
  }

  let {
    customer_name,
    whatsapp,
    telegram,
    address,
    note
  } = req.body;

  customer_name = String(customer_name || '').trim();
  whatsapp = String(whatsapp || '').trim();
  telegram = String(telegram || '').trim();
  address = String(address || '').trim();
  note = String(note || '').trim();

  if (!customer_name || !address) {
    setFlash(req, 'danger', 'Nama lengkap dan alamat wajib diisi.');
    return res.redirect('/checkout');
  }

  if (!whatsapp && !telegram) {
    setFlash(req, 'danger', 'Isi minimal satu kontak: WhatsApp atau Telegram.');
    return res.redirect('/checkout');
  }

  if (whatsapp) {
    whatsapp = whatsapp.replace(/[^\d+]/g, '');
  }

  if (telegram) {
    telegram = telegram.replace(/\s+/g, '');
    telegram = telegram.replace(/^@+/, '');
  }

  if (!whatsapp && !telegram) {
    setFlash(req, 'danger', 'Kontak tidak valid. Isi WhatsApp atau Telegram dengan benar.');
    return res.redirect('/checkout');
  }

  const totals = cartTotals(cart);

  const orderPayload = {
    customer_name,
    whatsapp,
    telegram,
    address,
    note,
    items: cart,
    total_items: cartCount(cart),
    total_thb: totals.total_thb,
    total_idr: totals.total_idr
  };

  const order = createOrder(orderPayload);

  try {
    await sendTelegramOrderNotification(order, res.locals.settings);
  } catch (error) {
    console.error('Telegram notification failed:', error.message);
  }

  saveCart(req, []);

  return res.render('checkout-success', {
    order
  });
}

module.exports = {
  checkoutPage,
  placeOrder
};
