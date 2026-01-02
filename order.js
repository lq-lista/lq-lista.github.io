class OrderSystem {
    constructor() {
        try {
            if (typeof AppData === 'undefined') {
                throw new Error('Dane aplikacji (AppData) nie zostały załadowane! Upewnij się, że data.js jest ładowany przed order.js');
            }
    
            // Inicjalizacja właściwości
            this.currentOrder = [];
            this.orders = {};
            this.adminPassword = "admin123";
            this.pageViews = 0;
            this.ordersChart = null;
            this.flavorsChart = null;
            this.miniOrdersChart = null;
            this.miniFlavorsChart = null;
            this.firebaseAvailable = false;
            this.isSyncing = false; // Flaga do kontroli synchronizacji
            
            // 1. Inicjalizacja Firebase
            this.initializeFirebase();
            
            // 2. Inicjalizacja danych lokalnych
            this.initializeLocalData();
            
            // 3. Inicjalizacja UI
            this.initUIComponents();
            
            // 4. Inicjalizacja statystyk (bez wykresów na razie)
            this.initBasicStatistics();
            
            // 5. Nasłuchiwanie zmian w Firebase (tylko raz)
            if (this.database) {
                this.database.ref('orders').on('value', (snapshot) => {
                    try {
                        const firebaseOrders = snapshot.val() || {};
                        
                        // Aktualizuj tylko jeśli są zmiany
                        if (JSON.stringify(this.orders) !== JSON.stringify(firebaseOrders)) {
                            this.orders = firebaseOrders;
                            localStorage.setItem('orders', JSON.stringify(this.orders));
                            this.updateStats();
                        }
                    } catch (error) {
                        console.error('Błąd podczas aktualizacji zamówień:', error);
                    }
                });
            }
    
            // 6. Opóźniona synchronizacja i test połączenia
            if (this.firebaseAvailable) {
                setTimeout(() => {
                    if (!this.isSyncing) {
                        this.isSyncing = true;
                        this.testFirebaseConnection()
                            .then(() => {
                                console.log('Połączenie z Firebase sprawdzone, rozpoczynam synchronizację...');
                                return this.syncLocalOrdersToFirebase();
                            })
                            .catch(e => {
                                console.warn('Błąd podczas synchronizacji:', e);
                                this.isSyncing = false;
                            });
                    }
                }, 2000);
            }
    
        } catch (error) {
            console.error('Błąd inicjalizacji OrderSystem:', error);
            throw error;
        }
    }

    initializeFirebase() {
        try {
            // Sprawdź czy Firebase jest dostępny
            if (typeof firebase === 'undefined' || typeof firebase.initializeApp !== 'function') {
                console.warn('Firebase nie został załadowany');
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
    
            // Inicjalizuj Firebase tylko jeśli nie został jeszcze zainicjalizowany
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.database = firebase.database();
            this.firebaseAvailable = true;
            
        } catch (error) {
            console.error('Błąd inicjalizacji Firebase:', error);
            this.firebaseAvailable = false;
        }
    }

    async testConnection() {
        try {
            if (!this.database) {
                throw new Error('Brak zainicjalizowanej bazy danych');
            }
            await this.database.ref('.info/connected').once('value');
            console.log("Połączenie z Firebase działa poprawnie!");
        } catch (error) {
            console.error("Błąd połączenia z Firebase:", error);
            throw error;
        }
    }

    async initializeLocalData() {
        try {
            const localOrders = localStorage.getItem('orders');
            this.orders = localOrders ? JSON.parse(localOrders) : {};
            
            if (Object.keys(this.orders).length > 0) {
                await this.syncLocalOrdersToFirebase();
            }
        } catch (error) {
            console.error("Błąd inicjalizacji danych lokalnych:", error);
            this.orders = {};
            throw error;
        }
    }

    initUIComponents() {
        try {
            this.initEventListeners();
            this.populateFlavors();
            this.setupPricePreview();
            this.initFlavorFilter();
            this.initScrollButton();
        } catch (error) {
            console.error('Błąd inicjalizacji komponentów UI:', error);
            throw error;
        }
    }

    initStatistics() {
        try {
            this.pageViews = parseInt(localStorage.getItem('pageViews')) || 0;
            this.initCharts();
            this.trackPageView();
        } catch (error) {
            console.error('Błąd inicjalizacji statystyk:', error);
            throw error;
        }
    }

    async syncOrdersFromFirebase() {
        try {
            console.log("Rozpoczynanie synchronizacji z Firebase...");
            const snapshot = await this.database.ref('orders').once('value');
            const firebaseOrders = snapshot.val() || {};
            
            let updated = false;
            
            for (const [orderId, firebaseOrder] of Object.entries(firebaseOrders)) {
                if (!this.orders[orderId] || 
                    (this.orders[orderId].updatedAt || 0) < firebaseOrder.updatedAt) {
                    this.orders[orderId] = firebaseOrder;
                    updated = true;
                }
            }
            
            if (updated) {
                localStorage.setItem('orders', JSON.stringify(this.orders));
                console.log("Zaktualizowano lokalne zamówienia z Firebase");
                this.updateStats(); // Automatyczna aktualizacja statystyk
                this.updateCharts(); // Automatyczna aktualizacja wykresów
            }
            
        } catch (error) {
            console.error("Błąd synchronizacji z Firebase:", error);
            throw error;
        }
    }

    async syncLocalOrdersToFirebase() {
        try {
            console.log("Rozpoczynanie synchronizacji lokalnych zamówień z Firebase...");
            const updates = {};
            
            for (const [orderId, order] of Object.entries(this.orders)) {
                updates[`orders/${orderId}`] = order;
            }
            
            await this.database.ref().update(updates);
            console.log("Zsynchroniczowano lokalne zamówienia z Firebase");
            
        } catch (error) {
            console.error("Błąd synchronizacji lokalnych zamówień:", error);
            throw error;
        }
    }

    async testFirebaseConnection() {
        try {
            const testRef = this.database.ref('connectionTest');
            await testRef.set({
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                message: "Test połączenia z Firebase",
                status: "success"
            });
            
            const snapshot = await testRef.once('value');
            console.log("Test połączenia z Firebase zakończony sukcesem:", snapshot.val());
        } catch (error) {
            console.error("Błąd testu połączenia z Firebase:", error);
            throw error;
        }
    }

    initEventListeners() {
        try {
            document.getElementById('start-order').addEventListener('click', () => {
                this.openModal();
                this.resetScrollPosition();
            });
            
            document.querySelector('.close').addEventListener('click', this.closeModal.bind(this));
            document.getElementById('add-to-order').addEventListener('click', this.addToOrder.bind(this));
            document.getElementById('submit-order').addEventListener('click', this.submitOrder.bind(this));
            document.getElementById('login-admin').addEventListener('click', this.loginAdmin.bind(this));
            document.getElementById('search-order').addEventListener('click', this.searchOrder.bind(this));
            
            window.addEventListener('click', (event) => {
                if (event.target === document.getElementById('order-modal')) {
                    this.closeModal();
                }
            });

            document.getElementById('admin-link').addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('admin-panel').style.display = 'block';
                window.scrollTo({
                    top: document.getElementById('admin-panel').offsetTop,
                    behavior: 'smooth'
                });
            });

            // Obsługa przycisku kopiowania (globalna)
            document.body.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-order-number')) {
                    this.handleCopyOrderNumber(e);
                }
            });

        } catch (error) {
            console.error('Błąd inicjalizacji event listenerów:', error);
            throw error;
        }
    }

    handleCopyOrderNumber(e) {
        try {
            const orderNumber = e.target.closest('.copy-container').querySelector('#order-number').textContent;
            navigator.clipboard.writeText(orderNumber).then(() => {
                const btn = e.target;
                btn.textContent = 'Skopiowano!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = 'Kopiuj';
                    btn.classList.remove('copied');
                }, 2000);
            });
        } catch (error) {
            console.error('Błąd kopiowania numeru zamówienia:', error);
            alert('Nie udało się skopiować numeru zamówienia');
        }
    }

    resetScrollPosition() {
        try {
            const scrollContainer = document.querySelector('.order-scroll-container');
            if (scrollContainer) {
                scrollContainer.scrollTop = 0;
            }
        } catch (error) {
            console.error('Błąd resetowania pozycji scrolla:', error);
        }
    }

    openModal() {
        try {
            document.getElementById('order-modal').style.display = 'block';
            document.body.classList.add('modal-open');
            document.getElementById('order-form').style.display = 'block';
            document.getElementById('order-summary').style.display = 'block';
            document.getElementById('submit-order-container').classList.remove('hidden');
            document.getElementById('order-confirmation').style.display = 'none';
            document.getElementById('order-notes').value = '';
            this.currentOrder = [];
            this.updateOrderSummary();
        } catch (error) {
            console.error('Błąd otwierania modala:', error);
        }
    }
    
    closeModal() {
        try {
            document.getElementById('order-modal').style.display = 'none';
            document.body.classList.remove('modal-open');
        } catch (error) {
            console.error('Błąd zamykania modala:', error);
        }
    }

    initFlavorFilter() {
        try {
            // Sprawdź czy filtry już istnieją
            if (document.getElementById('brand-filter') && document.getElementById('type-filter')) {
                return;
            }
    
            // Dodaj event listeners do istniejących filtrów
            const brandFilter = document.getElementById('brand-filter');
            const typeFilter = document.getElementById('type-filter');
            
            if (brandFilter) brandFilter.addEventListener('change', () => this.filterFlavors());
            if (typeFilter) typeFilter.addEventListener('change', () => this.filterFlavors());
    
            // Jeśli filtry nie istnieją, utwórz je (dla kompatybilności wstecznej)
            if (!brandFilter || !typeFilter) {
                const filterContainer = document.createElement('div');
                filterContainer.className = 'filter-container';
                filterContainer.innerHTML = `
                    <div class="filter-group">
                        <label for="brand-filter">Firma:</label>
                        <select id="brand-filter" class="form-control">
                            <option value="all">Wszystkie firmy</option>
                            <option value="a&l">A&L</option>
                            <option value="tribal">Tribal Force</option>
                            <option value="vapir">Vapir Vape</option>
                            <option value="fighter">Fighter Fuel</option>
                            <option value="izi">IZI PIZI</option>
                            <option value="wanna">WANNA BE COOL</option>
                            <option value="funk">FUNK CLARO</option>
                            <option value="aroma">AROMA KING</option>
                            <option value="dilno">DILNO'S</option>
                            <option value="panda">PANDA</option>
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
    
                const flavorsSection = document.querySelector('.flavors');
                if (flavorsSection) {
                    flavorsSection.insertBefore(filterContainer, document.getElementById('flavors-list'));
                }
    
                // Dodaj event listeners do nowych filtrów
                document.getElementById('brand-filter').addEventListener('change', () => this.filterFlavors());
                document.getElementById('type-filter').addEventListener('change', () => this.filterFlavors());
            }
        } catch (error) {
            console.error('Błąd inicjalizacji filtrów smaków:', error);
        }
    }

    filterFlavors() {
        try {
            const flavorsList = document.getElementById('flavors-list');
            if (!flavorsList) return;
    
            const brandFilter = document.getElementById('brand-filter').value;
            const typeFilter = document.getElementById('type-filter').value;
            const flavors = AppData?.flavors || [];
            const flavorCategories = AppData?.flavorCategories || {};
    
            flavorsList.innerHTML = '';
    
            // Sprawdź czy są jakieś smaki do wyświetlenia
            if (flavors.length === 0) {
                flavorsList.innerHTML = '<li class="error">Brak dostępnych smaków</li>';
                return;
            }
    
            flavors.forEach((flavor, index) => {
                try {
                    // Sprawdź filtr firmy
                    const brandMatch = 
                        brandFilter === 'all' ||
                        (brandFilter === 'a&l' && flavor.includes('(A&L)')) ||
                        (brandFilter === 'tribal' && flavor.includes('(Tribal Force)')) ||
                        (brandFilter === 'vapir' && flavor.includes('(Vapir Vape)')) ||
                        (brandFilter === 'fighter' && flavor.includes('(Fighter Fuel)')) ||
                        (brandFilter === 'izi' && flavor.includes('(IZI PIZI)')) ||
                        (brandFilter === 'wanna' && flavor.includes('(WANNA BE COOL)')) ||
                        (brandFilter === 'funk' && flavor.includes('(FUNK CLARO)')) ||
                        (brandFilter === 'aroma' && flavor.includes('(AROMA KING)')) ||
                        (brandFilter === 'dilno' && flavor.includes('(DILNO\'S)')) ||
                        (brandFilter === 'panda' && flavor.includes('(PANDA)'));
    
                    // Sprawdź filtr typu
                    let typeMatch = typeFilter === 'all';
                    if (!typeMatch) {
                        const typeIndexes = flavorCategories[typeFilter] || [];
                        typeMatch = typeIndexes.includes(index);
                    }
    
                    // Jeśli pasuje do obu filtrów, dodaj do listy
                    if (brandMatch && typeMatch) {
                        const li = document.createElement('li');
                        li.innerHTML = `<span class="flavor-number">${index + 1}.</span> ${this.formatFlavorName(flavor)}`;
                        flavorsList.appendChild(li);
                    }
                } catch (e) {
                    console.warn(`Błąd przetwarzania smaku ${index}:`, e);
                }
            });
    
            // Jeśli nic nie pasuje do filtrów
            if (flavorsList.children.length === 0) {
                flavorsList.innerHTML = '<li class="no-results">Brak smaków pasujących do wybranych filtrów</li>';
            }
    
        } catch (error) {
            console.error('Błąd filtrowania smaków:', error);
            const flavorsList = document.getElementById('flavors-list');
            if (flavorsList) {
                flavorsList.innerHTML = '<li class="error">Błąd podczas filtrowania smaków</li>';
            }
        }
    }
    
    formatFlavorName(flavor) {
        try {
            if (!flavor) return '';
            return String(flavor)
                .replace(/\s+/g, ' ')
                .replace(/\s,/g, ',')
                .replace(/\s\(/g, ' (');
        } catch (e) {
            console.warn('Błąd formatowania nazwy smaku:', flavor, e);
            return String(flavor);
        }
    }
    
    populateFlavors() {
        try {
            const select = document.getElementById('flavor-select');
            if (!select) {
                console.error('Element #flavor-select nie znaleziony');
                return;
            }
            
            select.innerHTML = '<option value="">Wybierz smak</option>';
            
            (AppData?.flavors || []).forEach((flavor, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${index + 1}. ${this.formatFlavorName(flavor)}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Błąd wypełniania listy smaków:', error);
        }
    }
    
    setupPricePreview() {
        try {
            if (document.getElementById('price-preview')) return;
            
            const pricePreview = document.createElement('div');
            pricePreview.id = 'price-preview';
            pricePreview.textContent = 'Cena: -';
            document.getElementById('strength-select').insertAdjacentElement('afterend', pricePreview);
            
            [document.getElementById('flavor-select'), 
             document.getElementById('size-select'), 
             document.getElementById('strength-select')].forEach(select => {
                if (select) {
                    select.addEventListener('change', () => this.updatePricePreview());
                }
            });
        } catch (error) {
            console.error('Błąd ustawiania podglądu ceny:', error);
        }
    }

    updatePricePreview() {
        try {
            const size = document.getElementById('size-select').value;
            const strength = document.getElementById('strength-select').value;
            const pricePreview = document.getElementById('price-preview');
            
            if (!pricePreview) return;
            
            if (size && strength) {
                const price = this.calculatePrice(size, strength);
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
    
    addToOrder() {
        try {
            const flavorSelect = document.getElementById('flavor-select');
            const sizeSelect = document.getElementById('size-select');
            const strengthSelect = document.getElementById('strength-select');
            
            // Walidacja
            if (!flavorSelect.value) {
                this.showValidationError(flavorSelect, 'Proszę wybrać smak');
                return;
            }
            
            if (!sizeSelect.value) {
                this.showValidationError(sizeSelect, 'Proszę wybrać pojemność');
                return;
            }
            
            if (!strengthSelect.value) {
                this.showValidationError(strengthSelect, 'Proszę wybrać moc nikotyny');
                return;
            }
            
            // Resetowanie błędów
            this.resetValidationErrors([flavorSelect, sizeSelect, strengthSelect]);
            
            // Reszta istniejącej logiki
            const flavors = AppData?.flavors || [];
            if (!flavors[flavorSelect.value]) {
                throw new Error(`Nie znaleziono smaku o indeksie ${flavorSelect.value}`);
            }
            
            const price = this.calculatePrice(sizeSelect.value, strengthSelect.value);
            const flavorName = flavors[flavorSelect.value];
            
            this.currentOrder.push({
                flavor: flavorName,
                size: sizeSelect.value,
                strength: strengthSelect.value + 'mg',
                price,
                flavorNumber: parseInt(flavorSelect.value) + 1
            });
            
            this.updateOrderSummary();

            // ★★★★★ TUTAJ WKŁADAMY NOWY KOD ★★★★★
        const addButton = document.getElementById('add-to-order');
        addButton.textContent = '✓ Dodano!';
        addButton.classList.add('success');
        setTimeout(() => {
            addButton.textContent = 'Dodaj do zamówienia';
            addButton.classList.remove('success');
        }, 2000);
        // ★★★★★ KONIEC NOWEGO KODU ★★★★★
            
        } catch (error) {
            console.error('Błąd dodawania do zamówienia:', error);
            this.showUserAlert('Wystąpił błąd podczas dodawania produktu. Spróbuj ponownie.', 'error');
        }
    }
    
    // Nowe metody pomocnicze
    showValidationError(element, message) {
        const errorElement = element.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = message;
            element.parentNode.insertBefore(errorMsg, element.nextSibling);
        }
        element.classList.add('error-input');
    }
    
    resetValidationErrors(elements) {
        elements.forEach(el => {
            el.classList.remove('error-input');
            const errorMsg = el.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.remove();
            }
        });
    }
    
    showUserAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `user-alert ${type}`;
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
    
    calculatePrice(size, strength) {
        try {
            const strengthNum = parseInt(strength);
            let price;

            if (size === '15ml') {
                 return 17;
            }
            
            if (size === '10ml') {
                price = strengthNum >= 18 ? 16 : (strengthNum >= 12 ? 15 : (strengthNum >= 6 ? 14 : 13));
            } else if (size === '30ml') {
                price = strengthNum >= 18 ? 40 : (strengthNum >= 12 ? 38 : (strengthNum >= 6 ? 37 : 36));
            } else { // 60ml
                price = strengthNum >= 18 ? 70 : (strengthNum >= 12 ? 68 : (strengthNum >= 6 ? 67 : 66));
            }
            
            return price;
        } catch (error) {
            console.error('Błąd obliczania ceny:', error);
            return 0;
        }
    }
    
    updateOrderSummary() {
        try {
            const itemsList = document.getElementById('order-items');
            const orderTotal = document.getElementById('order-total');
            const submitButton = document.getElementById('submit-order');
            
            if (!itemsList || !orderTotal || !submitButton) return;
            
            // Resetowanie listy
            itemsList.innerHTML = '';
            let total = 0;
            
            // Grupowanie przedmiotów z poprawioną obsługą błędów
            const groupedItems = this.currentOrder.reduce((acc, item) => {
                try {
                    if (!item || !item.flavorNumber || !item.size || !item.strength) {
                        console.warn('Nieprawidłowy przedmiot w zamówieniu:', item);
                        return acc;
                    }
                    
                    const key = `${item.flavorNumber}-${item.size}-${item.strength}`;
                    if (!acc[key]) {
                        acc[key] = {
                            ...item,
                            quantity: 0,
                            totalPrice: 0
                        };
                    }
                    acc[key].quantity++;
                    acc[key].totalPrice += item.price || 0;
                    return acc;
                } catch (e) {
                    console.error('Błąd podczas grupowania przedmiotu:', e);
                    return acc;
                }
            }, {});
            
            // Sprawdzanie typu urządzenia
            const isMobile = window.matchMedia("(max-width: 768px)").matches;
            const quantitySymbol = isMobile ? '×' : 'x';
            
            // Sortowanie przedmiotów przed wyświetleniem
            const sortedItems = Object.values(groupedItems).sort((a, b) => 
                a.flavorNumber - b.flavorNumber || a.size.localeCompare(b.size)
            );
            
            // Renderowanie przedmiotów
            if (sortedItems.length === 0) {
                itemsList.innerHTML = '<li class="empty-cart">Twój koszyk jest pusty</li>';
                submitButton.disabled = true;
                orderTotal.textContent = 'Razem: 0zł';
                return;
            }
            
            sortedItems.forEach((item) => {
                const li = document.createElement('li');
                li.className = 'order-item';
                
                // Bezpieczne formatowanie nazwy smaku
                const flavorName = this.formatFlavorName(item.flavor || '')
                    .split('(')[0]
                    .trim();
                
                li.innerHTML = `
                    <div class="order-item-info">
                        <div class="flavor-name">
                            <span class="flavor-number">${item.flavorNumber}.</span>
                            ${flavorName}
                        </div>
                        <div class="item-details">
                            (${item.size}, ${item.strength})
                            <span class="item-quantity">${item.quantity}${quantitySymbol}</span>
                        </div>
                    </div>
                    <div class="order-item-price">${item.totalPrice.toFixed(2)}zł</div>
                    <button class="remove-item" aria-label="Usuń produkt">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                `;
                
                // Obsługa usuwania z animacją
                li.querySelector('.remove-item').addEventListener('click', () => {
                    li.classList.add('removing');
                    setTimeout(() => {
                        this.currentOrder = this.currentOrder.filter(i => 
                            `${i.flavorNumber}-${i.size}-${i.strength}` !== `${item.flavorNumber}-${item.size}-${i.strength}`
                        );
                        this.updateOrderSummary();
                    }, 300);
                });
                
                itemsList.appendChild(li);
                total += item.totalPrice;
            });
            
            // Aktualizacja podsumowania
            orderTotal.textContent = `Razem: ${total.toFixed(2)}zł`;
            submitButton.disabled = false;
            
            // Animacja zmian
            orderTotal.classList.add('updated');
            setTimeout(() => orderTotal.classList.remove('updated'), 500);
            
        } catch (error) {
            console.error('Błąd aktualizacji podsumowania zamówienia:', error);
            this.showUserAlert('Wystąpił błąd podczas aktualizacji koszyka', 'error');
        }
    }
    
    async submitOrder() {
        try {
            if (this.currentOrder.length === 0) {
                alert('Dodaj przynajmniej jeden produkt do zamówienia!');
                return;
            }
            
            const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
            const total = this.currentOrder.reduce((sum, item) => sum + item.price, 0);
            const notes = document.getElementById('order-notes').value;
            
            const orderData = {
                items: [...this.currentOrder],
                total,
                date: new Date().toISOString(),
                status: 'Nowe',
                notes: notes,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Zapisz do Firebase
            await this.database.ref('orders/' + orderNumber).set(orderData);
            
            // Aktualizuj lokalną kopię
            this.orders[orderNumber] = orderData;
            localStorage.setItem('orders', JSON.stringify(this.orders));
            
            // Pokaż potwierdzenie z przyciskiem kopiowania
            document.getElementById('order-form').style.display = 'none';
            document.getElementById('order-summary').style.display = 'none';
            document.getElementById('submit-order-container').classList.add('hidden');
            document.getElementById('order-confirmation').style.display = 'block';
            
            const orderNumberElement = document.getElementById('order-number');
            orderNumberElement.textContent = orderNumber;
            
            console.log("Zamówienie zapisane:", orderNumber);
            this.updateStats();
            
        } catch (error) {
            console.error("Błąd zapisu zamówienia:", error);
            alert('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
        }
    }
    
    loginAdmin() {
        try {
            const password = document.getElementById('admin-password').value;
            if (password === this.adminPassword) {
                document.getElementById('admin-content').style.display = 'block';
                this.updateStats(); // Dodano automatyczne ładowanie statystyk
                this.initCharts(); // Dodano automatyczne inicjalizowanie wykresów
            } else {
                alert('Nieprawidłowe hasło!');
            }
        } catch (error) {
            console.error('Błąd logowania admina:', error);
        }
    }
    
    async searchOrder() {
        try {
            const orderNumber = document.getElementById('order-search').value.trim();
            const orderDetails = document.getElementById('order-details');
            
            if (!orderNumber) {
                orderDetails.innerHTML = '<p class="no-order">Wpisz numer zamówienia</p>';
                return;
            }
            
            orderDetails.innerHTML = '<p class="loading">Wyszukiwanie zamówienia...</p>';
            this.updateStats();
            
            // Szukaj najpierw lokalnie
            if (this.orders[orderNumber]) {
                this.displayOrderDetails(orderNumber, this.orders[orderNumber]);
                return;
            }
            
            // Jeśli nie znaleziono lokalnie, sprawdź Firebase
            const snapshot = await this.database.ref('orders/' + orderNumber).once('value');
            const order = snapshot.val();
            
            if (!order) {
                orderDetails.innerHTML = '<p class="no-order">Nie znaleziono zamówienia</p>';
                return;
            }
            
            // Zapisz w lokalnej kopii i wyświetl
            this.orders[orderNumber] = order;
            localStorage.setItem('orders', JSON.stringify(this.orders));
            this.displayOrderDetails(orderNumber, order);
            
        } catch (error) {
            console.error("Błąd wyszukiwania:", error);
            const orderDetails = document.getElementById('order-details');
            if (orderDetails) {
                orderDetails.innerHTML = '<p class="error">Błąd połączenia z bazą</p>';
            }
        }
    }
    
    displayOrderDetails(orderNumber, order) {
        try {
            const orderDetails = document.getElementById('order-details');
            if (!orderDetails) return;
            
            const orderHTML = `
                <div class="order-header">
                    <h3>Zamówienie ${orderNumber}</h3>
                    <p class="order-date"><strong>Data:</strong> ${new Date(order.date).toLocaleString()}</p>
                    <p class="order-status"><strong>Status:</strong> 
                        <span class="status-badge ${order.status.toLowerCase().replace(' ', '-')}">
                            ${order.status}
                        </span>
                    </p>
                    ${order.notes ? `<p class="order-notes"><strong>Uwagi:</strong> ${order.notes}</p>` : ''}
                    
                    <h4>Produkty:</h4>
                    <ul class="order-items-list">
                        ${order.items.map(item => `
                            <li class="order-item-detail">
                                <span class="flavor-number">${item.flavorNumber}.</span> 
                                ${this.formatFlavorName(item.flavor).split('(')[0].trim()} 
                                (${item.size}, ${item.strength}) - ${item.price}zł
                            </li>
                        `).join('')}
                    </ul>
                    
                    <p class="order-total"><strong>Suma:</strong> ${order.total}zł</p>
                </div>
            `;
            
            orderDetails.innerHTML = orderHTML;
            
            document.getElementById('update-status').addEventListener('click', async () => {
                try {
                    const newStatus = document.getElementById('status-select').value;
                    
                    // Aktualizuj w Firebase
                    await this.database.ref(`orders/${orderNumber}/status`).set(newStatus);
                    await this.database.ref(`orders/${orderNumber}/updatedAt`).set(firebase.database.ServerValue.TIMESTAMP);
                    
                    // Aktualizuj lokalnie
                    this.orders[orderNumber].status = newStatus;
                    this.orders[orderNumber].updatedAt = Date.now();
                    localStorage.setItem('orders', JSON.stringify(this.orders));
                    
                    // Odśwież widok
                    this.displayOrderDetails(orderNumber, this.orders[orderNumber]);
                    this.updateStats();
                    alert('Status zamówienia został zaktualizowany!');
                    
                } catch (error) {
                    console.error("Błąd aktualizacji statusu:", error);
                    alert("Wystąpił błąd podczas aktualizacji statusu");
                }
            });
        } catch (error) {
            console.error('Błąd wyświetlania szczegółów zamówienia:', error);
        }
    }

    initScrollButton() {
        try {
            const scrollBtn = document.createElement('button');
            scrollBtn.className = 'scroll-top-btn';
            scrollBtn.innerHTML = '↑';
            scrollBtn.setAttribute('aria-label', 'Przewiń do góry');
            document.body.appendChild(scrollBtn);
            
            window.addEventListener('scroll', () => {
                scrollBtn.classList.toggle('show', window.scrollY > 300);
            });
            
            scrollBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        } catch (error) {
            console.error('Błąd inicjalizacji przycisku scrolla:', error);
        }
    }

    trackPageView() {
        try {
            this.pageViews++;
            localStorage.setItem('pageViews', this.pageViews);
            this.updateStats();
        } catch (error) {
            console.error('Błąd śledzenia odwiedzin:', error);
        }
    }

    initCharts() {
        // Funkcja pomocnicza do niszczenia wykresów
        const destroyChart = (chartInstance, chartName) => {
            if (chartInstance instanceof Chart) {
                try {
                    chartInstance.destroy();
                    console.log(`Pomyślnie zniszczono wykres ${chartName}`);
                } catch (e) {
                    console.warn(`Błąd niszczenia wykresu ${chartName}:`, e);
                }
            }
            return null;
        };
    
        // Najpierw zniszcz istniejące mini wykresy
        this.miniOrdersChart = destroyChart(this.miniOrdersChart, 'mini zamówień');
        this.miniFlavorsChart = destroyChart(this.miniFlavorsChart, 'mini smaków');
    
        try {
            // Pobierz elementy canvas dla mini wykresów
            const miniOrdersCanvas = document.getElementById('miniOrdersChart');
            const miniFlavorsCanvas = document.getElementById('miniFlavorsChart');
            
            if (!miniOrdersCanvas || !miniFlavorsCanvas) {
                console.warn('Nie znaleziono elementów canvas dla mini wykresów');
                return;
            }
    
            // Sprawdź czy canvasy są gotowe do użycia
            if (miniOrdersCanvas.__chart || miniFlavorsCanvas.__chart) {
                console.warn('Canvas jest już używany - ponawiam próbę za 300ms');
                setTimeout(() => this.initCharts(), 300);
                return;
            }
    
            // Przygotuj dane
            const last7Days = this.getLast7Days();
            const ordersData = this.getOrdersLast7Days();
            const topFlavors = this.getTopFlavors(5);
    
            // Oznacz canvasy jako używane
            miniOrdersCanvas.__chart = true;
            miniFlavorsCanvas.__chart = true;
    
            // Utwórz nowe mini wykresy
            this.miniOrdersChart = new Chart(miniOrdersCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Zamówienia z ostatnich 7 dni',
                        data: ordersData,
                        backgroundColor: 'rgba(255, 111, 97, 0.7)',
                        borderColor: '#ff6f61',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
    
            this.miniFlavorsChart = new Chart(miniFlavorsCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: topFlavors.map(f => f.name),
                    datasets: [{
                        data: topFlavors.map(f => f.count),
                        backgroundColor: [
                            '#ff6f61',
                            '#ff9a9e',
                            '#fad0c4',
                            '#ffcc00',
                            '#45a049'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            });
    
            // Ustaw obsługę zakończenia animacji
            this.miniOrdersChart.options.animation = {
                onComplete: () => {
                    if (miniOrdersCanvas) miniOrdersCanvas.__chart = this.miniOrdersChart;
                }
            };
            
            this.miniFlavorsChart.options.animation = {
                onComplete: () => {
                    if (miniFlavorsCanvas) miniFlavorsCanvas.__chart = this.miniFlavorsChart;
                }
            };
    
        } catch (error) {
            console.error('Krytyczny błąd inicjalizacji mini wykresów:', error);
            // W przypadku błędu oznacz canvasy jako nieużywane
            const miniOrdersCanvas = document.getElementById('miniOrdersChart');
            const miniFlavorsCanvas = document.getElementById('miniFlavorsChart');
            if (miniOrdersCanvas) miniOrdersCanvas.__chart = false;
            if (miniFlavorsCanvas) miniFlavorsCanvas.__chart = false;
        }
    }
    
    // Nowe metody pomocnicze:
    
    prepareChartData() {
        try {
            const last7Days = this.getLast7Days().map(String);
            const ordersData = this.getOrdersLast7Days().map(Number);
            const topFlavors = this.getTopFlavors(5);
    
            if (!last7Days.length || !ordersData.length || !topFlavors.length) {
                return null;
            }
    
            return {
                labels: last7Days,
                ordersData: ordersData,
                topFlavors: topFlavors
            };
        } catch (error) {
            console.error('Błąd przygotowywania danych wykresów:', error);
            return null;
        }
    }
    
    createOrdersChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Zamówienia z ostatnich 7 dni',
                    data: data.ordersData,
                    borderColor: '#ff6f61',
                    backgroundColor: 'rgba(255, 111, 97, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    }
    
    createFlavorsChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.topFlavors.map(f => f.name),
                datasets: [{
                    data: data.topFlavors.map(f => f.count),
                    backgroundColor: [
                        '#ff6f61',
                        '#ff9a9e',
                        '#fad0c4',
                        '#ffcc00',
                        '#45a049'
                    ],
                    borderWidth: 1,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { size: 12 },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
    
    setChartAnimationHandlers() {
        if (this.ordersChart) {
            this.ordersChart.options.animation = {
                onComplete: () => {
                    const canvas = document.getElementById('ordersChart');
                    if (canvas) canvas.__chart = this.ordersChart;
                }
            };
        }
        
        if (this.flavorsChart) {
            this.flavorsChart.options.animation = {
                onComplete: () => {
                    const canvas = document.getElementById('flavorsChart');
                    if (canvas) canvas.__chart = this.flavorsChart;
                }
            };
        }
    }
    
    cleanupFailedCharts() {
        const ordersCanvas = document.getElementById('ordersChart');
        const flavorsCanvas = document.getElementById('flavorsChart');
        
        if (ordersCanvas) ordersCanvas.__chart = null;
        if (flavorsCanvas) flavorsCanvas.__chart = null;
        
        this.ordersChart = null;
        this.flavorsChart = null;
    }

    updateStats() {
        try {
            // 1. Aktualizacja statystyk tekstowych
            const totalOrders = Object.keys(this.orders).length;
            const todayOrders = this.getTodaysOrdersCount();
            
            // Bezpieczna aktualizacja UI
            const safeUpdate = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                    element.style.animation = 'pulse 0.5s'; // Efekt wizualny
                    setTimeout(() => element.style.animation = '', 500);
                }
            };
            
            safeUpdate('total-orders', totalOrders);
            safeUpdate('today-orders', todayOrders);
            safeUpdate('total-views', this.pageViews);
    
            // 2. Aktualizacja ostatnich zamówień
            const recentOrders = Object.entries(this.orders)
                .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
                .slice(0, 5);
    
            const recentOrdersContainer = document.getElementById('recent-orders');
            if (recentOrdersContainer) {
                recentOrdersContainer.innerHTML = recentOrders.map(([orderId, order]) => `
                    <tr>
                        <td>${orderId}</td>
                        <td>${new Date(order.date).toLocaleDateString('pl-PL')}</td>
                        <td>${order.total}zł</td>
                        <td class="status-${order.status.toLowerCase()}">${order.status}</td>
                    </tr>
                `).join('') || '<tr><td colspan="4">Brak danych</td></tr>';
            }
    
            // 3. Aktualizacja wykresów
            this.updateCharts();
    
        } catch (error) {
            console.error('Błąd podczas aktualizacji statystyk:', error);
        }
    }

    updateCharts() {
        if (!this.ordersChart || !this.flavorsChart) {
            this.initCharts();
            return;
        }

        try {
            const last7Days = this.getLast7Days();
            const ordersData = this.getOrdersLast7Days();
            const topFlavors = this.getTopFlavors(5);

            // Sprawdź czy wykresy są prawidłowe
            if (this.isChartValid(this.ordersChart)) {
                this.ordersChart.data.labels = last7Days;
                this.ordersChart.data.datasets[0].data = ordersData;
                this.ordersChart.update();
            }

            if (this.isChartValid(this.flavorsChart)) {
                this.flavorsChart.data.labels = topFlavors.map(f => String(f.name));
                this.flavorsChart.data.datasets[0].data = topFlavors.map(f => Number(f.count));
                this.flavorsChart.update();
            }

        } catch (error) {
            console.error('Błąd aktualizacji wykresów:', error);
            this.initCharts(); // Próba ponownej inicjalizacji
        }
    }

    isChartValid(chart) {
        return chart instanceof Chart && 
               typeof chart.update === 'function' &&
               chart.data && 
               chart.data.datasets &&
               chart.data.datasets.length > 0;
    }

    getLast7Days() {
        try {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                days.push(date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }));
            }
            return days.map(String);
        } catch (error) {
            console.error('Błąd generowania dni:', error);
            return ['Błąd', '', '', '', '', '', ''];
        }
    }

    getOrdersLast7Days() {
        try {
            const counts = [0, 0, 0, 0, 0, 0, 0];
            const today = new Date();
            
            Object.values(this.orders || {}).forEach(order => {
                try {
                    const orderDate = new Date(order.date);
                    const diffDays = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays >= 0 && diffDays < 7) {
                        counts[6 - diffDays]++;
                    }
                } catch (e) {
                    console.warn('Błąd przetwarzania zamówienia:', order, e);
                }
            });
            
            return counts;
        } catch (error) {
            console.error('Błąd obliczania zamówień:', error);
            return [0, 0, 0, 0, 0, 0, 0];
        }
    }

    getTopFlavors(limit = 5) {
        const flavorCounts = {};
        
        try {
            // Używamy AppData.flavors jako źródła danych
            const allFlavors = AppData?.flavors || [];
            const orders = this.orders || {};
            
            Object.values(orders).forEach(order => {
                try {
                    if (order?.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            try {
                                if (item?.flavor) {
                                    // Szukamy pełnej nazwy smaku na podstawie flavorNumber
                                    const flavorIndex = (item.flavorNumber || 1) - 1;
                                    const flavorName = allFlavors[flavorIndex] || item.flavor;
                                    const formattedName = this.formatFlavorName(flavorName).split('(')[0].trim();
                                    
                                    if (formattedName) {
                                        const quantity = Number(item.quantity) || 1;
                                        flavorCounts[formattedName] = (flavorCounts[formattedName] || 0) + quantity;
                                    }
                                }
                            } catch (itemError) {
                                console.warn('Błąd przetwarzania pozycji:', item, itemError);
                            }
                        });
                    }
                } catch (orderError) {
                    console.warn('Błąd przetwarzania zamówienia:', order, orderError);
                }
            });
        } catch (error) {
            console.error('Błąd przetwarzania zamówień:', error);
        }
        
        // Zawsze zwracamy poprawną strukturę danych
        const result = Object.entries(flavorCounts)
            .map(([name, count]) => ({ 
                name: String(name || 'Nieznany smak'), 
                count: Number(count) || 0 
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    
        return result.length > 0 ? result : [{ name: 'Brak danych', count: 0 }];
    }
    
    getValidatedFlavors() {
        try {
            const flavors = this.getTopFlavors(5);
            return {
                valid: true, // Zawsze zwracamy true, aby pokazać wykres
                data: flavors
            };
        } catch (e) {
            console.warn('Błąd walidacji smaków:', e);
            return {
                valid: true,
                data: [{ name: 'Brak danych', count: 0 }]
            };
        }
    }

    updateStats() {
        try {
            // 1. Aktualizacja statystyk tekstowych
            const totalOrders = Object.keys(this.orders).length;
            const todayOrders = this.getTodaysOrdersCount();
            
            document.getElementById('total-orders').textContent = totalOrders;
            document.getElementById('today-orders').textContent = todayOrders;
            document.getElementById('total-views').textContent = this.pageViews;
    
            // 2. Aktualizacja ostatnich zamówień
            const recentOrders = Object.entries(this.orders)
                .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
                .slice(0, 5);
                
            document.getElementById('recent-orders').innerHTML = recentOrders.map(([orderId, order]) => `
                <tr>
                    <td>${orderId}</td>
                    <td>${new Date(order.date).toLocaleDateString('pl-PL')}</td>
                    <td>${order.total}zł</td>
                    <td class="status-${order.status.toLowerCase()}">${order.status}</td>
                    <td>
                        <select class="status-select" data-order-id="${orderId}">
                            <option value="Nowe" ${order.status === 'Nowe' ? 'selected' : ''}>Nowe</option>
                            <option value="W trakcie" ${order.status === 'W trakcie' ? 'selected' : ''}>W trakcie</option>
                            <option value="Zakończone" ${order.status === 'Zakończone' ? 'selected' : ''}>Zakończone</option>
                            <option value="Anulowane" ${order.status === 'Anulowane' ? 'selected' : ''}>Anulowane</option>
                        </select>
                        <button class="action-btn save-btn" data-order-id="${orderId}">Zapisz</button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="5">Brak zamówień</td></tr>';
    
            // 3. Dodanie event listenerów
            document.querySelectorAll('.save-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = e.target.getAttribute('data-order-id');
                    const select = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
                    this.updateOrderStatus(orderId, select.value);
                });
            });
    
            // 4. Opóźniona aktualizacja wykresów (zabezpieczenie przed wyścigiem)
            setTimeout(() => {
                if (!this.miniOrdersChart || !this.miniFlavorsChart) {
                    this.initMiniCharts();
                } else {
                    try {
                        this.miniOrdersChart.data.labels = this.getLast7Days();
                        this.miniOrdersChart.data.datasets[0].data = this.getOrdersLast7Days();
                        this.miniOrdersChart.update();
                        
                        this.miniFlavorsChart.data.labels = this.getTopFlavors(5).map(f => f.name);
                        this.miniFlavorsChart.data.datasets[0].data = this.getTopFlavors(5).map(f => f.count);
                        this.miniFlavorsChart.update();
                    } catch (error) {
                        console.error('Błąd aktualizacji mini wykresów:', error);
                        this.initMiniCharts(); // Próba ponownej inicjalizacji
                    }
                }
            }, 100);
        } catch (error) {
            console.error('Błąd aktualizacji statystyk:', error);
        }
    }

    getTodaysOrdersCount() {
        const today = new Date().toLocaleDateString();
        return Object.values(this.orders).filter(order => {
            return new Date(order.date).toLocaleDateString() === today;
        }).length;
    }

    initBasicStatistics() {
        try {
            this.pageViews = parseInt(localStorage.getItem('pageViews')) || 0;
            this.trackPageView();
        } catch (error) {
            console.error('Błąd inicjalizacji statystyk:', error);
        }
    }

    // Dodaj nową metodę do inicjalizacji mini wykresów
    initMiniCharts() {
        // Najpierw zniszcz istniejące wykresy jeśli są
        if (this.miniOrdersChart instanceof Chart) {
            this.miniOrdersChart.destroy();
            this.miniOrdersChart = null;
        }
        if (this.miniFlavorsChart instanceof Chart) {
            this.miniFlavorsChart.destroy();
            this.miniFlavorsChart = null;
        }
    
        // Sprawdź czy elementy canvas istnieją i nie są już używane
        const miniOrdersCanvas = document.getElementById('miniOrdersChart');
        const miniFlavorsCanvas = document.getElementById('miniFlavorsChart');
        
        if (!miniOrdersCanvas || !miniFlavorsCanvas) {
            console.warn('Elementy canvas dla mini wykresów nie istnieją');
            return;
        }
    
        // Dodatkowe sprawdzenie czy canvas nie jest już używany
        if (miniOrdersCanvas.__chart || miniFlavorsCanvas.__chart) {
            console.warn('Canvas jest już używany - odczekaj przed ponowną inicjalizacją');
            return;
        }
    
        try {
            // Oznacz canvasy jako używane
            miniOrdersCanvas.__chart = true;
            miniFlavorsCanvas.__chart = true;
    
            // Inicjalizacja wykresów
            this.miniOrdersChart = new Chart(miniOrdersCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: this.getLast7Days(),
                    datasets: [{
                        label: 'Zamówienia z ostatnich 7 dni',
                        data: this.getOrdersLast7Days(),
                        backgroundColor: 'rgba(255, 111, 97, 0.7)',
                        borderColor: '#ff6f61',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
    
            this.miniFlavorsChart = new Chart(miniFlavorsCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: this.getTopFlavors(5).map(f => f.name),
                    datasets: [{
                        data: this.getTopFlavors(5).map(f => f.count),
                        backgroundColor: [
                            '#ff6f61',
                            '#ff9a9e',
                            '#fad0c4',
                            '#ffcc00',
                            '#45a049'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            });
        } catch (error) {
            console.error('Błąd inicjalizacji mini wykresów:', error);
            // W przypadku błędu oznacz canvasy jako nieużywane
            if (miniOrdersCanvas) miniOrdersCanvas.__chart = false;
            if (miniFlavorsCanvas) miniFlavorsCanvas.__chart = false;
        }
    }

    // Nowa metoda do aktualizacji statusu
    async updateOrderStatus(orderId, newStatus) {
        try {
            // Aktualizacja w Firebase
            await this.database.ref(`orders/${orderId}/status`).set(newStatus);
            await this.database.ref(`orders/${orderId}/updatedAt`).set(firebase.database.ServerValue.TIMESTAMP);
            
            // Aktualizacja lokalna
            if (this.orders[orderId]) {
                this.orders[orderId].status = newStatus;
                this.orders[orderId].updatedAt = Date.now();
                localStorage.setItem('orders', JSON.stringify(this.orders));
            }
            
            // Odświeżenie widoku
            this.updateStats();
            alert('Status zamówienia został zaktualizowany!');
        } catch (error) {
            console.error('Błąd aktualizacji statusu:', error);
            alert('Wystąpił błąd podczas aktualizacji statusu');
        }
    }

    // Zaktualizowana metoda updateStats
    updateStats() {
        try {
            // 1. Aktualizacja statystyk tekstowych
            const totalOrders = Object.keys(this.orders).length;
            const todayOrders = this.getTodaysOrdersCount();
            
            document.getElementById('total-orders').textContent = totalOrders;
            document.getElementById('today-orders').textContent = todayOrders;
            document.getElementById('total-views').textContent = this.pageViews;
    
            // 2. Aktualizacja ostatnich zamówień
            const recentOrders = Object.entries(this.orders)
                .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
                .slice(0, 5);
                
            const recentOrdersHTML = recentOrders.map(([orderId, order]) => `
                <tr>
                    <td>${orderId}</td>
                    <td>${new Date(order.date).toLocaleDateString('pl-PL')}</td>
                    <td>${order.total}zł</td>
                    <td class="status-${order.status.toLowerCase().replace(' ', '-')}">
                        ${order.status}
                    </td>
                    <td>
                        <select class="status-select" data-order-id="${orderId}">
                            <option value="Nowe" ${order.status === 'Nowe' ? 'selected' : ''}>Nowe</option>
                            <option value="W trakcie" ${order.status === 'W trakcie' ? 'selected' : ''}>W trakcie</option>
                            <option value="Zakończone" ${order.status === 'Zakończone' ? 'selected' : ''}>Zakończone</option>
                            <option value="Anulowane" ${order.status === 'Anulowane' ? 'selected' : ''}>Anulowane</option>
                        </select>
                        <button class="action-btn save-btn" data-order-id="${orderId}">Zapisz</button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="5">Brak zamówień</td></tr>';
            
            document.getElementById('recent-orders').innerHTML = recentOrdersHTML;
    
            // 3. Dodanie event listenerów do przycisków
            document.querySelectorAll('.save-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = e.target.getAttribute('data-order-id');
                    const select = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
                    this.updateOrderStatus(orderId, select.value);
                });
            });
    
            // 4. Aktualizacja mini wykresów (zostawiamy oba)
            if (this.miniOrdersChart && this.miniFlavorsChart) {
                this.miniOrdersChart.data.labels = this.getLast7Days();
                this.miniOrdersChart.data.datasets[0].data = this.getOrdersLast7Days();
                this.miniOrdersChart.update();
                
                this.miniFlavorsChart.data.labels = this.getTopFlavors(5).map(f => f.name);
                this.miniFlavorsChart.data.datasets[0].data = this.getTopFlavors(5).map(f => f.count);
                this.miniFlavorsChart.update();
            } else {
                this.initMiniCharts();
            }
    
        } catch (error) {
            console.error('Błąd aktualizacji statystyk:', error);
        }
    }
}

// Bezpieczna inicjalizacja systemu
try {
    const orderSystem = new OrderSystem();
} catch (error) {
    console.error('Błąd inicjalizacji systemu zamówień:', error);
    // Tutaj możesz dodać kod wyświetlający komunikat o błędzie użytkownikowi
}