const express = require('express');
const app = express();
const PORT = 3000;

// Middleware для парсингу JSON та логування
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// початкові дані конденсаторних установок
let capacitorBanks = [
    {
        id: 1,
        name: "КУ-10-400 Цех №1",
        ratedPower: 400,
        activePower: 320,
        stepsCount: 8,
        activeSteps: 6,
        voltage: 10,
        powerFactor: 0.92,
        mode: "auto",
        location: "Цех №1",
        installDate: "2023-05-15"
    },
    {
        id: 2,
        name: "КУ-35-1200 Підстанція Північна",
        ratedPower: 1200,
        activePower: 800,
        stepsCount: 12,
        activeSteps: 8,
        voltage: 35,
        powerFactor: 0.88,
        mode: "manual",
        location: "Підстанція Північна",
        installDate: "2024-01-20"
    },
    {
        id: 3,
        name: "КУ-6-200 Компресорна",
        ratedPower: 200,
        activePower: 150,
        stepsCount: 5,
        activeSteps: 4,
        voltage: 6,
        powerFactor: 0.95,
        mode: "auto",
        location: "Компресорна станція",
        installDate: "2023-11-10"
    },
    {
        id: 4,
        name: "КУ-10-600 Цех №3",
        ratedPower: 600,
        activePower: 450,
        stepsCount: 10,
        activeSteps: 7,
        voltage: 10,
        powerFactor: 0.85,
        mode: "auto",
        location: "Цех №3",
        installDate: "2024-03-05"
    },
    {
        id: 5,
        name: "КУ-35-800 Підстанція Східна",
        ratedPower: 800,
        activePower: 0,
        stepsCount: 8,
        activeSteps: 0,
        voltage: 35,
        powerFactor: 0.78,
        mode: "manual",
        location: "Підстанція Східна",
        installDate: "2024-06-12"
    }
];

// статистика викликів API
let apiStats = {
    totalRequests: 0,
    endpoints: {}
};

// Middleware для статистики
app.use((req, res, next) => {
    apiStats.totalRequests++;
    apiStats.endpoints[req.path] = (apiStats.endpoints[req.path] || 0) + 1;
    next();
});

// ============ ENDPOINTS ============

/**
 * GET /api/capacitor-banks
 * Отримати всі конденсаторні установки з можливістю фільтрації, сортування та пагінації
 * Query params:
 * - mode: фільтр за режимом (auto/manual)
 * - voltage: фільтр за напругою
 * - minPowerFactor: мінімальний коефіцієнт потужності
 * - sort: поле для сортування (name, ratedPower, powerFactor, activePower)
 * - order: asc/desc (за замовчуванням asc)
 * - page: номер сторінки (за замовчуванням 1)
 * - limit: кількість записів на сторінку (за замовчуванням 10)
 * - search: пошук за назвою або локацією
 */
app.get('/api/capacitor-banks', (req, res) => {
    try {
        let result = [...capacitorBanks];
        
        // Фільтрація
        const { mode, voltage, minPowerFactor, search } = req.query;
        
        if (mode) {
            result = result.filter(cb => cb.mode === mode);
        }
        
        if (voltage) {
            result = result.filter(cb => cb.voltage === parseFloat(voltage));
        }
        
        if (minPowerFactor) {
            result = result.filter(cb => cb.powerFactor >= parseFloat(minPowerFactor));
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(cb => 
                cb.name.toLowerCase().includes(searchLower) ||
                (cb.location && cb.location.toLowerCase().includes(searchLower))
            );
        }
        
        // сортування
        const { sort, order = 'asc' } = req.query;
        if (sort) {
            result.sort((a, b) => {
                let aVal = a[sort];
                let bVal = b[sort];
                
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                
                if (order === 'desc') {
                    return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
                }
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            });
        }
        
        // Пагінація
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedResult = result.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            count: paginatedResult.length,
            total: result.length,
            page,
            totalPages: Math.ceil(result.length / limit),
            data: paginatedResult
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера при отриманні даних',
            details: error.message
        });
    }
});

/**
 * GET /api/capacitor-banks/:id
 * Отримати конкретну конденсаторну установку за ID
 */
