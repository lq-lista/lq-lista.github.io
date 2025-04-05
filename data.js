/**
 * Pełna baza smaków liquidów z kategoriami i cennikiem
 * @version 2.0.0
 * @type {Object}
 */
const AppData = (() => {
    // Główna lista smaków
    const flavors = [
        // Owoce + chłodzenie
        "Cukierek jabłkowy, chłodzik",
        "Czarna porzeczka, jeżyna, truskawka, malina, jagoda, czerwona porzeczka, ananas, chłodzik, słodzik",
        "Truskawka, słodzik, chłodzik",
        "Cola z chłodzikiem",
        "Czerwone owoce, cytrusy, chłodzik",
        "Niebieska malina, chłodzik",
        "Brzoskwinia, kiwi, słodka malina",
        "Kwaśna cytryna, limonka, chłodzik, słodzik",
        
        // Miętowe
        "Mieszanka świeżej mięty, miętowe cukierki",
        
        // Owocowe
        "Arbuz, sok cytrynowy, chłodzik, słodzik",
        "Granat, kiwi, poziomka, ice",
        "Wiśnia, smoczy owoc, ice",
        "Owoce leśne, ice",
        "Gruszka, melon, granat, ice",
        "Ananas, grejpfrut",
        
        // Energy drink
        "Kiwi (Energy Drink)",
        
        // Wanna Be Cool
        "Cactus (Wanna Be Cool)",
        
        // Funk Claro
        "Strawberry Cream (Funk Claro)",
        "Kiwi Guava Marakuja (Funk Claro)",
        "Kwaśne Jabłko (Funk Claro)",
        "Mrożone Winogrono (Funk Claro)",
        "Chilled Face (Funk Claro)",
        "Blue Slushie (Funk Claro)",
        "Berry (Funk Claro)",
        "Mint Watermelon (Funk Claro)",
        
        // Aroma King
        "Blue Razz Cherry (Aroma King)",
        "Geometric (Aroma King)",
        "Dragon Berry (Aroma King)",
        "Blueberry Slushie (Aroma King)",
        "Dilons (Aroma King)",
        "Wild Orange (Aroma King)",
        "Summer Time (Aroma King)",
        "Citrus Punch (Aroma King)",
        "Panda (Aroma King)",
        "Gruszka (Aroma King)"
    ];

    // Kategorie smaków
    const flavorCategories = {
        // Główne profile smakowe
        "owocowe": [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
        "miętowe": [8, 24],
        "słodkie": [0, 1, 2, 6, 9, 15, 17, 22, 23, 25, 26, 27, 28, 29, 30, 31, 33, 34],
        "cytrusowe": [4, 7, 14, 19, 30, 32],
        "energy": [15],
        
        // Producenci
        "funk": [17, 18, 19, 20, 21, 22, 23, 24],
        "aroma": [25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
        "wanna": [16],
        
        // Specjalne
        "chłodzone": [0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 20, 21, 22, 23, 24, 25, 28],
        "bez_słodzika": [3, 5, 6, 8, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]
    };

    // Cennik
    const pricingData = {
        headers: ["Pojemność", "24mg", "18mg", "12mg", "6/3/0mg"],
        rows: [
            ["60ml", 70, 68, 67, 66],
            ["30ml", 40, 38, 37, 36],
            ["10ml", 16, 15, 14, 13]
        ],
        // Opisy kolumn dla a11y
        descriptions: {
            "24mg": "Mocna nikotyna 24mg/ml",
            "18mg": "Średnia moc 18mg/ml",
            "12mg": "Łagodna moc 12mg/ml",
            "6/3/0mg": "Słaba moc (6mg, 3mg) lub bez nikotyny (0mg)"
        }
    };

    // Walidacja danych
    const validateData = () => {
        const errors = [];
        
        // Sprawdź czy wszystkie indeksy w kategoriach istnieją
        Object.entries(flavorCategories).forEach(([category, indexes]) => {
            indexes.forEach(index => {
                if (!flavors[index]) {
                    errors.push(`BŁĄD: Kategoria "${category}" wskazuje na nieistniejący smak (indeks ${index})`);
                }
            });
        });
        
        // Sprawdź czy wszystkie smaki mają przynajmniej jedną kategorię
        flavors.forEach((_, index) => {
            let hasCategory = false;
            for (const category in flavorCategories) {
                if (flavorCategories[category].includes(index)) {
                    hasCategory = true;
                    break;
                }
            }
            if (!hasCategory) {
                console.warn(`UWAGA: Smak nr ${index + 1} ("${flavors[index]}") nie ma przypisanej kategorii`);
            }
        });
        
        if (errors.length > 0) {
            errors.forEach(error => console.error(error));
            throw new Error("Wykryto błędy w danych aplikacji");
        }
    };

    validateData();

    return {
        flavors,
        flavorCategories,
        pricingData,
        version: '2.0.0',
        lastUpdated: '2023-11-20'
    };
})();

// Wywołanie funkcji renderAdminCharts po załadowaniu danych aplikacji
if (typeof renderAdminCharts === 'function') {
    document.addEventListener('DOMContentLoaded', () => {
        renderAdminCharts();
    });
} else {
    console.warn('Funkcja renderAdminCharts nie jest dostępna. Upewnij się, że app.js jest poprawnie załadowany.');
}

// Eksport dla Node.js (jeśli potrzebny)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppData;
}

window.AppData = AppData