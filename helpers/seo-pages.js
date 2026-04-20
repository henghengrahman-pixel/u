function slugify(text = '') {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' dan ')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createPage(keyword, title, desc) {
  const safeKeyword = String(keyword || '').trim();
  const safeTitle = String(title || '').trim();
  const safeDesc = String(desc || '').trim();
  const slug = slugify(safeKeyword);

  return {
    keyword: safeKeyword,
    slug,
    title: safeTitle,
    desc: safeDesc
  };
}

function generateSeoPages() {
  const pages = [
    createPage(
      'kaos oversize pria bahan tebal',
      'Kaos Oversize Pria Bahan Tebal untuk Harian',
      'Temukan rekomendasi kaos oversize pria bahan tebal yang nyaman dipakai harian, cocok untuk pria Indonesia yang ingin tampil rapi, santai, dan tetap stylish.'
    ),
    createPage(
      'kaos oversize pria tidak panas',
      'Kaos Oversize Pria Tidak Panas dan Nyaman Dipakai',
      'Cari kaos oversize pria tidak panas dengan bahan nyaman, potongan modern, dan pilihan terbaik untuk aktivitas harian pria Indonesia.'
    ),
    createPage(
      'kaos oversize pria premium original',
      'Kaos Oversize Pria Premium Original untuk Tampilan Lebih Rapi',
      'Temukan kaos oversize pria premium original dengan bahan nyaman, model kekinian, dan kualitas yang cocok untuk pembeli pria Indonesia.'
    ),
    createPage(
      'kaos oversize pria murah berkualitas',
      'Kaos Oversize Pria Murah Berkualitas untuk Pria Indonesia',
      'Cari kaos oversize pria murah berkualitas dengan bahan nyaman, model modern, dan harga yang tetap masuk akal untuk outfit harian.'
    ),
    createPage(
      'kaos oversize pria terbaik untuk harian',
      'Kaos Oversize Pria Terbaik untuk Outfit Harian',
      'Jelajahi rekomendasi kaos oversize pria terbaik untuk outfit harian, nongkrong, jalan santai, dan tampilan casual pria Indonesia.'
    ),
    createPage(
      'kaos pria oversize kekinian',
      'Kaos Pria Oversize Kekinian untuk Gaya Casual Modern',
      'Temukan kaos pria oversize kekinian dengan bahan nyaman dan potongan modern untuk pembeli pria Indonesia yang ingin tampil lebih percaya diri.'
    ),
    createPage(
      'kaos distro pria original',
      'Kaos Distro Pria Original dengan Model Kekinian',
      'Cari kaos distro pria original dengan bahan nyaman, look lebih rapi, dan pilihan terbaik untuk gaya harian pria Indonesia.'
    ),
    createPage(
      'baju oversize pria terbaik',
      'Baju Oversize Pria Terbaik untuk Style Harian',
      'Temukan rekomendasi baju oversize pria terbaik dengan bahan adem, potongan modern, dan model yang mudah dipadukan.'
    ),
    createPage(
      'tshirt oversize pria premium',
      'Tshirt Oversize Pria Premium untuk Pria Indonesia',
      'Cari tshirt oversize pria premium dengan kualitas nyaman, tampilan clean, dan model yang cocok untuk daily outfit pria Indonesia.'
    ),
    createPage(
      'kaos oversize pria untuk nongkrong',
      'Kaos Oversize Pria untuk Nongkrong dan Gaya Santai',
      'Temukan kaos oversize pria untuk nongkrong dengan bahan nyaman, model kekinian, dan pilihan terbaik untuk gaya santai pria Indonesia.'
    ),
    createPage(
      'kaos oversize pria lengan pendek',
      'Kaos Oversize Pria Lengan Pendek yang Nyaman Dipakai',
      'Cari kaos oversize pria lengan pendek dengan bahan adem, model simpel, dan tampilan yang cocok untuk aktivitas harian.'
    ),
    createPage(
      'kaos oversize pria lokal brand',
      'Kaos Oversize Pria Lokal Brand yang Layak Dipilih',
      'Temukan rekomendasi kaos oversize pria lokal brand dengan kualitas nyaman, model modern, dan pilihan terbaik untuk pembeli pria Indonesia.'
    )
  ];

  const used = new Set();
  return pages.filter((page) => {
    if (!page.slug || used.has(page.slug)) return false;
    used.add(page.slug);
    return true;
  });
}

module.exports = { generateSeoPages, slugify };
