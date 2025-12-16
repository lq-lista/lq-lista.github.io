// Prosta obsługa karuzeli Dark Line Double
(document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('double-carousel');
  if (track) {
    const prev = document.querySelector('.promo-prev');
    const next = document.querySelector('.promo-next');

    const stepSize = () => {
      const card = track.querySelector('.promo-card');
      if (!card) return 260;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 16);
      return card.getBoundingClientRect().width + gap;
    };

    const updateArrows = () => {
      const atStart = track.scrollLeft <= 5;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
    };

    const scrollByStep = (dir) => {
      track.scrollBy({ left: dir * stepSize(), behavior: 'smooth' });
    };

    prev?.addEventListener('click', () => scrollByStep(-1));
    next?.addEventListener('click', () => scrollByStep(1));
    track.addEventListener('scroll', updateArrows);

    // obsługa kółka myszy
    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY;
        updateArrows();
      }
    }, { passive: false });

    updateArrows();
  }

  // ==== Karuzela Dark Line 15ml ====
  const featuredCarousel = document.getElementById('featured-darkline-carousel');
  if (featuredCarousel) {
    const featuredMap = {
      'green-tea': { index: 44, title: 'LQ Darkline Green Tea' },
      'apple-x-coconut': { index: 45, title: 'LQ Darkline Apple x Coconut' }
    };

    const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
         <rect width="100%" height="100%" fill="#f3f3f3"/>
         <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
               fill="#999" font-family="Arial" font-size="20">Brak zdjęcia</text>
       </svg>`
    );

    const prev = document.querySelector('.featured-prev');
    const next = document.querySelector('.featured-next');

    const stepSizeFeatured = () => {
      const card = featuredCarousel.querySelector('.longfill-item');
      if (!card) return 260;
      const gap = parseFloat(getComputedStyle(featuredCarousel).columnGap || getComputedStyle(featuredCarousel).gap || 16);
      return card.getBoundingClientRect().width + gap;
    };

    const updateFeaturedArrows = () => {
      const atStart = featuredCarousel.scrollLeft <= 5;
      const atEnd = featuredCarousel.scrollLeft + featuredCarousel.clientWidth >= featuredCarousel.scrollWidth - 5;
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
    };

    const openOrder = (meta) => {
      if (!meta) return;
      document.getElementById('start-order')?.click();
      const select = document.getElementById('flavor-select');
      if (select) {
        select.value = String(meta.index);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      document.getElementById('order-modal')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    featuredCarousel.querySelectorAll('.longfill-item').forEach((card) => {
      const slug = card.dataset.slug;
      const meta = featuredMap[slug];
      const btn = card.querySelector('.order-btn');
      const img = card.querySelector('img');
      btn?.addEventListener('click', () => openOrder(meta));
      if (img) {
        img.addEventListener('error', () => { img.src = placeholder; });
        img.addEventListener('click', () => openOrder(meta));
      }
    });

    const scrollFeatured = (dir) => {
      featuredCarousel.scrollBy({ left: dir * stepSizeFeatured(), behavior: 'smooth' });
    };

    prev?.addEventListener('click', () => scrollFeatured(-1));
    next?.addEventListener('click', () => scrollFeatured(1));
    featuredCarousel.addEventListener('scroll', updateFeaturedArrows);
    featuredCarousel.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        featuredCarousel.scrollLeft += e.deltaY;
        updateFeaturedArrows();
      }
    }, { passive: false });

    updateFeaturedArrows();
  }
}));
