/**
 * order.js — system zamówień + panel admina + statusy smaków
 * Wymaga: data.js (window.AppData), Chart.js (opcjonalnie), Firebase compat
 */
class OrderSystem {
  constructor() {
    // ── Stan aplikacji ───────────────────────────────────────────────────────────
    this.currentOrder = [];        // bieżące pozycje w koszyku (lista wariantów)
    this.orders = {};              // { orderId: {items, total, ...} }
    this.pageViews = 0;
    this.adminPassword = "admin123";

    // wykresy (mini w panelu)
    this.miniOrdersChart = null;
    this.miniFlavorsChart = null;

    // Firebase
    this.firebaseAvailable = false;
    this.database = null;

    // Statusy smaków (slug -> 'available'|'low'|'out')
    this.flavorStatus = {};

    // ── Inicjalizacja ───────────────────────────────────────────────────────────
    try {
      this.initializeFirebase();
      this.initializeLocalData();
      this.initFlavorStatusSync();        // nasłuch statusów (Firebase + localStorage)
      this.initUIComponents();
      this.initBasicStatistics();
      this.initFirebaseOrdersListener();  // nasłuch zamówień (1 raz)
    } catch (err) {
      console.error("Błąd inicjalizacji OrderSystem:", err);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Firebase
  // ──────────────────────────────────────────────────────────────────────────────
  initializeFirebase() {
    try {
      if (typeof firebase === 'undefined' || typeof firebase.initializeApp !== 'function') {
        console.warn('Firebase nie jest dostępny (brak skryptu). Działamy offline.');
        this.firebaseAvailable = false;
        return;
      }

      const firebaseConfig = {
        apiKey: "AIzaSyAfYyYUOcdjfpupkWMTUZfup6xmRRZJ68w",
        authDomain: "lq-lista.firebaseapp.com",
        databaseURL: "https://lq-lista-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "lq-lista",
        storageBucket: "lq-lista.appspot.com",
        messagingSenderId: "642905853097",
        appId: "1:642905853097:web:ca850099dcdc002f9b2db8"
      };

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      this.database = firebase.database();
      this.firebaseAvailable = true;
    } catch (e) {
      console.error('Błąd inicjalizacji Firebase:', e);
      this.firebaseAvailable = false;
    }
  }

  initFirebaseOrdersListener() {
    if (!this.database) return;
    try {
      this.database.ref('orders').on('value', (snapshot) => {
        const fbOrders = snapshot.val() || {};
        // Aktualizuj tylko jeśli różni się od lokalnego
        if (JSON.stringify(this.orders) !== JSON.stringify(fbOrders)) {
          this.orders = fbOrders;
          localStorage.setItem('orders', JSON.stringify(this.orders));
          this.updateStats();
        }
      });
    } catch (e) {
      console.warn('Błąd nasłuchu orders:', e);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Dane lokalne / statusy smaków
  // ──────────────────────────────────────────────────────────────────────────────
  async initializeLocalData() {
    try {
      const localOrders = localStorage.getItem('orders');
      this.orders = localOrders ? JSON.parse(localOrders) : {};
    } catch (e) {
      console.warn('Błąd parsowania orders z localStorage:', e);
      this.orders = {};
    }
  }

  // Konwersje nazw na slug (wspólne z brands.js)
  toSlug(title) {
    const map = {'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z','Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z'};
    const ascii = String(title).replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => map[ch] || ch);
    return ascii.toLowerCase()
      .replace(/&/g,'and')
      .replace(/\//g,'-')
      .replace(/[^a-z0-9\s-]/g,'')
      .trim()
      .replace(/\s+/g,'-');
  }
  stripBrand(full) {
    const m = String(full).match(/^(.*)\s*\(([^()]+)\)\s*$/);
    return (m ? m[1] : full).trim();
  }

  initFlavorStatusSync() {
    // 1) z localStorage
    try { this.flavorStatus = JSON.parse(localStorage.getItem('flavorStatus') || '{}'); }
    catch { this.flavorStatus = {}; }

    // 2) nasłuch Firebase (jeśli dostępne)
    if (this.database) {
      this.database.ref('flavorStatus').on('value', (snap) => {
        const val = snap.val() || {};
        // akceptuj obie formy: {slug: 'low'} lub {slug: {status:'low'}}
        const normalized = {};
        Object.entries(val).forEach(([slug, v]) => {
          normalized[slug] = (v && typeof v === 'object' && v.status) ? v.status : (v || 'available');
        });
        this.flavorStatus = normalized;
        localStorage.setItem('flavorStatus', JSON.stringify(this.flavorStatus));
        window.dispatchEvent(new CustomEvent('flavorStatus:updated'));
        this.populateFlavors(); // odśwież listę w modalu
      });
    }

    // 3) gdy zmieni się localStorage (inna karta)
    window.addEventListener('storage', (e) => {
      if (e.key === 'flavorStatus') {
        try { this.flavorStatus = JSON.parse(e.newValue || '{}'); } catch { this.flavorStatus = {}; }
        this.populateFlavors();
        window.dispatchEvent(new CustomEvent('flavorStatus:updated'));
      }
    });
  }

  getFlavorStatusByIndex(index) {
    const full = (window.AppData?.flavors || [])[index];
    if (!full) return 'available';
    const slug = this.toSlug(this.stripBrand(full));
    return this.flavorStatus[slug] || 'available';
  }

  async updateFlavorStatus(slug, status) {
    try {
      // zapis do Firebase (jeśli jest)
      if (this.database) {
        await this.database.ref('flavorStatus/' + slug).set({
          status,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
      // cache lokalny + event
      this.flavorStatus[slug] = status;
      localStorage.setItem('flavorStatus', JSON.stringify(this.flavorStatus));
      window.dispatchEvent(new CustomEvent('flavorStatus:updated'));
      this.populateFlavors();
      this.showUserAlert('Zapisano status smaku', 'success');
    } catch (e) {
      console.error('Błąd zapisu statusu:', e);
      this.showUserAlert('Błąd zapisu statusu', 'error');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────────────────────────────────────────
  initUIComponents() {
    this.initEventListeners();
    this.populateFlavors();
    this.setupPricePreview();
    this.initFlavorFilter();
    this.initScrollButton();
    // Minimalne poprawki modal layoutu (gdy CSS nie wejdzie)
    const sc = document.querySelector('.order-scroll-container');
    if (sc) {
      sc.style.maxHeight = '65vh';
      sc.style.overflowY = 'auto';
    }
  }

  initEventListeners() {
    // Przycisk „Stwórz zamówienie”
    const startBtn = document.getElementById('start-order');
    if (startBtn) startBtn.addEventListener('click', () => {
      this.openModal();
      this.resetScrollPosition();
    });

    // Zamknięcie modala
    const closeX = document.querySelector('#order-modal .close');
    if (closeX) closeX.addEventListener('click', this.closeModal.bind(this));

    // Klik w tło modala
    window.addEventListener('click', (ev) => {
      if (ev.target === document.getElementById('order-modal')) {
        this.closeModal();
      }
    });

    // Formularz dodawania
    const addBtn = document.getElementById('add-to-order');
    if (addBtn) addBtn.addEventListener('click', this.addToOrder.bind(this));

    // Złożenie zamówienia
    const submitBtn = document.getElementById('submit-order');
    if (submitBtn) submitBtn.addEventListener('click', this.submitOrder.bind(this));

    // Panel admina — wejście
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
      adminLink.addEventListener('click', (e) => {
        e.preventDefault();
        const panel = document.getElementById('admin-panel');
        if (panel) panel.style.display = 'block';
        window.scrollTo({ top: panel.offsetTop, behavior: 'smooth' });
      });
    }
    // Logowanie admina
    const loginBtn = document.getElementById('login-admin');
    if (loginBtn) loginBtn.addEventListener('click', this.loginAdmin.bind(this));

    // Wyszukiwanie zamówienia
    const searchBtn = document.getElementById('search-order');
    if (searchBtn) searchBtn.addEventListener('click', this.searchOrder.bind(this));
  }

  resetScrollPosition() {
    try {
      const sc = document.querySelector('.order-scroll-container');
      if (sc) sc.scrollTop = 0;
    } catch {}
  }

  getBrandFromFlavorIndex(index) {
  try {
    const s = AppData?.flavors?.[index];
    if (!s) return null;
    const m = s.match(/\(([^()]+)\)\s*$/);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

// jakie pojemności ma dana firma wg BrandPricing
getAvailableSizesForBrand(brand) {
  const bp = window.BrandPricing || {};
  if (!brand || !bp[brand]) return [];
  return Object.keys(bp[brand]); // np. ["60ml","30ml","10ml"]
}

// wyszarza niedostępne pojemności i auto-przełącza
updateSizeAvailability() {
  try {
    const flavorIndex = document.getElementById('flavor-select').value;
    const sizeSelect  = document.getElementById('size-select');
    const brand = this.getBrandFromFlavorIndex(flavorIndex);
    if (!sizeSelect || !brand) return;

    const avail = this.getAvailableSizesForBrand(brand); // np. ["60ml","30ml"]
    let firstAvailable = null;

    [...sizeSelect.options].forEach(opt => {
      if (!opt.value) return; // "Wybierz pojemność"
      const isAvail = avail.includes(opt.value);
      // zapamiętaj oryginalny tekst (do czyszczenia)
      if (!opt.dataset.orig) opt.dataset.orig = opt.textContent;

      opt.disabled = !isAvail;
      opt.textContent = isAvail ? opt.dataset.orig : `${opt.dataset.orig} — niedostępne`;
      if (isAvail && !firstAvailable) firstAvailable = opt.value;
    });

    // jeśli wybrana pojemność jest niedostępna – przełącz na pierwszą dostępną
    const cur = sizeSelect.value;
    if (!avail.includes(cur)) {
      sizeSelect.value = firstAvailable || '';
    }

    // odśwież podgląd ceny
    this.updatePricePreview();
  } catch (e) {
    console.warn('updateSizeAvailability error:', e);
  }
}


  getBrandFromFlavorIndex(index) {
  try {
    const s = AppData?.flavors?.[index];
    if (!s) return null;
    const m = s.match(/\(([^()]+)\)\s*$/);
    return m ? m[1].trim() : null;
  } catch { return null; }
}


  openModal() {
    const modal = document.getElementById('order-modal');
    if (!modal) return;
    modal.style.display = 'block';
    document.body.classList.add('modal-open');

    // pokaż właściwe sekcje
    const $form = document.getElementById('order-form');
    const $sum  = document.getElementById('order-summary');
    const $sub  = document.getElementById('submit-order-container');
    const $ok   = document.getElementById('order-confirmation');
    if ($form) $form.style.display = 'block';
    if ($sum)  $sum.style.display  = 'block';
    if ($sub)  $sub.classList.remove('hidden');
    if ($ok)   $ok.style.display   = 'none';

    // czyść
    document.getElementById('order-notes').value = '';
    this.currentOrder = [];
    this.updateOrderSummary();

    this.updateSizeAvailability();
    this.updatePricePreview();

    // focus na pierwsze pole
    const sel = document.getElementById('flavor-select');
    if (sel) sel.focus();

    // upewnij się, że kontener przewijany
    const sc = document.querySelector('.order-scroll-container');
    if (sc) {
      sc.style.maxHeight = '65vh';
      sc.style.overflowY = 'auto';
    }
  }

  closeModal() {
    const modal = document.getElementById('order-modal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Lista „Nasze Smaki” (sekcja na stronie)
  // ──────────────────────────────────────────────────────────────────────────────
  initFlavorFilter() {
  // Jeśli sekcji .flavors nie ma (usunięta z index.html), to nic nie rób
  const flavorsSection = document.querySelector('.flavors');
  if (!flavorsSection) return;

  // jeżeli jednak kiedyś wróci – podpinamy się do istniejących filtrów
  const brandFilter = document.getElementById('brand-filter');
  const typeFilter = document.getElementById('type-filter');

  if (brandFilter) brandFilter.addEventListener('change', () => this.filterFlavors());
  if (typeFilter) typeFilter.addEventListener('change', () => this.filterFlavors());

    const flavorSelect = document.getElementById('flavor-select');
if (flavorSelect) {
  flavorSelect.addEventListener('change', () => {
    this.updateSizeAvailability();
    this.updatePricePreview();
  });
}


  // Gdyby filtrów nie było w HTML, tworzymy je TYLKO jeśli istnieje .flavors
  if (!brandFilter || !typeFilter) {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.innerHTML = `
      <div class="filter-group">
        <label for="brand-filter">Firma:</label>
        <select id="brand-filter" class="form-control">
          <option value="all">Wszystkie firmy</option>
          <option value="a&l">A&L</option>
          <option value="vampir">Vampir Vape</option>
          <option value="fighter">Fighter Fuel</option>
          <option value="premium">Premium Fcukin Flava</option>
          <option value="tribal">Tribal Force</option>
          <option value="izi">IZI PIZI</option>
          <option value="wanna">WANNA BE COOL</option>
          <option value="klarro">Klarro Smooth Funk</option>
          <option value="aroma">AROMA KING</option>
          <option value="dillon">Dillon's</option>
          <option value="geometric">Geometric Fruits</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="type-filter">Typ smaku:</label>
        <select id="type-filter" class="form-control">
          <option value="all">Wszystkie typy</option>
          <option value="owocowe">Owocowe</option>
          <option value="miętowe">Miętowe</option>
          <option value="słodkie">Słodkie</option>
          <option value="cytrusowe">Cytrusowe</option>
          <option value="energy">Energy drink</option>
          <option value="chłodzone">Chłodzone</option>
        </select>
      </div>
    `;

    // wstawiamy filtry tylko jeśli jest gdzie
    const flavorsList = document.getElementById('flavors-list');
    if (flavorsList) {
      flavorsSection.insertBefore(filterContainer, flavorsList);
      const bf = document.getElementById('brand-filter');
      const tf = document.getElementById('type-filter');
      if (bf) bf.addEventListener('change', () => this.filterFlavors());
      if (tf) tf.addEventListener('change', () => this.filterFlavors());
    }
  }
}


  filterFlavors() {
    try {
      const list = document.getElementById('flavors-list');
      if (!list) return;

      const brandFilter = (document.getElementById('brand-filter')?.value || 'all');
      const typeFilter  = (document.getElementById('type-filter')?.value || 'all');

      const flavors = window.AppData?.flavors || [];
      const flavorCategories = window.AppData?.flavorCategories || {};

      list.innerHTML = '';

      const brandRegex = {
        "a&l":       /\(A&L\)\s*$/i,
        "vampir":    /\(Vampir\s+Vape\)\s*$/i,
        "fighter":   /\(Fighter\s+Fuel\)\s*$/i,
        "premium":   /\(Premium\s+Fcukin\s+Flava\)\s*$/i,
        "tribal":    /\(Tribal\s+Force\)\s*$/i,
        "izi":       /\(Izi\s+Pizi\)\s*$/i,
        "wanna":     /\(Wanna\s+be\s+Cool\)\s*$/i,
        "klarro":    /\(Klarro\s+Smooth\s+Funk\)\s*$/i,
        "aroma":     /\(Aroma\s+King\)\s*$/i,
        "dillon":    /\(Dillon'?s\)\s*$/i,
        "geometric": /\(Geometric\s+Fruits\)\s*$/i,
        "chilled":   /\(chilled\s+face\)\s*$/i,
        "summer":    /\(Summer\s+time\)\s*$/i,
        "winter":    /\(Winter\s+time\)\s*$/i,
        "duo":       /\(Duo\)\s*$/i,
        "dark":      /\(Dark\s+Line\)\s*$/i
      };

      (flavors || []).forEach((flavor, index) => {
        const byBrand = brandFilter === 'all' ||
                        (brandRegex[brandFilter] && brandRegex[brandFilter].test(flavor));

        let byType = typeFilter === 'all';
        if (!byType) {
          const indexes = flavorCategories[typeFilter] || [];
          byType = indexes.includes(index);
        }

        if (byBrand && byType) {
          const li = document.createElement('li');
          li.innerHTML = `<span class="flavor-number">${index + 1}.</span> ${this.formatFlavorName(flavor)}`;
          list.appendChild(li);
        }
      });

      if (list.children.length === 0) {
        list.innerHTML = '<li class="no-results">Brak smaków pasujących do wybranych filtrów</li>';
      }
    } catch (e) {
      console.error('Błąd filtrowania smaków:', e);
      const list = document.getElementById('flavors-list');
      if (list) list.innerHTML = '<li class="error">Błąd podczas filtrowania smaków</li>';
    }
  }

  formatFlavorName(flavor) {
    try {
      return String(flavor)
        .replace(/\s+/g, ' ')
        .replace(/\s,/g, ',')
        .replace(/\s\(/g, ' (');
    } catch {
      return String(flavor);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Formularz w modalu
  // ──────────────────────────────────────────────────────────────────────────────
  populateFlavors() {
    const select = document.getElementById('flavor-select');
    if (!select) return;

    select.innerHTML = '<option value="">Wybierz smak</option>';

    (window.AppData?.flavors || []).forEach((full, index) => {
      const option = document.createElement('option');
      option.value = index;
      const titleOnly = this.stripBrand(full);
      const slug = this.toSlug(titleOnly);
      const stRaw = this.flavorStatus[slug] || 'available';
      const st = (stRaw === 'low' || stRaw === 'out') ? stRaw : 'available';

      let suffix = '';
      if (st === 'low') suffix = ' — NA WYCZERPANIU';
      if (st === 'out') suffix = ' — BRAK';

      option.textContent = `${index + 1}. ${this.formatFlavorName(titleOnly)}${suffix}`;
      if (st === 'out') option.disabled = true;
      select.appendChild(option);
    });
  }

  setupPricePreview() {
    if (document.getElementById('price-preview')) return;
    const after = document.getElementById('strength-select');
    if (!after) return;

    const preview = document.createElement('div');
    preview.id = 'price-preview';
    preview.textContent = 'Cena: -';
    after.insertAdjacentElement('afterend', preview);

    ['flavor-select','size-select','strength-select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => this.updatePricePreview());
    });
  }

updatePricePreview() {
  try {
    const size = document.getElementById('size-select').value;
    const strength = document.getElementById('strength-select').value;
    const flavorIndex = document.getElementById('flavor-select').value;
    const brand = this.getBrandFromFlavorIndex(flavorIndex);
    const pricePreview = document.getElementById('price-preview');

    if (!pricePreview) return;

    if (size && strength && brand) {
      const price = this.calculatePrice(size, strength, brand);
      pricePreview.textContent = `Cena: ${price}zł`;
      pricePreview.style.color = '#ff6f61';
    } else {
      pricePreview.textContent = 'Cena: -';
      pricePreview.style.color = '';
    }
  } catch (error) {
    console.error('Błąd aktualizacji podglądu ceny:', error);
  }
}


  // Walidacja + alerty
  showValidationError(element, message) {
    if (!element) return;
    const next = element.nextElementSibling;
    if (!next || !next.classList.contains('error-message')) {
      const div = document.createElement('div');
      div.className = 'error-message';
      div.textContent = message;
      element.parentNode.insertBefore(div, element.nextSibling);
    }
    element.classList.add('error-input');
  }
  resetValidationErrors(elements = []) {
    elements.forEach(el => {
      if (!el) return;
      el.classList.remove('error-input');
      const next = el.nextElementSibling;
      if (next && next.classList.contains('error-message')) next.remove();
    });
  }
  showUserAlert(message, type='info') {
    const a = document.createElement('div');
    a.className = `user-alert ${type}`;
    a.textContent = message;
    document.body.appendChild(a);
    setTimeout(() => a.remove(), 3000);
  }

calculatePrice(size, strength, brand) {
  try {
    const bp = window.BrandPricing || {};
    const fallback = bp['A&L'] || {};
    const table = (bp[brand] && bp[brand][size]) || fallback[size] || null;
    const mg = String(parseInt(strength, 10));

    if (table) {
      const key = (mg === '24' || mg === '18' || mg === '12') ? mg : '6'; // 6/3/0 razem
      const val = table[key];
      if (typeof val === 'number') return val;
    }

    // awaryjnie stare widełki
    const mgNum = parseInt(strength, 10);
    if (size === '10ml') return mgNum >= 18 ? 16 : (mgNum >= 12 ? 15 : 14);
    if (size === '30ml') return mgNum >= 18 ? 40 : (mgNum >= 12 ? 38 : 35);
    return mgNum >= 18 ? 70 : (mgNum >= 12 ? 67 : 65);
  } catch (e) {
    console.error('Błąd calculatePrice:', e);
    return 0;
  }
}


  addToOrder() {
    try {
      const flavorSelect   = document.getElementById('flavor-select');
      const sizeSelect     = document.getElementById('size-select');
      const strengthSelect = document.getElementById('strength-select');

      // Walidacja wyborów
      if (!flavorSelect?.value) return this.showValidationError(flavorSelect, 'Proszę wybrać smak');
      if (!sizeSelect?.value)   return this.showValidationError(sizeSelect,   'Proszę wybrać pojemność');
      if (!strengthSelect?.value) return this.showValidationError(strengthSelect, 'Proszę wybrać moc nikotyny');

      // Blokada dla „brak”
      const idx = parseInt(flavorSelect.value, 10);
      if (!isNaN(idx) && this.getFlavorStatusByIndex(idx) === 'out') {
        return this.showValidationError(flavorSelect, 'Ten smak jest chwilowo niedostępny');
      }

      // Reset błędów
      this.resetValidationErrors([flavorSelect, sizeSelect, strengthSelect]);

      const all = window.AppData?.flavors || [];
      const flavorFull = all[idx];
      if (!flavorFull) throw new Error('Wybrany smak nie istnieje');

      const price = this.calculatePrice(
  sizeSelect.value, strengthSelect.value,
  this.getBrandFromFlavorIndex(flavorSelect.value)
);


      const flavorNumber = idx + 1;

      this.currentOrder.push({
        flavor: flavorFull,
        size: sizeSelect.value,
        strength: strengthSelect.value + 'mg',
        price,
        flavorNumber
      });

      this.updateOrderSummary();

      // feedback na przycisku
      const addButton = document.getElementById('add-to-order');
      if (addButton) {
        addButton.textContent = '✓ Dodano!';
        addButton.classList.add('success');
        setTimeout(() => {
          addButton.textContent = 'Dodaj do zamówienia';
          addButton.classList.remove('success');
        }, 1000);
      }
    } catch (e) {
      console.error('Błąd dodawania do zamówienia:', e);
      this.showUserAlert('Wystąpił błąd podczas dodawania produktu', 'error');
    }
  }

  updateOrderSummary() {
    const list = document.getElementById('order-items');
    const totalEl = document.getElementById('order-total');
    const submitBtn = document.getElementById('submit-order');
    if (!list || !totalEl || !submitBtn) return;

    list.innerHTML = '';
    let total = 0;

    // Grupowanie wariantów
    const grouped = this.currentOrder.reduce((acc, item) => {
      const key = `${item.flavorNumber}|${item.size}|${item.strength}`;
      if (!acc[key]) acc[key] = { ...item, quantity: 0, totalPrice: 0 };
      acc[key].quantity += 1;
      acc[key].totalPrice += (item.price || 0);
      return acc;
    }, {});

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const symbol = isMobile ? '×' : 'x';

    const sorted = Object.values(grouped).sort((a,b) =>
      a.flavorNumber - b.flavorNumber || a.size.localeCompare(b.size)
    );

    if (sorted.length === 0) {
      list.innerHTML = '<li class="empty-cart">Twój koszyk jest pusty</li>';
      submitBtn.disabled = true;
      totalEl.textContent = 'Razem: 0zł';
      return;
    }

    sorted.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'order-item';

      const safeName = this.formatFlavorName(item.flavor).split('(')[0].trim();

      li.innerHTML = `
        <div class="order-item-info">
          <div class="flavor-name">
            <span class="flavor-number">${item.flavorNumber}.</span>
            ${safeName}
          </div>
          <div class="item-details">
            (${item.size}, ${item.strength})
            <span class="item-quantity">${item.quantity}${symbol}</span>
          </div>
        </div>
        <div class="order-item-price">${item.totalPrice.toFixed(2)}zł</div>
        <button class="remove-item" aria-label="Usuń produkt">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      `;

      // usuwanie całego wariantu
      li.querySelector('.remove-item').addEventListener('click', () => {
        li.classList.add('removing');
        setTimeout(() => {
          const key = `${item.flavorNumber}|${item.size}|${item.strength}`;
          this.currentOrder = this.currentOrder.filter(i =>
            `${i.flavorNumber}|${i.size}|${i.strength}` !== key
          );
          this.updateOrderSummary();
        }, 250);
      });

      list.appendChild(li);
      total += item.totalPrice;
    });

    totalEl.textContent = `Razem: ${total.toFixed(2)}zł`;
    submitBtn.disabled = false;
    totalEl.classList.add('updated');
    setTimeout(() => totalEl.classList.remove('updated'), 500);
  }

  async submitOrder() {
    try {
      if (this.currentOrder.length === 0) {
        alert('Dodaj przynajmniej jeden produkt do zamówienia!');
        return;
      }

      const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
      const total = this.currentOrder.reduce((s, it) => s + (it.price || 0), 0);
      const notes = document.getElementById('order-notes')?.value || '';

      const orderData = {
        items: [...this.currentOrder],
        total,
        date: new Date().toISOString(),
        status: 'Nowe',
        notes,
        updatedAt: this.database ? firebase.database.ServerValue.TIMESTAMP : Date.now()
      };

      // Zapis do Firebase (jeśli jest), inaczej tylko lokalnie
      if (this.database) {
        await this.database.ref('orders/' + orderNumber).set(orderData);
      }
      this.orders[orderNumber] = orderData;
      localStorage.setItem('orders', JSON.stringify(this.orders));

      // Potwierdzenie
      document.getElementById('order-form').style.display = 'none';
      document.getElementById('order-summary').style.display = 'none';
      document.getElementById('submit-order-container').classList.add('hidden');
      document.getElementById('order-confirmation').style.display = 'block';
      document.getElementById('order-number').textContent = orderNumber;

      this.updateStats();
    } catch (e) {
      console.error('Błąd zapisu zamówienia:', e);
      alert('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Admin
  // ──────────────────────────────────────────────────────────────────────────────
  loginAdmin() {
    try {
      const pass = document.getElementById('admin-password')?.value || '';
      if (pass !== this.adminPassword) {
        alert('Nieprawidłowe hasło!');
        return;
      }
      document.getElementById('admin-content').style.display = 'block';
      // Odśwież staty i mini wykresy
      this.updateStats();
      this.initMiniCharts();
      // Menedżer statusów smaków
      this.renderStockManager();
    } catch (e) {
      console.error('Błąd logowania admina:', e);
    }
  }

  async searchOrder() {
    const id = document.getElementById('order-search')?.value.trim();
    const box = document.getElementById('order-details');
    if (!box) return;

    if (!id) {
      box.innerHTML = '<p class="no-order">Wpisz numer zamówienia</p>';
      return;
    }
    box.innerHTML = '<p class="loading">Wyszukiwanie zamówienia...</p>';

    // najpierw lokalnie
    if (this.orders[id]) {
      this.displayOrderDetails(id, this.orders[id]);
      return;
    }

    // Firebase
    try {
      if (!this.database) throw new Error('Offline');
      const snap = await this.database.ref('orders/' + id).once('value');
      const order = snap.val();
      if (!order) {
        box.innerHTML = '<p class="no-order">Nie znaleziono zamówienia</p>';
        return;
      }
      this.orders[id] = order;
      localStorage.setItem('orders', JSON.stringify(this.orders));
      this.displayOrderDetails(id, order);
    } catch (e) {
      console.warn('Błąd pobierania zamówienia:', e);
      box.innerHTML = '<p class="error">Błąd połączenia z bazą</p>';
    }
  }

  displayOrderDetails(orderId, order) {
    const box = document.getElementById('order-details');
    if (!box) return;

    const itemsHTML = (order.items || []).map(it => `
      <li class="order-item-detail">
        <span class="flavor-number">${it.flavorNumber}.</span>
        ${this.formatFlavorName(it.flavor).split('(')[0].trim()}
        (${it.size}, ${it.strength}) - ${Number(it.price||0).toFixed(2)}zł
      </li>
    `).join('');

    box.innerHTML = `
      <div class="order-header">
        <h3>Zamówienie ${orderId}</h3>
        <p class="order-date"><strong>Data:</strong> ${new Date(order.date).toLocaleString('pl-PL')}</p>
        <p class="order-status"><strong>Status:</strong>
          <span class="status-badge ${this.statusClassFromText(order.status)}">${order.status}</span>
        </p>
        ${order.notes ? `<p class="order-notes"><strong>Uwagi:</strong> ${order.notes}</p>` : ''}

        <h4>Produkty:</h4>
        <ul class="order-items-list">${itemsHTML}</ul>

        <p class="order-total"><strong>Suma:</strong> ${Number(order.total||0).toFixed(2)}zł</p>
      </div>
    `;
  }

  statusClassFromText(t) {
    const s = (t||'').toLowerCase();
    if (s.includes('nowe')) return 'status-new';
    if (s.includes('w trakcie')) return 'status-in-progress';
    if (s.includes('zakończone')) return 'status-completed';
    if (s.includes('anulowane')) return 'status-cancelled';
    return '';
  }

  // Menedżer statusów smaków (w panelu admina)
  renderStockManager() {
    const box = document.getElementById('stock-manager');
    const search = document.getElementById('stock-search');
    if (!box) return;

    const flavors = window.AppData?.flavors || [];
    const q = (search?.value || '').toLowerCase();
    const rows = [];

    flavors.forEach((full, idx) => {
      const title = this.stripBrand(full);
      if (q && !title.toLowerCase().includes(q)) return;
      const slug = this.toSlug(title);
      const st = (this.flavorStatus[slug] || 'available');
      rows.push(`
        <div class="stock-row" data-slug="${slug}" data-index="${idx}">
          <div class="stock-title">${idx+1}. ${title}</div>
          <select class="stock-select form-control">
            <option value="available" ${st==='available'?'selected':''}>Dostępny</option>
            <option value="low" ${st==='low'?'selected':''}>Na wyczerpaniu</option>
            <option value="out" ${st==='out'?'selected':''}>Brak</option>
          </select>
        </div>
      `);
    });

    box.innerHTML = rows.join('') || '<div style="padding:12px;color:#666">Brak wyników…</div>';
    // Listenery
    box.querySelectorAll('.stock-row .stock-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const row = e.target.closest('.stock-row');
        this.updateFlavorStatus(row.dataset.slug, e.target.value);
      });
    });

    if (search && !search._wired) {
      search._wired = true;
      search.addEventListener('input', () => this.renderStockManager());
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Statystyki + wykresy mini
  // ──────────────────────────────────────────────────────────────────────────────
  initBasicStatistics() {
    try {
      this.pageViews = parseInt(localStorage.getItem('pageViews') || '0', 10) || 0;
      this.trackPageView();
    } catch (e) {
      console.warn('Błąd initBasicStatistics:', e);
    }
  }

  trackPageView() {
    this.pageViews += 1;
    localStorage.setItem('pageViews', this.pageViews);
    this.updateStats();
  }

  updateStats() {
    try {
      // Teksty
      const totalOrders = Object.keys(this.orders).length;
      const todayOrders = this.getTodaysOrdersCount();

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('total-orders', totalOrders);
      set('today-orders', todayOrders);
      set('total-views', this.pageViews);

      // Tabela ostatnich
      const recent = Object.entries(this.orders)
        .sort((a,b) => new Date(b[1].date) - new Date(a[1].date))
        .slice(0, 5);

      const tbody = document.getElementById('recent-orders');
      if (tbody) {
        tbody.innerHTML = recent.map(([id, o]) => `
          <tr>
            <td>${id}</td>
            <td>${new Date(o.date).toLocaleDateString('pl-PL')}</td>
            <td>${Number(o.total||0).toFixed(2)}zł</td>
            <td class="status-${this.statusClassFromText(o.status)}">${o.status}</td>
            <td>
              <select class="status-select" data-order-id="${id}">
                <option value="Nowe" ${o.status==='Nowe'?'selected':''}>Nowe</option>
                <option value="W trakcie" ${o.status==='W trakcie'?'selected':''}>W trakcie</option>
                <option value="Zakończone" ${o.status==='Zakończone'?'selected':''}>Zakończone</option>
                <option value="Anulowane" ${o.status==='Anulowane'?'selected':''}>Anulowane</option>
              </select>
              <button class="action-btn save-btn" data-order-id="${id}">Zapisz</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="5">Brak zamówień</td></tr>';

        tbody.querySelectorAll('.save-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-order-id');
            const sel = tbody.querySelector(`.status-select[data-order-id="${id}"]`);
            await this.updateOrderStatus(id, sel.value);
          });
        });
      }

      // Mini wykresy
      setTimeout(() => this.refreshMiniCharts(), 50);
    } catch (e) {
      console.warn('Błąd updateStats:', e);
    }
  }

  getTodaysOrdersCount() {
    const today = new Date().toLocaleDateString();
    return Object.values(this.orders).filter(o =>
      new Date(o.date).toLocaleDateString() === today
    ).length;
  }

  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }));
    }
    return days;
  }

  getOrdersLast7Days() {
    const counts = [0,0,0,0,0,0,0];
    const today = new Date();
    Object.values(this.orders || {}).forEach(o => {
      try {
        const d = new Date(o.date);
        const diff = Math.floor((today - d) / 86400000);
        if (diff >= 0 && diff < 7) counts[6 - diff] += 1;
      } catch {}
    });
    return counts;
  }

  getTopFlavors(limit=5) {
    const flavorCounts = {};
    const all = window.AppData?.flavors || [];
    Object.values(this.orders || {}).forEach(order => {
      (order.items || []).forEach(item => {
        const idx = (item.flavorNumber || 1) - 1;
        const name = this.stripBrand(all[idx] || item.flavor);
        const key = (name || 'Nieznany smak').split('(')[0].trim();
        const qty = Number(item.quantity) || 1;
        flavorCounts[key] = (flavorCounts[key] || 0) + qty;
      });
    });
    return Object.entries(flavorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, limit);
  }

  initMiniCharts() {
    if (typeof Chart === 'undefined') return; // brak Chart.js — pomijamy
    // zniszcz stare
    try { if (this.miniOrdersChart) { this.miniOrdersChart.destroy(); this.miniOrdersChart = null; } } catch {}
    try { if (this.miniFlavorsChart) { this.miniFlavorsChart.destroy(); this.miniFlavorsChart = null; } } catch {}

    const c1 = document.getElementById('miniOrdersChart');
    const c2 = document.getElementById('miniFlavorsChart');
    if (!c1 || !c2) return;

    this.miniOrdersChart = new Chart(c1.getContext('2d'), {
      type: 'bar',
      data: {
        labels: this.getLast7Days(),
        datasets: [{ label: 'Zamówienia (7 dni)', data: this.getOrdersLast7Days(), backgroundColor: 'rgba(255, 111, 97, 0.7)', borderColor: '#ff6f61', borderWidth: 1 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    const top = this.getTopFlavors(5);
    this.miniFlavorsChart = new Chart(c2.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: top.map(f => f.name),
        datasets: [{ data: top.map(f => f.count), backgroundColor: ['#ff6f61','#ff9a9e','#fad0c4','#ffcc00','#45a049'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }

  refreshMiniCharts() {
    if (!this.miniOrdersChart || !this.miniFlavorsChart) {
      this.initMiniCharts();
      return;
    }
    try {
      this.miniOrdersChart.data.labels = this.getLast7Days();
      this.miniOrdersChart.data.datasets[0].data = this.getOrdersLast7Days();
      this.miniOrdersChart.update();

      const top = this.getTopFlavors(5);
      this.miniFlavorsChart.data.labels = top.map(f => f.name);
      this.miniFlavorsChart.data.datasets[0].data = top.map(f => f.count);
      this.miniFlavorsChart.update();
    } catch (e) {
      console.warn('Błąd refreshMiniCharts:', e);
      this.initMiniCharts();
    }
  }

  async updateOrderStatus(orderId, newStatus) {
    try {
      if (this.database) {
        await this.database.ref(`orders/${orderId}/status`).set(newStatus);
        await this.database.ref(`orders/${orderId}/updatedAt`).set(firebase.database.ServerValue.TIMESTAMP);
      }
      if (this.orders[orderId]) {
        this.orders[orderId].status = newStatus;
        this.orders[orderId].updatedAt = Date.now();
        localStorage.setItem('orders', JSON.stringify(this.orders));
      }
      this.updateStats();
      this.showUserAlert('Zaktualizowano status zamówienia', 'success');
    } catch (e) {
      console.error('Błąd aktualizacji statusu zamówienia:', e);
      this.showUserAlert('Błąd aktualizacji statusu', 'error');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Drobne narzędzia
  // ──────────────────────────────────────────────────────────────────────────────
  initScrollButton() {
    try {
      const btn = document.createElement('button');
      btn.className = 'scroll-top-btn';
      btn.innerHTML = '↑';
      btn.setAttribute('aria-label', 'Przewiń do góry');
      document.body.appendChild(btn);
      window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 300));
      btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    } catch {}
  }

  // Dla kompatybilności ze starymi wywołaniami (np. z dawnych longfill)
  addItem({ name, type='Longfill', qty=1 }) {
    try {
      const all = window.AppData?.flavors || [];
      const idx = all.findIndex(f => this.stripBrand(f).toLowerCase() === String(name).toLowerCase());
      const index = (idx >= 0 ? idx : 0);

      // domyślne pola jeśli ktoś wywoła bez rozmiaru/mocy
      const size = '30ml';
      const strength = '12mg';
      const price = this.calculatePrice(size, parseInt(strength,10));

      for (let i=0;i<qty;i++) {
        this.currentOrder.push({
          flavor: all[index] || name,
          size, strength, price, flavorNumber: index + 1
        });
      }
      this.openModal();
      this.updateOrderSummary();
    } catch (e) {
      console.warn('addItem error:', e);
    }
  }
}

// ── Start systemu ───────────────────────────────────────────────────────────────
try {
  window.OrderSystem = new OrderSystem();
} catch (e) {
  console.error('Błąd startu OrderSystem:', e);
}
