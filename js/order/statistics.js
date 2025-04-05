class StatisticsModule {
    constructor(orderSystem) {
        this.orderSystem = orderSystem;
        this.initStatistics();
    }

    initStatistics() {
        this.orderSystem.pageViews = parseInt(localStorage.getItem('pageViews')) || 0;
        this.initCharts();
        this.trackPageView();
    }

    trackPageView() {
        try {
            this.orderSystem.pageViews++;
            localStorage.setItem('pageViews', this.orderSystem.pageViews);
            this.updateStats();
        } catch (error) {
            console.error('Błąd śledzenia odwiedzin:', error);
        }
    }

    initCharts() {
        try {
            // Niszczenie istniejących wykresów
            if (this.orderSystem.ordersChart) {
                this.orderSystem.ordersChart.destroy();
            }
            if (this.orderSystem.flavorsChart) {
                this.orderSystem.flavorsChart.destroy();
            }

            // Inicjalizacja nowych wykresów
            const ordersCtx = document.getElementById('ordersChart').getContext('2d');
            const flavorsCtx = document.getElementById('flavorsChart').getContext('2d');

            // Dane dla wykresów
            const last7Days = this.orderSystem.utils.getLast7Days();
            const ordersData = this.getOrdersLast7Days();
            const topFlavors = this.getTopFlavors(5);

            // Wykres zamówień
            this.orderSystem.ordersChart = new Chart(ordersCtx, {
                type: 'line',
                data: {
                    labels: last7Days,
                    datasets: [{
                        label: 'Zamówienia z ostatnich 7 dni',
                        data: ordersData,
                        borderColor: '#ff6f61',
                        backgroundColor: 'rgba(255, 111, 97, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });

            // Wykres smaków
            this.orderSystem.flavorsChart = new Chart(flavorsCtx, {
                type: 'doughnut',
                data: {
                    labels: topFlavors.map(f => f.name),
                    datasets: [{
                        data: topFlavors.map(f => f.count),
                        backgroundColor: [
                            '#ff6f61',
                            '#ff9a9e',
                            '#fad0c4',
                            '#ffcc00',
                            '#45a049'
                        ]
                    }]
                }
            });

        } catch (error) {
            console.error('Błąd inicjalizacji wykresów:', error);
        }
    }

    updateStats() {
        try {
            const totalOrders = Object.keys(this.orderSystem.orders).length;
            const todayOrders = this.getTodaysOrdersCount();

            document.getElementById('total-orders').textContent = totalOrders;
            document.getElementById('today-orders').textContent = todayOrders;
            document.getElementById('total-views').textContent = this.orderSystem.pageViews;

            this.updateCharts();
        } catch (error) {
            console.error('Błąd aktualizacji statystyk:', error);
        }
    }

    getTodaysOrdersCount() {
        const today = new Date().toLocaleDateString();
        return Object.values(this.orderSystem.orders).filter(order => {
            return new Date(order.date).toLocaleDateString() === today;
        }).length;
    }

    getOrdersLast7Days() {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();

        Object.values(this.orderSystem.orders).forEach(order => {
            const orderDate = new Date(order.date);
            const diffDays = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays < 7) {
                counts[6 - diffDays]++;
            }
        });

        return counts;
    }

    getTopFlavors(limit = 5) {
        const flavorCounts = {};
        
        Object.values(this.orderSystem.orders).forEach(order => {
            order.items.forEach(item => {
                const flavorName = this.orderSystem.utils.formatFlavorName(item.flavor).split('(')[0].trim();
                flavorCounts[flavorName] = (flavorCounts[flavorName] || 0) + 1;
            });
        });

        return Object.entries(flavorCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    updateCharts() {
        if (!this.orderSystem.ordersChart || !this.orderSystem.flavorsChart) {
            this.initCharts();
            return;
        }

        const last7Days = this.orderSystem.utils.getLast7Days();
        const ordersData = this.getOrdersLast7Days();
        const topFlavors = this.getTopFlavors(5);

        this.orderSystem.ordersChart.data.labels = last7Days;
        this.orderSystem.ordersChart.data.datasets[0].data = ordersData;
        this.orderSystem.ordersChart.update();

        this.orderSystem.flavorsChart.data.labels = topFlavors.map(f => f.name);
        this.orderSystem.flavorsChart.data.datasets[0].data = topFlavors.map(f => f.count);
        this.orderSystem.flavorsChart.update();
    }
}