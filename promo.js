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

}));
