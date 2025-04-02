/**
 * Główna inicjalizacja aplikacji - wersja 2.1.0
 * Integracja z Firebase i OrderSystem
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Funkcja wyświetlająca błąd
    const showError = (error) => {
        console.error('Błąd inicjalizacji:', error);
        
        const errorContainer = document.createElement('div');
        errorContainer.className = 'global-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Błąd aplikacji</h3>
                <p>${error.message || 'Nieznany błąd'}</p>
                <div class="error-actions">
                    <button onclick="window.location.reload()">Odśwież stronę</button>
                    <button onclick="this.parentElement.parentElement.remove()">Zamknij</button>
                </div>
            </div>
        `;
        document.body.prepend(errorContainer);
    };

    try {
        // 1. Sprawdzenie wymaganych zależności
        if (typeof AppData === 'undefined') {
            throw new Error('Brak danych aplikacji (AppData). Sprawdź czy data.js jest załadowany.');
        }

        if (!AppData.flavors || !AppData.flavorCategories || !AppData.pricingData) {
            throw new Error('Niekompletne dane aplikacji. Sprawdź plik data.js');
        }

        // 2. Inicjalizacja interfejsu użytkownika
        const initUI = () => {
            try {
                // Lista smaków
                const flavorsList = document.getElementById('flavors-list');
                if (!flavorsList) throw new Error('Brak listy smaków (#flavors-list)');
                
                flavorsList.innerHTML = AppData.flavors.map((flavor, index) => 
                    `<li><span class="flavor-number">${index + 1}.</span> ${flavor}</li>`
                ).join('');

                // Tabela cen
                const pricingTable = document.getElementById('pricing-table');
                if (!pricingTable) throw new Error('Brak tabeli cen (#pricing-table)');
                
                pricingTable.innerHTML = `
                    <thead>
                        <tr>${AppData.pricingData.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${AppData.pricingData.rows.map(row => 
                            `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
                        ).join('')}
                    </tbody>
                `;

                // Aktualizacja roku
                const yearElement = document.getElementById('current-year');
                if (yearElement) {
                    yearElement.textContent = new Date().getFullYear();
                }

            } catch (uiError) {
                console.error('Błąd inicjalizacji UI:', uiError);
                throw uiError;
            }
        };

        // 3. Inicjalizacja systemu zamówień
        const initOrderSystem = () => {
            if (typeof OrderSystem === 'undefined') {
                throw new Error('System zamówień nie jest dostępny. Sprawdź czy order.js jest załadowany.');
            }

            try {
                const system = new OrderSystem();
                
                // Sprawdź czy Firebase działa
                if (typeof firebase !== 'undefined') {
                    console.log('Firebase jest dostępny:', firebase.SDK_VERSION);
                } else {
                    console.warn('Firebase nie został załadowany - aplikacja działa w trybie offline');
                }
                
                return system;
            } catch (systemError) {
                console.error('Błąd inicjalizacji OrderSystem:', systemError);
                throw systemError;
            }
        };

        // Główna inicjalizacja
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

// Obsługa stanu offline
window.addEventListener('offline', () => {
    const offlineBar = document.createElement('div');
    offlineBar.className = 'offline-bar';
    offlineBar.textContent = '⚠️ Tryb offline - niektóre funkcje mogą być niedostępne';
    document.body.prepend(offlineBar);
    
    setTimeout(() => {
        offlineBar.style.opacity = '0';
        setTimeout(() => offlineBar.remove(), 500);
    }, 5000);
});

// Automatyczne ukrywanie komunikatu o offline gdy połączenie wróci
window.addEventListener('online', () => {
    const offlineBar = document.querySelector('.offline-bar');
    if (offlineBar) {
        offlineBar.textContent = '✔️ Połączenie przywrócone';
        offlineBar.style.background = '#4CAF50';
        
        setTimeout(() => {
            offlineBar.style.opacity = '0';
            setTimeout(() => offlineBar.remove(), 500);
        }, 2000);
    }
});
