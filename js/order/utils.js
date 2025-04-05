class UtilsModule {
    constructor(orderSystem) {
        this.orderSystem = orderSystem;
    }

    formatPrice(price) {
        return `${price.toFixed(2)}zł`;
    }

    generateOrderNumber() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let result = '';
        
        // 3 litery
        for (let i = 0; i < 3; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        // 4 cyfry
        for (let i = 0; i < 4; i++) {
            result += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        
        return result;
    }

    calculateItemPrice(size, strength) {
        const basePrices = this.orderSystem.pricing;
        let price = 0;
        
        switch(size) {
            case '10ml':
                price = basePrices.small;
                break;
            case '30ml':
                price = basePrices.medium;
                break;
            case '60ml':
                price = basePrices.large;
                break;
            default:
                price = 0;
        }
        
        // Dodatkowa opłata za wyższą moc nikotyny
        if (strength >= 12) {
            price += basePrices.highNicotineFee || 0;
        }
        
        return price;
    }

    formatPrice(price) {
        return `${price.toFixed(2)}zł`;
    }

    formatFlavorName(flavor) {
        return flavor
            .replace(/,/g, ', ')
            .replace(/\s+/g, ' ')
            .replace(/\s([A-Z])/g, ' $1')
            .replace(/\s\(/g, ' (')
            .trim();
    }

    generateOrderNumber() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let result = '';
        
        for (let i = 0; i < 3; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        for (let i = 0; i < 4; i++) {
            result += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        
        return result;
    }

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}