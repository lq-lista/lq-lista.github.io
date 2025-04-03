/* ===== GLOBAL STYLES & ANIMATIONS ===== */
body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    color: #333;
    animation: gradientBackground 10s ease infinite;
    line-height: 1.6;
}

@keyframes gradientBackground {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* ===== HEADER & TYPOGRAPHY ===== */
header {
    padding: 20px 0;
    text-align: center;
}

h1 {
    font-size: 3rem;
    color: #fff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    margin: 20px auto;
    padding: 20px;
    background: linear-gradient(135deg, #ff6f61, #ffcc00);
    border-radius: 10px;
    max-width: 90%;
}

h2 {
    font-size: 2rem;
    color: #555;
    border-bottom: 2px solid #ddd;
    padding-bottom: 10px;
    margin-bottom: 20px;
}

h3 {
    font-size: 1.5rem;
    color: #ff6f61;
    margin-top: 0;
}

/* ===== LAYOUT CONTAINERS ===== */
.container {
    max-width: 800px;
    margin: 20px auto;
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.flavors, .pricing, .why-us {
    margin-bottom: 30px;
}

.footer {
    text-align: center;
    margin-top: 30px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* ===== PRICING TABLE STYLES ===== */
#pricing-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

#pricing-table th, #pricing-table td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #ddd;
}

#pricing-table th {
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    color: #fff;
    font-weight: bold;
}

#pricing-table tr:hover {
    background: #f8f8f8;
}

#pricing-table td {
    color: #555;
}

/* ===== ORDER MODAL STYLES ===== */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.7);
}

.modal-content {
    background-color: #fff;
    margin: 2% auto;
    padding: 25px;
    border-radius: 10px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    position: relative;
    overflow: hidden;
}

.close {
    color: #aaa;
    position: absolute;
    top: 15px;
    right: 20px;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.close:hover {
    color: #333;
}

/* ===== ORDER FORM STYLES ===== */
#order-form {
    overflow-y: auto;
    flex: 1;
    padding-right: 10px;
    margin-bottom: 15px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #555;
}

.form-control {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    transition: border 0.3s;
}

.form-control:focus {
    border-color: #ff6f61;
    outline: none;
}

#order-notes {
    min-height: 80px;
    resize: vertical;
}

/* ===== IMPROVED ORDER SUMMARY WITH SCROLL ===== */
#order-summary {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: 50vh;
    min-height: 150px;
    overflow: hidden;
    border: 1px solid #eee;
    border-radius: 8px;
    background: #f9f9f9;
    position: relative;
}

.order-items-container {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    margin: 0;
    scrollbar-width: thin;
    scrollbar-color: #ff6f61 #f1f1f1;
    max-height: calc(50vh - 120px);
}

#order-items {
    list-style: none;
    padding: 0;
    margin: 0;
}

#order-items:empty::before {
    content: "Twój koszyk jest pusty";
    display: block;
    text-align: center;
    color: #888;
    padding: 20px;
}

.order-item {
    padding: 12px;
    margin-bottom: 8px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: transform 0.2s;
}

.order-item:hover {
    transform: translateY(-2px);
}

.order-item-info {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
}

.order-item-info span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.order-item-price {
    font-weight: bold;
    margin: 0 15px;
    color: #ff6f61;
    min-width: 50px;
    text-align: right;
}

.remove-item {
    background: #ff4f42;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background 0.3s;
}

.remove-item:hover {
    background: #e53935;
}

#order-total {
    font-weight: bold;
    font-size: 1.2rem;
    text-align: right;
    margin: 15px 0;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 4px;
}

/* ===== SUBMIT BUTTON CONTAINER ===== */
#submit-order-container {
    position: sticky;
    bottom: 0;
    background: white;
    padding: 15px 0;
    margin-top: 10px;
    border-top: 1px solid #eee;
    z-index: 10;
}

#submit-order {
    width: 100%;
    padding: 14px;
    font-size: 1.1rem;
    background: #4CAF50;
    transition: all 0.3s;
    font-weight: bold;
}

#submit-order:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* ===== BUTTON STYLES ===== */
.btn {
    display: inline-block;
    background: #ff6f61;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s;
    text-align: center;
}

