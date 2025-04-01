document.addEventListener('DOMContentLoaded', function() {
    // Renderowanie listy smaków
    const flavorsList = document.getElementById('flavors-list');
    flavors.forEach(flavor => {
        const li = document.createElement('li');
        li.textContent = flavor;
        flavorsList.appendChild(li);
    });

    // Renderowanie tabeli cen
    const pricingTable = document.getElementById('pricing-table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    pricingData.headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    pricingTable.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    pricingData.rows.forEach(rowData => {
        const row = document.createElement('tr');
        rowData.forEach(cellData => {
            const cell = document.createElement('td');
            cell.textContent = cellData;
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });
    pricingTable.appendChild(tbody);
});
