class UIModule {
    constructor(orderSystem) {
        this.orderSystem = orderSystem;
        this.initUIComponents();
    }

    initUIComponents() {
        this.initEventListeners();
        this.populateFlavors();
        this.initPricingTable();
        this.setupPricePreview();
        this.initFlavorFilter();
        this.initScrollButton();
        this.filterFlavors();
    }

    initEventListeners() {
        try {
            // Modal zamówienia
            const startOrderBtn = document.getElementById('start-order');
            if (startOrderBtn) {
                startOrderBtn.addEventListener('click', () => {
                    this.openModal();
                    this.resetScrollPosition();
                });
            }
    
            const closeModalBtn = document.querySelector('.close');
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', this.closeModal.bind(this));
            }
    
            // Formularz zamówienia
            const addToOrderBtn = document.getElementById('add-to-order');
            if (addToOrderBtn) {
                addToOrderBtn.addEventListener('click', () => {
                    this.orderSystem.orders.addToOrder();
                });
            }
    
            const submitOrderBtn = document.getElementById('submit-order');
            if (submitOrderBtn) {
                submitOrderBtn.addEventListener('click', () => {
                    this.orderSystem.orders.submitOrder();
                });
            }
    
            // Panel admina
            const loginAdminBtn = document.getElementById('login-admin');
            if (loginAdminBtn) {
                loginAdminBtn.addEventListener('click', () => {
                    this.orderSystem.orders.loginAdmin();
                });
            }
    
            const searchOrderBtn = document.getElementById('search-order');
            if (searchOrderBtn) {
                searchOrderBtn.addEventListener('click', () => {
                    this.orderSystem.orders.searchOrder();
                });
            }
    
            // Zamknięcie modala kliknięciem poza nim
            const orderModal = document.getElementById('order-modal');
            if (orderModal) {
                window.addEventListener('click', (event) => {
                    if (event.target === orderModal) {
                        this.closeModal();
                    }
                });
            }
    
            // Link do panelu admina
            const adminLink = document.getElementById('admin-link');
            if (adminLink) {
                adminLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const adminPanel = document.getElementById('admin-panel');
                    if (adminPanel) {
                        adminPanel.style.display = 'block';
                        window.scrollTo({
                            top: adminPanel.offsetTop,
                            behavior: 'smooth'
                        });
                    }
                });
            }
    
            // Kopiowanie numeru zamówienia
            document.body.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-order-btn') || 
                    e.target.closest('.copy-order-btn')) {
                    this.handleCopyOrderNumber(e);
                }
            });
    
            // Aktualizacja podglądu ceny
            ['flavor-select', 'size-select', 'strength-select'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', () => {
                        this.orderSystem.orders.updatePricePreview();
                    });
                }
            });
    
        } catch (error) {
            console.error('Błąd inicjalizacji event listenerów:', error);
            throw error;
        }
    }

    handleCopyOrderNumber(e) {
        try {
            const btn = e.target.classList.contains('copy-order-btn') ? 
                       e.target : e.target.closest('.copy-order-btn');
            const orderNumber = document.getElementById('order-number')?.textContent;
            
            if (!orderNumber) return;
            
            navigator.clipboard.writeText(orderNumber).then(() => {
                const btnText = btn.querySelector('.btn-text');
                const btnIcon = btn.querySelector('.btn-icon');
                
                if (btnText) btnText.textContent = 'Skopiowano!';
                if (btnIcon) btnIcon.textContent = '✔️';
                btn.classList.add('copied');
                
                setTimeout(() => {
                    if (btnText) btnText.textContent = 'Kopiuj';
                    if (btnIcon) btnIcon.textContent = '📋';
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
            const modal = document.getElementById('order-modal');
            if (modal) {
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
            }
    
            const orderForm = document.getElementById('order-form');
            const orderSummary = document.getElementById('order-summary');
            const submitOrderContainer = document.getElementById('submit-order-container');
            const orderConfirmation = document.getElementById('order-confirmation');
            const orderNotes = document.getElementById('order-notes');
    
            if (orderForm) orderForm.style.display = 'block';
            if (orderSummary) orderSummary.style.display = 'block';
            if (submitOrderContainer) submitOrderContainer.classList.remove('hidden');
            if (orderConfirmation) orderConfirmation.style.display = 'none';
            if (orderNotes) orderNotes.value = '';
    
            this.orderSystem.currentOrder = [];
            this.orderSystem.orders.updateOrderSummary();
        } catch (error) {
            console.error('Błąd otwierania modala:', error);
        }
    }
    
    closeModal() {
        try {
            const modal = document.getElementById('order-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        } catch (error) {
            console.error('Błąd zamykania modala:', error);
        }
    }

    initFlavorFilter() {
        try {
            // Sprawdź czy filtry już istnieją
            if (document.getElementById('brand-filter')) {
                document.getElementById('brand-filter').value = 'all';
                document.getElementById('type-filter').value = 'all';
                this.filterFlavors();
                return;
            }
            
            // Utwórz kontener z filtrami
            const filterContainer = document.createElement('div');
            filterContainer.className = 'flavor-filters';
            filterContainer.innerHTML = `
                <div class="filter-group">
                    <label>Firma:</label>
                    <select id="brand-filter" class="form-control">
                        <option value="all">Wszystkie firmy</option>
                        <option value="izi">IZI PIZI</option>
                        <option value="funk">FUNK CLARO</option>
                        <option value="wanna">WANNA BE COOL</option>
                        <option value="aroma">AROMA KING</option>
                        <option value="dilno">DILNO'S</option>
                        <option value="panda">PANDA</option>
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
                        <option value="chłodzone">Chłodzone</option>
                        <option value="energy">Energy</option>
                    </select>
                </div>
            `;
            
            // Dodaj filtry do sekcji smaków
            const flavorsSection = document.querySelector('.flavors');
            if (flavorsSection) {
                flavorsSection.insertBefore(filterContainer, document.getElementById('flavors-list'));
            }
            
            // Event listeners dla selectów
            document.getElementById('brand-filter').addEventListener('change', () => {
                document.getElementById('type-filter').value = 'all';
                this.filterFlavors();
            });
            
            document.getElementById('type-filter').addEventListener('change', () => {
                document.getElementById('brand-filter').value = 'all';
                this.filterFlavors();
            });
            
            // Wymuś pierwsze filtrowanie
            setTimeout(() => {
                document.getElementById('brand-filter').value = 'all';
                document.getElementById('type-filter').value = 'all';
                this.filterFlavors();
            }, 100);
            
        } catch (error) {
            console.error('Błąd inicjalizacji filtrów smaków:', error);
        }
    }

    filterFlavors() {
        try {
            // Lista smaków na stronie głównej
            const flavorsList = document.getElementById('flavors-list');
            if (flavorsList) {
                flavorsList.innerHTML = '';
                
                const brandFilter = document.getElementById('brand-filter')?.value || 'all';
                const typeFilter = document.getElementById('type-filter')?.value || 'all';
                const flavors = this.orderSystem.appData.flavors;
                const categories = this.orderSystem.appData.flavorCategories;
    
                flavors.forEach((flavor, index) => {
                    const brandMatch = 
                        brandFilter === 'all' ||
                        (brandFilter === 'izi' && flavor.includes('(IZI PIZI)')) ||
                        (brandFilter === 'funk' && flavor.includes('(FUNK CLARO)')) ||
                        (brandFilter === 'wanna' && flavor.includes('(WANNA BE COOL)')) ||
                        (brandFilter === 'aroma' && flavor.includes('(AROMA KING)')) ||
                        (brandFilter === 'dilno' && flavor.includes('(DILNO\'S)')) ||
                        (brandFilter === 'panda' && flavor.includes('(PANDA)'));
    
                    const typeMatch = 
                        typeFilter === 'all' || 
                        (categories[typeFilter] && categories[typeFilter].includes(index));
    
                    if (brandMatch && typeMatch) {
                        const li = document.createElement('li');
                        li.innerHTML = `<span class="flavor-number">${index + 1}.</span> ${this.orderSystem.utils.formatFlavorName(flavor)}`;
                        flavorsList.appendChild(li);
                    }
                });
            }
    
            // Select w formularzu zamówienia
            const flavorSelect = document.getElementById('flavor-select');
            if (flavorSelect && flavorSelect.options.length <= 1) {
                flavorSelect.innerHTML = '<option value="">Wybierz smak</option>';
                this.orderSystem.appData.flavors.forEach((flavor, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${index + 1}. ${this.orderSystem.utils.formatFlavorName(flavor)}`;
                    flavorSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Błąd podczas filtrowania smaków:', error);
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
            
            this.orderSystem.appData.flavors.forEach((flavor, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${index + 1}. ${this.orderSystem.utils.formatFlavorName(flavor)}`;
                select.appendChild(option);
            });
            
            this.filterFlavors();
        } catch (error) {
            console.error('Błąd wypełniania listy smaków:', error);
        }
    }

    initPricingTable() {
        try {
            const table = document.getElementById('pricing-table');
            if (!table) return;

            const { headers, rows, descriptions } = this.orderSystem.appData.pricingData;

            let html = `<thead><tr><th>${headers[0]}</th>`;
            for (let i = 1; i < headers.length; i++) {
                html += `<th aria-label="${descriptions[headers[i]]}">${headers[i]}</th>`;
            }
            html += '</tr></thead><tbody>';

            rows.forEach(row => {
                html += '<tr>';
                row.forEach((cell, index) => {
                    html += `<td>${cell}${index > 0 ? 'zł' : ''}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody>';
            table.innerHTML = html;

        } catch (error) {
            console.error('Błąd inicjalizacji tabeli cen:', error);
        }
    }
    
    setupPricePreview() {
        try {
            if (document.getElementById('price-preview')) return;
            
            const pricePreview = document.createElement('div');
            pricePreview.id = 'price-preview';
            pricePreview.textContent = 'Cena: -';
            document.getElementById('strength-select').insertAdjacentElement('afterend', pricePreview);
            
            this.orderSystem.orders.updatePricePreview();
        } catch (error) {
            console.error('Błąd ustawiania podglądu ceny:', error);
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

    updateAdminPanel() {
        try {
            if (document.getElementById('admin-content')?.style.display === 'block') {
                this.orderSystem.stats.updateStats();
            }
        } catch (error) {
            console.error('Błąd aktualizacji panelu admina:', error);
        }
    }
}