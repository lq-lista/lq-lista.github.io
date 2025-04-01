const flavors = [
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
    "Ananas, grejpfrut",
    // Nowe smaki
    "Kiwi (Energy Drink)",
    "Cactus (Wanna Be Cool)",
    "Strawberry Cream (Funk Claro)",
    "Kiwi Guava Marakuja (Funk Claro)",
    "Kwaśne Jabłko (Funk Claro)",
    "Mrożone Winogrono (Funk Claro)",
    "Chilled Face (Funk Claro)",
    "Blue Slushie (Funk Claro)",
    "Berry (Funk Claro)",
    "Mint Watermelon (Funk Claro)",
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

const flavorCategories = {
    // Kategorie smaków
    "owocowe": [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
    "miętowe": [8, 24], // Mint Watermelon
    "słodkie": [0, 1, 2, 6, 9, 15, 17, 22, 23, 25, 26, 27, 28, 29, 30, 31, 33, 34],
    "cytrusowe": [4, 7, 14, 19, 30, 32],
    "energy": [15],
    
    // Kategorie producentów (zgodne z nowym filtrem)
    "funk": [17, 18, 19, 20, 21, 22, 23, 24], // Funk Claro
    "aroma": [25, 26, 27, 28, 29, 30, 31, 32, 33, 34], // Aroma King
    "wanna": [16], // Wanna Be Cool (tylko Cactus)
    
    // Inne kategorie
    "chłodzone": [0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 20, 21, 22, 23, 24, 25, 28]
};

const pricingData = {
    headers: ["Pojemność", "24mg", "18mg", "12mg", "9,6,3,0mg"],
    rows: [
        ["60ml", 70, 68, 67, 66],
        ["30ml", 40, 38, 37, 36],
        ["10ml", 16, 15, 14, 13]
    ]
};
