(function () {
  // ===== USTAWIENIA OBRAZKÓW =====
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

  // slug z tytułu (do nazwy pliku)
  const toSlug = (title) => {
    const map = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'};
    const ascii = title.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => map[ch] || ch);
    return ascii.toLowerCase().replace(/&/g,'and').replace(/\//g,'-').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
  };

  // źródła obrazków (kolejne próby)
  const srcForAttempt = (slug, step) => (
    [LOCAL_BASE+slug+'.jpg', LOCAL_BASE+slug+'.png', REMOTE_BASE+slug+'.jpg', REMOTE_BASE+slug+'.png'][step] || PLACEHOLDER
  );
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

  // ===== MINI-IKONKI (tagi) =====
  const tagDefs = [
    { key:'cold',  test:(t)=>/chłod|ice|lod|cool/i.test(t),         icon:'❄️', label:'chłód' },
    { key:'mint',  test:(t)=>/mięt|menthol/i.test(t),               icon:'🌿', label:'mięta' },
    { key:'citrus',test:(t)=>/cytryn|limonk|grejpfrut|pomarańcz/i,  icon:'🍋', label:'cytrus' },
    { key:'cola',  test:(t)=>/cola/i,                               icon:'🥤', label:'cola' },
    { key:'sweet', test:(t)=>/słodzik|cukier|cukierk|słodk/i,       icon:'🍬', label:'słodkie' },
    { key:'trop',  test:(t)=>/mango|ananas|papay|smoczego|guawa|marakuja|kiwi|arbuz|melon|granat/i,
                                                                  icon:'🥭', label:'egzotyczne' },
    { key:'berry', test:(t)=>/truskawk|malin|porzecz|jeżyn|jagod|winogron|wiśn/i,
                                                                  icon:'🍓', label:'owoce' }
  ];
  const getTags = (txt) => {
    const t = txt.toLowerCase();
    const tags = [];
    tagDefs.forEach(def => { if (def.test(t)) tags.push(def); });
    // limit 3 najbardziej „charakterystyczne”
    return tags.slice(0,3);
  };
  const renderTags = (txt) => {
    const tags = getTags(txt);
    if (!tags.length) return '';
    return `<div class="flavor-tags">` +
      tags.map(t => `<span class="flavor-tag" title="${t.label}">${t.icon}</span>`).join('') +
    `</div>`;
  };

  // ===== TABY → nawigacja do sekcji (anchor scroll) =====
  if ($tabs) {
    $tabs.innerHTML = brands.map(b => `<button class="brand-tab" data-target="${anchorId(b)}">${b}</button>`).join('');
    $tabs.addEventListener('click', (e)=>{
      const btn = e.target.closest('.brand-tab'); if(!btn) return;
      const el = document.getElementById(btn.dataset.target);
      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  // ===== RENDER: wszystkie firmy → osobne karuzele =====
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
            ${renderTags(it.title)}
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
        ${renderTags(data.title)}
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

// ==============================
//  ADMIN PANEL – poprawki UI
// ==============================
(function(){
  const tableBody = document.getElementById('recent-orders');
  if (!tableBody) return;

  const table = tableBody.closest('table');
  const container = table.closest('.recent-orders-container') || table.parentElement;

  // Pasek narzędzi (filtr statusu + szukaj numeru)
  const tools = document.createElement('div');
  tools.id = 'admin-tools';
  tools.className = 'admin-tools';
  tools.innerHTML = `
    <select id="admin-status-filter">
      <option value="">Wszystkie statusy</option>
      <option value="nowe">Nowe</option>
      <option value="w trakcie">W trakcie</option>
      <option value="zrealizowane">Zrealizowane</option>
      <option value="anulowane">Anulowane</option>
    </select>
    <input id="admin-search" type="text" placeholder="Szukaj numeru…" />
    <span class="admin-hint">Kliknij nagłówek <b>Data</b> lub <b>Kwota</b>, aby sortować</span>
  `;
  container.parentElement.insertBefore(tools, container);

  // Dodaj przycisk „Kopiuj” do kolumny Akcje (jeżeli brak)
  const ensureCopyButtons = () => {
    [...tableBody.querySelectorAll('tr')].forEach(tr=>{
      const tds = tr.querySelectorAll('td'); if (tds.length < 5) return;
      const numCell = tds[0];
      const actions = tds[4];
      if (!actions || actions.querySelector('.copy-num')) return;

      const btn = document.createElement('button');
      btn.className = 'copy-num mini-btn';
      btn.textContent = 'Kopiuj nr';
      btn.addEventListener('click', ()=>{
        const num = (numCell.textContent||'').trim();
        navigator.clipboard?.writeText(num);
        btn.textContent = 'Skopiowano!';
        setTimeout(()=> btn.textContent = 'Kopiuj nr', 1200);
      });
      actions.appendChild(btn);
    });
  };

  // Filtr statusu + szukaj numeru
  const applyFilters = () => {
    const q = (document.getElementById('admin-search').value||'').trim().toLowerCase();
    const status = (document.getElementById('admin-status-filter').value||'').toLowerCase();

    [...tableBody.querySelectorAll('tr')].forEach(tr=>{
      const cells = tr.querySelectorAll('td'); if (!cells.length) return;
      const num    = (cells[0].textContent||'').toLowerCase();
      const statTx = (cells[3].textContent||'').toLowerCase();
      const okNum  = !q || num.includes(q);
      const okStat = !status || statTx.includes(status);
      tr.style.display = (okNum && okStat) ? '' : 'none';
    });
  };

  // Sort po kliknięciu nagłówków „Data” (index 1) i „Kwota” (index 2)
  const thead = table.querySelector('thead');
  let sortState = { col: null, dir: 1 };
  const parseAmount = (s) => parseFloat((s||'').replace(/[^\d,.-]/g,'').replace(',', '.')) || 0;
  const parseDateLoose = (s) => {
    // próba: ISO / pl-PL / inne — jak się nie uda, zero
    const d = new Date(s);
    if (!isNaN(d)) return d.getTime();
    //  dd.mm.yyyy / dd.mm
    const m = String(s).match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/);
    if (m) {
      const day = +m[1], mon = +m[2]-1, yr = m[3] ? (+m[3] < 100 ? 2000+ +m[3] : +m[3]) : new Date().getFullYear();
      return new Date(yr, mon, day).getTime();
    }
    return 0;
    };

  if (thead) {
    const ths = thead.querySelectorAll('th');
    const activateSort = (idx, extractor) => {
      const th = ths[idx]; if (!th) return;
      th.style.cursor = 'pointer';
      th.title = 'Kliknij, aby sortować';
      th.addEventListener('click', ()=>{
        sortState.dir = (sortState.col === idx) ? -sortState.dir : 1;
        sortState.col = idx;
        const rows = [...tableBody.querySelectorAll('tr')];
        rows.sort((a,b)=>{
          const av = extractor(a), bv = extractor(b);
          return (av > bv ? 1 : av < bv ? -1 : 0) * sortState.dir;
        }).forEach(r=> tableBody.appendChild(r));
      });
    };
    activateSort(1, tr => parseDateLoose(tr.children[1]?.textContent));
    activateSort(2, tr => parseAmount(tr.children[2]?.textContent));
  }

  // Zdarzenia
  tools.addEventListener('input', applyFilters);
  const observer = new MutationObserver(()=>{ ensureCopyButtons(); applyFilters(); });
  observer.observe(tableBody, { childList: true, subtree: false });

  // init
  ensureCopyButtons();
  applyFilters();
})();