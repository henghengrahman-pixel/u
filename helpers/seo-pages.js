function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function generateSeoPages() {
  const base = [
    'kaos oversize pria',
    'kaos pria oversize',
    'kaos distro pria',
    'baju oversize pria',
    'tshirt oversize pria'
  ];

  const modifiers = [
    'murah','premium','terbaik','original','bahan tebal',
    'cotton combed 30s','tidak panas','adem dipakai',
    'kekinian','trending','import','lokal brand',
    'lengan pendek','lengan panjang','fit oversize'
  ];

  const intents = [
    'beli sekarang',
    'harga terbaik',
    'diskon hari ini',
    'termurah',
    'review lengkap',
    'rekomendasi terbaik',
    'ready stock',
    'free ongkir',
    'best seller'
  ];

  const locations = [
    'jakarta','bandung','surabaya','medan','makassar',
    'tangerang','bekasi','depok','semarang','palembang',
    'bogor','malang','yogyakarta','solo','batam',
    'pekanbaru','denpasar','balikpapan','pontianak','manado'
  ];

  const pages = [];
  const used = new Set();

  for (let b of base) {
    for (let m of modifiers) {
      for (let i of intents) {
        for (let l of locations) {

          const keyword = `${b} ${m} ${i} di ${l}`;
          const slug = slugify(keyword);

          if (used.has(slug)) continue;
          used.add(slug);

          pages.push({
            keyword,
            slug,
            title: `${b} ${m} ${i} di ${l} terbaik 2026`,
            desc: `Beli ${b} ${m} ${i} di ${l}. Bahan nyaman, kualitas premium, cocok untuk outfit harian dan siap kirim cepat.`,
          });

          if (pages.length >= 10000) break;
        }
        if (pages.length >= 10000) break;
      }
      if (pages.length >= 10000) break;
    }
    if (pages.length >= 10000) break;
  }

  return pages;
}

module.exports = { generateSeoPages };
