// api.js - модуль роботи з WebSocket API

class WebSocketClient {
    constructor(url, options = {}) {
        this.url = url;
        this.options = {
            reconnectInterval: 5000,
            maxReconnectAttempts: 10,
            ...options
        };
        
        this.socket = null;
        this.reconnectAttempts = 0;
        this.listeners = new Map();
        this.isManualClose = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.url);
                
                this.socket.onopen = (event) => {
                    console.log('WebSocket підключено');
                    this.reconnectAttempts = 0;
                    this.emit('open', event);
                    resolve(event);
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.emit('message', data);
                    } catch (error) {
                        console.error('Помилка парсингу JSON:', error);
                        this.emit('error', error);
                    }
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket помилка:', error);
                    this.emit('error', error);
                    reject(error);
                };
                
                this.socket.onclose = (event) => {
                    console.log('🔌 WebSocket закрито');
                    this.emit('close', event);
                    
                    if (!this.isManualClose) {
                        this.attemptReconnect();
                    }
                };
                
            } catch (error) {
                console.error('Помилка створення WebSocket:', error);
                reject(error);
            }
        });
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('Перевищено максимальну кількість спроб перепідключення');
            this.emit('maxReconnectAttemptsReached');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Спроба перепідключення ${this.reconnectAttempts}/${this.options.maxReconnectAttempts}...`);
        
        setTimeout(() => {
            this.connect().catch(() => {
                // помилка обробляється в attemptReconnect
            });
        }, this.options.reconnectInterval);
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this.socket.send(message);
            return true;
        }
        console.warn('WebSocket не підключено, неможливо відправити повідомлення');
        return false;
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Помилка в обробнику події "${event}":`, error);
                }
            });
        }
    }

    close() {
        this.isManualClose = true;
        if (this.socket) {
            this.socket.close();
        }
    }

    getStatus() {
        if (!this.socket) return 'CLOSED';
        
        const states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
        return states[this.socket.readyState] || 'UNKNOWN';
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

// функція генерації тестових даних для геотермальної станції
function generateGeothermalData() {
    const baseTemp = 180 + Math.random() * 60; // 180-240 °C
    const basePressure = 8 + Math.random() * 6; // 8-14 бар
    
    return {
        timestamp: Date.now(),
        temperature: Math.round(baseTemp * 10) / 10,
        pressure: Math.round(basePressure * 10) / 10,
        power: Math.round((8 + Math.random() * 4) * 10) / 10, // 8-12 МВт
        flowRate: Math.round((50 + Math.random() * 30) * 10) / 10, // 50-80 кг/с
        efficiency: Math.round((75 + Math.random() * 15) * 10) / 10, // 75-90%
        // додаткові параметри для T-S діаграми
        entropyValues: {
            point1: 0.4 + Math.random() * 0.1, // після конденсатора
            point2: 0.45 + Math.random() * 0.1, // після насоса
            point3: 1.6 + Math.random() * 0.2, // після випарника
            point4: 1.7 + Math.random() * 0.2  // після турбіни
        },
        temperatureValues: {
            point1: 40 + Math.random() * 10, // конденсатор
            point2: 45 + Math.random() * 10, // насос
            point3: baseTemp, // випарник
            point4: 100 + Math.random() * 30 // турбіна
        }
    };
}

// експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebSocketClient, generateGeothermalData };
}