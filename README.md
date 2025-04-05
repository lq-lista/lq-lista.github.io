# Sklep z Liquidami - Sole

Kompletny system zamówień dla sklepu z liquidami z panelem administracyjnym.

## Funkcje

✅ **System zamówień**  
- Wybór smaku, pojemności i mocy  
- Podgląd ceny przed dodaniem  
- Edycja zamówienia przed złożeniem  
- Unikalne numery zamówień  

✅ **Filtrowanie smaków**  
- Dwupoziomowy filtr (firma i typ smaku)  
- Numeryczna lista wszystkich smaków  

✅ **Panel administracyjny**  
- Podgląd zamówień po numerze  
- Zmiana statusu zamówienia  
- Hasło zabezpieczające  

✅ **Dodatkowe funkcje**  
- Pola uwag do zamówienia  
- Przewijanie długich list  
- Przycisk szybkiego powrotu do góry  

## Struktura plików

/sklep-liquidy/
│── index.html                  # Główny szkielet strony
│── partials/                   # Częściowe pliki HTML
│   ├── head.html               # Sekcja <head>
│   ├── header.html             # Nagłówek strony
│   ├── main-content.html       # Główna zawartość
│   ├── footer.html             # Stopka
│   ├── order-modal.html        # Modal zamówienia
│   └── admin-panel.html        # Panel administratora
│── app.js                      # Główna logika aplikacji
│── data.js                     # Dane aplikacji
├── js/
│   ├── order/
│   │   ├── core.js             # Główna klasa OrderSystem
│   │   ├── firebase.js         # Integracja z Firebase
│   │   ├── ui.js               # Obsługa interfejsu użytkownika
│   │   ├── orders.js           # Logika zamówień
│   │   ├── statistics.js       # Statystyki i wykresy
│   │   └── utils.js            # Narzędzia pomocnicze
│   └── order.js                # Główny plik inicjalizujący
├── css/
│   ├── main.css            
│   ├── components/         
│   │   ├── buttons.css
│   │   ├── modal.css
│   │   ├── forms.css
│   │   ├── tables.css
│   │   └── filters.css
│   ├── layout/             
│   │   ├── header.css
│   │   ├── footer.css
│   │   └── containers.css
│   ├── pages/              
│   │   ├── flavors.css
│   │   ├── pricing.css
│   │   ├── order.css
│   │   └── admin.css
│   └── utilities/          
│       ├── animations.css
│       ├── responsive.css
│       ├── utilities.css
│       └── scrollbars.css

## Konfiguracja

- **Zmiana hasła admina**:  
  W pliku `order.js` zmień wartość `this.adminPassword`

- **Dodawanie smaków**:  
  Edytuj tablicę `flavors` w pliku `data.js`

- **Modyfikacja cen**:  
  Aktualizuj obiekt `pricingData` w pliku `data.js`

## Podgląd zamówień

1. Kliknij "Panel admina" w stopce
2. Wpisz hasło: `admin123`
3. Wpisz numer zamówienia (np. ORD-123456)
4. Zarządzaj statusem zamówienia

## Uwagi techniczne

- Dane przechowywane w localStorage przeglądarki
- Responsywny design działa na urządzeniach mobilnych
- Brak wymagań serwerowych - działa lokalnie