app.get('/api/capacitor-banks/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Невірний формат ID. Очікується число.'
            });
        }
        
        const capacitorBank = capacitorBanks.find(cb => cb.id === id);
        
        if (!capacitorBank) {
            return res.status(404).json({
                success: false,
                error: `Конденсаторну установку з ID ${id} не знайдено`,
                id
            });
        }
        
        res.json({
            success: true,
            data: capacitorBank
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера',
            details: error.message
        });
    }
});

/**
 * GET /api/capacitor-banks/:id/compensation
 * Отримати детальні дані компенсації для конкретної установки
 */
app.get('/api/capacitor-banks/:id/compensation', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Невірний формат ID. Очікується число.'
            });
        }
        
        const capacitorBank = capacitorBanks.find(cb => cb.id === id);
        
        if (!capacitorBank) {
            return res.status(404).json({
                success: false,
                error: `Конденсаторну установку з ID ${id} не знайдено`
            });
        }
        
        // розрахунок показників компенсації
        const utilizationRate = (capacitorBank.activePower / capacitorBank.ratedPower * 100).toFixed(2);
        const availableSteps = capacitorBank.stepsCount - capacitorBank.activeSteps;
        const stepPower = capacitorBank.ratedPower / capacitorBank.stepsCount;
        const availablePower = availableSteps * stepPower;
        const reactivePowerCompensated = capacitorBank.activePower;
        
        // оцінка ефективності
        let efficiency;
        if (capacitorBank.powerFactor >= 0.95) {
            efficiency = 'excellent';
        } else if (capacitorBank.powerFactor >= 0.90) {
            efficiency = 'good';
        } else if (capacitorBank.powerFactor >= 0.85) {
            efficiency = 'fair';
        } else {
            efficiency = 'poor';
        }
        
        res.json({
            success: true,
            data: {
                id: capacitorBank.id,
                name: capacitorBank.name,
                compensationData: {
                    ratedPower: capacitorBank.ratedPower,
                    activePower: capacitorBank.activePower,
                    utilizationRate: `${utilizationRate}%`,
                    powerFactor: capacitorBank.powerFactor,
                    efficiency,
                    steps: {
                        total: capacitorBank.stepsCount,
                        active: capacitorBank.activeSteps,
                        available: availableSteps,
                        stepPower: stepPower.toFixed(2),
                        availablePower: availablePower.toFixed(2)
                    }
                },
                reactivePowerCompensated,
                mode: capacitorBank.mode,
                recommendation: capacitorBank.powerFactor < 0.90 
                    ? 'Рекомендується збільшити компенсацію для покращення коефіцієнта потужності'
                    : 'Рівень компенсації в нормі'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера',
            details: error.message
        });
    }
});

/**
 * POST /api/capacitor-banks
 * Створити нову конденсаторну установку
 */
app.post('/api/capacitor-banks', (req, res) => {
    try {
        const { name, ratedPower, stepsCount, voltage, location } = req.body;
        
        // валідація обов'язкових полів
        const requiredFields = ['name', 'ratedPower', 'stepsCount', 'voltage'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Відсутні обов\'язкові поля',
                required: requiredFields,
                missing: missingFields
            });
        }
        
        // валідація типів даних
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Поле name повинно бути непорожнім рядком'
            });
        }
        
        if (ratedPower <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Номінальна потужність повинна бути більше 0'
            });
        }
        
        if (stepsCount <= 0 || !Number.isInteger(stepsCount)) {
            return res.status(400).json({
                success: false,
                error: 'Кількість ступенів повинна бути цілим числом більше 0'
            });
        }
        
        if (voltage <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Напруга повинна бути більше 0'
            });
        }
        
        // створення нової установки
        const newId = capacitorBanks.length > 0 
            ? Math.max(...capacitorBanks.map(cb => cb.id)) + 1 
            : 1;
        
        const newCapacitorBank = {
            id: newId,
            name: name.trim(),
            ratedPower,
            activePower: 0,
            stepsCount,
            activeSteps: 0,
            voltage,
            powerFactor: 0.80, // початкове значення без компенсації
            mode: req.body.mode || 'manual',
            location: location || 'Не вказано',
            installDate: new Date().toISOString().split('T')[0]
        };
        
        capacitorBanks.push(newCapacitorBank);
        
        res.status(201).json({
            success: true,
            message: 'Конденсаторну установку успішно створено',
            data: newCapacitorBank
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера при створенні установки',
            details: error.message
        });
    }
});

