// brands.js — marki → osobne karuzele, dynamiczne marki, lightbox z opisem
// Wymaga: window.AppData (data.js)
(function () {
  // ===== Ustawienia obrazków =====
  const LOCAL_BASE  = 'images/';
  const REMOTE_BASE = 'https://raw.githubusercontent.com/lq-lista/lq-lista.github.io/main/images/';
  const PLACEHOLDER =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
         <rect width="100%" height="100%" fill="#f3f3f3"/>
         <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
               fill="#999" font-family="Arial" font-size="20">Brak zdjęcia</text>
       </svg>`
    );

  const $ = (id) => document.getElementById(id);
  const $tabs = $('brand-tabs');
  const $grid = $('brand-grid');
  const $q = $('brand-search');
  const $cold = $('filter-cold');
  const $noncold = $('filter-noncold');
  if (!$grid) return;

  // ===== Pomocnicze =====
  const stripNumber = (s) => String(s).replace(/^\s*\d+[\.)]?\s*/, '');
  const hasCold = (s) => /chłod|ice|lod|cool|mięta|menthol/i.test(s);
  const norm = (s) => (s||'').toLowerCase().replace(/[’‘]/g,"'").trim();
  const anchorId = (b) => 'brand-' + b.toLowerCase().replace(/[^a-z0-9]+/g,'-');

  // Kanonizacja marek (dowolna pisownia → jedna forma)
  const CANON = {
    "a&l":"A&L",
    "vampir vape":"Vampir Vape",
    "fighter fuel":"Fighter Fuel",
    "premium fcukin flava":"Premium Fcukin Flava",
    "tribal force":"Tribal Force",
    "klarro smooth funk":"Klarro Smooth Funk",
    "geometric fruits":"Geometric Fruits",
    "izi pizi":"Izi Pizi",
    "wanna be cool":"Wanna be Cool",
    "aroma king":"Aroma King",
    "dillon's":"Dillon's","dillon’s":"Dillon's",
    "chilled face":"chilled face",
    "summer time":"Summer time",
    "winter time":"Winter time",
    "duo":"Duo",
    "dark line":"Dark Line",
    "inne":"Inne"
  };

  // Kolejność zakładek: znane marki najpierw, reszta automatycznie A→Z
  const PRIORITY = [
    "A&L","Vampir Vape","Fighter Fuel","Premium Fcukin Flava","Tribal Force",
    "Izi Pizi","Wanna be Cool","Klarro Smooth Funk","Aroma King",
    "Duo","Dark Line","Geometric Fruits","chilled face","Summer time","Winter time",
    "Dillon's"
  ];

  // Slug do nazw plików i kluczy opisów (bez marki)
  const toSlug = (title) => {
    const map = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'};
    const ascii = title.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => map[ch] || ch);
    return ascii.toLowerCase().replace(/&/g,'and').replace(/\//g,'-').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
  };

  const srcForAttempt = (slug, step) =>
    [LOCAL_BASE+slug+'.jpg', LOCAL_BASE+slug+'.png', REMOTE_BASE+slug+'.jpg', REMOTE_BASE+slug+'.png'][step] || PLACEHOLDER;

  const attachImgFallback = (img, slug) => {
    let step = 0;
    const handler = () => {
      step += 1;
      if (step <= 3) { img.src = srcForAttempt(slug, step); return; }
      img.removeEventListener('error', handler);
      img.src = PLACEHOLDER;
    };
    img.addEventListener('error', handler);
  };

  // ===== Opisy (klucz = slug tytułu BEZ marki) =====
  const DESCRIPTIONS = {
    // Fighter Fuel – nowe
    "kabura": "Intensywny, słodko-kwaśny miks owocowy z cytrusowym akcentem i wyraźnym chłodem (Fighter Fuel).",
    "freed": "Egzotyczna mieszanka: słodkie owoce tropikalne z orzeźwiającym chłodem – bardzo soczysta.",
    "seiryuto": "Czerwone owoce z cytrusowym „twistem” i rześkim chłodem. Wyrazisty, ale gładki profil.",
    "kansetsu": "Kiwi / winogrono / granat – słodko-kwaskowe nuty + solidna porcja chłodu.",

    // Duo / Dark Line
    "pitaja-gruszka": "Smoczy owoc (pitaja) + dojrzała gruszka – egzotycznie, gładko i lekko słodko.",
    "jablko-mieta": "Zielone jabłko i świeża mięta. Zwiewne, czyste i chłodne zakończenie.",
    "grape": "Ciemne, soczyste winogrono – pełne, słodkie, z lekką kwaskowatością.",
    "skittles": "Tęczowy miks cukierków owocowych – dużo słodyczy, lekko kwaskowy finisz.",
    "black-tea": "Aromat czarnej herbaty: lekko taniczny, herbaciany, subtelnie słodki.",
    "kiwi": "Świeże, lekko kwaskowe kiwi o czystym, soczystym profilu.",
    "forest-fruits": "Mieszanka owoców leśnych – jagoda, malina, jeżyna; słodko-kwaskowa i soczysta.",

    // Inne mniej oczywiste
    "dragon-berry": "Smoczy owoc ze słodkimi czerwonymi jagodami – soczysto-egzotyczny balans.",
    "peach-ice": "Dojrzała brzoskwinia z wyraźnym, czystym chłodem.",
    "wave": "Cytrusowa lemoniada z delikatnym chłodem – wakacyjnie i rześko.",
    "jam": "Słodka konfitura z czerwonych owoców; gęsta, deserowa baza."
  };

  // ===== Przetwarzanie AppData =====
  const raw = (window.AppData && AppData.flavors) ? AppData.flavors : [];

  const items = raw.map((full, i) => {
    const m = String(full).match(/^(.*)\s*\(([^()]+)\)\s*$/);
    if (!m) {
      const title = stripNumber(full).trim();
      const brand = "Inne";
      return { index:i, full, title, brand, brandKey:norm(brand), cold:hasCold(full), slug: toSlug(title), desc: DESCRIPTIONS[toSlug(title)] || "" };
    }
    const title = stripNumber(m[1]).trim();
    const brandRaw = m[2].trim();
    const brandKey = norm(brandRaw);
    const brand = CANON[brandKey] || brandRaw; // jeśli nowa marka — pokaż dokładnie tę z danych
    return { index:i, full, title, brand, brandKey, cold:hasCold(full), slug: toSlug(title), desc: DESCRIPTIONS[toSlug(title)] || "" };
  });

  // Grupowanie po marce
  const byBrand = items.reduce((acc, it)=>{
    const key = CANON[it.brandKey] || it.brand;
    (acc[key] ||= []).push(it);
    return acc;
  },{});

  // Kolejność marek: najpierw PRIORITY ∩ discovered, potem reszta A→Z
  const discovered = Object.keys(byBrand);
  const brands = [
    ...PRIORITY.filter(b => discovered.includes(b)),
    ...discovered.filter(b => !PRIORITY.includes(b)).sort((a,b)=>a.localeCompare(b,'pl'))
  ];
  // Sort nazw w obrębie marki
  brands.forEach(b => byBrand[b].sort((x,y)=> x.title.localeCompare(y.title,'pl')));

  // ===== Taby (nawigacja do sekcji) =====
  const $tabsEl = $tabs;
  if ($tabsEl) {
    $tabsEl.innerHTML = brands.map(b => `<button class="brand-tab" data-target="${anchorId(b)}">${b}</button>`).join('');
    $tabsEl.addEventListener('click', (e)=>{
      const btn = e.target.closest('.brand-tab'); if(!btn) return;
      const el = document.getElementById(btn.dataset.target);
      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  // ===== Render sekcji (jedna marka = jedna karuzela) =====
  const renderSections = () => {
  const q = ($q?.value || '').toLowerCase();
  const wantCold = !!$cold?.checked;
  const wantNon  = !!$noncold?.checked;

  const sections = brands.map(brand => {
    const base = byBrand[brand] || [];
    const list = base
      // szukajka
      .filter(it => !q || it.title.toLowerCase().includes(q))
      // chłód: jeśli oba zaznaczone → nie filtruj wcale
      .filter(it => (wantCold && wantNon) ? true : (wantCold ? it.cold : (wantNon ? !it.cold : true)));

    if (!list.length) return '';

    const cards = list.map(it => {
      const firstSrc = srcForAttempt(it.slug, 0);
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

  $grid.querySelectorAll('.longfill-item').forEach(card => {
    const idx = +card.dataset.index;
    const data = items[idx];
    const img = card.querySelector('img');
    attachImgFallback(img, data.slug);
    img.addEventListener('click', () => openLightbox(data));
    card.querySelector('.order-btn').addEventListener('click', () => addToOrder(data));
  });
};


  // ===== Lightbox (z opcjonalnym opisem) =====
  let $overlay;
  const openLightbox = (data) => {
    $overlay?.remove();
    $overlay = document.createElement('div');
    $overlay.className = 'longfill-overlay';
    $overlay.innerHTML = `
      <div class="longfill-modal">
        <img class="lb-img" src="${srcForAttempt(data.slug,0)}" alt="${data.title}">
        <div class="longfill-modal-title">${data.title}</div>
        ${data.desc ? `<div class="longfill-desc">${data.desc}</div>` : ''}
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

  // ===== Powiązanie z modalem zamówienia =====
  const addToOrder = (data) => {
    const startBtn = document.getElementById('start-order'); if (startBtn) startBtn.click();
    const sel = document.getElementById('flavor-select'); if (sel) { sel.value = String(data.index); sel.dispatchEvent(new Event('change',{bubbles:true})); }
    const modal = document.getElementById('order-modal'); if (modal) modal.scrollTo({top:0,behavior:'smooth'});
  };

  // ===== Filtry =====
  [$q,$cold,$noncold].forEach(el=> el && el.addEventListener('input', renderSections));

  // Start
  renderSections();
})();