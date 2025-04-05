/**
 * Główna inicjalizacja aplikacji - wersja 2.2.0
 * Integracja z Firebase, OrderSystem i nowym systemem filtrów
 * Poprawki: obsługa błędów, optymalizacja, bezpieczeństwo
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Funkcja wyświetlająca błąd (ulepszona)
    const showError = (error) => {
        console.error('Błąd inicjalizacji:', error);
        
        if (document.querySelector('.global-error')) return;
        
        const errorContainer = document.createElement('div');
        errorContainer.className = 'global-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Błąd aplikacji</h3>
                <p>${error.message || 'Nieznany błąd'}</p>
                <div class="error-actions">
                    <button class="refresh-btn">Odśwież stronę</button>
                    <button class="close-btn">Zamknij</button>
                </div>
            </div>
        `;
        document.body.prepend(errorContainer);
        
        errorContainer.querySelector('.refresh-btn').addEventListener('click', () => {
            window.location.reload();
        });
        
        errorContainer.querySelector('.close-btn').addEventListener('click', () => {
            errorContainer.remove();
        });
    };

    // Funkcja tworząca komunikat o stanie offline/online
    const createNetworkStatusBar = (isOnline) => {
        const existingBar = document.querySelector('.network-status-bar');
        if (existingBar) existingBar.remove();
        
        const bar = document.createElement('div');
        bar.className = `network-status-bar ${isOnline ? 'online' : 'offline'}`;
        bar.innerHTML = `
            <span>${isOnline ? '✔️ Połączenie przywrócone' : '⚠️ Tryb offline - niektóre funkcje mogą być niedostępne'}</span>
            <button class="close-status-btn">×</button>
        `;
        document.body.prepend(bar);
        
        bar.querySelector('.close-status-btn').addEventListener('click', () => {
            bar.style.opacity = '0';
            setTimeout(() => bar.remove(), 300);
        });
        
        if (isOnline) {
            setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => bar.remove(), 300);
            }, 3000);
        }
        
        return bar;
    };

    try {
        // 1. Sprawdzenie wymaganych zależności (ulepszone)
        const checkDependencies = () => {
            if (typeof AppData === 'undefined') {
                throw new Error('Brak danych aplikacji (AppData). Sprawdź czy data.js jest załadowany.');
            }

            const requiredData = ['flavors', 'flavorCategories', 'pricingData', 'version'];
            const missingData = requiredData.filter(prop => !AppData[prop]);
            
            if (missingData.length > 0) {
                throw new Error(`Niekompletne dane aplikacji. Brakujące właściwości: ${missingData.join(', ')}`);
            }
            
            console.log('Wersja aplikacji:', AppData.version);
        };

        // 2. Inicjalizacja interfejsu użytkownika (ostateczna wersja)
        const initUI = () => {
            try {
                const sanitizeHTML = (input) => {
                    if (input === null || input === undefined || input === false) return '';
                    if (typeof input === 'boolean') return input ? 'true' : 'false';
                    if (typeof input === 'number') return String(input);
                    if (typeof input !== 'string') {
                        try {
                            input = String(input);
                        } catch (e) {
                            console.warn('Nie można przekonwertować wartości na string:', input);
                            return '';
                        }
                    }
                    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                };

                // 1. Lista smaków z filtrowaniem
                const flavorsList = document.getElementById('flavors-list');
                if (flavorsList) {
                    try {
                        if (!Array.isArray(AppData.flavors)) {
                            console.warn('AppData.flavors nie jest tablicą:', AppData.flavors);
                            flavorsList.innerHTML = '<li>Brak danych o smakach</li>';
                            return;
                        }

                        const renderFlavorsList = (flavorsToShow) => {
                            flavorsList.innerHTML = flavorsToShow
                                .map((flavor, index) => {
                                    try {
                                        const displayName = flavor ? sanitizeHTML(flavor) : 'Brak nazwy smaku';
                                        return `<li><span class="flavor-number">${index + 1}.</span> ${displayName}</li>`;
                                    } catch (e) {
                                        console.warn('Błąd przetwarzania smaku:', flavor, e);
                                        return `<li><span class="flavor-number">${index + 1}.</span> Nieznany smak</li>`;
                                    }
                                })
                                .join('') || '<li>Brak dostępnych smaków</li>';
                        };

                        // Inicjalizacja filtrowania
                        const initFilters = () => {
                            const filterButtons = document.querySelectorAll('.filter-btn');
                            
                            const filterFlavors = (category) => {
                                let flavorsToShow = [];
                                
                                if (category === 'all') {
                                    flavorsToShow = AppData.flavors;
                                } else {
                                    const indexes = AppData.flavorCategories[category] || [];
                                    flavorsToShow = indexes.map(index => AppData.flavors[index]);
                                }
                                
                                renderFlavorsList(flavorsToShow);
                            };
                            
                            filterButtons.forEach(btn => {
                                btn.addEventListener('click', function() {
                                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                                    this.classList.add('active');
                                    filterFlavors(this.dataset.category);
                                });
                            });
                            
                            // Początkowy stan - wszystkie smaki
                            filterFlavors('all');
                        };
                        
                        initFilters();
                    } catch (flavorError) {
                        console.error('Błąd ładowania listy smaków:', flavorError);
                        flavorsList.innerHTML = '<li class="error">Nie można załadować listy smaków</li>';
                    }
                }

                // 2. Tabela cen (bardziej defensywna wersja)
                const pricingTable = document.getElementById('pricing-table');
                if (pricingTable) {
                    try {
                        if (!AppData.pricingData) {
                            throw new Error('Brak danych pricingData');
                        }

                        const headers = Array.isArray(AppData.pricingData.headers) 
                            ? AppData.pricingData.headers 
                            : [];
                        const rows = Array.isArray(AppData.pricingData.rows) 
                            ? AppData.pricingData.rows 
                            : [];
                        const descriptions = AppData.pricingData.descriptions || {};

                        const renderTableRow = (cells, isHeader = false) => {
                            if (!Array.isArray(cells)) return '';
                            return cells.map((cell, cellIndex) => {
                                try {
                                    if (isHeader) {
                                        return `<th>${sanitizeHTML(cell)}</th>`;
                                    } else {
                                        const headerKey = headers[cellIndex]?.toLowerCase().replace('/', '').replace('mg', '');
                                        const tooltip = descriptions[headerKey] ? `data-tooltip="${sanitizeHTML(descriptions[headerKey])}"` : '';
                                        return `<td ${tooltip}>${sanitizeHTML(cell)}${cellIndex > 0 ? 'zł' : ''}</td>`;
                                    }
                                } catch (e) {
                                    console.warn('Błąd renderowania komórki:', cell);
                                    return isHeader ? '<th>?</th>' : '<td>?</td>';
                                }
                            }).join('');
                        };

                        pricingTable.innerHTML = `
                            <thead>
                                <tr>${renderTableRow(headers, true)}</tr>
                            </thead>
                            <tbody>
                                ${rows.map(row => `<tr>${renderTableRow(row)}</tr>`).join('')}
                            </tbody>
                        `;
                    } catch (pricingError) {
                        console.error('Błąd ładowania tabeli cen:', pricingError);
                        pricingTable.innerHTML = `
                            <tr>
                                <td colspan="10" class="error">
                                    Nie można załadować cennika
                                </td>
                            </tr>
                        `;
                    }
                }

                // 3. Aktualizacja roku
                document.querySelectorAll('[data-current-year]').forEach(el => {
                    try {
                        el.textContent = new Date().getFullYear();
                    } catch (yearError) {
                        console.error('Błąd aktualizacji roku:', yearError);
                        el.textContent = new Date().getFullYear().toString();
                    }
                });

                // 4. Inicjalizacja modali
                const initModals = () => {
                    // Modal zamówienia
                    const orderModal = document.getElementById('order-modal');
                    const orderBtn = document.getElementById('start-order');
                    const closeBtn = document.querySelector('.close');
                    
                    if (orderModal && orderBtn && closeBtn) {
                        orderBtn.addEventListener('click', () => {
                            orderModal.style.display = 'block';
                        });
                        
                        closeBtn.addEventListener('click', () => {
                            orderModal.style.display = 'none';
                        });
                        
                        window.addEventListener('click', (event) => {
                            if (event.target === orderModal) {
                                orderModal.style.display = 'none';
                            }
                        });
                    }
                    
                    // Modal admina
                    const adminLink = document.getElementById('admin-link');
                    const adminPanel = document.getElementById('admin-panel');
                    
                    if (adminLink && adminPanel) {
                        adminLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            adminPanel.style.display = 'block';
                        });
                    }
                };
                
                initModals();

                // 5. Obsługa kopiowania numeru zamówienia
                document.addEventListener('click', function(e) {
                    if (e.target.closest('.copy-order-btn')) {
                        const btn = e.target.closest('.copy-order-btn');
                        const orderNumber = document.getElementById('order-number')?.textContent;
                        
                        if (!orderNumber) return;
                        
                        navigator.clipboard.writeText(orderNumber).then(() => {
                            const btnText = btn.querySelector('.btn-text');
                            const btnIcon = btn.querySelector('.btn-icon');
                            
                            btnText.textContent = 'Skopiowano!';
                            btnIcon.textContent = '✔️';
                            btn.classList.add('copied');
                            
                            setTimeout(() => {
                                btnText.textContent = 'Kopiuj';
                                btnIcon.textContent = '📋';
                                btn.classList.remove('copied');
                            }, 2000);
                        }).catch(err => {
                            console.error('Błąd kopiowania: ', err);
                        });
                    }
                });

            } catch (uiError) {
                console.error('Krytyczny błąd inicjalizacji UI:', uiError);
                throw new Error(`Interfejs użytkownika: ${uiError.message}`);
            }
        };

        // 3. Inicjalizacja systemu zamówień (ulepszona)
        const initOrderSystem = () => {
            try {
                if (typeof OrderSystem === 'undefined') {
                    throw new Error('System zamówień nie jest dostępny. Sprawdź czy order.js jest załadowany.');
                }

                // Sprawdź czy Firebase jest dostępny
                const firebaseAvailable = typeof firebase !== 'undefined' && 
                                        typeof firebase.database === 'function';
                
                if (firebaseAvailable) {
                    console.log('Firebase jest dostępny:', firebase.SDK_VERSION);
                } else {
                    console.warn('Firebase nie został załadowany - aplikacja działa w trybie offline');
                }

                const system = new OrderSystem();
                
                // Opóźniona synchronizacja po załadowaniu strony
                setTimeout(() => {
                    if (firebaseAvailable) {
                        system.syncOrdersFromFirebase().catch(e => 
                            console.warn('Błąd synchronizacji:', e.message)
                        );
                    }
                }, 2000);
                
                return system;
            } catch (systemError) {
                console.error('Błąd inicjalizacji OrderSystem:', systemError);
                throw new Error(`System zamówień: ${systemError.message}`);
            }
        };

        // Główna inicjalizacja
        checkDependencies();
        initUI();
        const orderSystem = initOrderSystem();
        
        console.log('Aplikacja została poprawnie zainicjalizowana', {
            version: AppData.version,
            flavorsCount: AppData.flavors.length,
            firebase: typeof firebase !== 'undefined'
        });

    } catch (mainError) {
        showError(mainError);
    }
});

// Obsługa stanu sieci (ulepszona)
const handleNetworkChange = () => {
    if (navigator.onLine) {
        createNetworkStatusBar(true);
    } else {
        createNetworkStatusBar(false);
    }
};

// Inicjalizacja stanu sieci przy ładowaniu
window.addEventListener('load', () => {
    if (!navigator.onLine) {
        createNetworkStatusBar(false);
    }
});

window.addEventListener('offline', () => handleNetworkChange());
window.addEventListener('online', () => handleNetworkChange());

// Automatyczne odświeżanie przy powrocie do online
window.addEventListener('online', () => {
    if (sessionStorage.getItem('autoRefreshOnOnline') === 'true') {
        sessionStorage.removeItem('autoRefreshOnOnline');
        window.location.reload();
    }
});

window.addEventListener('offline', () => {
    sessionStorage.setItem('autoRefreshOnOnline', 'true');
});