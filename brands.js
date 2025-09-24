(function () {
  // ====== USTAWIENIA OBRAZKÓW ======
  const LOCAL_BASE  = 'images/'; // Twój folder z obrazkami
  const REMOTE_BASE = 'https://raw.githubusercontent.com/lq-lista/lq-lista.github.io/main/images/';
  const PLACEHOLDER = LOCAL_BASE + 'placeholder.jpg';

  // ====== POBIERANIE ELEMENTÓW Z DOM ======
  const $ = (id) => document.getElementById(id);
  const $tabs   = $('brand-tabs');
  const $grid   = $('brand-grid');
  const $q      = $('brand-search');
  const $cold   = $('filter-cold');
  const $noncold= $('filter-noncold');

  // Nie uruchamiaj, jeśli sekcji nie ma
  if (!$tabs || !$grid) return;

  // ====== NARZĘDZIA ======
  const stripNumber = (s) => s.replace(/^\s*\d+[\.)]?\s*/, '');
  const hasCold = (s) => /chłod|ice|lod|cool|mięta|menthol/i.test(s);

  // Normalizacja brandu -> łączenie wariantów zapisu
  const norm = (s) => (s || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .trim();

  const CANON = {
    "a&l": "A&L",
    "vampir vape": "Vampir Vape",
    "fighter fuel": "Fighter Fuel",
    "premium fcukin flava": "Premium Fcukin Flava",
    "tribal force": "Tribal Force",
    "klarro smooth funk": "Klarro Smooth Funk",
    "geometric fruits": "Geometric Fruits",
    "izi pizi": "Izi Pizi",
    "wanna be cool": "Wanna be Cool",
    "aroma king": "Aroma King",
    "dillon's": "Dillon's",
    "dillon’s": "Dillon's",
    "chilled face": "chilled face",
    "summer time": "Summer time",
    "winter time": "Winter time",
    "inne": "Inne"
  };

  const ORDER = [
    "A&L","Vampir Vape","Fighter Fuel","Premium Fcukin Flava","Tribal Force",
    "Izi Pizi","Wanna be Cool","Klarro Smooth Funk","Aroma King","Dillon's",
    "Geometric Fruits","chilled face","Summer time","Winter time","Inne"
  ];

  // Slug do nazwy pliku (bez brandu!) -> np. "Mango Ice" => "mango-ice"
  const toSlug = (title) => {
    const map = { 'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
                  'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z' };
    const ascii = title.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => map[ch] || ch);
    return ascii
      .toLowerCase()
      .replace(/&/g,'and')
      .replace(/\//g,'-')
      .replace(/[^a-z0-9\s-]/g,'')
      .trim()
      .replace(/\s+/g,'-');
  };

  // Zwraca SRC na podstawie kroku fallbacku
  // kolejne próby: local jpg -> local png -> remote jpg -> remote png -> placeholder
  const srcForAttempt = (slug, step) => {
    switch (step) {
      case 0: return LOCAL_BASE  + slug + '.jpg';
      case 1: return LOCAL_BASE  + slug + '.png';
      case 2: return REMOTE_BASE + slug + '.jpg';
      case 3: return REMOTE_BASE + slug + '.png';
      default: return PLACEHOLDER;
    }
  };

  // Obsługa błędów obrazka – przełączaj format/bazę
  const attachImgFallback = (img, slug) => {
    img.dataset.attempt = '0';
    img.addEventListener('error', () => {
      let n = parseInt(img.dataset.attempt || '0', 10) + 1;
      img.dataset.attempt = String(n);
      img.src = srcForAttempt(slug, n);
    });
  };

  // ====== PARSOWANIE DANYCH ======
  // Wymagane: window.AppData (z data.js)
  const raw = (window.AppData && AppData.flavors) ? AppData.flavors : [];
  // Zapisz też indeks smaku – będzie potrzebny do podpowiadania w formularzu zamówienia
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
    const brand = CANON[brandKey] || originalBrand; // wyświetlaj ładną nazwę, ale łącz marki
    return { index:i, full, title, brand, brandKey, cold:hasCold(full), slug: toSlug(title) };
  });

  // Grupowanie po znormalizowanej nazwie marki
  const byBrand = items.reduce((acc, it) => {
    const key = CANON[it.brandKey] || it.brand; // wspólny klucz
    (acc[key] ||= []).push(it);
    return acc;
  }, {});

  // Kolejność zakładek
  const brands = Object.keys(byBrand).sort((a,b) => {
    const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b,'pl');
  });

  // Sort w obrębie marki
  brands.forEach(b => byBrand[b].sort((x,y) => x.title.localeCompare(y.title,'pl')));

  // ====== RENDER ZAKŁADEK ======
  let activeBrand = brands[0] || null;

  const renderTabs = () => {
    $tabs.innerHTML = brands.map(b => `
      <button class="brand-tab ${b===activeBrand?'active':''}" data-brand="${b}">${b}</button>
    `).join('');
    $tabs.querySelectorAll('.brand-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeBrand = btn.dataset.brand;
        renderTabs();
        renderGrid();
      });
    });
  };

  // ====== RENDER KART ======
  const renderGrid = () => {
    const all = byBrand[activeBrand] || [];

    const q = ($q?.value || '').toLowerCase();
    const list = all
      .filter(it => !q || it.title.toLowerCase().includes(q))
      .filter(it => !$cold?.checked || it.cold)
      .filter(it => !$noncold?.checked || !it.cold);

    if (!list.length) {
      $grid.innerHTML = '<p class="empty">Brak wyników.</p>';
      return;
    }

    const cards = list.map(it => {
      // pierwszy SRC – local JPG (z fallbackiem do PNG/remote/placeholder)
      const firstSrc = srcForAttempt(it.slug, 0);
      return `
        <div class="longfill-item" data-index="${it.index}">
          <img class="longfill-image" alt="${it.title}" src="${firstSrc}" />
          <div class="longfill-name">${it.title}</div>
          <button class="longfill-order">Zamów teraz</button>
        </div>
      `;
    }).join('');

    // Zachowujemy layout jak w Longfill – poziomy carousel
    $grid.innerHTML = `<div class="longfill-carousel">${cards}</div>`;

    // Fallbacki obrazków + akcje
    $grid.querySelectorAll('.longfill-item').forEach(card => {
      const idx  = parseInt(card.dataset.index, 10);
      const data = items[idx];
      const img  = card.querySelector('img');
      attachImgFallback(img, data.slug);

      img.addEventListener('click', () => openLightbox(data));
      card.querySelector('.longfill-order').addEventListener('click', () => addToOrder(data));
    });
  };

  // ====== LIGHTBOX ======
  let $overlay;
  const openLightbox = (data) => {
    $overlay?.remove();
    $overlay = document.createElement('div');
    $overlay.className = 'longfill-overlay';
    const firstSrc = srcForAttempt(data.slug, 0);

    $overlay.innerHTML = `
      <div class="longfill-modal">
        <img class="lb-img" src="${firstSrc}" alt="${data.title}" />
        <div class="longfill-modal-title">${data.title}</div>
        <button class="longfill-order modal">Zamów teraz</button>
        <button class="longfill-close" aria-label="Zamknij">×</button>
      </div>
    `;
    document.body.appendChild($overlay);

    const lbImg = $overlay.querySelector('.lb-img');
    attachImgFallback(lbImg, data.slug);

    $overlay.querySelector('.longfill-close').addEventListener('click', () => $overlay.remove());
    $overlay.addEventListener('click', (e) => { if (e.target === $overlay) $overlay.remove(); });
    $overlay.querySelector('.longfill-order').addEventListener('click', () => addToOrder(data));
  };

  // ====== POWIĄZANIE Z FORMULARZEM ZAMÓWIENIA ======
  const addToOrder = (data) => {
    // Otwórz modal zamówienia (symulacja kliknięcia przycisku)
    const startBtn = document.getElementById('start-order');
    if (startBtn) startBtn.click();

    // Ustaw wybrany smak w selectcie
    const sel = document.getElementById('flavor-select');
    if (sel) {
      sel.value = String(data.index);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Przewiń do formularza (dla wygody)
    const modal = document.getElementById('order-modal');
    if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ====== FILTRY ======
  [$q, $cold, $noncold].forEach(el => el && el.addEventListener('input', renderGrid));

  // ====== START ======
  renderTabs();
  renderGrid();
})();
