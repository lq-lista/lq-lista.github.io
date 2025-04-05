/**
 * Główna inicjalizacja aplikacji - wersja 2.1.2
 * Integracja z Firebase i OrderSystem
 * Poprawki: 
 * - naprawiony błąd z wielokrotnym użyciem canvas
 * - lepsza obsługa błędów
 * - optymalizacja wydajności
 * - poprawione bezpieczeństwo
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Flagi stanu aplikacji
    let appInitialized = false;
    let chartsRendered = false;

    // Funkcja wyświetlająca błąd (ulepszona)
    const showError = (error) => {
        console.error('Błąd inicjalizacji:', error);
        
        // Sprawdź czy już istnieje komunikat o błędzie
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
        
        // Dodaj event listenery po wstawieniu do DOM
        errorContainer.querySelector('.refresh-btn').addEventListener('click', () => {
            window.location.reload();
        });
        
        errorContainer.querySelector('.close-btn').addEventListener('click', () => {
            errorContainer.remove();
        });
    };

    // Funkcja tworząca komunikat o stanie offline/online
    const createNetworkStatusBar = (isOnline) => {
        // Usuń istniejący pasek jeśli jest
        const existingBar = document.querySelector('.network-status-bar');
        if (existingBar) existingBar.remove();
        
        const bar = document.createElement('div');
        bar.className = `network-status-bar ${isOnline ? 'online' : 'offline'}`;
        bar.innerHTML = `
            <span>${isOnline ? '✔️ Połączenie przywrócone' : '⚠️ Tryb offline - niektóre funkcje mogą być niedostępne'}</span>
            <button class="close-status-btn">×</button>
        `;
        document.body.prepend(bar);
        
        // Dodaj obsługę zamknięcia
        bar.querySelector('.close-status-btn').addEventListener('click', () => {
            bar.style.opacity = '0';
            setTimeout(() => bar.remove(), 300);
        });
        
        // Automatyczne ukrywanie
        if (isOnline) {
            setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => bar.remove(), 300);
            }, 3000);
        }
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
                // Funkcja bezpiecznego renderowania HTML (ostateczna wersja)
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

                // 1. Lista smaków
                const flavorsList = document.getElementById('flavors-list');
                if (flavorsList) {
                    try {
                        if (!Array.isArray(AppData.flavors)) {
                            console.warn('AppData.flavors nie jest tablicą:', AppData.flavors);
                            flavorsList.innerHTML = '<li>Brak danych o smakach</li>';
                            return;
                        }

                        flavorsList.innerHTML = AppData.flavors
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

                // Dopasuj rozmiary czcionek dla mobile
                if (window.matchMedia("(max-width: 768px)").matches) {
                    document.querySelectorAll('h2').forEach(h2 => {
                        h2.style.fontSize = '1.5rem';
                    });

                    document.querySelectorAll('.benefit h3').forEach(h3 => {
                        h3.style.fontSize = '1.2rem';
                    });
                }

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

        // 4. Renderowanie wykresów administracyjnych
        const renderAdminCharts = () => {
            if (chartsRendered) return;
            
            const adminPanel = document.getElementById('admin-panel');
            if (!adminPanel) return;

            // Sprawdź czy kontener istnieje, jeśli nie - utwórz go
            let chartsContainer = document.querySelector('.charts-container');
            if (!chartsContainer) {
                chartsContainer = document.createElement('div');
                chartsContainer.className = 'charts-container';
                chartsContainer.innerHTML = `
                    <div class="chart-wrapper">
                        <canvas id="ordersChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="flavorsChart" width="400" height="200"></canvas>
                    </div>
                `;
                adminPanel.appendChild(chartsContainer);
            }

            // Niszczenie istniejących wykresów, jeśli istnieją
            if (window.ordersChartInstance) {
                window.ordersChartInstance.destroy();
                window.ordersChartInstance = null;
            }
            if (window.flavorsChartInstance) {
                window.flavorsChartInstance.destroy();
                window.flavorsChartInstance = null;
            }

            // Pobierz elementy canvas
            const ordersCanvas = document.getElementById('ordersChart');
            const flavorsCanvas = document.getElementById('flavorsChart');

            // Dane do wykresów
            const ordersData = {
                labels: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'],
                datasets: [{
                    label: 'Zamówienia w ostatnich 7 dniach',
                    data: [12, 19, 3, 5, 2, 3, 7],
                    backgroundColor: 'rgba(255, 111, 97, 0.2)',
                    borderColor: '#ff6f61',
                    borderWidth: 2,
                    tension: 0.4
                }]
            };

            const flavorsData = {
                labels: ['Truskawka', 'Mięta', 'Cytryna', 'Cola', 'Arbuz'],
                datasets: [{
                    label: 'Najpopularniejsze smaki',
                    data: [15, 10, 8, 5, 3],
                    backgroundColor: [
                        '#ff6f61',
                        '#ff9a9e',
                        '#fad0c4',
                        '#ffcc00',
                        '#45a049'
                    ],
                    hoverOffset: 4
                }]
            };

            // Inicjalizacja wykresów
            try {
                window.ordersChartInstance = new Chart(ordersCanvas, {
                    type: 'line',
                    data: ordersData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Błąd tworzenia wykresu zamówień:', error);
            }

            try {
                window.flavorsChartInstance = new Chart(flavorsCanvas, {
                    type: 'doughnut',
                    data: flavorsData,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'right'
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Błąd tworzenia wykresu smaków:', error);
            }

            chartsRendered = true;
        };

        // Główna inicjalizacja
        if (!appInitialized) {
            checkDependencies();
            initUI();
            const orderSystem = initOrderSystem();
            
            console.log('Aplikacja została poprawnie zainicjalizowana', {
                version: AppData.version,
                flavorsCount: AppData.flavors.length,
                firebase: typeof firebase !== 'undefined'
            });

            // Renderuj wykresy jeśli panel admina istnieje
            if (document.getElementById('admin-panel')) {
                renderAdminCharts();
            }

            appInitialized = true;
        }

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