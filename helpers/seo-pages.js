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
    'kaos pria',
    'kaos distro pria'
  ];

  const modifiers = [
    'murah','premium','terbaik','terbaru','kekinian','original',
    'bahan tebal','nyaman dipakai','lengan pendek','lengan panjang',
    'import','lokal','branded','casual','simple','minimalis',
    'outfit harian','streetwear','keren','gaul'
  ];

  const intents = [
    'untuk sehari hari','untuk nongkrong','untuk kerja',
    'untuk kuliah','untuk santai','untuk jalan jalan'
  ];

  const locations = [
    'jakarta','bandung','surabaya','medan','makassar',
    'tangerang','bekasi','depok','semarang','palembang'
  ];

  const pages = [];

  base.forEach(b => {
    modifiers.forEach(m => {
      intents.forEach(i => {
        locations.forEach(l => {

          const keyword = `${b} ${m} ${i} di ${l}`;
          const slug = slugify(keyword);

          pages.push({
            keyword,
            slug,
            title: `${keyword} terbaik 2026`,
            desc: `Temukan ${keyword} dengan kualitas terbaik, bahan nyaman, dan model kekinian.`
          });

        });
      });
    });
  });

  return pages.slice(0, 1000);
}

module.exports = { generateSeoPages };
