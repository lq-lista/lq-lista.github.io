class OrderSystem {
    constructor() {
        this.currentOrder = [];
        this.orders = JSON.parse(localStorage.getItem('orders')) || {};
        this.adminPassword = "admin123";
        
        this.initEventListeners();
        this.populateFlavors();
        this.setupPricePreview();
        this.initFlavorFilter();
        this.initScrollButton();
        this.pageViews = parseInt(localStorage.getItem('pageViews')) || 0;
        this.initCharts();
        this.trackPageView();
    }
    
    initEventListeners() {
        // Przyciski zamówienia
        document.getElementById('start-order').addEventListener('click', this.openModal.bind(this));
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
            e.stopPropagation();
            document.getElementById('admin-panel').style.display = 'block';
            window.scrollTo({
                top: document.getElementById('admin-panel').offsetTop,
                behavior: 'smooth'
            });
        });
    }
    
    initFlavorFilter() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'flavor-filters';
        filterContainer.innerHTML = `
            <div class="filter-group">
                <label>Firma:</label>
                <select id="brand-filter" class="form-control">
                    <option value="all">Wszystkie firmy</option>
                    <option value="panda">Panda Classic</option>
                    <option value="funk">Funk Claro</option>
                    <option value="izi">Izi Pizi</option>
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

        document.querySelector('.flavors').insertBefore(filterContainer, document.getElementById('flavors-list'));
        
        document.getElementById('brand-filter').addEventListener('change', () => this.filterFlavors());
        document.getElementById('type-filter').addEventListener('change', () => this.filterFlavors());
    }
    
    filterFlavors() {
        const flavorsList = document.getElementById('flavors-list');
        flavorsList.innerHTML = '';

        const brandFilter = document.getElementById('brand-filter').value;
        const typeFilter = document.getElementById('type-filter').value;

        flavors.forEach((flavor, index) => {
            // Sprawdzanie filtra firmy
            const brandMatch = 
                brandFilter === 'all' ||
                (brandFilter === 'panda' && flavor.includes('(Panda Classic)')) ||
                (brandFilter === 'funk' && flavor.includes('(Funk Claro)')) ||
                (brandFilter === 'izi' && flavor.includes('(Izi Pizi)')) ||
                (brandFilter === 'inne' && !flavor.includes('('));

            // Sprawdzanie filtra typu
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
        return flavor.includes('(') 
            ? flavor.replace('(', ' (') // Dodaj spację przed nawiasem
            : flavor;
    }
    
    openModal() {
        document.getElementById('order-modal').style.display = 'block';
        document.getElementById('order-form').style.display = 'block';
        document.getElementById('order-summary').style.display = 'block';
        document.getElementById('order-confirmation').style.display = 'none';
        this.currentOrder = [];
        this.updateOrderSummary();
    }
    
    closeModal() {
        document.getElementById('order-modal').style.display = 'none';
    }
    
    populateFlavors() {
        const select = document.getElementById('flavor-select');
        select.innerHTML = '<option value="">Wybierz smak</option>';
        
        flavors.forEach((flavor, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.innerHTML = `<span class="flavor-number">${index + 1}.</span> ${this.formatFlavorName(flavor)}`;
            select.appendChild(option);
        });
    }
    
    setupPricePreview() {
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
            flavorNumber: parseInt(flavorIndex) + 1 // Dodajemy numer smaku
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
        
        // Grupowanie identycznych produktów
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
        
        // Wyświetlanie zgrupowanych produktów
        Object.values(groupedItems).forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'order-item';
            
            const itemInfo = document.createElement('div');
            itemInfo.className = 'order-item-info';
            itemInfo.innerHTML = `
                <span class="flavor-number">${item.flavorNumber}.</span>
                ${this.formatFlavorName(item.flavor).split('(')[0].trim()} 
                (${item.size}, ${item.strength})
                ${item.quantity > 1 ? `<span class="item-quantity">${item.quantity}x</span>` : ''}
            `;
            
            const itemPrice = document.createElement('div');
            itemPrice.className = 'order-item-price';
            itemPrice.textContent = `${item.totalPrice}zł`;
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.className = 'remove-item';
            removeBtn.addEventListener('click', () => {
                // Usuń wszystkie wystąpienia tego produktu
                this.currentOrder = this.currentOrder.filter(i => 
                    `${i.flavorNumber}-${i.size}-${i.strength}` !== `${item.flavorNumber}-${item.size}-${item.strength}`
                );
                this.updateOrderSummary();
            });
            
            li.appendChild(itemInfo);
            li.appendChild(itemPrice);
            li.appendChild(removeBtn);
            
            itemsList.appendChild(li);
            total += item.totalPrice;
        });
        
        orderTotal.textContent = `Razem: ${total}zł`;
        
        // Automatyczne przewijanie do dołu jeśli lista jest długa
        if (Object.keys(groupedItems).length > 2) {
            const orderContainer = document.querySelector('.order-items-container');
            orderContainer.scrollTop = orderContainer.scrollHeight;
        }
    }
    
    submitOrder() {
        if (this.currentOrder.length === 0) {
            alert('Dodaj przynajmniej jeden produkt do zamówienia!');
            return;
        }
        
        const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
        const total = this.currentOrder.reduce((sum, item) => sum + item.price, 0);
        const notes = document.getElementById('order-notes').value;
        
        this.orders[orderNumber] = {
            items: [...this.currentOrder],
            total,
            date: new Date().toLocaleString(),
            status: 'Nowe',
            notes: notes
        };
        
        localStorage.setItem('orders', JSON.stringify(this.orders));
        
        document.getElementById('order-form').style.display = 'none';
        document.getElementById('order-summary').style.display = 'none';
        document.getElementById('order-confirmation').style.display = 'block';
        document.getElementById('order-number').textContent = orderNumber;
        document.getElementById('order-notes').value = '';
    }
    
    loginAdmin() {
        const password = document.getElementById('admin-password').value;
        if (password === this.adminPassword) {
            document.getElementById('admin-content').style.display = 'block';
        } else {
            alert('Nieprawidłowe hasło!');
        }
    }
    
    searchOrder() {
        const orderNumber = document.getElementById('order-search').value.trim();
        const order = this.orders[orderNumber];
        const orderDetails = document.getElementById('order-details');
        
        orderDetails.innerHTML = '';
        
        if (!order) {
            orderDetails.innerHTML = '<p>Nie znaleziono zamówienia o podanym numerze</p>';
            return;
        }
        
        const orderHTML = `
            <h3>Zamówienie ${orderNumber}</h3>
            <p><strong>Data:</strong> ${order.date}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            ${order.notes ? `<p><strong>Uwagi:</strong> ${order.notes}</p>` : ''}
            <h4>Produkty:</h4>
            <ul class="order-items-list">
                ${order.items.map(item => `
                    <li>
                        <span class="flavor-number">${item.flavorNumber}.</span> 
                        ${this.formatFlavorName(item.flavor).split('(')[0].trim()} (${item.size}, ${item.strength}) - ${item.price}zł
                    </li>
                `).join('')}
            </ul>
            <p><strong>Suma:</strong> ${order.total}zł</p>
            <div class="form-group">
                <label>Zmień status:</label>
                <select id="status-select">
                    <option ${order.status === 'Nowe' ? 'selected' : ''}>Nowe</option>
                    <option ${order.status === 'W realizacji' ? 'selected' : ''}>W realizacji</option>
                    <option ${order.status === 'Wysłane' ? 'selected' : ''}>Wysłane</option>
                    <option ${order.status === 'Zakończone' ? 'selected' : ''}>Zakończone</option>
                </select>
                <button id="update-status" class="btn">Aktualizuj</button>
            </div>
        `;
        
        orderDetails.innerHTML = orderHTML;
        
        document.getElementById('update-status').addEventListener('click', () => {
            const newStatus = document.getElementById('status-select').value;
            this.orders[orderNumber].status = newStatus;
            localStorage.setItem('orders', JSON.stringify(this.orders));
            this.searchOrder();
        });
    }

    initScrollButton() {
        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-top-btn';
        scrollBtn.innerHTML = '↑';
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
        this.ordersChart = new Chart(
            document.getElementById('ordersChart'),
            this.getOrdersChartConfig()
        );
        
        this.flavorsChart = new Chart(
            document.getElementById('flavorsChart'),
            this.getFlavorsChartConfig()
        );
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
                    }
                }
            }
        };
    }

    getFlavorsChartConfig() {
        return {
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
                plugins: {
                    legend: {
                        position: 'right',
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
            days.push(date.toLocaleDateString('pl-PL'));
        }
        return days;
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
            order.items.forEach(item => {
                const flavorName = item.flavor.split('(')[0].trim();
                flavorCounts[flavorName] = (flavorCounts[flavorName] || 0) + item.quantity;
            });
        });
        
        return Object.entries(flavorCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    updateStats() {
        document.getElementById('total-orders').textContent = Object.keys(this.orders).length;
        document.getElementById('today-orders').textContent = this.getTodaysOrdersCount();
        document.getElementById('total-views').textContent = this.pageViews;
        
        // Aktualizacja wykresów
        this.ordersChart.data.datasets[0].data = this.getOrdersLast7Days();
        this.ordersChart.update();
        
        const topFlavors = this.getTopFlavors(5);
        this.flavorsChart.data.labels = topFlavors.map(f => f.name);
        this.flavorsChart.data.datasets[0].data = topFlavors.map(f => f.count);
        this.flavorsChart.update();
    }

    getTodaysOrdersCount() {
        const today = new Date().toLocaleDateString();
        return Object.values(this.orders).filter(order => {
            return new Date(order.date).toLocaleDateString() === today;
        }).length;
    }

    // W metodzie searchOrder (na początku):
    searchOrder() {
        this.updateStats(); // Dodaj tę linijkę
        // ... reszta istniejącej metody
    }
}

// Inicjalizacja systemu
const orderSystem = new OrderSystem();