/**
 * POST /api/capacitor-banks/:id/switch-step
 * Перемкнути ступінь компенсації (збільшити або зменшити)
 * Body: { action: "increase" | "decrease" }
 */
app.post('/api/capacitor-banks/:id/switch-step', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { action } = req.body;
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Невірний формат ID. Очікується число.'
            });
        }
        
        if (!action || !['increase', 'decrease'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Параметр action повинен бути "increase" або "decrease"'
            });
        }
        
        const index = capacitorBanks.findIndex(cb => cb.id === id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: `Конденсаторну установку з ID ${id} не знайдено`
            });
        }
        
        const capacitorBank = capacitorBanks[index];
        const stepPower = capacitorBank.ratedPower / capacitorBank.stepsCount;
        let newActiveSteps = capacitorBank.activeSteps;
        let message = '';
        
        if (action === 'increase') {
            if (capacitorBank.activeSteps >= capacitorBank.stepsCount) {
                return res.status(400).json({
                    success: false,
                    error: 'Всі ступені вже увімкнені',
                    currentSteps: capacitorBank.activeSteps,
                    maxSteps: capacitorBank.stepsCount
                });
            }
            newActiveSteps++;
            message = `Ступінь увімкнено. Активних ступенів: ${newActiveSteps}`;
        } else {
            if (capacitorBank.activeSteps <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Всі ступені вже вимкнені',
                    currentSteps: capacitorBank.activeSteps
                });
            }
            newActiveSteps--;
            message = `Ступінь вимкнено. Активних ступенів: ${newActiveSteps}`;
        }
        
        // оновлення параметрів
        const newActivePower = newActiveSteps * stepPower;
        // симуляція покращення коефіцієнта потужності при компенсації
        const newPowerFactor = Math.min(0.99, 0.80 + (newActivePower / capacitorBank.ratedPower) * 0.19);
        
        capacitorBanks[index] = {
            ...capacitorBank,
            activeSteps: newActiveSteps,
            activePower: parseFloat(newActivePower.toFixed(2)),
            powerFactor: parseFloat(newPowerFactor.toFixed(3))
        };
        
        res.json({
            success: true,
            message,
            data: {
                previousSteps: capacitorBank.activeSteps,
                currentSteps: newActiveSteps,
                previousPower: capacitorBank.activePower,
                currentPower: capacitorBanks[index].activePower,
                powerFactor: capacitorBanks[index].powerFactor,
                stepPower: stepPower.toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера при перемиканні ступеня',
            details: error.message
        });
    }
});

/**
 * PUT /api/capacitor-banks/:id
 * Повне оновлення даних конденсаторної установки
 */
app.put('/api/capacitor-banks/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Невірний формат ID. Очікується число.'
            });
        }
        
        const index = capacitorBanks.findIndex(cb => cb.id === id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: `Конденсаторну установку з ID ${id} не знайдено`
            });
        }
        
        const { name, ratedPower, activePower, stepsCount, activeSteps, voltage, powerFactor, mode, location } = req.body;

        if (!name || !ratedPower || !stepsCount || !voltage) {
            return res.status(400).json({
                success: false,
                error: 'Відсутні обов\'язкові поля',
                required: ['name', 'ratedPower', 'stepsCount', 'voltage']
            });
        }
        
        if (activeSteps > stepsCount) {
            return res.status(400).json({
                success: false,
                error: 'Кількість активних ступенів не може перевищувати загальну кількість'
            });
        }
        
        // Збереження старого значення для порівняння
        const oldData = capacitorBanks[index];
        
        capacitorBanks[index] = {
            id,
            name,
            ratedPower,
            activePower: activePower || 0,
            stepsCount,
            activeSteps: activeSteps || 0,
            voltage,
            powerFactor: powerFactor || 0.80,
            mode: mode || 'manual',
            location: location || oldData.location,
            installDate: oldData.installDate
        };
        
        res.json({
            success: true,
            message: 'Дані установки повністю оновлено',
            data: capacitorBanks[index]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера при оновленні даних',
            details: error.message
        });
    }
});

/**
 * PUT /api/capacitor-banks/:id/mode
 * Змінити режим роботи установки (auto/manual)
 */
