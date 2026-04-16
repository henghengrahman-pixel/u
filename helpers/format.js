function money(value) {
  const num = Number(value || 0);
  return num.toLocaleString('en-US');
}

function formatPrice(thb, idr) {
  const parts = [];
  if (Number(thb || 0) > 0) parts.push(`THB ${money(thb)}`);
  if (Number(idr || 0) > 0) parts.push(`IDR ${money(idr)}`);
  return parts.join(' / ') || '-';
}

function stripHtml(input = '') {
  return String(input).replace(/<[^>]*>/g, '').trim();
}

module.exports = { money, formatPrice, stripHtml };
