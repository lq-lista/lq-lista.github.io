/**
 * Pełna baza smaków liquidów z kategoriami i cennikiem
 * @version 2.0.1
 * @type {Object}
 */
const AppData = (() => {
    // Główna lista smaków
    const flavors = [
        // IZI PIZI
        "mango papaya (IZI PIZI)",
        "energy drink kiwi (IZI PIZI)",
        
        // WANNA BE COOL
        "cactus (WANNA BE COOL)",
        "strawberry cream (WANNA BE COOL)",
        
        // FUNK CLARO
        "kiwi guawa marakuja (FUNK CLARO)",
        "kwaśne jabłko (FUNK CLARO)",
        "mrożone winogrono (FUNK CLARO)",
        "chilled face (FUNK CLARO)",
        "blue slushie (FUNK CLARO)",
        "berry (FUNK CLARO)",
        "mint watermelon (FUNK CLARO)",
        
        // AROMA KING
        "blue razz cherry (AROMA KING)",
        "geometric (AROMA KING)",
        "dragon berry (AROMA KING)",
        "blueberry slushie (AROMA KING)",
        
        // DILNO'S
        "wild orange (DILNO'S)",
        "summer time (DILNO'S)",
        "citrus punch (DILNO'S)",
        
        // PANDA
        "gruszka (PANDA)"
    ];

    // Kategorie smaków
    const flavorCategories = {
        // Producenci
        "izi": [0, 1],
        "wanna": [2, 3],
        "funk": [4, 5, 6, 7, 8, 9, 10],
        "aroma": [11, 12, 13, 14],
        "dilno": [15, 16, 17],
        "panda": [18],
        
        // Profile smakowe
        "owocowe": [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        "miętowe": [10],
        "słodkie": [0, 3, 4, 7, 8, 9, 11, 13, 14, 18],
        "cytrusowe": [1, 5, 16, 17],
        "energy": [1],
        "chłodzone": [6, 7, 8, 9, 10, 14]
    };

    // Cennik
    const pricingData = {
        headers: ["Pojemność", "24mg", "18mg", "12mg", "6/3/0mg"],
        rows: [
            ["60ml", 70, 68, 67, 66],
            ["30ml", 40, 38, 37, 36],
            ["10ml", 16, 15, 14, 13]
        ],
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
        version: '2.0.1',
        lastUpdated: new Date().toISOString().split('T')[0]
    };
})();

// Eksport dla Node.js (jeśli potrzebny)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppData;
}

window.AppData = AppData;
