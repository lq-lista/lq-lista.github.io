// Funkcja pomocnicza do sprawdzania elementów DOM
const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) console.warn(`Element #${id} nie został znaleziony`);
    return element;
  };
  
  // Funkcja do wyświetlania błędów
  const showError = (message) => {
    console.error(message);
    const errorContainer = document.createElement('div');
    errorContainer.className = 'app-error';
    errorContainer.innerHTML = `
      <h3>Błąd aplikacji</h3>
      <p>${message}</p>
      <p>Proszę odświeżyć stronę lub skontaktować się z administratorem.</p>
    `;
    document.body.prepend(errorContainer);
    
    const loader = getElement('app-loading');
    if (loader) loader.style.display = 'none';
  };
  
  // Sprawdzenie załadowanych bibliotek
  const checkDependencies = () => {
    if (typeof Chart === 'undefined') {
      console.warn('Biblioteka Chart.js nie została załadowana - wykresy nie będą działać');
    }
    if (typeof firebase === 'undefined') {
      console.warn('Firebase nie został załadowany - tryb offline');
    }
  };
  
  // Inicjalizacja aplikacji
  const initApp = () => {
    try {
      checkDependencies();
      
      // Utwórz element statusu połączenia
      const statusElement = document.createElement('div');
      statusElement.id = 'connection-status';
      statusElement.textContent = 'Łączenie...';
      document.body.appendChild(statusElement);
      
      // Inicjalizacja głównego systemu
      const orderSystem = new OrderSystem();
      window.orderSystem = orderSystem;
      
      // Aktualizacja roku w stopce
      const currentYearElement = getElement('current-year');
      if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
      }
      
      // Ukryj loader
      const hideLoader = () => {
        const loader = getElement('app-loading');
        if (loader) {
          loader.style.opacity = '0';
          setTimeout(() => loader.style.display = 'none', 300);
        }
      };
      
      setTimeout(hideLoader, 1500);
      
    } catch (error) {
      console.error('Błąd inicjalizacji aplikacji:', error);
      showError(error.message);
    }
  };
  
  // Rejestracja Service Worker
  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('ServiceWorker zarejestrowany'))
        .catch(err => console.error('ServiceWorker registration failed:', err));
    }
  };
  
  // Start aplikacji po załadowaniu DOM
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
    registerServiceWorker();
  });