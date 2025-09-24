// brands.js – zakładki firmowe + karty smaków (layout jak Longfill)
// Wymaga: AppData (z data.js)

(function(){
  const byId = (id) => document.getElementById(id);
  const $tabs = byId('brand-tabs');
  const $grid = byId('brand-grid');
  const $q = byId('brand-search');
  const $cold = byId('filter-cold');
  const $noncold = byId('filter-noncold');

  if (!$tabs || !$grid) return;

  // 1) Parsowanie: wyciągamy nazwę firmy z nawiasu na końcu: "... (A&L)"
  const parseItem = (full) => {
    const m = full.match(/^(.*)\s*\(([^()]+)\)\s*$/);
    if (!m) return { title: full.trim(), brand: 'Inne', cold: hasCold(full) };
    return { title: m[1].trim(), brand: m[2].trim(), cold: hasCold(full) };
  };

  const hasCold = (s) => /chłod|ice|lod|cool|mięta|menthol/i.test(s);

  // 2) Grupy firm
  const items = (AppData?.flavors || []).map(parseItem);
  const brandOrder = [
    'A&L','Vampir Vape','Fighter Fuel','Premium Fcukin Flava','Tribal Force',
    'Klarro Smooth Funk','Geometric Fruits','IZI PIZI','WANNA BE COOL','AROMA KING','Dillon’s','Inne'
  ];
  const byBrand = items.reduce((acc, it)=>{
    (acc[it.brand] ||= []).push(it);
    return acc;
  }, {});

  // Posortuj alfabetycznie w obrębie firm i ustaw kolejność firm wg brandOrder
  const brands = Object.keys(byBrand).sort((a,b)=>{
    const ia = brandOrder.indexOf(a); const ib = brandOrder.indexOf(b);
    return (ia===-1?999:ia) - (ib===-1?999:ib) || a.localeCompare(b);
  });
  brands.forEach(b => byBrand[b].sort((x,y)=> x.title.localeCompare(y.title, 'pl')));

  // 3) Zakładki
  let activeBrand = brands[0] || null;
  const renderTabs = () => {
    $tabs.innerHTML = brands.map(b => `
      <button class="brand-tab ${b===activeBrand?'active':''}" data-brand="${b}">${b}</button>
    `).join('');
    $tabs.querySelectorAll('.brand-tab').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        activeBrand = btn.dataset.brand;
        renderTabs();
        renderGrid();
      });
    });
  };

  // 4) Generowanie nazw plików na podstawie tytułu (używane w src obrazka)
  const toFilename = (title) => {
    // usuwamy cudzysłowy, kropki, przecinki itp., spacje -> myślniki, PL znaki -> ascii
    const map = {
      'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
      'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z','&':'and','/':'-'
    };
    const ascii = title.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ&/]/g, ch=>map[ch]||'');
    return ascii
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g,'')
      .trim()
      .replace(/\s+/g,'-')
      + '.jpg';
  };

  // 5) Karty (layout longfill)
  const renderGrid = () => {
    const list = (byBrand[activeBrand]||[])
      .filter(it => !$q.value || it.title.toLowerCase().includes($q.value.toLowerCase()))
      .filter(it => !$cold.checked || it.cold)
      .filter(it => !$noncold.checked || !it.cold);

    if (!list.length) { $grid.innerHTML = '<p class="empty">Brak wyników.</p>'; return; }

    $grid.innerHTML = list.map((it,idx)=>{
      const file = toFilename(it.title);
      const img = `images/${file}`;
      return `
      <div class="longfill-item" data-idx="${idx}">
        <img class="longfill-image" src="${img}" alt="${it.title}" onerror="this.src='images/placeholder.jpg'"/>
        <div class="longfill-name">${it.title}</div>
        <button class="longfill-order">Zamów teraz</button>
      </div>`;
    }).join('');

    // Lightbox + zamówienia
    $grid.querySelectorAll('.longfill-item').forEach(card=>{
      const name = card.querySelector('.longfill-name').textContent;
      card.querySelector('.longfill-image').addEventListener('click', ()=> openLightbox(name));
      card.querySelector('.longfill-order').addEventListener('click', ()=> addToOrder(name));
    });
  };

  // 6) Lightbox (prosty, w stylu starego)
  let $overlay;
  const openLightbox = (title) => {
    const file = `images/${toFilename(title)}`;
    $overlay?.remove();
    $overlay = document.createElement('div');
    $overlay.className = 'longfill-overlay';
    $overlay.innerHTML = `
      <div class="longfill-modal">
        <img src="${file}" alt="${title}" onerror="this.src='images/placeholder.jpg'"/>
        <div class="longfill-modal-title">${title}</div>
        <button class="longfill-order modal">Zamów teraz</button>
        <button class="longfill-close">×</button>
      </div>`;
    document.body.appendChild($overlay);
    $overlay.querySelector('.longfill-close').addEventListener('click', ()=> $overlay.remove());
    $overlay.addEventListener('click', (e)=>{ if(e.target===$overlay) $overlay.remove(); });
    $overlay.querySelector('.longfill-order').addEventListener('click', ()=> addToOrder(title));
  };

  // 7) Podpięcie do OrderSystem (jeśli jest w projekcie)
  const addToOrder = (title) => {
    if (window.OrderSystem?.addItem) {
      window.OrderSystem.addItem({ name: title, type: 'Longfill', qty: 1 });
    } else {
      alert(`Dodano do koszyka: ${title}`);
    }
  };

  // 8) Filtry
  [$q, $cold, $noncold].forEach(el=> el && el.addEventListener('input', renderGrid));

  // 9) Start
  renderTabs();
  renderGrid();
})();