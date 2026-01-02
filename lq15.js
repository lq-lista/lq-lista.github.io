document.addEventListener('DOMContentLoaded', () => {
    const data = [
        {
            name: "Apple x Coconut (Darkline)",
            image: "images/lq1_15ml.jpg",
            available: true
        },
        {
            name: "Green Tea (Darkline)",
            image: "images/lq2_15ml.jpg",
            available: true
        }
    ];

    const carousel = document.querySelector('.lq15-carousel');
    const dotsContainer = document.querySelector('.lq15-dots');
    const leftBtn = document.querySelector('.lq15-left-btn');
    const rightBtn = document.querySelector('.lq15-right-btn');

    if (!carousel || !dotsContainer || !leftBtn || !rightBtn) return;

    const baseFallback = "https://raw.githubusercontent.com/lq-lista/lq-lista.github.io/main/images/placeholder.jpg";

    // znajdz indeks smaku w AppData po nazwie (musi byc dopisany w data.js)
    const getFlavorIndex = (flavorName) => {
        const flavors = window.AppData?.flavors || [];
        return flavors.findIndex(f => f === flavorName);
    };

    const ensure15mlOption = () => {
        const sizeSelect = document.getElementById('size-select');
        if (!sizeSelect) return;

        const exists = [...sizeSelect.options].some(o => o.value === '15ml');
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = '15ml';
            opt.textContent = '15ml';
            sizeSelect.appendChild(opt);
        }
    };

    const startOrder = (flavorIndex) => {
        const startBtn = document.getElementById('start-order');
        if (!startBtn) return;

        startBtn.click();

        setTimeout(() => {
            const flavorSelect = document.getElementById('flavor-select');
            const sizeSelect = document.getElementById('size-select');
            const strengthSelect = document.getElementById('strength-select');

            if (!flavorSelect || !sizeSelect || !strengthSelect) return;

            ensure15mlOption();

            flavorSelect.value = String(flavorIndex);
            flavorSelect.dispatchEvent(new Event('change'));

            sizeSelect.value = '15ml';
            sizeSelect.dispatchEvent(new Event('change'));

            strengthSelect.value = '24';
            strengthSelect.dispatchEvent(new Event('change'));

            // Auto-dodanie do koszyka (Twoje A + B)
            setTimeout(() => {
                document.getElementById('add-to-order')?.click();
            }, 150);

        }, 300);
    };

    // render
    data.forEach((item, index) => {
        const flavorIndex = getFlavorIndex(item.name);

        const el = document.createElement('div');
        el.className = 'lq15-item';
        el.innerHTML = `
            <img class="lq15-image" src="${item.image}" alt="${item.name}" onerror="this.src='${baseFallback}'">
            <div class="lq15-name">${item.name}</div>
            <div class="lq15-actions">
                <span class="lq15-status ${item.available ? 'available' : 'unavailable'}">
                    ${item.available ? 'Dostepny' : 'Brak'}
                </span>
                <button class="lq15-order-btn" ${item.available ? '' : 'disabled'}>
                    Zamow teraz
                </button>
            </div>
        `;

        const btn = el.querySelector('.lq15-order-btn');
        btn?.addEventListener('click', (e) => {
            e.stopPropagation();

            if (flavorIndex === -1) {
                alert("Nie znalazlem tego smaku w AppData.flavors (sprawdz data.js).");
                return;
            }

            startOrder(flavorIndex);
        });

        carousel.appendChild(el);

        const dot = document.createElement('div');
        dot.className = 'lq15-dot';
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
        });
        dotsContainer.appendChild(dot);
    });

    // karuzela (prosta)
    let currentIndex = 0;

    const getItemWidth = () => {
        const first = carousel.querySelector('.lq15-item');
        return first ? first.offsetWidth : 250;
    };

    function updateCarousel() {
        const itemWidth = getItemWidth();
        carousel.scrollTo({
            left: currentIndex * (itemWidth + 20),
            behavior: 'smooth'
        });

        const dots = dotsContainer.querySelectorAll('.lq15-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }

    leftBtn.addEventListener('click', () => {
        currentIndex = Math.max(0, currentIndex - 1);
        updateCarousel();
    });

    rightBtn.addEventListener('click', () => {
        const itemsCount = carousel.querySelectorAll('.lq15-item').length;
        currentIndex = Math.min(itemsCount - 1, currentIndex + 1);
        updateCarousel();
    });

    updateCarousel();
});
