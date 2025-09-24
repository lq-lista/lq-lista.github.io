(function () {
  // ===== USTAWIENIA OBRAZKÓW =====
  const LOCAL_BASE  = 'images/';
  const REMOTE_BASE = 'https://raw.githubusercontent.com/lq-lista/lq-lista.github.io/main/images/';
  const PLACEHOLDER = LOCAL_BASE + 'placeholder.jpg';

  // ===== POBRANIE ELEMENTÓW =====
  const $ = (id) => document.getElementById(id);
  const $tabs = $('brand-tabs');
  const $grid = $('brand-grid');
  const $q = $('brand-search');
  const $cold = $('filter-cold');
  const $noncold = $('filter-noncold');

  if (!$grid) return;

  // ===== NARZĘDZIA =====
  const stripNumber = (s) => String(s).replace(/^\s*\d+[\.)]?\s*/, '');
  const hasCold = (s) => /chłod|ice|lod|cool|mięta|menthol/i.test(s);
  const norm = (s) => (s||'').toLowerCase().replace(/[’‘]/g,"'").trim();
  const anchorId = (b) => 'brand-' + b.toLowerCase().replace(/[^a-z0-9]+/g,'-');

  const CANON = {
    "a&l":"A&L","vampir vape":"Vampir Vape","fighter fuel":"Fighter Fuel",
    "premium fcukin flava":"Premium Fcukin Flava","tribal force":"Tribal Force",
    "klarro smooth funk":"Klarro Smooth Funk","geometric fruits":"Geometric Fruits",
    "izi pizi":"Izi Pizi","wanna be cool":"Wanna be Cool","aroma king":"Aroma King",
    "dillon's":"Dillon's","dillon’s":"Dillon's","chilled face":"chilled face",
    "summer time":"Summer time","winter time":"Winter time","inne":"Inne"
  };

  const ORDER = [
    "A&L","Vampir Vape","Fighter Fuel","Premium Fcukin Flava","Tribal Force",
    "Izi Pizi","Wanna be Cool","Klarro Smooth Funk","Aroma King","Dillon's",
    "Geometric Fruits","chilled face","Summer time","Winter time","Inne"
  ];

  // slug z tytułu (do pliku)
  const toSlug = (title) => {
    const map = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'};
    const ascii = title.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => map[ch] || ch);
    return ascii.toLowerCase().replace(/&/g,'and').replace(/\//g,'-').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
  };

  // źródło obrazka z fallbackiem
  const srcForAttempt = (slug, step) => (
    [LOCAL_BASE+slug+'.jpg', LOCAL_BASE+slug+'.png', REMOTE_BASE+slug+'.jpg', REMOTE_BASE+slug+'.png'][step] || PLACEHOLDER
  );
  const attachImgFallback = (img, slug) => {
    img.dataset.attempt = '0';
    img.addEventListener('error', () => {
      let n = (+img.dataset.attempt||0)+1;
      img.dataset.attempt = String(n);
      img.src = srcForAttempt(slug, n);
    });
  };

  // ===== DANE Z AppData =====
  const raw = (window.AppData && AppData.flavors) ? AppData.flavors : [];
  const items = raw.map((full, i) => {
    const m = String(full).match(/^(.*)\s*\(([^()]+)\)\s*$/);
    if (!m) {
      const title = stripNumber(full).trim();
      const brand = "Inne";
      return { index:i, full, title, brand, brandKey:norm(brand), cold:hasCold(full), slug: toSlug(title) };
    }
    const title = stripNumber(m[1]).trim();
    const originalBrand = m[2].trim();
    const brandKey = norm(originalBrand);
    const brand = CANON[brandKey] || originalBrand;
    return { index:i, full, title, brand, brandKey, cold:hasCold(full), slug: toSlug(title) };
  });

  const byBrand = items.reduce((acc, it)=>{
    const key = CANON[it.brandKey] || it.brand;
    (acc[key] ||= []).push(it);
    return acc;
  },{});

  const brands = Object.keys(byBrand).sort((a,b)=>{
    const ia=ORDER.indexOf(a), ib=ORDER.indexOf(b);
    return (ia===-1?999:ia)-(ib===-1?999:ib) || a.localeCompare(b,'pl');
  });
  brands.forEach(b=>byBrand[b].sort((x,y)=>x.title.localeCompare(y.title,'pl')));

  // ===== TABY -> nawigacja do sekcji (anchor scroll) =====
  if ($tabs) {
    $tabs.innerHTML = brands.map(b => `<button class="brand-tab" data-target="${anchorId(b)}">${b}</button>`).join('');
    $tabs.addEventListener('click', (e)=>{
      const btn = e.target.closest('.brand-tab'); if(!btn) return;
      const el = document.getElementById(btn.dataset.target);
      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  // ===== RENDER: wszystkie firmy -> osobne karuzele =====
  const renderSections = () => {
    const q = ($q?.value||'').toLowerCase();

    const sections = brands.map(brand=>{
      const base = byBrand[brand] || [];
      const list = base
        .filter(it => !q || it.title.toLowerCase().includes(q))
        .filter(it => !$cold?.checked || it.cold)
        .filter(it => !$noncold?.checked || !it.cold);

      if (!list.length) return '';

      const cards = list.map(it=>{
        const firstSrc = srcForAttempt(it.slug,0);
        return `
          <div class="longfill-item" data-index="${it.index}">
            <img class="longfill-image" alt="${it.title}" src="${firstSrc}">
            <div class="longfill-name">${it.title}</div>
            <button class="order-btn pretty">Zamów teraz</button>
          </div>`;
      }).join('');

      return `
        <div class="brand-section" id="${anchorId(brand)}">
          <h3 class="brand-title">${brand}</h3>
          <div class="longfill-container">
            <div class="longfill-carousel">${cards}</div>
          </div>
        </div>`;
    }).join('');

    $grid.innerHTML = sections || '<p class="empty">Brak wyników.</p>';

    // akcje i fallbacki
    $grid.querySelectorAll('.longfill-item').forEach(card=>{
      const idx = +card.dataset.index;
      const data = items[idx];
      const img = card.querySelector('img');
      attachImgFallback(img, data.slug);
      img.addEventListener('click', ()=> openLightbox(data));
      card.querySelector('.order-btn').addEventListener('click', ()=> addToOrder(data));
    });
  };

  // ===== LIGHTBOX =====
  let $overlay;
  const openLightbox = (data) => {
    $overlay?.remove();
    $overlay = document.createElement('div');
    $overlay.className = 'longfill-overlay';
    $overlay.innerHTML = `
      <div class="longfill-modal">
        <img class="lb-img" src="${srcForAttempt(data.slug,0)}" alt="${data.title}">
        <div class="longfill-modal-title">${data.title}</div>
        <button class="order-btn pretty">Zamów teraz</button>
        <button class="longfill-close" aria-label="Zamknij">×</button>
      </div>`;
    document.body.appendChild($overlay);
    const lbImg = $overlay.querySelector('.lb-img');
    attachImgFallback(lbImg, data.slug);
    $overlay.querySelector('.longfill-close').addEventListener('click', ()=> $overlay.remove());
    $overlay.addEventListener('click', (e)=>{ if(e.target===$overlay) $overlay.remove(); });
    $overlay.querySelector('.order-btn').addEventListener('click', ()=> addToOrder(data));
  };

  // ===== POWIĄZANIE Z MODALEM ZAMÓWIEŃ =====
  const addToOrder = (data) => {
    const startBtn = document.getElementById('start-order'); if (startBtn) startBtn.click();
    const sel = document.getElementById('flavor-select'); if (sel) { sel.value = String(data.index); sel.dispatchEvent(new Event('change',{bubbles:true})); }
    const modal = document.getElementById('order-modal'); if (modal) modal.scrollTo({top:0,behavior:'smooth'});
  };

  // ===== FILTRY =====
  [$q,$cold,$noncold].forEach(el=> el && el.addEventListener('input', renderSections));

  // START
  renderSections();
})();