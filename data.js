/**
 * Pełna baza smaków liquidów z kategoriami i cennikiem
 * @version 3.0.0
 * @type {Object}
 */
const AppData = (() => {
    // Główna lista smaków
    const flavors = [
        // A&L
        "Cukierek jabłkowy, chłodzik (A&L)",
        "Czarna porzeczka, jeżyna, truskawka, malina, jagoda, czerwona porzeczka, ananas, chłodzik, słodzik (A&L)",
        "Truskawka, słodzik, chłodzik (A&L)",
        "Cola z chłodzikiem (A&L)",
        "Czerwone owoce, cytrusy, chłodzik (A&L)",
        "Niebieska malina, chłodzik (A&L)",
        "Brzoskwinia, kiwi, słodka malina (A&L)",
        "Kwaśna cytryna, limonka, chłodzik, słodzik (A&L)",
        "Mieszanka świeżej mięty, miętowe cukierki (A&L)",
        "Arbuz, sok cytrynowy, chłodzik, słodzik (A&L)",
        "Czarna porzeczka, truskawka, malina, jagody, czerwona porzeczka, ice (A&L)",
        "Czerwona porzeczka, jagoda, malina (A&L)",
        "Truskawka, czerwona porzeczka, malina (A&L)",
        // Tribal Force
        "Słodki kaktus limonka (Tribal Force)",
        // Vapir Vape
        "Wiśnia, smoczy owoc, ice (Vapir Vape)",
        "Owoce leśne, ice (Vapir Vape)",
        "Ananas, grejpfrut (Vapir Vape)",
        "Owoce tropikalne (Vapir Vape)",
        "Winogrono, jeżyna, anyż, ice (Vapir Vape)",
        // Fighter Fuel
        "Gruszka, melon, granat, ice (Fighter Fuel)",
        "Granat, kiwi, poziomka, ice (Fighter Fuel)",
        "Słodkie mango, owoce tropikalne, nuta ananasa, lekki ice (Fighter Fuel)",
        // IZI PIZI
        "Mango papaya (IZI PIZI)",
        "Energy drink kiwi (IZI PIZI)",
        // WANNA BE COOL
        "Cactus (WANNA BE COOL)",
        "Strawberry cream (WANNA BE COOL)",
        // FUNK CLARO
        "Kiwi guawa marakuja (FUNK CLARO)",
        "Kwaśne jabłko (FUNK CLARO)",
        "Mrożone winogrono (FUNK CLARO)",
        "Chilled face (FUNK CLARO)",
        "Blue slushie (FUNK CLARO)",
        "Berry (FUNK CLARO)",
        "Mint watermelon (FUNK CLARO)",
        // AROMA KING
        "Blue razz cherry (AROMA KING)",
        "Geometric (AROMA KING)",
        "Dragon berry (AROMA KING)",
        "Blueberry slushie (AROMA KING)",
        // DILNO'S
        "Wild orange (DILNO'S)",
        "Summer time (DILNO'S)",
        "Citrus punch (DILNO'S)",
        // PANDA
        "Gruszka (PANDA)"
    ];

    // Kategorie smaków
    const flavorCategories = {
        "owocowe": [0,1,2,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40],
        "miętowe": [8,33],
        "słodkie": [0,1,2,6,9,10,12,13,14,17,19,20,21,22,23,25,26,31,32,34,35,36,37,38,39,40],
        "cytrusowe": [4,7,8,16,17,22,24,30,39,40],
        "energy": [24],
        "chłodzone": [0,1,2,3,4,5,7,8,9,10,11,14,15,16,18,19,20,21,22,27,28,29,30,31,32,33],
        "a&l": [0,1,2,3,4,5,6,7,8,9,10,11,12,13],
        "tribal": [14],
        "vapir": [15,16,17,18,19],
        "fighter": [20,21,22],
        "izi": [23,24],
        "wanna": [25,26],
        "funk": [27,28,29,30,31,32,33],
        "aroma": [34,35,36,37],
        "dilno": [38,39,40],
        "panda": [41]
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
        version: '3.0.0',
        lastUpdated: new Date().toISOString().split('T')[0]
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