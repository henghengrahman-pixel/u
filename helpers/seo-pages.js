function generateSeoPages() {
  const base = [
    'kaos oversize pria',
    'kaos pria',
    'kaos distro pria'
  ];

  const modifiers = [
    'murah',
    'premium',
    'terbaik',
    'terbaru',
    'kekinian',
    'original',
    'bahan tebal',
    'nyaman dipakai'
  ];

  const pages = [];

  base.forEach(b => {
    modifiers.forEach(m => {
      const keyword = `${b} ${m}`;
      const slug = keyword.replace(/\s+/g, '-');

      pages.push({
        keyword,
        slug,
        title: `${keyword} terbaik 2026`,
        desc: `Temukan ${keyword} dengan kualitas terbaik, bahan nyaman, dan model kekinian.`
      });
    });
  });

  return pages;
}

module.exports = { generateSeoPages };
