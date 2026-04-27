// websocket-server.js - тестовий WebSocket сервер для геотермальної станції

const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`
╔══════════════════════════════════════════════════════════╗
║     🌋 WebSocket сервер геотермальної станції           ║
║     Порт: ${PORT}                                          ║
║     Очікування підключень...                            ║
╚══════════════════════════════════════════════════════════╝
`);

// функція генерації реалістичних даних геотермальної станції
function generateGeothermalData() {
    // базові параметри з реалістичними діапазонами
    const baseTemp = 180 + Math.random() * 60; // 180-240 °C
    const basePressure = 8 + Math.random() * 6; // 8-14 бар
    
    // розрахунок ентропії для T-S діаграми
    // використовуємо спрощену модель насиченої пари
    const entropyLiquid = 0.5 + (baseTemp / 500); // Рідка фаза
    const entropyVapor = 1.5 + (baseTemp / 300);  // Парова фаза
    
    // потужність залежить від температури та тиску
    const power = 6 + (baseTemp - 180) * 0.15 + (basePressure - 8) * 0.5 + Math.random() * 2;
    
    // витрата теплоносія
    const flowRate = 40 + (baseTemp - 180) * 0.8 + Math.random() * 15;
    
    // ефективність циклу (ККД)
    const efficiency = 70 + (baseTemp - 180) * 0.3 + (basePressure - 8) * 1.5;
    
    return {
        timestamp: Date.now(),
        temperature: Math.round(baseTemp * 10) / 10,
        pressure: Math.round(basePressure * 10) / 10,
        power: Math.round(Math.min(power, 14) * 10) / 10,
        flowRate: Math.round(flowRate * 10) / 10,
        efficiency: Math.round(Math.min(efficiency, 92) * 10) / 10,
        
        // дані для T-S діаграми
        entropyValues: {
            point1: Math.round((0.4 + Math.random() * 0.15) * 100) / 100, // після конденсатора
            point2: Math.round((0.5 + Math.random() * 0.15) * 100) / 100, // після насоса
            point3: Math.round((entropyVapor - 0.1) * 100) / 100,         // після випарника
            point4: Math.round((entropyVapor + 0.05) * 100) / 100         // після турбіни
        },
        
        temperatureValues: {
            point1: Math.round((35 + Math.random() * 15) * 10) / 10,      // конденсатор
            point2: Math.round((40 + Math.random() * 15) * 10) / 10,      // насос
            point3: baseTemp,                                             // випарник
            point4: Math.round((90 + Math.random() * 40) * 10) / 10       // турбіна
        }
    };
}

// обробка підключень
wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`Клієнт підключився: ${clientIP}`);
    
    let intervalId = null;
    let updateInterval = 2000; // за замовчуванням 2 секунди
    
    // відправляємо перші дані одразу
    const initialData = generateGeothermalData();
    ws.send(JSON.stringify(initialData));
    console.log('📤 Відправлено початкові дані');
    
    // обробка вхідних повідомлень від клієнта
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Отримано повідомлення:', data);
            
            if (data.type === 'subscribe') {
                // оновлюємо інтервал відправки
                if (data.interval) {
                    updateInterval = data.interval;
                }
                
                // очищаємо попередній інтервал
                if (intervalId) {
                    clearInterval(intervalId);
                }
                
                // встановлюємо новий інтервал
                intervalId = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const newData = generateGeothermalData();
                        ws.send(JSON.stringify(newData));
                        console.log(`Відправлено дані: ${newData.temperature}°C, ${newData.power} МВт`);
                    }
                }, updateInterval);
                
                console.log(`Встановлено інтервал оновлення: ${updateInterval} мс`);
            }
            
            if (data.type === 'unsubscribe') {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                    console.log('Клієнт відписався від оновлень');
                }
            }
            
        } catch (error) {
            console.error('Помилка обробки повідомлення:', error);
        }
    });
    
    // обробка закриття з'єднання
    ws.on('close', () => {
        console.log(`🔌 Клієнт відключився: ${clientIP}`);
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    });
    
    // обробка помилок
    ws.on('error', (error) => {
        console.error(`Помилка WebSocket (${clientIP}):`, error);
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    });
});

// обробка помилок сервера
wss.on('error', (error) => {
    console.error('Помилка сервера WebSocket:', error);
});

// коректне завершення роботи
process.on('SIGINT', () => {
    console.log('\nЗавершення роботи сервера...');
    
    // закриваємо всі з'єднання
    wss.clients.forEach((client) => {
        client.close();
    });
    
    wss.close(() => {
        console.log('Сервер зупинено');
        process.exit(0);
    });
});

console.log('📡 Сервер готовий до роботи. Натисніть Ctrl+C для зупинки.\n');