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
    'kaos distro pria'
  ];

  const modifiers = [
    'murah',
    'premium',
    'terbaik',
    'original',
    'bahan tebal',
    'cotton combed 30s',
    'tidak panas',
    'adem dipakai',
    'kekinian',
    'trending',
    'import',
    'lokal brand'
  ];

  const intents = [
    'beli sekarang',
    'harga terbaik',
    'diskon hari ini',
    'termurah',
    'review lengkap',
    'rekomendasi terbaik'
  ];

  const locations = [
    'jakarta',
    'bandung',
    'surabaya',
    'medan',
    'makassar',
    'tangerang',
    'bekasi',
    'depok',
    'semarang',
    'palembang'
  ];

  const pages = [];
  const used = new Set();

  base.forEach(b => {
    modifiers.forEach(m => {
      intents.forEach(i => {
        locations.forEach(l => {

          const keyword = `${b} ${m} ${i} di ${l}`;
          const slug = slugify(keyword);

          if (used.has(slug)) return;
          used.add(slug);

          pages.push({
            keyword,
            slug,
            title: `${b} ${m} ${i} di ${l} terbaik 2026`,
            desc: `Beli ${b} ${m} ${i} di ${l}. Bahan nyaman, kualitas premium, cocok untuk outfit harian.`,
          });

        });
      });
    });
  });

  return pages.slice(0, 1000);
}

module.exports = { generateSeoPages };
