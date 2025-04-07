/**
 * Główna inicjalizacja aplikacji - wersja 2.2.0
 * Integracja z Firebase i OrderSystem
 * Poprawki:
 * - lepsza obsługa błędów i inicjalizacji wykresów
 * - optymalizacja wydajności
 * - poprawione bezpieczeństwo
 * - lepsze zarządzanie stanem aplikacji
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Flagi stanu aplikacji
    const appState = {
        initialized: false,
        chartsRendered: false,
        orderSystem: null
    };

    // Funkcja wyświetlająca błąd
    const showError = (error, context = '') => {
        console.error(`Błąd${context ? ` w ${context}` : ''}:`, error);
        
        if (document.querySelector('.global-error')) return;
        
        const errorMessage = error.message || 'Nieznany błąd aplikacji';
        const errorContainer = document.createElement('div');
        errorContainer.className = 'global-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Błąd aplikacji</h3>
                <p>${errorMessage}</p>
                <div class="error-actions">
                    <button class="refresh-btn">Odśwież stronę</button>
                    <button class="close-btn">Zamknij</button>
                </div>
            </div>
        `;
        
        document.body.prepend(errorContainer);
        errorContainer.querySelector('.refresh-btn').addEventListener('click', () => window.location.reload());
        errorContainer.querySelector('.close-btn').addEventListener('click', () => errorContainer.remove());
    };

    // Funkcja tworząca komunikat o stanie sieci
    const createNetworkStatusBar = (isOnline) => {
        const existingBar = document.querySelector('.network-status-bar');
        if (existingBar) existingBar.remove();
        
        const statusMessage = isOnline 
            ? '✔️ Połączenie przywrócone' 
            : '⚠️ Tryb offline - niektóre funkcje mogą być niedostępne';
        
        const bar = document.createElement('div');
        bar.className = `network-status-bar ${isOnline ? 'online' : 'offline'}`;
        bar.innerHTML = `
            <span>${statusMessage}</span>
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
    };

    // Sprawdzenie wymaganych zależności
    const checkDependencies = () => {
        const requiredDependencies = {
            AppData: ['flavors', 'flavorCategories', 'pricingData', 'version'],
            Firebase: ['app', 'database']
        };

        if (typeof AppData === 'undefined') {
            throw new Error('Brak danych aplikacji (AppData). Sprawdź czy data.js jest załadowany.');
        }

        // Walidacja danych AppData
        const missingData = requiredDependencies.AppData.filter(prop => !AppData[prop]);
        if (missingData.length > 0) {
            throw new Error(`Niekompletne dane aplikacji. Brakujące właściwości: ${missingData.join(', ')}`);
        }

        // Logowanie wersji
        console.log(`Wersja aplikacji: ${AppData.version}`);
    };

    // Inicjalizacja interfejsu użytkownika
    const initUI = () => {
        try {
            // Funkcja sanitizacji HTML
            const sanitizeHTML = (input) => {
                if (input == null) return '';
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

            // Renderowanie listy smaków
            const renderFlavorsList = () => {
                const flavorsList = document.getElementById('flavors-list');
                if (!flavorsList) return;

                if (!Array.isArray(AppData.flavors)) {
                    flavorsList.innerHTML = '<li class="error">Błędne dane smaków</li>';
                    return;
                }

                flavorsList.innerHTML = AppData.flavors
                    .map((flavor, index) => {
                        const displayName = flavor ? sanitizeHTML(flavor) : 'Brak nazwy smaku';
                        return `<li><span class="flavor-number">${index + 1}.</span> ${displayName}</li>`;
                    })
                    .join('') || '<li>Brak dostępnych smaków</li>';
            };

            // Renderowanie tabeli cen
            const renderPricingTable = () => {
                const pricingTable = document.getElementById('pricing-table');
                if (!pricingTable || !AppData.pricingData) return;

                try {
                    const { headers = [], rows = [], descriptions = {} } = AppData.pricingData;

                    const renderCell = (cell, isHeader = false, index = 0) => {
                        const sanitizedCell = sanitizeHTML(cell);
                        if (isHeader) return `<th>${sanitizedCell}</th>`;

                        const headerKey = headers[index]?.toLowerCase().replace(/[\/mg]/g, '');
                        const tooltip = descriptions[headerKey] ? `data-tooltip="${sanitizeHTML(descriptions[headerKey])}"` : '';
                        return `<td ${tooltip}>${sanitizedCell}${index > 0 ? 'zł' : ''}</td>`;
                    };

                    pricingTable.innerHTML = `
                        <thead><tr>${headers.map((h, i) => renderCell(h, true, i)).join('')}</tr></thead>
                        <tbody>${rows.map(row => `<tr>${row.map((c, i) => renderCell(c, false, i)).join('')}</tr>`).join('')}</tbody>
                    `;
                } catch (error) {
                    console.error('Błąd renderowania tabeli cen:', error);
                    pricingTable.innerHTML = '<tr><td colspan="10" class="error">Błąd ładowania cennika</td></tr>';
                }
            };

            // Aktualizacja roku w stopce
            const updateYear = () => {
                document.querySelectorAll('[data-current-year]').forEach(el => {
                    el.textContent = new Date().getFullYear();
                });
            };

            renderFlavorsList();
            renderPricingTable();
            updateYear();

        } catch (error) {
            throw new Error(`Błąd inicjalizacji UI: ${error.message}`);
        }
    };

    // Inicjalizacja systemu zamówień
    const initOrderSystem = () => {
        try {
            if (typeof OrderSystem === 'undefined') {
                throw new Error('Brak systemu zamówień. Sprawdź czy order.js jest załadowany.');
            }

            const isFirebaseAvailable = typeof firebase !== 'undefined' && 
                                      typeof firebase.database === 'function';

            console.log(`Firebase ${isFirebaseAvailable ? 'dostępny' : 'niedostępny'}: ${firebase?.SDK_VERSION || 'brak'}`);

            const system = new OrderSystem();
            appState.orderSystem = system;

            // Opóźniona synchronizacja
            if (isFirebaseAvailable) {
                setTimeout(() => {
                    system.syncOrdersFromFirebase()
                        .catch(e => console.warn('Błąd synchronizacji:', e.message));
                }, 2000);
            }

            return system;

        } catch (error) {
            throw new Error(`Błąd systemu zamówień: ${error.message}`);
        }
    };

    // Renderowanie wykresów admina
    const renderAdminCharts = () => {
        if (appState.chartsRendered || !document.getElementById('admin-panel')) return;
    
        try {
            // Usuń tylko kontener głównego wykresu ordersChart
            const mainChartContainer = document.querySelector('.chart-container');
            if (mainChartContainer) mainChartContainer.remove();
    
            // Zostawiamy flagę initialized
            appState.chartsRendered = true;
    
        } catch (error) {
            console.error('Błąd renderowania panelu admina:', error);
        }
    };

    // Główna inicjalizacja aplikacji
    try {
        if (appState.initialized) return;

        checkDependencies();
        initUI();
        initOrderSystem();
        renderAdminCharts();

        console.log('Aplikacja zainicjalizowana pomyślnie', {
            version: AppData.version,
            flavorsCount: AppData.flavors.length,
            firebase: typeof firebase !== 'undefined'
        });

        appState.initialized = true;

    } catch (error) {
        showError(error, 'inicjalizacji aplikacji');
    }
});

// Obsługa stanu sieci
const handleNetworkChange = () => {
    createNetworkStatusBar(navigator.onLine);
};

// Inicjalizacja stanu sieci
window.addEventListener('load', () => {
    if (!navigator.onLine) {
        createNetworkStatusBar(false);
    }
});

// Nasłuchiwanie zmian połączenia
window.addEventListener('offline', handleNetworkChange);
window.addEventListener('online', handleNetworkChange);

// Automatyczne odświeżanie przy powrocie online
window.addEventListener('online', () => {
    if (sessionStorage.getItem('autoRefreshOnOnline') === 'true') {
        sessionStorage.removeItem('autoRefreshOnOnline');
        setTimeout(() => window.location.reload(), 1000);
    }
});

window.addEventListener('offline', () => {
    sessionStorage.setItem('autoRefreshOnOnline', 'true');
});