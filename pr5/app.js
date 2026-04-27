// app.js - головний модуль клієнтського застосунку

class GeothermalMonitor {
    constructor() {
        this.wsClient = null;
        this.chartsManager = null;
        this.dataHistory = [];
        this.maxHistorySize = 10;
        
        this.init();
    }

    async init() {
        // ініціалізація менеджера графіків
        this.chartsManager = new ChartsManager();
        
        // підключення до WebSocket
        await this.connectToServer();
        
        // оновлення UI
        this.updateConnectionStatus();
    }

    async connectToServer() {
        this.wsClient = new WebSocketClient('ws://localhost:8080', {
            reconnectInterval: 5000,
            maxReconnectAttempts: 10
        });

        // обробники подій
        this.wsClient.on('open', () => {
            this.onConnected();
        });

        this.wsClient.on('message', (data) => {
            this.onDataReceived(data);
        });

        this.wsClient.on('error', (error) => {
            this.onError(error);
        });

        this.wsClient.on('close', () => {
            this.onDisconnected();
        });

        this.wsClient.on('maxReconnectAttemptsReached', () => {
            this.onMaxReconnectAttempts();
        });

        // спроба підключення
        try {
            await this.wsClient.connect();
        } catch (error) {
            console.error('Не вдалося підключитися до сервера:', error);
            this.updateStatus('offline', 'Помилка підключення');
        }
    }

    onConnected() {
        console.log('Підключено до сервера геотермальної станції');
        this.updateStatus('online', 'Онлайн');
        
        // відправляємо запит на отримання поточних даних
        this.wsClient.send(JSON.stringify({ 
            type: 'subscribe',
            interval: 2000 // оновлення кожні 2 секунди
        }));
    }

    onDataReceived(data) {
        console.log('Отримано дані:', data);
        
        // оновлення UI з анімацією
        this.updateMetricsWithAnimation(data);
        
        // оновлення графіків
        this.chartsManager.updateAllCharts(data);
        
        // додавання до історії
        this.addToHistory(data);
        
        // оновлення таблиці
        this.updateTable();
        
        // оновлення часу останнього оновлення
        this.updateLastUpdateTime(data.timestamp);
    }

    updateMetricsWithAnimation(data) {
        const elements = [
            'powerValue',
            'tempValue',
            'pressureValue',
            'efficiencyValue'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            element.classList.add('updating');
            setTimeout(() => element.classList.remove('updating'), 500);
        });
        
        // оновлення значень
        document.getElementById('powerValue').textContent = data.power.toFixed(1);
        document.getElementById('tempValue').textContent = data.temperature.toFixed(1);
        document.getElementById('pressureValue').textContent = data.pressure.toFixed(1);
        document.getElementById('efficiencyValue').textContent = data.efficiency.toFixed(1);
        
        // оновлення прогресу потужності
        const powerPercent = (data.power / 15) * 100; // Максимум 15 МВт
        document.getElementById('powerBar').style.width = `${Math.min(powerPercent, 100)}%`;
        
        // оновлення бейджа ефективності
        const efficiencyBadge = document.getElementById('efficiencyBadge');
        if (data.efficiency >= 85) {
            efficiencyBadge.textContent = 'Відмінна';
            efficiencyBadge.className = 'badge bg-success';
        } else if (data.efficiency >= 75) {
            efficiencyBadge.textContent = 'Нормальна';
            efficiencyBadge.className = 'badge bg-primary';
        } else {
            efficiencyBadge.textContent = 'Низька';
            efficiencyBadge.className = 'badge bg-warning';
        }
    }

    addToHistory(data) {
        this.dataHistory.unshift({
            timestamp: data.timestamp,
            power: data.power,
            temperature: data.temperature,
            pressure: data.pressure,
            flowRate: data.flowRate,
            efficiency: data.efficiency
        });
        
        // обмеження розміру історії
        if (this.dataHistory.length > this.maxHistorySize) {
            this.dataHistory.pop();
        }
        
        // оновлення лічильника записів
        document.getElementById('recordCount').textContent = 
            `${this.dataHistory.length} / ${this.maxHistorySize} записів`;
    }

    updateTable() {
        const tbody = document.getElementById('dataTableBody');
        
        if (this.dataHistory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-sync fa-spin me-2"></i>
                        Очікування даних...
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.dataHistory.map(item => `
            <tr>
                <td>
                    <i class="far fa-clock me-1 text-muted"></i>
                    ${new Date(item.timestamp).toLocaleTimeString('uk-UA')}
                </td>
                <td>
                    <span class="fw-semibold">${item.power.toFixed(2)}</span>
                    <small class="text-muted">МВт</small>
                </td>
                <td>
                    <i class="fas fa-temperature-low me-1 text-danger"></i>
                    ${item.temperature.toFixed(1)}°C
                </td>
                <td>
                    <i class="fas fa-compress-alt me-1 text-info"></i>
                    ${item.pressure.toFixed(1)} бар
                </td>
                <td>
                    <i class="fas fa-tachometer-alt me-1 text-success"></i>
                    ${item.flowRate.toFixed(1)} кг/с
                </td>
                <td>
                    <span class="badge ${item.efficiency >= 85 ? 'bg-success' : item.efficiency >= 75 ? 'bg-primary' : 'bg-warning'}">
                        ${item.efficiency.toFixed(1)}%
                    </span>
                </td>
            </tr>
        `).join('');
    }

    updateLastUpdateTime(timestamp) {
        const time = new Date(timestamp).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('lastUpdate').textContent = `Останнє оновлення: ${time}`;
    }

    updateStatus(status, text) {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        indicator.className = 'fas fa-circle me-2';
        
        switch(status) {
            case 'online':
                indicator.classList.add('status-online');
                statusText.textContent = text || 'Онлайн';
                break;
            case 'offline':
                indicator.classList.add('status-offline');
                statusText.textContent = text || 'Офлайн';
                break;
            case 'connecting':
                indicator.classList.add('status-connecting');
                statusText.textContent = text || 'Підключення...';
                break;
        }
    }

    onError(error) {
        console.error('Помилка WebSocket:', error);
        this.updateStatus('offline', 'Помилка з\'єднання');
    }

    onDisconnected() {
        console.log('🔌 Відключено від сервера');
        this.updateStatus('offline', 'Відключено');
    }

    onMaxReconnectAttempts() {
        console.error('Не вдалося перепідключитися після максимальної кількості спроб');
        this.updateStatus('offline', 'Не вдалося підключитися');
        
       
        alert('Не вдалося підключитися до сервера. Перевірте, чи запущено сервер WebSocket на порту 8080.');
    }

    updateConnectionStatus() {
        const checkInterval = setInterval(() => {
            if (this.wsClient) {
                const status = this.wsClient.getStatus();
                
                if (status === 'OPEN') {
                    this.updateStatus('online', 'Онлайн');
                } else if (status === 'CONNECTING') {
                    this.updateStatus('connecting', 'Підключення...');
                } else {
                    this.updateStatus('offline', 'Офлайн');
                }
            }
        }, 1000);
    }
}

// ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Запуск системи моніторингу геотермальної станції');
    window.geothermalMonitor = new GeothermalMonitor();
});