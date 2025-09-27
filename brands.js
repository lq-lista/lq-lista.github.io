// brands.js — marki → osobne karuzele, dynamicznie; lightbox z opisem + STATUS smaku
// Wymaga: window.AppData (data.js)
(function () {
  // ===== OBRAZKI =====
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

  // ===== POMOCNICZE =====
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
    "summer time":"Summer time","winter time":"Winter time",
    "duo":"Duo","dark line":"Dark Line","inne":"Inne"
  };

  const PRIORITY = [
    "A&L","Vampir Vape","Fighter Fuel","Premium Fcukin Flava","Tribal Force",
    "Izi Pizi","Wanna be Cool","Klarro Smooth Funk","Aroma King",
    "Duo","Dark Line","Geometric Fruits","chilled face","Summer time","Winter time",
    "Dillon's"
  ];

  // Pojemność samego aromatu (ml) – tylko wybrane brandy pokazujemy
  const AROMA_ML = {
    'Izi Pizi': 6,
    'Klarro Smooth Funk': 11,
    'Aroma King': 10,
    'Duo': 10,
    'Dark Line': 6,
    'Geometric Fruits': 10,
    'chilled face': 6
  };

  // slug = klucz statusu i nazwy pliku
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

  // ===== OPISY (opcjonalnie) =====
  const DESCRIPTIONS = {
    "kabura":"Intensywny, słodko-kwaśny miks owocowy z cytrusowym akcentem i chłodem (Fighter Fuel).",
    "freed":"Egzotyczna mieszanka: słodkie owoce tropikalne z orzeźwiającym chłodem.",
    "seiryuto":"Czerwone owoce z cytrusowym twistem i rześkim chłodem.",
    "kansetsu":"Kiwi / winogrono / granat — słodko-kwaskowe nuty + solidny chłód.",
    "pitaja-gruszka":"Pitaja + dojrzała gruszka — egzotycznie i gładko (Duo).",
    "jablko-mieta":"Zielone jabłko i świeża mięta — czysto i chłodno (Duo).",
    "grape":"Ciemne, soczyste winogrono — pełne i lekko kwaskowe (Dark Line).",
    "skittles":"Słodki miks cukierków owocowych (Dark Line).",
    "black-tea":"Aromat czarnej herbaty — lekko taniczny, subtelnie słodki (Dark Line).",
    "kiwi":"Świeże, lekko kwaskowe kiwi (Dark Line).",
    "forest-fruits":"Mieszanka owoców leśnych — słodko-kwaskowa, soczysta (Dark Line).",
    "dragon-berry":"Smoczy owoc + czerwone jagody — egzotyczny balans (Geometric Fruits).",
    "peach-ice":"Dojrzała brzoskwinia z czystym chłodem (Aroma King).",
    "wave":"Cytrusowa lemoniada z delikatnym chłodem (Summer time).",
    "jam":"Słodka konfitura z czerwonych owoców (Winter time)."
  };

  // ===== STATUSY (z localStorage; aktualizowane przez order.js) =====
  const readStatusMap = () => {
    try { return JSON.parse(localStorage.getItem('flavorStatus') || '{}'); }
    catch { return {}; }
  };
  let STATUS = readStatusMap();

  const statusLabel = (code) => ({
    available: 'Dostępny',
    low:       'Na wyczerpaniu',
    out:       'Brak'
  }[code] || null);

  const statusClass = (code) => ({
    available: 'stock-available',
    low:       'stock-low',
    out:       'stock-out'
  }[code] || '');

  // ===== DANE z AppData =====
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
    const brand = CANON[brandKey] || brandRaw;
    return { index:i, full, title, brand, brandKey, cold:hasCold(full), slug: toSlug(title), desc: DESCRIPTIONS[toSlug(title)] || "" };
  });

  const byBrand = items.reduce((acc, it)=>{
    const key = CANON[it.brandKey] || it.brand;
    (acc[key] ||= []).push(it);
    return acc;
  },{});

  const discovered = Object.keys(byBrand);
  const brands = [
    ...PRIORITY.filter(b => discovered.includes(b)),
    ...discovered.filter(b => !PRIORITY.includes(b)).sort((a,b)=>a.localeCompare(b,'pl'))
  ];
  brands.forEach(b => byBrand[b].sort((x,y)=> x.title.localeCompare(y.title,'pl')));

  // ===== TABS =====
  if ($tabs) {
    $tabs.innerHTML = brands.map(b => `<button class="brand-tab" data-target="${anchorId(b)}">${b}</button>`).join('');
    $tabs.addEventListener('click', (e)=>{
      const btn = e.target.closest('.brand-tab'); if(!btn) return;
      const el = document.getElementById(btn.dataset.target);
      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

// --- brands.js
const setupCarousel = (section) => {
  const scroller = section.querySelector('.longfill-carousel');
  const prev = section.querySelector('.brand-prev');
  const next = section.querySelector('.brand-next');
  if (!scroller || !prev || !next) return;

  prev.hidden = false; next.hidden = false;
  prev.style.display = 'flex'; next.style.display = 'flex';

  const stepSize = () => {
    const card = scroller.querySelector('.longfill-item');
    if (!card) return 300;
    const gap = parseFloat(getComputedStyle(scroller).columnGap || getComputedStyle(scroller).gap || 20);
    return card.getBoundingClientRect().width + gap;
  };

  const updateArrows = () => {
    const atStart = scroller.scrollLeft <= 5;
    const atEnd   = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 5;
    prev.disabled = atStart;
    next.disabled = atEnd;
  };

  prev.addEventListener('click', () => scroller.scrollBy({ left: -stepSize()*2, behavior: 'smooth' }));
  next.addEventListener('click', () => scroller.scrollBy({ left:  stepSize()*2, behavior: 'smooth' }));

  // poziome przewijanie kółkiem (desktop)
  scroller.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scroller.scrollLeft += e.deltaY;
      updateArrows();
    }
  }, { passive: false });

  // drag-to-scroll z progiem (klik nie jest blokowany)
  let potential = false, dragging = false;
  let startX = 0, startLeft = 0, lastPointerId = null;
  const THRESH = 6;  // próg pikseli zanim zaczniemy drag
  let moved = 0;

  // NIE startujemy dragu na klikalnych elementach (przycisk, link, form)
  const isClickable = (t) => !!t.closest('button, a, input, select, textarea, label, .no-drag');

  scroller.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;                 // tylko lewy
    if (isClickable(e.target)) return;          // zostaw klikom
    if (scroller.scrollWidth <= scroller.clientWidth) return; // nic do scrolla
    potential = true; dragging = false; moved = 0;
    startX = e.pageX; startLeft = scroller.scrollLeft;
    lastPointerId = e.pointerId;
  });

  scroller.addEventListener('pointermove', (e) => {
    if (!potential && !dragging) return;
    const dx = e.pageX - startX;
    moved = Math.abs(dx);
    if (!dragging && moved > THRESH) {
      dragging = true;
      scroller.setPointerCapture(lastPointerId);
      scroller.classList.add('dragging');
    }
    if (dragging) {
      scroller.scrollLeft = startLeft - dx;
      updateArrows();
    }
  });

  const stopDrag = () => {
    potential = false;
    if (dragging && lastPointerId != null && scroller.hasPointerCapture(lastPointerId)) {
      scroller.releasePointerCapture(lastPointerId);
    }
    dragging = false;
    lastPointerId = null;
    scroller.classList.remove('dragging');
  };
  scroller.addEventListener('pointerup',   stopDrag);
  scroller.addEventListener('pointercancel', stopDrag);
  scroller.addEventListener('pointerleave',  stopDrag);

  // Jeśli był realny drag, zablokuj „fałszywy” click, ale tylko wtedy
  scroller.addEventListener('click', (e) => {
    if (moved > THRESH && !isClickable(e.target)) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true); // capture

  // Nie pozwól scrollerowi przejąć clicka z przycisku
  scroller.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => e.stopPropagation(), {capture:true});
  });

  scroller.addEventListener('scroll', updateArrows);
  updateArrows();
};




  // ===== RENDER =====
  const renderSections = () => {
    STATUS = readStatusMap(); // odśwież statusy
    const q = ($q?.value || '').toLowerCase();
    const wantCold = !!$cold?.checked;
    const wantNon  = !!$noncold?.checked;

    const sections = brands.map(brand=>{
      const base = byBrand[brand] || [];
      const list = base
        .filter(it => !q || it.title.toLowerCase().includes(q))
        .filter(it => (wantCold && wantNon) ? true : (wantCold ? it.cold : (wantNon ? !it.cold : true)));

      if (!list.length) return '';

      const cards = list.map(it=>{
        const firstSrc = srcForAttempt(it.slug, 0);
        const st = STATUS[it.slug] || 'available';
        const stLabel = statusLabel(st);
        const stClass = statusClass(st);
        const disabled = st === 'out' ? 'disabled' : '';
        const extraClass = st === 'out' ? 'is-disabled' : '';
        return `
          <div class="longfill-item" data-index="${it.index}">
            <img class="longfill-image" alt="${it.title}" src="${firstSrc}">
            <div class="longfill-name">${it.title}</div>
            ${stLabel ? `<div class="status-badge ${stClass}">${stLabel}</div>` : ''}
            <button class="order-btn pretty ${extraClass}" ${disabled}>Zamów teraz</button>
          </div>`;
      }).join('');

      // nagłówek firmy + badge z ml aromatu (jeśli jest w mapie)
      const header = `
        <div class="brand-header">
          <h3 class="brand-title">${brand}</h3>
          ${AROMA_ML[brand] ? `<span class="ml-badge" title="Pojemność aromatu">Aromat: ${AROMA_ML[brand]} ml</span>` : ''}
        </div>
      `;

      // dodaj przyciski ‹ › wokół karuzeli
      return `
        <div class="brand-section" id="${anchorId(brand)}">
          ${header}
          <div class="longfill-container">
            <button class="scroll-btn brand-prev" aria-label="W lewo">‹</button>
            <div class="longfill-carousel">${cards}</div>
            <button class="scroll-btn brand-next" aria-label="W prawo">›</button>
          </div>
        </div>`;
    }).join('');

    $grid.innerHTML = sections || '<p class="empty">Brak wyników.</p>';

    // obrazki + zamówienia
    $grid.querySelectorAll('.longfill-item').forEach(card=>{
      const idx = +card.dataset.index;
      const data = items[idx];
      const img = card.querySelector('img');
      attachImgFallback(img, data.slug);
      img.addEventListener('click', ()=> openLightbox(data));
      const btn = card.querySelector('.order-btn');
      btn.addEventListener('click', ()=> addToOrder(data));
    });

    // setup karuzel
    $grid.querySelectorAll('.brand-section').forEach(setupCarousel);
  };

  // ===== LIGHTBOX =====
  let $overlay;
  const openLightbox = (data) => {
    const st = (readStatusMap()[data.slug] || 'available');
    const stLabel = statusLabel(st);
    const stClass = statusClass(st);
    const disabled = st === 'out' ? 'disabled' : '';
    $overlay?.remove();
    $overlay = document.createElement('div');
    $overlay.className = 'longfill-overlay';
    $overlay.innerHTML = `
      <div class="longfill-modal">
        <img class="lb-img" src="${srcForAttempt(data.slug,0)}" alt="${data.title}">
        <div class="longfill-modal-title">${data.title}</div>
        ${data.desc ? `<div class="longfill-desc">${data.desc}</div>` : ''}
        ${stLabel ? `<div class="status-badge ${stClass}">${stLabel}</div>` : ''}
        <button class="order-btn pretty ${st==='out'?'is-disabled':''}" ${disabled}>Zamów teraz</button>
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
    const st = (readStatusMap()[data.slug] || 'available');
    if (st === 'out') { alert('Ten smak jest chwilowo niedostępny.'); return; }
    const startBtn = document.getElementById('start-order'); if (startBtn) startBtn.click();
    const sel = document.getElementById('flavor-select'); if (sel) { sel.value = String(data.index); sel.dispatchEvent(new Event('change',{bubbles:true})); }
    const modal = document.getElementById('order-modal'); if (modal) modal.scrollTo({top:0,behavior:'smooth'});
  };

  // ===== FILTRY =====
  [$q,$cold,$noncold].forEach(el=> el && el.addEventListener('input', renderSections));

  // Aktualizuj, gdy admin zmieni status (order.js emituje event) lub gdy zmieni się localStorage z innej karty
  window.addEventListener('flavorStatus:updated', renderSections);
  window.addEventListener('storage', (e)=>{ if (e.key === 'flavorStatus') renderSections(); });

  // START
  renderSections();
})();
