const {
  getVisibleProducts,
  getProductBySlug,
  getVisibleArticles,
  getArticleBySlug
} = require('../helpers/store');

/* ================= SEO APPLY ================= */
function applySeo(res, meta) {
  const base = res.locals.baseUrl;

  res.locals.meta = {
    ...(res.locals.meta || {}),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    canonical: base + meta.canonical,
    url: base + meta.canonical
  };
}

/* ================= HOME ================= */
exports.home = (req,res)=>{
  const products = getVisibleProducts();
  const articles = getVisibleArticles();

  applySeo(res,{
    title:'Kaos Oversize Pria Premium Terbaik 2026',
    description:'Beli kaos oversize pria premium bahan tebal dan nyaman dipakai harian.',
    keywords:'kaos oversize pria, kaos pria premium',
    canonical:'/'
  });

  res.render('home',{
    products,
    featured:products.slice(0,6),
    recommended:products.slice(0,8),
    articles:articles.slice(0,4)
  });
};

/* ================= SHOP ================= */
exports.shop = (req,res)=>{
  const products = getVisibleProducts();

  const query = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();

  applySeo(res,{
    title:'Shop Kaos Pria Terbaik',
    description:'Temukan kaos pria terbaik dan oversize premium.',
    keywords:'kaos pria, kaos oversize pria',
    canonical:'/shop'
  });

  res.render('shop',{
    products,
    query,
    category
  });
};

/* ================= PRODUCT ================= */
exports.productDetail = (req,res)=>{
  const product = getProductBySlug(req.params.slug);

  if(!product) return res.redirect('/shop');

  applySeo(res,{
    title:`${product.name} - Kaos Oversize Pria`,
    description:product.shortDescription || product.name,
    keywords:product.name,
    canonical:`/product/${product.slug}`
  });

  res.render('product-detail',{
    product,
    recommended:getVisibleProducts().slice(0,4)
  });
};

/* ================= ARTICLES ================= */
exports.articles = (req,res)=>{
  const articles = getVisibleArticles();

  applySeo(res,{
    title:'Artikel Fashion Pria',
    description:'Tips outfit pria dan rekomendasi kaos terbaik.',
    keywords:'fashion pria, kaos pria',
    canonical:'/articles'
  });

  res.render('articles',{articles});
};

/* ================= ARTICLE DETAIL ================= */
exports.articleDetail = (req,res)=>{
  const article = getArticleBySlug(req.params.slug);

  if(!article) return res.redirect('/articles');

  applySeo(res,{
    title:article.title,
    description:article.excerpt || article.title,
    keywords:article.title,
    canonical:`/article/${article.slug}`
  });

  res.render('article-detail',{article});
};

/* ================= CONTACT ================= */
exports.contact = (req,res)=>{
  applySeo(res,{
    title:'Kontak',
    description:'Hubungi kami',
    keywords:'kontak',
    canonical:'/contact'
  });

  res.render('contact');
};

/* ================= SEO LANDING ================= */
exports.seoKaosOversizePria = (req,res)=>{
  const products = getVisibleProducts();

  applySeo(res,{
    title:'Kaos Oversize Pria Premium Terbaik 2026',
    description:'Rekomendasi kaos oversize pria terbaik, bahan tebal dan nyaman.',
    keywords:'kaos oversize pria premium',
    canonical:'/kaos-oversize-pria'
  });

  res.render('seo-kaos-oversize',{
    products,
    articles:getVisibleArticles().slice(0,4)
  });
};

/* ================= AUTO SEO ================= */
exports.seoDynamic = (req,res,page,products)=>{
  applySeo(res,{
    title:page.title,
    description:page.desc,
    keywords:page.keyword,
    canonical:`/s/${page.slug}`
  });

  res.render('seo-dynamic',{
    products,
    page
  });
};

/* ================= 🔥 SNIPER SEO ================= */
exports.seoSniper = (req,res,keyword)=>{
  const products = getVisibleProducts();

  const slug = keyword.replace(/\s+/g,'-');

  applySeo(res,{
    title: keyword + ' terbaik 2026',
    description: 'Temukan ' + keyword + ' dengan kualitas terbaik dan nyaman dipakai.',
    keywords: keyword,
    canonical: '/sniper/' + slug
  });

  res.render('seo-sniper',{
    products,
    keyword
  });
};
