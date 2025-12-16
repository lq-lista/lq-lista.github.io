/**
 * Pełna baza smaków liquidów z kategoriami i cennikiem
 * @version 3.1.0
 * @type {Object}
 */
const AppData = (() => {
    // Główna lista smaków (indeksy 0-40)
    const flavors = [
        "Mieszanka soczystych truskawek, czerwonych porzeczek, malin i jeżyn, uzupełniona o słodzik (A&L)",
        "Mieszanka kwaśnych cytryn i limonek z nutą chłodzenia i słodzika (A&L)",
        "Mieszanka soczystych truskawek z delikatnym chłodzeniem i słodzikiem (A&L)",
        "Mieszanka czarnej porzeczki, jeżyn, truskawek, malin, jagód, czerwonych porzeczek i ananasa, wzbogacona o chłodzik i słodzik (A&L)",
        "Mieszanka soczystych truskawek, czerwonych porzeczek, malin i jeżyn, uzupełniona o chłodzik i słodzik (A&L)",
        "Połączenie soczystej brzoskwini, owocowej kiwi i słodkiej maliny (A&L)",
        "Niebieskie maliny (A&L)",
        "Połączenie czerwonych owoców i cytrusów z odrobiną chłodzącej świeżości (A&L)",
        "Mieszanka świeżej mięty, syropu miętowego i miętowych cukierków z dodatkiem chłodzika (A&L)",
        "Cukierki z zielonego jabłka z efektem chłodzenia (A&L)",
        "Mieszanka arbuzów i cytryny (A&L)",
        "Klasyczna cola z dodatkiem chłodzika (A&L)",
        "Mieszanka czerwonych porzeczek, jeżyn, jagód i malin, które zostały wzbogacone o słodzik, bez dodatku barwników i chłodzenia (A&L)",
        "Mieszanka dojrzałych wiśni, egzotyczną nutę smoczego owocu i chłodzące orzeźwienie (Vampir Vape)",
        "Mieszanka ananasa z grejpfrutem (Vampir Vape)",
        "Mieszanka owoców tropikalnych (Vampir Vape)",
        "Mieszanka owoców leśnych z lodem (Vampir Vape)",
        "Mieszanka owocowa z nutą chłodu i winogron (Vampir Vape)",
        "Mieszanka smaków gruszki, melona i granatu, wzbogacona chłodzikiem (Fighter Fuel)",
        "Mieszanka smaków granatu, kiwi i poziomek, wzbogacona orzeźwiającym chłodzikiem (Fighter Fuel)",
        "Mango, Ananas, Mięta, Efekt chłodzenia (Premium Fcukin Flava)",
        "Kaktus, limonka (Tribal Force)",
        "Gruszka, Jabłko ice (Izi Pizi)",
        "Mango, Papaya (Izi Pizi)",
        "Połączenie soczystych owoców leśnych z przyjemnym chłodzeniem (chilled face)",
        "Peach ice (Aroma King)",
        "Wave (Summer time)",
        "Jam (Winter time)",
        "Dragon Berry (Geometric Fruits)",
        "Kabura (Fighter Fuel)",
        "Freed (Fighter Fuel)",
        "Seiryuto (Fighter Fuel)",
        "Kansetsu (Fighter Fuel)",
        "Kwaśne jabłko (Klarro Smooth Funk)",
        "Soczysta brzoskwinia (Klarro Smooth Funk)",
        "Żelki owocowe (Klarro Smooth Funk)",
        "Wata cukrowa (Klarro Smooth Funk)",
        "Pitaja gruszka (Duo)",
        "Jabłko mięta (Duo)",
        "Grape (Dark Line)",
        "Skittles (Dark Line)",
        "Black tea (Dark Line)",
        "Kiwi (Dark Line)",
        "Forest fruits (Dark Line)",
        "Green tea (Dark Line)",
        "Apple x Coconut (Dark Line)",
    ];

    // Kategorie smaków
    const flavorCategories = {
        // ... w flavorCategories:
"a&l":    [0,1,2,3,4,5,6,7,8,9,10,11,12],
"vampir": [13,14,15,16,17],
"fighter":[18,19,29,30,31,32],     // ← 6 pozycji Fighter Fuel
"premium":[20],
"tribal": [21],
"izi":    [22,23],
"chilled":[24],
"aroma":  [25],
"summer": [26],
"winter": [27],
"geometric":[28],
"klarro": [33,34,35,36],
"duo":    [37,38],
"dark":   [39,40,41,42,43,44,45]

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
        version: '3.0.1',
        lastUpdated: new Date().toISOString().split('T')[0]
    };
})();

// Eksport dla Node.js (jeśli potrzebny)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppData;
}

// Udostępnij globalnie w przeglądarce
window.AppData = AppData;