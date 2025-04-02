/**
 * Główna inicjalizacja aplikacji - wersja 2.1.1
 * Integracja z Firebase i OrderSystem
 * Poprawki: obsługa błędów, optymalizacja, bezpieczeństwo
 */
document.addEventListener('DOMContentLoaded', async () => {
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

        // 2. Inicjalizacja interfejsu użytkownika (ulepszona)
        const initUI = () => {
            try {
                // Lista smaków
                const flavorsList = document.getElementById('flavors-list');
                if (!flavorsList) throw new Error('Brak listy smaków (#flavors-list)');
                
                flavorsList.innerHTML = AppData.flavors
                    .map((flavor, index) => 
                        `<li><span class="flavor-number">${index + 1}.</span> ${flavor}</li>`
                    )
                    .join('');

                // Tabela cen (z zabezpieczeniem przed XSS)
                const sanitizeHTML = (str) => {
                    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                };
                
                const pricingTable = document.getElementById('pricing-table');
                if (pricingTable) {
                    pricingTable.innerHTML = `
                        <thead>
                            <tr>${
                                AppData.pricingData.headers
                                .map(h => `<th>${sanitizeHTML(h)}</th>`)
                                .join('')
                            }</tr>
                        </thead>
                        <tbody>
                            ${
                                AppData.pricingData.rows
                                .map(row => 
                                    `<tr>${
                                        row.map(cell => `<td>${sanitizeHTML(cell)}</td>`).join('')
                                    }</tr>`
                                )
                                .join('')
                            }
                        </tbody>
                    `;
                }

                // Aktualizacja roku
                document.querySelectorAll('[data-current-year]').forEach(el => {
                    el.textContent = new Date().getFullYear();
                });

            } catch (uiError) {
                console.error('Błąd inicjalizacji UI:', uiError);
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
