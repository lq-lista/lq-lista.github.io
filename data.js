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
    "Starberry cream (Panda Classic)",
    "Mrożone winogrono (Funk Claro)",
    "Energy drink kiwi (Izi Pizi)",
    "Mango papaya (Izi Pizi)",
    "Winogronowy energetyk (Funk Claro)",
    "Kiwi guawa marakuja (Funk Claro)"
];

const flavorCategories = {
    "owocowe": [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    "miętowe": [8],
    "słodkie": [0, 1, 2, 6, 9, 15],
    "cytrusowe": [4, 7, 14],
    "energy": [17, 19],
    "panda": [15],
    "funk": [16, 19, 20],
    "izi": [17, 18]
};

const pricingData = {
    headers: ["Pojemność", "24mg", "18mg", "12mg", "9,6,3,0mg"],
    rows: [
        ["60ml", 70, 68, 67, 66],
        ["30ml", 40, 38, 37, 36],
        ["10ml", 16, 15, 14, 13]
    ]
};
