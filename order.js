class OrderSystem {
    constructor() {

        // Sprawdź czy dane są załadowane
        if (typeof AppData === 'undefined') {
            throw new Error('Dane aplikacji (AppData) nie zostały załadowane!');
        }
    
        // Inicjalizacja właściwości
        this.currentOrder = [];
        this.orders = {};
        this.adminPassword = "admin123";
        this.pageViews = 0;
        
        // Inicjalizacja Firebase
        this.initializeFirebase();
        
        // Inicjalizacja danych lokalnych
        this.initializeLocalData();
        
        // Inicjalizacja UI i eventów
        this.initUIComponents();
        
        // Inicjalizacja statystyk
        this.initStatistics();
        
        // Test połączenia z Firebase (można później usunąć)
        this.testFirebaseConnection();

        this.ordersChart = null;
        this.flavorsChart = null;
    }

    initializeFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyAfYyYUOcdjfpupkWMTUZfup6xmRRZJ68w",
            authDomain: "lq-lista.firebaseapp.com",
            databaseURL: "https://lq-lista-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "lq-lista",
            storageBucket: "lq-lista.firebasestorage.app",
            messagingSenderId: "642905853097",
            appId: "1:642905853097:web:ca850099dcdc002f9b2db8"
        };
    
        // Inicjalizacja tylko jeśli nie została już wykonana
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        this.database = firebase.database();
        
        // Test połączenia (możesz później usunąć)
        this.testConnection();
    }
    
    async testConnection() {
        try {
            await this.database.ref('.info/connected').once('value');
            console.log("Połączenie z Firebase działa poprawnie!");
        } catch (error) {
            console.error("Błąd połączenia z Firebase:", error);
        }
    }

    async initializeLocalData() {
        // Ładowanie zamówień z localStorage
        const localOrders = localStorage.getItem('orders');
        this.orders = localOrders ? JSON.parse(localOrders) : {};
        
        // Jeśli są lokalne zamówienia, zsynchronizuj je z Firebase
        if (Object.keys(this.orders).length > 0) {
            await this.syncLocalOrdersToFirebase();
        }
    }

    initUIComponents() {
        this.initEventListeners();
        this.populateFlavors();
        this.setupPricePreview();
        this.initFlavorFilter();
        this.initScrollButton();
    }

    initStatistics() {
        this.pageViews = parseInt(localStorage.getItem('pageViews')) || 0;
        this.initCharts();
        this.trackPageView();
    }

    async syncOrdersFromFirebase() {
        try {
            console.log("Rozpoczynanie synchronizacji z Firebase...");
            const snapshot = await this.database.ref('orders').once('value');
            const firebaseOrders = snapshot.val() || {};
            
            let updated = false;
            
            // Aktualizuj lokalne zamówienia tylko jeśli w Firebase są nowsze wersje
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
                this.updateStats();
            }
            
        } catch (error) {
            console.error("Błąd synchronizacji z Firebase:", error);
        }
    }

    async syncLocalOrdersToFirebase() {
        try {
            console.log("Rozpoczynanie synchronizacji lokalnych zamówień z Firebase...");
            const updates = {};
            
            // Przygotuj aktualizacje dla wszystkich zamówień
            for (const [orderId, order] of Object.entries(this.orders)) {
                updates[`orders/${orderId}`] = order;
            }
            
            // Wykonaj zbiorczą aktualizację
            await this.database.ref().update(updates);
            console.log("Zsynchroniczowano lokalne zamówienia z Firebase");
            
        } catch (error) {
            console.error("Błąd synchronizacji lokalnych zamówień:", error);
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
        }
    }
    
    initEventListeners() {
        // Przyciski zamówienia
        document.getElementById('start-order').addEventListener('click', () => {
            this.openModal();
            this.resetScrollPosition();
        });
        
        document.querySelector('.close').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('add-to-order').addEventListener('click', this.addToOrder.bind(this));
        document.getElementById('submit-order').addEventListener('click', this.submitOrder.bind(this));
        
        // Panel admina
        document.getElementById('login-admin').addEventListener('click', this.loginAdmin.bind(this));
        document.getElementById('search-order').addEventListener('click', this.searchOrder.bind(this));
        
        // Kliknięcie poza modalem
        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('order-modal')) {
                this.closeModal();
            }
        });

        // Link do panelu admina
        document.getElementById('admin-link').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('admin-panel').style.display = 'block';
            window.scrollTo({
                top: document.getElementById('admin-panel').offsetTop,
                behavior: 'smooth'
            });
        });
    }

    resetScrollPosition() {
        const scrollContainer = document.querySelector('.order-scroll-container');
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
    }

    openModal() {
        document.getElementById('order-modal').style.display = 'block';
        document.body.classList.add('modal-open');
        document.getElementById('order-form').style.display = 'block';
        document.getElementById('order-summary').style.display = 'block';
        document.getElementById('submit-order-container').classList.remove('hidden');
        document.getElementById('order-confirmation').style.display = 'none';
        document.getElementById('order-notes').value = '';
        this.currentOrder = [];
        this.updateOrderSummary();
    }
    
    closeModal() {
        document.getElementById('order-modal').style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    
    initFlavorFilter() {
        if (document.getElementById('brand-filter')) return;
    
        const filterContainer = document.createElement('div');
        filterContainer.className = 'flavor-filters';
        filterContainer.innerHTML = `
            <div class="filter-group">
                <label>Firma:</label>
                <select id="brand-filter" class="form-control">
                    <option value="all">Wszystkie firmy</option>
                    <option value="funk">Funk Claro</option>
                    <option value="aroma">Aroma King</option>
                    <option value="wanna">Wanna Be Cool</option>
                    <option value="inne">Inne</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Typ smaku:</label>
                <select id="type-filter" class="form-control">
                    <option value="all">Wszystkie typy</option>
                    <option value="owocowe">Owocowe</option>
                    <option value="miętowe">Miętowe</option>
                    <option value="słodkie">Słodkie</option>
                    <option value="cytrusowe">Cytrusowe</option>
                    <option value="energy">Energy drink</option>
                </select>
            </div>
        `;
    
        const flavorsSection = document.querySelector('.flavors');
        if (flavorsSection) {
            flavorsSection.insertBefore(filterContainer, document.getElementById('flavors-list'));
        }
        
        document.getElementById('brand-filter').addEventListener('change', () => this.filterFlavors());
        document.getElementById('type-filter').addEventListener('change', () => this.filterFlavors());
    }

    filterFlavors() {
        const flavorsList = document.getElementById('flavors-list');
        flavorsList.innerHTML = '';

        const brandFilter = document.getElementById('brand-filter').value;
        const typeFilter = document.getElementById('type-filter').value;

        flavors.forEach((flavor, index) => {
            const brandMatch = 
                brandFilter === 'all' ||
                (brandFilter === 'funk' && flavor.includes('(Funk Claro)')) ||
                (brandFilter === 'aroma' && flavor.includes('(Aroma King)')) ||
                (brandFilter === 'wanna' && flavor.includes('(Wanna Be Cool)')) ||
                (brandFilter === 'inne' && !flavor.includes('('));

            let typeMatch = false;
            if (typeFilter === 'all') {
                typeMatch = true;
            } else {
                const typeIndexes = flavorCategories[typeFilter] || [];
                typeMatch = typeIndexes.includes(index);
            }

            if (brandMatch && typeMatch) {
                const li = document.createElement('li');
                li.innerHTML = `<span class="flavor-number">${index + 1}.</span> ${this.formatFlavorName(flavor)}`;
                flavorsList.appendChild(li);
            }
        });
    }
    
    formatFlavorName(flavor) {
        return flavor
            .replace(/\s+/g, ' ')
            .replace(/\s,/g, ',')
            .replace(/\s\(/g, ' (');
    }
    
    populateFlavors() {
        const select = document.getElementById('flavor-select');
        if (!select) {
            console.error('Element #flavor-select nie znaleziony');
            return;
        }
        
        select.innerHTML = '<option value="">Wybierz smak</option>';
        
        // Użyj AppData.flavors zamiast bezpośrednio flavors
        AppData.flavors.forEach((flavor, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${index + 1}. ${this.formatFlavorName(flavor)}`;
            select.appendChild(option);
        });
    }
    
    setupPricePreview() {
        if (document.getElementById('price-preview')) return;
        
        const pricePreview = document.createElement('div');
        pricePreview.id = 'price-preview';
        pricePreview.textContent = 'Cena: -';
        document.getElementById('strength-select').insertAdjacentElement('afterend', pricePreview);
        
        [document.getElementById('flavor-select'), 
         document.getElementById('size-select'), 
         document.getElementById('strength-select')].forEach(select => {
            select.addEventListener('change', () => this.updatePricePreview());
        });
    }

    updatePricePreview() {
        const size = document.getElementById('size-select').value;
        const strength = document.getElementById('strength-select').value;
        const pricePreview = document.getElementById('price-preview');
        
        if (size && strength) {
            const price = this.calculatePrice(size, strength);
            pricePreview.textContent = `Cena: ${price}zł`;
            pricePreview.style.color = '#ff6f61';
        } else {
            pricePreview.textContent = 'Cena: -';
            pricePreview.style.color = '';
        }
    }
    
    addToOrder() {
        const flavorIndex = document.getElementById('flavor-select').value;
        const size = document.getElementById('size-select').value;
        const strength = document.getElementById('strength-select').value;
        
        if (!flavorIndex || !size || !strength) {
            alert('Proszę wybrać smak, pojemność i moc nikotyny!');
            return;
        }
        
        const price = this.calculatePrice(size, strength);
        const flavorName = flavors[flavorIndex];
        
        this.currentOrder.push({
            flavor: flavorName,
            size,
            strength: strength + 'mg',
            price,
            flavorNumber: parseInt(flavorIndex) + 1
        });
        
        this.updateOrderSummary();
    }
    
    calculatePrice(size, strength) {
        const strengthNum = parseInt(strength);
        let price;
        
        if (size === '10ml') {
            price = strengthNum >= 18 ? 16 : (strengthNum >= 12 ? 15 : (strengthNum >= 6 ? 14 : 13));
        } else if (size === '30ml') {
            price = strengthNum >= 18 ? 40 : (strengthNum >= 12 ? 38 : (strengthNum >= 6 ? 37 : 36));
        } else { // 60ml
            price = strengthNum >= 18 ? 70 : (strengthNum >= 12 ? 68 : (strengthNum >= 6 ? 67 : 66));
        }
        
        return price;
    }
    
    updateOrderSummary() {
        const itemsList = document.getElementById('order-items');
        const orderTotal = document.getElementById('order-total');
        
        itemsList.innerHTML = '';
        let total = 0;
        
        const groupedItems = {};
        this.currentOrder.forEach(item => {
            const key = `${item.flavorNumber}-${item.size}-${item.strength}`;
            if (!groupedItems[key]) {
                groupedItems[key] = {
                    ...item,
                    quantity: 1,
                    totalPrice: item.price
                };
            } else {
                groupedItems[key].quantity++;
                groupedItems[key].totalPrice += item.price;
            }
        });
        
        Object.values(groupedItems).forEach((item) => {
            const li = document.createElement('li');
            li.className = 'order-item';
            
            li.innerHTML = `
                <div class="order-item-info">
                    <div class="flavor-name">
                        <span class="flavor-number">${item.flavorNumber}.</span>
                        ${this.formatFlavorName(item.flavor).split('(')[0].trim()}
                    </div>
                    <div class="item-details">
                        (${item.size}, ${item.strength})
                        <span class="item-quantity">${item.quantity}x</span>
                    </div>
                </div>
                <div class="order-item-price">${item.totalPrice}zł</div>
                <button class="remove-item">X</button>
            `;
            
            li.querySelector('.remove-item').addEventListener('click', () => {
                this.currentOrder = this.currentOrder.filter(i => 
                    `${i.flavorNumber}-${i.size}-${i.strength}` !== `${item.flavorNumber}-${item.size}-${item.strength}`
                );
                this.updateOrderSummary();
            });
            
            itemsList.appendChild(li);
            total += item.totalPrice;
        });
        
        orderTotal.textContent = `Razem: ${total}zł`;
    }
    
    async submitOrder() {
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
        
        try {
            // Zapisz do Firebase
            await this.database.ref('orders/' + orderNumber).set(orderData);
            
            // Aktualizuj lokalną kopię
            this.orders[orderNumber] = orderData;
            localStorage.setItem('orders', JSON.stringify(this.orders));
            
            // Pokaż potwierdzenie
            document.getElementById('order-form').style.display = 'none';
            document.getElementById('order-summary').style.display = 'none';
            document.getElementById('submit-order-container').classList.add('hidden');
            document.getElementById('order-confirmation').style.display = 'block';
            document.getElementById('order-number').textContent = orderNumber;
            
            console.log("Zamówienie zapisane:", orderNumber);
            this.updateStats();
            
        } catch (error) {
            console.error("Błąd zapisu zamówienia:", error);
            alert('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
        }
    }
    
    loginAdmin() {
        const password = document.getElementById('admin-password').value;
        if (password === this.adminPassword) {
            document.getElementById('admin-content').style.display = 'block';
            this.updateStats();
        } else {
            alert('Nieprawidłowe hasło!');
        }
    }
    
    async searchOrder() {
        const orderNumber = document.getElementById('order-search').value.trim();
        const orderDetails = document.getElementById('order-details');
        
        if (!orderNumber) {
            orderDetails.innerHTML = '<p class="no-order">Wpisz numer zamówienia</p>';
            return;
        }
        
        orderDetails.innerHTML = '<p class="loading">Wyszukiwanie zamówienia...</p>';
        this.updateStats();
        
        try {
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
            orderDetails.innerHTML = '<p class="error">Błąd połączenia z bazą</p>';
        }
    }
    
    displayOrderDetails(orderNumber, order) {
        const orderDetails = document.getElementById('order-details');
        
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
                
                <div class="order-actions">
                    <div class="form-group">
                        <label>Zmień status:</label>
                        <select id="status-select" class="form-control">
                            <option value="Nowe" ${order.status === 'Nowe' ? 'selected' : ''}>Nowe</option>
                            <option value="W realizacji" ${order.status === 'W realizacji' ? 'selected' : ''}>W realizacji</option>
                            <option value="Wysłane" ${order.status === 'Wysłane' ? 'selected' : ''}>Wysłane</option>
                            <option value="Zakończone" ${order.status === 'Zakończone' ? 'selected' : ''}>Zakończone</option>
                        </select>
                        <button id="update-status" class="btn">Aktualizuj status</button>
                    </div>
                </div>
            </div>
        `;
        
        orderDetails.innerHTML = orderHTML;
        
        document.getElementById('update-status').addEventListener('click', async () => {
            const newStatus = document.getElementById('status-select').value;
            
            try {
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
    }

    initScrollButton() {
        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-top-btn';
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollBtn.setAttribute('aria-label', 'Przewiń do góry');
        document.body.appendChild(scrollBtn);
        
        window.addEventListener('scroll', () => {
            scrollBtn.classList.toggle('show', window.scrollY > 300);
        });
        
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    trackPageView() {
        this.pageViews++;
        localStorage.setItem('pageViews', this.pageViews);
        this.updateStats();
    }

    initCharts() {
        try {
            // Najpierw zniszcz istniejące wykresy jeśli są
            if (this.ordersChart instanceof Chart) {
                this.ordersChart.destroy();
                this.ordersChart = null;
            }
            if (this.flavorsChart instanceof Chart) {
                this.flavorsChart.destroy();
                this.flavorsChart = null;
            }
    
            // Pobierz elementy canvas
            const ordersCtx = document.getElementById('ordersChart')?.getContext('2d');
            const flavorsCtx = document.getElementById('flavorsChart')?.getContext('2d');
    
            if (!ordersCtx || !flavorsCtx) {
                console.warn('Nie znaleziono elementów canvas dla wykresów');
                return;
            }
    
            // Sprawdź czy elementy canvas nie są już używane
            if (ordersCtx.canvas.chart || flavorsCtx.canvas.chart) {
                console.warn('Canvas jest już używany przez inny wykres');
                return;
            }
    
            // Inicjalizacja nowych wykresów z bezpiecznymi danymi
            const ordersData = this.getOrdersLast7Days().map(Number);
            const last7Days = this.getLast7Days().map(String); // Upewnij się, że etykiety są stringami
    
            this.ordersChart = new Chart(ordersCtx, {
                type: 'line',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Zamówienia z ostatnich 7 dni',
                        data: ordersData,
                        borderColor: '#ff6f61',
                        backgroundColor: 'rgba(255, 111, 97, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
    
            const topFlavors = this.getTopFlavors(5);
            this.flavorsChart = new Chart(flavorsCtx, {
                type: 'doughnut',
                data: {
                    labels: topFlavors.map(f => String(f.name)), // Upewnij się, że etykiety są stringami
                    datasets: [{
                        data: topFlavors.map(f => Number(f.count)),
                        backgroundColor: [
                            '#ff6f61',
                            '#ff9a9e',
                            '#fad0c4',
                            '#ffcc00',
                            '#45a049'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                        }
                    }
                }
            });
    
        } catch (error) {
            console.error('Błąd inicjalizacji wykresów:', error);
        }
    }

    getOrdersChartConfig() {
        return {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Zamówienia z ostatnich 7 dni',
                    data: this.getOrdersLast7Days(),
                    borderColor: '#ff6f61',
                    backgroundColor: 'rgba(255, 111, 97, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Zamówienia: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        };
    }

    getFlavorsChartConfig() {
        const topFlavors = this.getTopFlavors(5);
        
        return {
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
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
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
                }
            }
        };
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }));
        }
        return days.map(String); // Upewnij się, że zwracane są stringi
    }

    getOrdersLast7Days() {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        
        Object.values(this.orders).forEach(order => {
            const orderDate = new Date(order.date);
            const diffDays = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays < 7) {
                counts[6 - diffDays]++;
            }
        });
        
        return counts;
    }

    getTopFlavors(limit) {
        const flavorCounts = {};
        
        Object.values(this.orders).forEach(order => {
            if (order && order.items) {
                order.items.forEach(item => {
                    if (item && item.flavor) {
                        const flavorName = this.formatFlavorName(item.flavor).split('(')[0].trim();
                        flavorCounts[flavorName] = (flavorCounts[flavorName] || 0) + (item.quantity || 1);
                    }
                });
            }
        });
        
        return Object.entries(flavorCounts)
            .map(([name, count]) => ({ name: String(name), count: Number(count) })) // Upewnij się o typach
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    updateStats() {
        try {
            // 1. Aktualizacja statystyk tekstowych
            const totalOrders = Object.keys(this.orders).length;
            const todayOrders = this.getTodaysOrdersCount();
            
            // Bezpieczna aktualizacja UI
            const safeUpdate = (id, value) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            };
            
            safeUpdate('total-orders', totalOrders);
            safeUpdate('today-orders', todayOrders);
            safeUpdate('total-views', this.pageViews);
    
            // 2. Aktualizacja wykresów tylko jeśli istnieją
            if (this.ordersChart && this.flavorsChart) {
                try {
                    // Przygotowanie danych
                    const last7Days = this.getLast7Days().map(String);
                    const ordersData = this.getOrdersLast7Days().map(Number);
                    const topFlavors = this.getTopFlavors(5);
                    
                    // Aktualizacja danych wykresu zamówień
                    this.ordersChart.data.labels = last7Days;
                    this.ordersChart.data.datasets[0].data = ordersData;
                    
                    // Aktualizacja danych wykresu smaków
                    this.flavorsChart.data.labels = topFlavors.map(f => String(f.name));
                    this.flavorsChart.data.datasets[0].data = topFlavors.map(f => Number(f.count));
                    
                    // Aktualizacja wykresów z animacją
                    this.ordersChart.update();
                    this.flavorsChart.update();
                    
                } catch (chartError) {
                    console.error('Błąd aktualizacji wykresów:', chartError);
                    // Próba ponownej inicjalizacji
                    this.initCharts();
                }
            } else {
                // Jeśli wykresy nie istnieją, zainicjuj je
                this.initCharts();
            }
            
        } catch (error) {
            console.error('Błąd podczas aktualizacji statystyk:', error);
        }
    }

    getTodaysOrdersCount() {
        const today = new Date().toLocaleDateString();
        return Object.values(this.orders).filter(order => {
            return new Date(order.date).toLocaleDateString() === today;
        }).length;
    }
}

// Inicjalizacja systemu
const orderSystem = new OrderSystem();
