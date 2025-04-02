/**
 * Główna inicjalizacja aplikacji
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Sprawdź czy wymagane dane istnieją
      if (!AppData || !AppData.flavors || !AppData.flavorCategories || !AppData.pricingData) {
        throw new Error('Brak wymaganych danych do inicjalizacji');
      }
  
      // Inicjalizacja UI
      const initUI = () => {
        // Renderowanie listy smaków
        const flavorsList = document.getElementById('flavors-list');
        if (!flavorsList) throw new Error('Element #flavors-list nie istnieje');
        
        flavorsList.innerHTML = '';
        AppData.flavors.forEach((flavor, index) => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="flavor-number">${index + 1}.</span> ${flavor}`;
          flavorsList.appendChild(li);
        });
  
        // Renderowanie tabeli cen
        const pricingTable = document.getElementById('pricing-table');
        if (!pricingTable) throw new Error('Element #pricing-table nie istnieje');
        
        pricingTable.innerHTML = '';
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        AppData.pricingData.headers.forEach(headerText => {
          const th = document.createElement('th');
          th.textContent = headerText;
          headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        pricingTable.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        AppData.pricingData.rows.forEach(rowData => {
          const row = document.createElement('tr');
          rowData.forEach(cellData => {
            const cell = document.createElement('td');
            cell.textContent = cellData;
            row.appendChild(cell);
          });
          tbody.appendChild(row);
        });
        pricingTable.appendChild(tbody);
      };
  
      // Inicjalizacja systemu zamówień
      const initOrderSystem = () => {
        if (typeof OrderSystem === 'undefined') {
          throw new Error('OrderSystem nie jest zdefiniowany - sprawdź czy order.js jest załadowany');
        }
        return new OrderSystem();
      };
  
      // Sprawdź czy Firebase jest dostępny
      if (typeof firebase === 'undefined') {
        console.warn('Firebase nie został załadowany!');
        // Możesz tutaj dodać fallback do localStorage
      }
  
      // Główna inicjalizacja
      initUI();
      const orderSystem = initOrderSystem();
      
      // Aktualizacja roku
      const yearElement = document.getElementById('current-year');
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
  
      console.log('Aplikacja została poprawnie zainicjalizowana');
    } catch (error) {
      console.error('Błąd inicjalizacji aplikacji:', error);
      
      // Wyświetl przyjazny komunikat użytkownikowi
      const errorContainer = document.createElement('div');
      errorContainer.className = 'error-message';
      errorContainer.innerHTML = `
        <h3>Wystąpił błąd podczas ładowania strony</h3>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Odśwież stronę</button>
      `;
      document.body.prepend(errorContainer);
    }
  });
  
  // Obsługa offline
  window.addEventListener('offline', () => {
    console.warn('Aplikacja jest w trybie offline');
    alert('Uwaga: Brak połączenia internetowego. Niektóre funkcje mogą nie działać.');
  });