.btn:hover {
    background: #ff4f42;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.order-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ff6f61;
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 50px;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    z-index: 100;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.order-button:hover {
    background: #ff4f42;
    transform: scale(1.05);
}

/* ===== PRICE PREVIEW ===== */
#price-preview {
    display: block;
    margin: 10px 0;
    padding: 10px;
    background: #f8f8f8;
    border-radius: 4px;
    font-weight: bold;
    color: #ff6f61;
    text-align: center;
}

/* ===== FLAVOR LIST STYLES ===== */
#flavors-list {
    list-style-type: none;
    padding: 0;
}

#flavors-list li {
    padding: 12px;
    margin: 8px 0;
    background: #f8f8f8;
    border-radius: 8px;
    transition: background 0.3s, transform 0.2s;
    cursor: pointer;
}

#flavors-list li:hover {
    background: #ff6f61;
    color: #fff;
    transform: translateX(10px);
}

.flavor-number {
    color: #ff6f61;
    font-weight: bold;
    margin-right: 5px;
}

/* ===== FILTER STYLES ===== */
.flavor-filters {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    padding: 10px;
    background: #f8f8f8;
    border-radius: 8px;
    flex-wrap: wrap;
}

.filter-group {
    flex: 1;
    min-width: 150px;
}

.filter-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

/* ===== ADMIN PANEL STYLES ===== */
.admin-panel {
    background: white;
    padding: 20px;
    margin: 20px auto;
    border-radius: 8px;
    max-width: 800px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

#admin-content {
    margin-top: 20px;
}

#order-details {
    margin-top: 20px;
    padding: 15px;
    background: #f8f8f8;
    border-radius: 8px;
}

.order-items-list {
    padding-left: 20px;
}

.order-items-list li {
    margin-bottom: 5px;
}

#status-select {
    padding: 8px;
    border-radius: 4px;
    margin-right: 10px;
}

/* ===== SCROLL TO TOP BUTTON ===== */
.scroll-top-btn {
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: #ff6f61;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    display: none;
    z-index: 99;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.3s;
}

.scroll-top-btn:hover {
    background: #ff4f42;
}

.scroll-top-btn.show {
    display: block;
}

/* ===== CUSTOM SCROLLBARS ===== */
.order-items-container::-webkit-scrollbar {
    width: 10px;
}

.order-items-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
    margin: 5px 0;
}

.order-items-container::-webkit-scrollbar-thumb {
    background: #ff6f61;
    border-radius: 10px;
    border: 2px solid #f1f1f1;
}

.order-items-container::-webkit-scrollbar-thumb:hover {
    background: #ff4f42;
}

/* ===== IMPROVED ORDER SUMMARY ===== */
.order-items-container {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #eee;
    border-radius: 8px;
    background: #fff;
}

/* Mobile-first styles */
.order-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 10px;
}

.order-item-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.flavor-name {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
    min-width: 0;
}

.flavor-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.order-item-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.9em;
    color: #666;
}

/* Custom scrollbar */
.order-items-container::-webkit-scrollbar {
    width: 8px;
}

.order-items-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.order-items-container::-webkit-scrollbar-thumb {
    background: #ff6f61;
    border-radius: 10px;
}

.order-items-container::-webkit-scrollbar-thumb:hover {
    background: #ff4f42;
}

/* ===== ADMIN STATS STYLES ===== */
.stats-section {
    margin-top: 30px;
    padding: 20px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.1);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.stat-card {
    background: #f8f8f8;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    border-left: 4px solid #ff6f61;
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #ff6f61;
}

.stat-label {
    color: #666;
    font-size: 0.9rem;
}

.charts-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
    margin-top: 30px;
}

/* ===== ADMIN PANEL STYLES ===== */
.admin-panel {
    background: white;
    padding: 20px;
    margin: 20px auto;
    border-radius: 8px;
    max-width: 800px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

#admin-content {
    margin-top: 20px;
}

#order-search {
    padding: 10px;
    width: 200px;
    margin-right: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

