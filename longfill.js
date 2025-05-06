document.addEventListener('DOMContentLoaded', function() {
    const longfillData = [
        // Format: [numer, nazwa, nazwa pliku zdjęcia, opis]
        [23, "Gruszka, Jabłko ice (Izi Pizi)", "longfill-23.jpg", "Orzeźwiające połączenie dojrzałej gruszki z chłodzącym jabłkiem. Idealne na letnie dni."],
        [24, "Mango, Papaya (Izi Pizi)", "longfill-24.jpg", "Egzotyczna mieszanka słodkiego mango i tropikalnej papai. Smak wakacji w każdym zaciągnięciu."],
        [25, "Połączenie owoców leśnych i przyjemnego chłodzenia (chilled face)", "longfill-25.jpg", "Kompozycja soczystych jagód, malin i jeżyn z orzeźwiającym chłodzeniem."],
        [26, "Mint Watermelon (chilled face)", "longfill-26.jpg", "Słodki arbuz spotyka się z orzeźwiającą miętą. Doskonałe połączenie na upalne dni."],
        [27, "Połączenie soczystych owoców leśnych z przyjemnym chłodzeniem (chilled face)", "longfill-27.jpg", "Bogactwo leśnych owoców z nutą chłodzącej świeżości."],
        [28, "Truskawka, Mięta (Wanna be Cool)", "longfill-28.jpg", "Klasyczna truskawka w duecie z orzeźwiającą miętą. Proste, ale genialne połączenie."],
        [29, "Kaktus (Wanna be Cool)", "longfill-29.jpg", "Tajemniczy smak kaktusa z lekką słodyczą. Dla tych, którzy lubią eksperymentować."],
        [30, "Kwaśne Jabłko (Klarro Smooth Funk)", "longfill-30.jpg", "Wyrazisty smak kwaśnego jabłka, które pobudzi Twoje kubki smakowe."],
        [31, "Soczysta brzoskwinia (Klarro Smooth Funk)", "longfill-31.jpg", "Słodka i soczysta brzoskwinia, jak prosto z sadu."],
        [32, "Mrożone winogrona (Klarro Smooth Funk)", "longfill-32.jpg", "Chłodzące winogrona, które przyniosą ulgę w upalne dni."],
        [33, "Kiwi Guawa Marakuja (Klarro Smooth Funk)", "longfill-33.jpg", "Egzotyczna mieszanka kiwi, guawy i marakui. Prawdziwa podróż smakowa."],
        [34, "Tiger blood, ice (Aroma King)", "longfill-34.jpg", "Mocna mieszanka tropikalnych owoców z nutą chłodzenia. Dla odważnych smakoszy."],
        [35, "Peach ice (Aroma King)", "longfill-35.jpg", "Słodka brzoskwinia z orzeźwiającym lodem. Klasyk w nowej odsłonie."],
        [36, "Wave (Summer time)", "longfill-36.jpg", "Letnia mieszanka owoców cytrusowych. Jak morska bryza dla Twoich zmysłów."],
        [37, "Jam (Winter time)", "longfill-37.jpg", "Ciepłe nuty dżemowych owoców. Idealne na chłodniejsze wieczory."],
        [38, "Dzika pomarańcza (Dillon's)", "longfill-38.jpg", "Intensywny smak dzikiej pomarańczy z lekką goryczką."],
        [39, "Citrus punch (Summer time)", "longfill-39.jpg", "Mocny cios cytrusowych smaków. Pobudzi każde zmysły."],
        [40, "Dragon Berry (Geometric Fruits)", "longfill-40.jpg", "Tajemnicza mieszanka jagód i egzotycznych owoców. Smak jak z bajki."],
        [41, "Raspberry Slushie (Geometric Fruits)", "longfill-41.jpg", "Orzeźwiająca malinowa chmurka. Lekkość i słodycz w każdym zaciągnięciu."]
    ];

    // Tworzenie lightboxa
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <div class="lightbox-content">
            <div class="lightbox-image-container">
                <img class="lightbox-image" src="" alt="">
            </div>
            <div class="lightbox-details">
                <h3 class="lightbox-title"></h3>
                <p class="lightbox-description"></p>
                <button class="lightbox-order-btn">Zamów teraz</button>
            </div>
        </div>
    `;
    document.body.appendChild(lightbox);

    const carousel = document.querySelector('.longfill-carousel');
    const dotsContainer = document.querySelector('.carousel-dots');
    const leftBtn = document.querySelector('.left-btn');
    const rightBtn = document.querySelector('.right-btn');
    const baseImageUrl = 'https://raw.githubusercontent.com/lq-lista/lq-lista.github.io/main/images/';

    // Generowanie karuzeli
    longfillData.forEach(([number, name, image, description], index) => {
        const item = document.createElement('div');
        item.className = 'longfill-item';
        item.innerHTML = `
            <img src="${baseImageUrl}${image}" alt="${name}" class="longfill-image" onerror="this.src='${baseImageUrl}placeholder.jpg'">
            <div class="longfill-name">${number}. ${name.split('(')[0].trim()}</div>
        `;
        
        item.addEventListener('click', () => {
            openLightbox(number, name, `${baseImageUrl}${image}`, description);
        });
        
        carousel.appendChild(item);
        
        // Punkty nawigacyjne
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.index = index;
        dot.addEventListener('click', () => scrollToItem(index));
        dotsContainer.appendChild(dot);
    });

    // Funkcja otwierająca lightbox
    function openLightbox(number, name, imageUrl, description) {
        const lightboxTitle = document.querySelector('.lightbox-title');
        const lightboxImage = document.querySelector('.lightbox-image');
        const lightboxDescription = document.querySelector('.lightbox-description');
        const lightboxOrderBtn = document.querySelector('.lightbox-order-btn');
        
        lightboxTitle.textContent = `${number}. ${name}`;
        lightboxImage.src = imageUrl;
        lightboxImage.alt = name;
        lightboxImage.classList.remove('zoomed');
        lightboxDescription.textContent = description;
        
        lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Obsługa przycisku zamówienia
        lightboxOrderBtn.onclick = function() {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
            document.getElementById('start-order').click();
            setTimeout(() => {
                document.getElementById('flavor-select').value = number - 1;
                document.getElementById('flavor-select').dispatchEvent(new Event('change'));
            }, 300);
        };
    }

    // Obsługa zamykania lightboxa
    document.querySelector('.lightbox-close').addEventListener('click', function() {
        document.querySelector('.lightbox').style.display = 'none';
        document.body.style.overflow = '';
    });

    // Obsługa powiększania zdjęcia
    document.querySelector('.lightbox-image').addEventListener('click', function() {
        this.classList.toggle('zoomed');
    });

    // Zamykanie lightboxa po kliknięciu na tło
    lightbox.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // Reszta istniejącego kodu karuzeli
    let currentIndex = 0;
    const items = document.querySelectorAll('.longfill-item');
    const dots = document.querySelectorAll('.dot');
    const itemWidth = items[0]?.offsetWidth || 250;

    function updateCarousel() {
        carousel.scrollTo({
            left: currentIndex * (itemWidth + 20),
            behavior: 'smooth'
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    leftBtn.addEventListener('click', () => {
        currentIndex = Math.max(0, currentIndex - 1);
        updateCarousel();
    });

    rightBtn.addEventListener('click', () => {
        currentIndex = Math.min(items.length - 1, currentIndex + 1);
        updateCarousel();
    });

    function scrollToItem(index) {
        currentIndex = index;
        updateCarousel();
    }

    // Inicjalizacja
    if (dots.length > 0) {
        dots[0].classList.add('active');
    }
});