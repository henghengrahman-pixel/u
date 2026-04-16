const axios = require('axios');
const { formatPrice } = require('./format');

async function sendTelegramOrderNotification(order, settings) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { skipped: true };
  }

  const baseUrl = String(process.env.BASE_URL || '').replace(/\/$/, '');
  const adminOrderUrl = baseUrl ? `${baseUrl}/admin/orders` : '/admin/orders';

  const whatsappText = order.whatsapp
    ? order.whatsapp
    : '-';

  const telegramText = order.telegram
    ? `@${String(order.telegram).replace(/^@+/, '')}`
    : '-';

  const addressText = order.address
    ? order.address
    : '-';

  const noteText = order.note
    ? order.note
    : '-';

  const itemsText = Array.isArray(order.items) && order.items.length
    ? order.items.map((item, index) => {
        const qty = Number(item.qty || 0);
        const lineTotalThb = Number(item.line_total_thb || 0);
        const lineTotalIdr = Number(item.line_total_idr || 0);

        return `${index + 1}. ${item.name} x${qty} (${formatPrice(lineTotalThb, lineTotalIdr)})`;
      })
    : ['-'];

  const lines = [
    '🛒 <b>New Order</b>',
    `Order ID: <b>${order.id}</b>`,
    `Nama: ${order.customer_name || '-'}`,
    `WhatsApp: ${whatsappText}`,
    `Telegram: ${telegramText}`,
    `Alamat: ${addressText}`,
    `Catatan: ${noteText}`,
    '',
    '<b>Produk:</b>',
    ...itemsText,
    '',
    `<b>Total Item:</b> ${Number(order.total_items || 0)}`,
    `<b>Total:</b> ${formatPrice(Number(order.total_thb || 0), Number(order.total_idr || 0))}`,
    `Admin: ${adminOrderUrl}`
  ];

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: lines.join('\n'),
    parse_mode: 'HTML'
  });

  return { sent: true };
}

module.exports = { sendTelegramOrderNotification };