#order-details {
    margin-top: 20px;
    padding: 20px;
    background: #f8f8f8;
    border-radius: 8px;
    border-left: 4px solid #ff6f61;
}

.order-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
}

.order-date, .order-status, .order-notes {
    margin: 5px 0;
}

.order-items-section {
    margin: 20px 0;
}

.order-items-list {
    padding-left: 20px;
    list-style-type: none;
}

.order-item-detail {
    padding: 10px;
    margin-bottom: 8px;
    background: white;
    border-radius: 4px;
    border-left: 3px solid #ff6f61;
}

.order-summary-section {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    text-align: right;
}

.order-total {
    font-size: 1.2rem;
    font-weight: bold;
}

.order-actions {
    margin-top: 25px;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: bold;
}

.status-badge.nowe {
    background: #ff6f61;
    color: white;
}

.status-badge.w-realizacji {
    background: #ffcc00;
    color: #333;
}

.status-badge.wysłane {
    background: #4CAF50;
    color: white;
}

.status-badge.zakończone {
    background: #555;
    color: white;
}

.no-order {
    text-align: center;
    padding: 20px;
    color: #888;
    font-style: italic;
}
/* Dodatkowe style dla uwag */
.notes-group {
    margin-top: 15px;
    position: sticky;
    bottom: 0;
    background: white;
    padding-bottom: 10px;
}

#order-notes {
    width: 100%;
    box-sizing: border-box;
    margin-top: 5px;
}

/* Styl dla kontenera z suwakiem */
.order-scroll-container {
    max-height: 65vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #ff6f61 #f1f1f1;
    padding-right: 5px;
}

.order-scroll-container::-webkit-scrollbar {
    width: 8px;
}

.order-scroll-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.order-scroll-container::-webkit-scrollbar-thumb {
    background: #ff6f61;
    border-radius: 10px;
}

.order-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #ff4f42;
}

/* Blokada przewijania tła gdy modal jest otwarty */
body.modal-open {
    overflow: hidden;
}

.tooltip {
    position: relative;
    display: inline-block;
    cursor: help;
    color: #ff6f61;
}

.tooltip:hover::after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    white-space: nowrap;
    z-index: 100;
}

/* Stylizacja sekcji "Dlaczego my" */
.why-us-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.benefit {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    text-align: center;
}

.benefit i {
    font-size: 2.5rem;
    color: #ff6f61;
    margin-bottom: 15px;
}

.benefit h3 {
    color: #ff6f61;
    margin: 10px 0;
}

/* Lepsze stylowanie textarea */
#order-notes {
    min-height: 100px;
    border: 2px solid #ff6f61;
    transition: all 0.3s;
}

#order-notes:focus {
    border-color: #ff4f42;
    box-shadow: 0 0 0 3px rgba(255, 111, 97, 0.2);
}

#submit-order-container {
    transition: opacity 0.3s ease;
}

#submit-order-container.hidden {
    opacity: 0;
    height: 0;
    padding: 0;
    margin: 0;
    overflow: hidden;
}

/* Komunikaty o błędach */
.global-error {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff6f61;
    color: white;
    padding: 15px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.global-error .error-content {
    max-width: 800px;
    margin: 0 auto;
}

.global-error button {
    background: white;
    color: #ff6f61;
    border: none;
    padding: 8px 15px;
    margin-right: 10px;
    border-radius: 4px;
    cursor: pointer;
}

.offline-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff9800;
    color: white;
    text-align: center;
    padding: 10px;
    z-index: 9999;
    animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
}

/* Dodaj to na końcu pliku styles.css */
.copy-order-number {
    display: inline-flex;
    align-items: center;
    background: #f0f0f0;
    border: none;
    border-radius: 4px;
    padding: 2px 8px;
    margin-left: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.copy-order-number:hover {
    background: #e0e0e0;
}

.copy-order-number i {
    margin-right: 5px;
    font-size: 14px;
}

#order-confirmation {
    text-align: center;
    padding: 20px;
}

#order-number {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ff6f61;
    margin: 15px 0;
    display: inline-flex;
    align-items: center;
}