app.put('/api/capacitor-banks/:id/mode', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { mode } = req.body;
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Невірний формат ID. Очікується число.'
            });
        }
        
        if (!mode || !['auto', 'manual'].includes(mode)) {
            return res.status(400).json({
                success: false,
                error: 'Режим повинен бути "auto" або "manual"'
            });
        }
        
        const index = capacitorBanks.findIndex(cb => cb.id === id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: `Конденсаторну установку з ID ${id} не знайдено`
            });
        }
        
        const oldMode = capacitorBanks[index].mode;
        capacitorBanks[index].mode = mode;
        
        res.json({
            success: true,
            message: `Режим роботи змінено з "${oldMode}" на "${mode}"`,
            data: {
                id,
                name: capacitorBanks[index].name,
                mode,
                previousMode: oldMode
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера при зміні режиму',
            details: error.message
        });
    }
});

/**
 * PATCH /api/capacitor-banks/:id
 * Часткове оновлення параметрів установки
 */
app.patch('/api/capacitor-banks/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Невірний формат ID. Очікується число.'
            });
        }
        
        const index = capacitorBanks.findIndex(cb => cb.id === id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: `Конденсаторну установку з ID ${id} не знайдено`
            });
        }
        
        const updates = req.body;
        
        if (updates.activeSteps !== undefined && updates.stepsCount !== undefined) {
            if (updates.activeSteps > updates.stepsCount) {
                return res.status(400).json({
                    success: false,
                    error: 'Кількість активних ступенів не може перевищувати загальну кількість'
                });
            }
        } else if (updates.activeSteps !== undefined) {
            const maxSteps = capacitorBanks[index].stepsCount;
            if (updates.activeSteps > maxSteps) {
                return res.status(400).json({
                    success: false,
                    error: `Кількість активних ступенів не може перевищувати ${maxSteps}`
                });
            }
        }
        
        capacitorBanks[index] = {
            ...capacitorBanks[index],
            ...updates,
            id // Захист від зміни ID
        };
        

        if (updates.activeSteps !== undefined) {
            const stepPower = capacitorBanks[index].ratedPower / capacitorBanks[index].stepsCount;
            capacitorBanks[index].activePower = parseFloat((updates.activeSteps * stepPower).toFixed(2));
        }
        
        res.json({
            success: true,
            message: 'Дані установки частково оновлено',
            data: capacitorBanks[index]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера при частковому оновленні',
            details: error.message
        });
    }
});

/**
 * DELETE /api/capacitor-banks/:id
 * Видалити конденсаторну установку з системи
 */
app.delete('/api/capacitor-banks/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: 'Невірний формат ID. Очікується число.'
            });
        }
        
        const index = capacitorBanks.findIndex(cb => cb.id === id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: `Конденсаторну установку з ID ${id} не знайдено`
            });
        }
        
        const deleted = capacitorBanks.splice(index, 1)[0];
        
        res.json({
            success: true,
            message: 'Конденсаторну установку успішно видалено',
            data: deleted
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Помилка сервера при видаленні установки',
            details: error.message
        });
    }
});

/**
 * GET /api/stats
 * Отримати статистику викликів API
 */
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalRequests: apiStats.totalRequests,
            endpoints: apiStats.endpoints,
            totalCapacitorBanks: capacitorBanks.length,
            serverUptime: process.uptime().toFixed(2) + ' секунд'
        }
    });
});

/**
 * GET /api/health
 * Перевірка стану сервера
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Capacitor Bank Management API',
        version: '1.0.0'
    });
});


app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint не знайдено',
        path: req.path,
        method: req.method
    });
});


app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`REST API сервер запущено на http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('\n Доступні endpoints:');
    console.log('  GET    /api/capacitor-banks              - список установок');
    console.log('  GET    /api/capacitor-banks/:id          - установка за ID');
    console.log('  GET    /api/capacitor-banks/:id/compensation - дані компенсації');
    console.log('  POST   /api/capacitor-banks              - створити установку');
    console.log('  POST   /api/capacitor-banks/:id/switch-step - перемкнути ступінь');
    console.log('  PUT    /api/capacitor-banks/:id          - оновити установку');
    console.log('  PUT    /api/capacitor-banks/:id/mode     - змінити режим');
    console.log('  PATCH  /api/capacitor-banks/:id          - часткове оновлення');
    console.log('  DELETE /api/capacitor-banks/:id          - видалити установку');
    console.log('  GET    /api/stats                        - статистика API');
    console.log('  GET    /api/health                       - стан сервера');
    console.log('\nПочаткові дані завантажено:', capacitorBanks.length, 'установок');
});
