// pricing.js – cennik wg firmy + accordion + eksport do window.BrandPricing
(function () {
  // Tabela cen (6/3/0 mają tę samą cenę => trzymamy pod kluczem '6')
  window.BrandPricing = {
    'A&L': {
      '60ml': { '24': 70, '18': 68, '12': 67, '6': 65, '3': 65, '0': 65 },
      '30ml': { '24': 40, '18': 38, '12': 37, '6': 35, '3': 35, '0': 35 },
      '10ml': { '24': 16, '18': 16, '12': 15, '6': 14, '3': 14, '0': 14 }
    },
    'Vampir Vape': {
      '60ml': { '24': 70, '18': 68, '12': 67, '6': 65, '3': 65, '0': 65 },
      '30ml': { '24': 40, '18': 38, '12': 37, '6': 35, '3': 35, '0': 35 },
      '10ml': { '24': 16, '18': 16, '12': 15, '6': 14, '3': 14, '0': 14 }
    },
    'Fighter Fuel': {
      '60ml': { '24': 70, '18': 68, '12': 67, '6': 65, '3': 65, '0': 65 },
      '30ml': { '24': 40, '18': 38, '12': 37, '6': 35, '3': 35, '0': 35 },
      '10ml': { '24': 16, '18': 16, '12': 15, '6': 14, '3': 14, '0': 14 }
    },
    'Premium Fcukin Flava': {
      '60ml': { '24': 70, '18': 68, '12': 67, '6': 65, '3': 65, '0': 65 },
      '30ml': { '24': 40, '18': 38, '12': 37, '6': 35, '3': 35, '0': 35 },
      '10ml': { '24': 16, '18': 16, '12': 15, '6': 14, '3': 14, '0': 14 }
    },
    'Tribal Force': {
      '60ml': { '24': 70, '18': 68, '12': 67, '6': 65, '3': 65, '0': 65 },
      '30ml': { '24': 40, '18': 38, '12': 37, '6': 35, '3': 35, '0': 35 },
      '10ml': { '24': 16, '18': 16, '12': 15, '6': 14, '3': 14, '0': 14 }
    },
    'Izi Pizi': {
      '60ml': { '24': 64, '18': 62, '12': 61, '6': 60, '3': 60, '0': 60 },
      '30ml': { '24': 36, '18': 35, '12': 34, '6': 33, '3': 33, '0': 33 }
      // brak 10ml
    },
    'Klarro Smooth Funk': {
      '60ml': { '24': 75, '18': 73, '12': 72, '6': 71, '3': 71, '0': 71 },
      '30ml': { '24': 40, '18': 38, '12': 37, '6': 35, '3': 35, '0': 35 }
      // brak 10ml
    },
    'Aroma King': {
      '60ml': { '24': 75, '18': 73, '12': 72, '6': 71, '3': 71, '0': 71 },
      '30ml': { '24': 40, '18': 38, '12': 37, '6': 35, '3': 35, '0': 35 }
      // brak 10ml
    },
    'Duo': {
      '60ml': { '24': 75, '18': 73, '12': 72, '6': 71, '3': 71, '0': 71 },
      '30ml': { '24': 40, '18': 38, '12': 37, '6': 35, '3': 35, '0': 35 }
      // brak 10ml
    },
    'Dark Line': {
      '60ml': { '24': 64, '18': 62, '12': 61, '6': 60, '3': 60, '0': 60 },
      '30ml': { '24': 36, '18': 35, '12': 34, '6': 32, '3': 32, '0': 32 }
      // brak 10ml
    },
    'Geometric Fruits': {
      '60ml': { '24': 65, '18': 63, '12': 62, '6': 61, '3': 61, '0': 61 },
      '30ml': { '24': 37, '18': 36, '12': 35, '6': 34, '3': 34, '0': 34 }
      // brak 10ml
    },
    'chilled face': {
      '60ml': { '24': 62, '18': 60, '12': 59, '6': 58, '3': 58, '0': 58 },
      '30ml': { '24': 35, '18': 34, '12': 33, '6': 30, '3': 30, '0': 30 }
      // brak 10ml
    },
    // >>> DODANE DWIE MARKI <<<
    'Summer time': {
      '60ml': { '24': 65, '18': 63, '12': 62, '6': 61, '3': 61, '0': 61 },
      '30ml': { '24': 37, '18': 36, '12': 35, '6': 34, '3': 34, '0': 34 }
      // brak 10ml
    },
    'Winter time': {
      '60ml': { '24': 65, '18': 63, '12': 62, '6': 61, '3': 61, '0': 61 },
      '30ml': { '24': 37, '18': 36, '12': 35, '6': 34, '3': 34, '0': 34 }
      // brak 10ml
    }
  };

  // === Render accordionu ===
  const host = document.getElementById('brand-pricing');
  if (!host) return;

  const sizesOrder = ['60ml', '30ml', '10ml'];
  const brands = Object.keys(window.BrandPricing);

  // mini-nawigacja po firmach
  const chips = `
    <div class="price-chips">
      ${brands.map(b => `<a href="#price-${b.replace(/\s+/g,'-')}" class="price-chip">${b}</a>`).join('')}
    </div>
  `;

  const content = brands.map(brand => {
    const data = window.BrandPricing[brand];
    const rows = sizesOrder.map(size => {
      const p = data[size] || null;
      const p24 = p ? (p['24'] ?? '—') : '—';
      const p18 = p ? (p['18'] ?? '—') : '—';
      const p12 = p ? (p['12'] ?? '—') : '—';
      const p63 = p ? (p['6']  ?? '—') : '—'; // grupa 6/3/0
      const disabledClass = p ? '' : 'row-na';
      return `
        <tr class="${disabledClass}">
          <td>${size}</td>
          <td>${p24==='—'?'—':p24+'zł'}</td>
          <td>${p18==='—'?'—':p18+'zł'}</td>
          <td>${p12==='—'?'—':p12+'zł'}</td>
          <td>${p63==='—'?'—':p63+'zł'} <span class="muted">(6/3/0)</span></td>
        </tr>`;
    }).join('');

    return `
      <details class="price-acc" id="price-${brand.replace(/\s+/g,'-')}">
        <summary class="price-acc__summary">${brand}</summary>
        <div class="price-acc__body">
          <table class="price-table" aria-label="Cennik ${brand}">
            <thead>
              <tr>
                <th>Pojemność</th><th>24mg</th><th>18mg</th><th>12mg</th><th>6/3/0mg</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </details>
    `;
  }).join('');

  host.innerHTML = chips + content;
})();