/* Kontener z zamówieniami */
.order-items-scrollable {
    max-height: 50vh;
    overflow-y: auto;
    padding-right: 5px;
    margin-bottom: 15px;
}

/* Stałe podsumowanie */
.order-total-container {
    position: sticky;
    bottom: 0;
    background: #f8f8f8;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 1.1em;
    box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
    z-index: 10;
}

.total-amount {
    color: #ff6f61;
    font-weight: bold;
}

/* Responsywność */
@media (max-height: 700px) {
    .order-items-scrollable {
        max-height: 40vh;
    }
}

@media (max-height: 600px) {
    .order-items-scrollable {
        max-height: 35vh;
    }
}

/* Desktop styles */
@media (min-width: 768px) {
    .order-item {
        flex-direction: row;
        align-items: center;
    }
    
    .order-item-details {
        gap: 15px;
        margin-left: auto;
    }
}

/* Responsywność */
@media (max-width: 768px) {
    .why-us-content {
        grid-template-columns: 1fr;
    }
}

/* Responsywność dla mniejszych ekranów */
@media (max-height: 700px) {
    .order-scroll-container {
        max-height: 55vh;
    }
}

@media (max-height: 600px) {
    .order-scroll-container {
        max-height: 50vh;
    }
}

/* Blokada przewijania tła gdy modal jest otwarty */
body.modal-open {
    overflow: hidden;
}

@media (max-width: 480px) {
    .modal-content {
        width: 95%;
        max-width: 350px;
        padding: 12px;
    }
    
    #order-form {
        padding-right: 5px;
    }
    
    .form-group {
        margin-bottom: 12px;
    }
    
    #order-notes {
        min-height: 60px;
    }
    
    /* Zwiększenie miejsca na klawiaturę */
    #order-modal {
        align-items: flex-start;
        padding-top: 20px;
    }
}

/* Dodatkowe style dla bardzo małych ekranów */
@media (max-width: 360px) {
    .modal-content {
        max-width: 320px;
    }
}

/* Lepsze zarządzanie przestrzenią na mobile */
@media (max-width: 768px) {
    #order-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    #order-summary {
        order: 3; /* Przesuwa podsumowanie na dół */
        margin-top: 15px;
    }
    
    .notes-group {
        order: 2;
    }
}

@media (min-width: 768px) {
    .charts-container {
        grid-template-columns: 1fr 1fr;
    }
}

/* ===== RESPONSIVE STYLES ===== */
@media (max-width: 768px) {
    h1 {
        font-size: 2rem;
        padding: 15px;
    }
    
    .modal-content {
        width: 90%;
        max-width: 400px; /* Zmniejszona maksymalna szerokość */
        margin: 5% auto;
        padding: 15px;
        overflow-y: auto;
        max-height: 90vh;
    }
    
    .order-button {
        padding: 12px 20px;
        font-size: 14px;
        bottom: 15px;
        right: 15px;
    }
    
    #order-summary {
        max-height: 45vh;
    }
    
    .order-items-container {
        max-height: calc(45vh - 120px);
    }
    
    .order-item {
        flex-wrap: wrap;
    }
    
    .order-item-info {
        width: 100%;
        margin-bottom: 5px;
    }
    
    .order-item-price {
        margin-left: 0;
        text-align: left;
    }
    
    .flavor-filters {
        flex-direction: column;
    }
    
    .filter-group {
        width: 100%;
    }
}

@media (max-width: 480px) {
    h1 {
        font-size: 1.8rem;
    }
    
    h2 {
        font-size: 1.5rem;
    }
    
    .container {
        padding: 15px;
        margin: 10px auto;
    }
    
    .form-control, .btn {
        padding: 8px 12px;
    }
    
    #order-summary {
        max-height: 40vh;
    }
    
    .order-items-container {
        max-height: calc(40vh - 120px);
    }
}

@media (max-height: 800px) {
    #order-summary {
        max-height: 45vh;
    }
    
    .order-items-container {
        max-height: calc(45vh - 120px);
    }
}

@media (max-height: 600px) {
    #order-summary {
        max-height: 40vh;
    }
    
    .order-items-container {
        max-height: calc(40vh - 120px);
    }
}

