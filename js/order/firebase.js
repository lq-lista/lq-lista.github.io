class FirebaseModule {
    constructor(orderSystem) {
        this.orderSystem = orderSystem;
        this.database = null;
        this.isOnline = false;
        this.syncInterval = null;
        this.initializeFirebase();
    }

    initializeFirebase() {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyAfYyYUOcdjfpupkWMTUZfup6xmRRZJ68w",
                authDomain: "lq-lista.firebaseapp.com",
                databaseURL: "https://lq-lista-default-rtdb.europe-west1.firebasedatabase.app",
                projectId: "lq-lista",
                storageBucket: "lq-lista.appspot.com",
                messagingSenderId: "642905853097",
                appId: "1:642905853097:web:ca850099dcdc002f9b2db8"
            };

            if (typeof firebase === 'undefined') {
                console.warn('Firebase nie został załadowany - tryb offline');
                this.setOfflineMode();
                return;
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.database = firebase.database();
            this.setupConnectionMonitoring();
            this.startSync();
            
        } catch (error) {
            console.error('Błąd inicjalizacji Firebase:', error);
            this.setOfflineMode();
        }
    }

    setupConnectionMonitoring() {
        const connectedRef = this.database.ref('.info/connected');
        connectedRef.on('value', (snap) => {
            this.isOnline = snap.val() === true;
            console.log(`Status połączenia: ${this.isOnline ? 'Online' : 'Offline'}`);
            this.orderSystem.ui.updateConnectionStatus(this.isOnline);
            
            if (this.isOnline) {
                this.syncLocalOrdersToFirebase();
            }
        });
    }

    startSync() {
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.syncOrdersFromFirebase();
                this.syncLocalOrdersToFirebase();
            }
        }, 30000);
    }

    setOfflineMode() {
        this.isOnline = false;
        console.log("Aplikacja w trybie offline");
        if (this.orderSystem.ui) {
            this.orderSystem.ui.updateConnectionStatus(false);
        }
    }

    async syncOrdersFromFirebase() {
        if (!this.isOnline) {
            console.log("Tryb offline - pominięto synchronizację z Firebase");
            return;
        }

        try {
            console.log("Rozpoczynanie synchronizacji z Firebase...");
            const snapshot = await this.database.ref('orders').once('value');
            const firebaseOrders = snapshot.val() || {};
            
            let updated = false;
            
            for (const [orderId, firebaseOrder] of Object.entries(firebaseOrders)) {
                if (!this.orderSystem.orders[orderId] || 
                    (this.orderSystem.orders[orderId].updatedAt || 0) < firebaseOrder.updatedAt) {
                    this.orderSystem.orders[orderId] = firebaseOrder;
                    updated = true;
                }
            }
            
            if (updated) {
                localStorage.setItem('orders', JSON.stringify(this.orderSystem.orders));
                console.log("Zaktualizowano lokalne zamówienia z Firebase");
                this.orderSystem.stats.updateStats();
                this.orderSystem.ui.updateAdminPanel();
            }
        } catch (error) {
            console.error("Błąd synchronizacji z Firebase:", error);
            this.setOfflineMode();
        }
    }

    async syncLocalOrdersToFirebase() {
        if (!this.isOnline) {
            console.log("Tryb offline - pominięto synchronizację lokalnych zamówień");
            return;
        }

        try {
            console.log("Rozpoczynanie synchronizacji lokalnych zamówień z Firebase...");
            const updates = {};
            const now = Date.now();
            let syncCount = 0;
            
            for (const [orderId, order] of Object.entries(this.orderSystem.orders)) {
                if (order.isOffline || !order.lastSynced || order.updatedAt > order.lastSynced) {
                    const orderToUpdate = { 
                        ...order, 
                        updatedAt: now, 
                        lastSynced: now,
                        isOffline: false 
                    };
                    updates[`orders/${orderId}`] = orderToUpdate;
                    this.orderSystem.orders[orderId] = orderToUpdate;
                    syncCount++;
                }
            }
            
            if (syncCount > 0) {
                await this.database.ref().update(updates);
                localStorage.setItem('orders', JSON.stringify(this.orderSystem.orders));
                console.log(`Zsynchroniczowano ${syncCount} lokalnych zamówień z Firebase`);
            }
        } catch (error) {
            console.error("Błąd synchronizacji lokalnych zamówień:", error);
        }
    }

    async submitOrderToFirebase(orderData) {
        if (!this.isOnline) {
            console.log("Tryb offline - zamówienie zapisane lokalnie");
            const orderId = `local_${Date.now()}`;
            const orderWithMeta = {
                ...orderData,
                id: orderId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: 'local',
                isOffline: true
            };
            
            this.orderSystem.orders[orderId] = orderWithMeta;
            localStorage.setItem('orders', JSON.stringify(this.orderSystem.orders));
            return orderId;
        }

        try {
            const orderId = `order_${Date.now()}`;
            const orderWithMeta = {
                ...orderData,
                id: orderId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: 'new'
            };
            
            await this.database.ref(`orders/${orderId}`).set(orderWithMeta);
            this.orderSystem.orders[orderId] = orderWithMeta;
            localStorage.setItem('orders', JSON.stringify(this.orderSystem.orders));
            
            console.log("Zamówienie zapisane w Firebase:", orderId);
            return orderId;
        } catch (error) {
            console.error("Błąd zapisywania zamówienia w Firebase:", error);
            throw error;
        }
    }

    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.database) {
            this.database.ref('.info/connected').off();
        }
    }
}