class OrdersModule {
    constructor(orderSystem) {
        this.orderSystem = orderSystem;
        this.initializeLocalData();
        this.initFlavorSelect();
    }

    initFlavorSelect() {
        try {
            const select = document.getElementById('flavor-select');
            if (!select) return;
            
            select.innerHTML = '<option value="">Wybierz smak</option>';
            
            this.orderSystem.appData.flavors.forEach((flavor, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${index + 1}. ${this.orderSystem.utils.formatFlavorName(flavor)}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Błąd inicjalizacji selecta smaków:', error);
        }
    }

    async initializeLocalData() {
        try {
            const localOrders = localStorage.getItem('orders');
            this.orderSystem.orders = localOrders ? JSON.parse(localOrders) : {};
            
            if (Object.keys(this.orderSystem.orders).length > 0) {
                console.log(`Załadowano ${Object.keys(this.orderSystem.orders).length} zamówień z localStorage`);
                await this.orderSystem.firebase.syncLocalOrdersToFirebase();
            }
        } catch (error) {
            console.error("Błąd inicjalizacji danych lokalnych:", error);
            this.orderSystem.orders = {};
        }
    }

    addToOrder() {
        try {
            const flavorIndex = document.getElementById('flavor-select').value;
            const size = document.getElementById('size-select').value;
            const strength = document.getElementById('strength-select').value;
            
            if (!flavorIndex || !size || !strength) {
                alert('Proszę wybrać smak, pojemność i moc nikotyny!');
                return;
            }
            
            const flavors = this.orderSystem.appData.flavors;
            if (!flavors[flavorIndex]) {
                throw new Error(`Nie znaleziono smaku o indeksie ${flavorIndex}`);
            }
            
            const price = this.calculatePrice(size, strength);
            const flavorName = flavors[flavorIndex];
            
            this.orderSystem.currentOrder.push({
                flavor: flavorName,
                size,
                strength: strength + 'mg',
                price,
                flavorNumber: parseInt(flavorIndex) + 1
            });
            
            this.updateOrderSummary();
        } catch (error) {
            console.error('Błąd dodawania do zamówienia:', error);
            alert('Wystąpił błąd podczas dodawania produktu. Spróbuj ponownie.');
        }
    }
    
    calculatePrice(size, strength) {
        try {
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
        } catch (error) {
            console.error('Błąd obliczania ceny:', error);
            return 0;
        }
    }
    
    updateOrderSummary() {
        try {
            const itemsList = document.getElementById('order-items');
            const orderTotal = document.getElementById('order-total');
            
            if (!itemsList || !orderTotal) return;
            
            itemsList.innerHTML = '';
            let total = 0;
            
            const groupedItems = {};
            this.orderSystem.currentOrder.forEach(item => {
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
            
            const isMobile = window.matchMedia("(max-width: 768px)").matches;
            const quantitySymbol = isMobile ? '×' : 'x';
            
            Object.values(groupedItems).forEach((item) => {
                const li = document.createElement('li');
                li.className = 'order-item';
                
                li.innerHTML = `
                    <div class="order-item-info">
                        <div class="flavor-name">
                            <span class="flavor-number">${item.flavorNumber}.</span>
                            ${this.orderSystem.utils.formatFlavorName(item.flavor).split('(')[0].trim()}
                        </div>
                        <div class="item-details">
                            (${item.size}, ${item.strength})
                            <span class="item-quantity">${item.quantity}${quantitySymbol}</span>
                        </div>
                    </div>
                    <div class="order-item-price">${item.totalPrice}zł</div>
                    <button class="remove-item">X</button>
                `;
                
                li.querySelector('.remove-item').addEventListener('click', () => {
                    this.orderSystem.currentOrder = this.orderSystem.currentOrder.filter(i => 
                        `${i.flavorNumber}-${i.size}-${i.strength}` !== `${item.flavorNumber}-${item.size}-${item.strength}`
                    );
                    this.updateOrderSummary();
                });
                
                itemsList.appendChild(li);
                total += item.totalPrice;
            });
            
            orderTotal.textContent = `Razem: ${total}zł`;
        } catch (error) {
            console.error('Błąd aktualizacji podsumowania zamówienia:', error);
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
    
    async submitOrder() {
        try {
            if (this.orderSystem.currentOrder.length === 0) {
                alert('Dodaj przynajmniej jeden produkt do zamówienia!');
                return;
            }
            
            const total = this.orderSystem.currentOrder.reduce((sum, item) => sum + item.price, 0);
            const notes = document.getElementById('order-notes').value;
            
            const orderData = {
                items: [...this.orderSystem.currentOrder],
                total,
                date: new Date().toISOString(),
                status: 'Nowe',
                notes: notes,
                updatedAt: Date.now()
            };
            
            const orderId = await this.orderSystem.firebase.submitOrderToFirebase(orderData);
            
            document.getElementById('order-form').style.display = 'none';
            document.getElementById('order-summary').style.display = 'none';
            document.getElementById('submit-order-container').classList.add('hidden');
            document.getElementById('order-confirmation').style.display = 'block';
            
            const orderNumberElement = document.getElementById('order-number');
            orderNumberElement.textContent = orderId;
            
            console.log("Zamówienie zapisane:", orderId);
            this.orderSystem.stats.updateStats();
            
            // Reset zamówienia
            this.orderSystem.currentOrder = [];
            
        } catch (error) {
            console.error("Błąd zapisu zamówienia:", error);
            alert('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
        }
    }
    
    loginAdmin() {
        try {
            const password = document.getElementById('admin-password').value;
            if (password === this.orderSystem.adminPassword) {
                document.getElementById('admin-content').style.display = 'block';
                this.orderSystem.stats.updateStats();
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
            this.orderSystem.stats.updateStats();
            
            // Najpierw sprawdź lokalne zamówienia
            if (this.orderSystem.orders[orderNumber]) {
                this.displayOrderDetails(orderNumber, this.orderSystem.orders[orderNumber]);
                return;
            }
            
            // Jeśli jest połączenie, sprawdź w Firebase
            if (this.orderSystem.firebase.isOnline) {
                const snapshot = await this.orderSystem.firebase.database.ref('orders/' + orderNumber).once('value');
                const order = snapshot.val();
                
                if (!order) {
                    orderDetails.innerHTML = '<p class="no-order">Nie znaleziono zamówienia</p>';
                    return;
                }
                
                this.orderSystem.orders[orderNumber] = order;
                localStorage.setItem('orders', JSON.stringify(this.orderSystem.orders));
                this.displayOrderDetails(orderNumber, order);
            } else {
                orderDetails.innerHTML = '<p class="no-order">Nie znaleziono zamówienia (tryb offline)</p>';
            }
            
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
                    ${order.isOffline ? '<p class="offline-warning">⚠️ Zamówienie utworzone offline</p>' : ''}
                    ${order.notes ? `<p class="order-notes"><strong>Uwagi:</strong> ${order.notes}</p>` : ''}
                    
                    <h4>Produkty:</h4>
                    <ul class="order-items-list">
                        ${order.items.map(item => `
                            <li class="order-item-detail">
                                <span class="flavor-number">${item.flavorNumber}.</span> 
                                ${this.orderSystem.utils.formatFlavorName(item.flavor).split('(')[0].trim()} 
                                (${item.size}, ${item.strength}) - ${item.price}zł
                            </li>
                        `).join('')}
                    </ul>
                    
                    <p class="order-total"><strong>Suma:</strong> ${order.total}zł</p>
                    
                    ${!order.isOffline ? `
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
                    ` : ''}
                </div>
            `;
            
            orderDetails.innerHTML = orderHTML;
            
            if (!order.isOffline) {
                document.getElementById('update-status').addEventListener('click', async () => {
                    try {
                        const newStatus = document.getElementById('status-select').value;
                        
                        await this.orderSystem.firebase.database.ref(`orders/${orderNumber}/status`).set(newStatus);
                        await this.orderSystem.firebase.database.ref(`orders/${orderNumber}/updatedAt`).set(firebase.database.ServerValue.TIMESTAMP);
                        
                        this.orderSystem.orders[orderNumber].status = newStatus;
                        this.orderSystem.orders[orderNumber].updatedAt = Date.now();
                        localStorage.setItem('orders', JSON.stringify(this.orderSystem.orders));
                        
                        this.displayOrderDetails(orderNumber, this.orderSystem.orders[orderNumber]);
                        this.orderSystem.stats.updateStats();
                        alert('Status zamówienia został zaktualizowany!');
                        
                    } catch (error) {
                        console.error("Błąd aktualizacji statusu:", error);
                        alert("Wystąpił błąd podczas aktualizacji statusu");
                    }
                });
            }
        } catch (error) {
            console.error('Błąd wyświetlania szczegółów zamówienia:', error);
        }
    }
}