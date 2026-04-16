function getCart(req) {
  if (!req.session) {
    throw new Error('Session belum aktif. Pastikan express-session sudah dipasang di server.js');
  }

  if (!Array.isArray(req.session.cart)) {
    req.session.cart = [];
  }

  return req.session.cart;
}

function saveCart(req, items) {
  if (!req.session) {
    throw new Error('Session belum aktif.');
  }

  req.session.cart = Array.isArray(items) ? items : [];
  return req.session.cart;
}

/* TOTAL QTY (untuk badge icon cart di navbar) */
function cartCount(cart = []) {
  if (!Array.isArray(cart)) return 0;

  return cart.reduce((sum, item) => {
    const qty = parseInt(item.qty, 10) || 0;
    return sum + qty;
  }, 0);
}

/* TOTAL HARGA */
function cartTotals(cart = []) {
  if (!Array.isArray(cart)) {
    return { total_thb: 0, total_idr: 0 };
  }

  return cart.reduce(
    (acc, item) => {
      const thb = Number(item.line_total_thb) || 0;
      const idr = Number(item.line_total_idr) || 0;

      acc.total_thb += thb;
      acc.total_idr += idr;

      return acc;
    },
    {
      total_thb: 0,
      total_idr: 0
    }
  );
}

/* FORMAT DISPLAY (opsional kalau mau dipakai di view) */
function formatCurrency(value, locale = 'en-US') {
  return Number(value || 0).toLocaleString(locale);
}

module.exports = {
  getCart,
  saveCart,
  cartCount,
  cartTotals,
  formatCurrency
};
