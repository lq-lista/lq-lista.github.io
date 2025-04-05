document.addEventListener('DOMContentLoaded', () => {
    try {
        // Utwórz element statusu połączenia
        const createConnectionStatus = () => {
            const statusElement = document.createElement('div');
            statusElement.id = 'connection-status';
            statusElement.textContent = 'Łączenie...';
            document.body.appendChild(statusElement);
        };

        // Funkcja do wyświetlania błędów
        const showError = (message) => {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'app-error';
            errorContainer.innerHTML = `
                <h3>Błąd aplikacji</h3>
                <p>${message}</p>
                <p>Proszę odświeżyć stronę lub skontaktować się z administratorem.</p>
            `;
            document.body.prepend(errorContainer);
            
            // Ukryj loader jeśli jest widoczny
            const loader = document.getElementById('app-loading');
            if (loader) {
                loader.style.display = 'none';
            }
        };

        // Sprawdź wymagane zależności
        if (typeof Chart === 'undefined') {
            console.warn('Biblioteka Chart.js nie została załadowana - wykresy nie będą działać');
        }

        // Utwórz element statusu połączenia
        createConnectionStatus();

        // Inicjalizacja głównego systemu
        const orderSystem = new OrderSystem();
        window.orderSystem = orderSystem;

        // Aktualizacja roku w stopce
        const currentYearElement = document.getElementById('current-year');
        if (currentYearElement) {
            currentYearElement.textContent = new Date().getFullYear();
        }

        // Ukryj loader po załadowaniu
        const hideLoader = () => {
            const loader = document.getElementById('app-loading');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }
        };

        // Spróbuj zainicjować Firebase
        if (typeof firebase !== 'undefined') {
            orderSystem.firebase.initializeFirebase();
        } else {
            console.log("Firebase nie jest dostępny - tryb offline");
            orderSystem.firebase.setOfflineMode();
            orderSystem.stats.updateStats();
        }

        // Ukryj loader po 1.5 sekundy (minimalny czas ładowania)
        setTimeout(hideLoader, 1500);

    } catch (error) {
        console.error('Błąd inicjalizacji aplikacji:', error);
        showError(error.message);
    }
});

// Obsługa Service Worker dla PWA (opcjonalne)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}