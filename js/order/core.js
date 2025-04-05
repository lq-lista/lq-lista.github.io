class OrderSystem {
    constructor() {
        try {
            if (typeof AppData === 'undefined') {
                throw new Error('Dane aplikacji (AppData) nie zostały załadowane!');
            }

            this.appData = AppData;
            this.currentOrder = [];
            this.orders = {};
            this.adminPassword = "admin123";
            this.pageViews = 0;
            this.ordersChart = null;
            this.flavorsChart = null;
            
            this.initializeModules();
            this.testFirebaseConnection();

            // Dodatkowa inicjalizacja po załadowaniu
            setTimeout(() => {
                if (this.ui) {
                    this.ui.filterFlavors();
                    if (document.getElementById('brand-filter')) {
                        document.getElementById('brand-filter').value = 'all';
                        document.getElementById('type-filter').value = 'all';
                    }
                }
            }, 300);

        } catch (error) {
            console.error('Błąd inicjalizacji OrderSystem:', error);
            throw error;
        }
    }

    initializeModules() {
        this.firebase = new FirebaseModule(this);
        this.ui = new UIModule(this);
        this.orders = new OrdersModule(this);
        this.stats = new StatisticsModule(this);
        this.utils = new UtilsModule(this);
    }

    async testFirebaseConnection() {
        try {
            await this.firebase.testConnection();
        } catch (error) {
            console.error("Błąd testu połączenia z Firebase:", error);
            throw error;
        }
    }
}