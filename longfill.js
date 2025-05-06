document.addEventListener('DOMContentLoaded', function() {
    const longfillData = [
        // Format: [numer, nazwa, nazwa pliku zdjęcia]
        [23, "Gruszka, Jabłko ice (Izi Pizi)", "longfill-23.jpg"],
        [24, "Mango, Papaya (Izi Pizi)", "longfill-24.jpg"],
        [25, "Połączenie owoców leśnych i przyjemnego chłodzenia (chilled face)", "longfill-25.jpg"],
        [26, "Mint Watermelon (chilled face)", "longfill-26.jpg"],
        [27, "Połączenie soczystych owoców leśnych z przyjemnym chłodzeniem (chilled face)", "longfill-27.jpg"],
        [28, "Truskawka, Mięta (Wanna be Cool)", "longfill-28.jpg"],
        [29, "Kaktus (Wanna be Cool)", "longfill-29.jpg"],
        [30, "Kwaśne Jabłko (Klarro Smooth Funk)", "longfill-30.jpg"],
        [31, "Soczysta brzoskwinia (Klarro Smooth Funk)", "longfill-31.jpg"],
        [32, "Mrożone winogrona (Klarro Smooth Funk)", "longfill-32.jpg"],
        [33, "Kiwi Guawa Marakuja (Klarro Smooth Funk)", "longfill-33.jpg"],
        [34, "Tiger blood, ice (Aroma King)", "longfill-34.jpg"],
        [35, "Peach ice (Aroma King)", "longfill-35.jpg"],
        [36, "Wave (Summer time)", "longfill-36.jpg"],
        [37, "Jam (Winter time)", "longfill-37.jpg"],
        [38, "Dzika pomarańcza (Dillon's)", "longfill-38.jpg"],
        [39, "Citrus punch (Summer time)", "longfill-39.jpg"],
        [40, "Dragon Berry (Geometric Fruits)", "longfill-40.jpg"],
        [41, "Raspberry Slushie (Geometric Fruits)", "longfill-41.jpg"]
    ];

    const carousel = document.querySelector('.longfill-carousel');
    const dotsContainer = document.querySelector('.carousel-dots');
    const leftBtn = document.querySelector('.left-btn');
    const rightBtn = document.querySelector('.right-btn');
    // Zaktualizuj poniższy URL według swojego repozytorium GitHub
    const baseImageUrl = 'https://raw.githubusercontent.com/lq-lista/lq-lista.github.io/main/images/';


    // Generowanie karuzeli
    longfillData.forEach(([number, name, image], index) => {
        const item = document.createElement('div');
        item.className = 'longfill-item';
        item.innerHTML = `
            <img src="${baseImageUrl}${image}" alt="${name}" class="longfill-image" onerror="this.src='${baseImageUrl}placeholder.jpg'">
            <div class="longfill-name">${number}. ${name.split('(')[0].trim()}</div>
        `;
        
        item.addEventListener('click', () => {
            document.getElementById('start-order').click();
            setTimeout(() => {
                document.getElementById('flavor-select').value = number - 1;
                document.getElementById('flavor-select').dispatchEvent(new Event('change'));
            }, 300);
        });
        
        carousel.appendChild(item);
        
        // Punkty nawigacyjne
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.index = index;
        dot.addEventListener('click', () => scrollToItem(index));
        dotsContainer.appendChild(dot);
    });

    // Nawigacja
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

    // Autoscroll i obsługa touch
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener('mouseleave', () => {
        isDown = false;
    });

    carousel.addEventListener('mouseup', () => {
        isDown = false;
        currentIndex = Math.round(carousel.scrollLeft / (itemWidth + 20));
        updateCarousel();
    });

    carousel.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
    });

    // Inicjalizacja
    if (dots.length > 0) {
        dots[0].classList.add('active');
    }
});