/**
 * Pełna baza smaków liquidów z kategoriami i cennikiem
 * @version 2.0.0
 * @type {Object}
 */
const AppData = (() => {
    // Główna lista smaków
    const flavors = [
        // IZI PIZI
        "mango papya (IZI PIZI)",
        "energy dring kiwi (IZI PIZI)",
        
        // WANNA BE COOL
        "cactus (WANNA BE COOL)",
        "straberry cram (WANNA BE COOL)",
        
        // FUNK CLARO
        "kiwi guawa marakuja (FUNK CLARO)",
        "kwaśne jabko (FUNK CLARO)",
        "mrożone winogrono (FUNK CLARO)",
        "chilled face (FUNK CLARO)",
        "bllue slushue (FUNK CLARO)",
        "berry (FUNK CLARO)",
        "Mint watermelon (FUNK CLARO)",
        
        // AROMA KING
        "blue razz cherry (AROMA KING)",
        "gometrik (AROMA KING)",
        "dragon beery (AROMA KING)",
        "blubery slushe (AROMA KING)",
        
        // DILNO'S
        "wild orange (DILNO'S)",
        "sumerr time (DILNO'S)",
        "citrus punche (DILNO'S)",
        
        // PANDA
        "gruszka (PANDA)",
        
        // Zachowaj istniejące smaki bez firm
        "Cukierek jabłkowy, chłodzik",
        "Czarna porzeczka, jeżyna, truskawka, malina, jagoda, czerwona porzeczka, ananas, chłodzik, słodzik",
        "Truskawka, słodzik, chłodzik",
        "Cola z chłodzikiem",
        "Czerwone owoce, cytrusy, chłodzik",
        "Niebieska malina, chłodzik",
        "Brzoskwinia, kiwi, słodka malina",
        "Kwaśna cytryna, limonka, chłodzik, słodzik",
        "Mieszanka świeżej mięty, miętowe cukierki",
        "Arbuz, sok cytrynowy, chłodzik, słodzik",
        "Granat, kiwi, poziomka, ice",
        "Wiśnia, smoczy owoc, ice",
        "Owoce leśne, ice",
        "Gruszka, melon, granat, ice",
        "Ananas, grejpfrut"
    ];

    // Kategorie smaków (zaktualizowane)
    const flavorCategories = {
        // Główne profile smakowe
        "owocowe": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34],
        "miętowe": [8,24],
        "słodkie": [0,1,2,6,9,15,17,22,23,25,26,27,28,29,30,31,33,34],
        "cytrusowe": [4,7,14,19,30,32],
        "energy": [1],
        
        // Producenci
        "izi": [0,1],
        "wanna": [2,3],
        "funk": [4,5,6,7,8,9,10],
        "aroma": [11,12,13,14],
        "dilno": [15,16,17],
        "panda": [18],
        
        // Specjalne
        "chłodzone": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,20,21,22,23,24,25,28],
        "bez_słodzika": [2,3,5,6,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34]
    };

    // Cennik (pozostaje bez zmian)
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

    // Walidacja danych (pozostaje bez zmian)
    const validateData = () => {
        const errors = [];
        
        Object.entries(flavorCategories).forEach(([category, indexes]) => {
            indexes.forEach(index => {
                if (!flavors[index]) {
                    errors.push(`BŁĄD: Kategoria \"${category}\" wskazuje na nieistniejący smak (indeks ${index})`);
                }
            });
        });
        
        flavors.forEach((_, index) => {
            let hasCategory = false;
            for (const category in flavorCategories) {
                if (flavorCategories[category].includes(index)) {
                    hasCategory = true;
                    break;
                }
            }
            if (!hasCategory) {
                console.warn(`UWAGA: Smak nr ${index + 1} (\"${flavors[index]}\") nie ma przypisanej kategorii`);
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

// Eksport dla Node.js (jeśli potrzebny)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppData;
}

window.AppData = AppData;
