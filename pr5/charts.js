// charts.js - модуль візуалізації графіків та діаграм

class ChartsManager {
    constructor() {
        this.powerChart = null;
        this.tsChart = null;
        this.schemeChart = null;
        
        this.initCharts();
    }

    initCharts() {
        this.initPowerChart();
        this.initTSDiagram();
        this.initStationScheme();
    }

    initPowerChart() {
        const ctx = document.getElementById('powerChart').getContext('2d');
        
        this.powerChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Електрична потужність (МВт)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `Потужність: ${context.parsed.y.toFixed(2)} МВт`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 5,
                        max: 15,
                        title: {
                            display: true,
                            text: 'Потужність (МВт)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Час'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    initTSDiagram() {
        const ctx = document.getElementById('tsDiagram').getContext('2d');
        
        this.tsChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Цикл Ренкіна',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'],
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        showLine: true,
                        tension: 0.1
                    },
                    {
                        label: 'Лінія насичення',
                        data: this.generateSaturationCurve(),
                        borderColor: '#6b7280',
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        showLine: true,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const point = context.raw;
                                return `T: ${point.y.toFixed(1)}°C, S: ${point.x.toFixed(3)} кДж/(кг·К)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Температура (°C)'
                        },
                        min: 0,
                        max: 300,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Ентропія (кДж/(кг·К))'
                        },
                        min: 0,
                        max: 2.5,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }

    generateSaturationCurve() {
        const points = [];
        // спрощена крива насичення для води
        for (let s = 0.1; s <= 2.0; s += 0.05) {
            // апроксимація лінії насичення
            let t;
            if (s < 0.5) {
                t = 20 + s * 40;
            } else if (s < 1.0) {
                t = 40 + (s - 0.5) * 80;
            } else if (s < 1.5) {
                t = 80 + (s - 1.0) * 120;
            } else {
                t = 140 + (s - 1.5) * 100;
            }
            points.push({ x: s, y: t });
        }
        return points;
    }

    initStationScheme() {
        const ctx = document.getElementById('stationScheme').getContext('2d');
        
        this.schemeChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Свердловина',
                        data: [{ x: 1, y: 1  }],
                        backgroundColor: '#8b5cf6',
                        pointRadius: 20,
                        pointStyle: 'circle'
                    },
                    {
                        label: 'Теплообмінник',
                        data: [{ x: 3, y: 3 }],
                        backgroundColor: '#ef4444',
                        pointRadius: 15,
                        pointStyle: 'rect'
                    },
                    {
                        label: 'Турбіна',
                        data: [{ x: 5, y: 3 }],
                        backgroundColor: '#3b82f6',
                        pointRadius: 18,
                        pointStyle: 'triangle'
                    },
                    {
                        label: 'Генератор',
                        data: [{ x: 7, y: 3 }],
                        backgroundColor: '#f59e0b',
                        pointRadius: 15,
                        pointStyle: 'circle'
                    },
                    {
                        label: 'Конденсатор',
                        data: [{ x: 5, y: 1 }],
                        backgroundColor: '#10b981',
                        pointRadius: 15,
                        pointStyle: 'rect'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return context.dataset.label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        display: false,
                        min: 0,
                        max: 4
                    },
                    x: {
                        display: false,
                        min: 0,
                        max: 8
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2,
                        borderColor: '#6b7280'
                    }
                }
            }
        });

        // додаємо з'єднувальні лінії
        this.addConnectionLines();
    }

    addConnectionLines() {
        // схематичні з'єднання між компонентами
        const connections = [
            { from: { x: 1.3, y: 3 }, to: { x: 2.7, y: 3 } }, // свердловина -> Теплообмінник
            { from: { x: 3.3, y: 3 }, to: { x: 4.7, y: 3 } }, // теплообмінник -> Турбіна
            { from: { x: 5.3, y: 3 }, to: { x: 6.7, y: 3 } }, // турбіна -> Генератор
            { from: { x: 5, y: 2.7 }, to: { x: 5, y: 1.3 } }, // турбіна -> Конденсатор
            { from: { x: 4.7, y: 1 }, to: { x: 3.3, y: 1 } }, // конденсатор -> Насос (неявний)
            { from: { x: 3, y: 1.3 }, to: { x: 3, y: 2.7 } }  // повернення до теплообмінника
        ];

        // примітка: Chart.js не підтримує довільні лінії в scatter plot,
        // тому використовуємо окремий canvas для схеми
        this.drawConnectionLines(connections);
    }

    drawConnectionLines(connections) {
        const canvas = document.getElementById('stationScheme');
        const ctx = canvas.getContext('2d');
        
        // малюємо поверх chart.js
        setTimeout(() => {
            ctx.save();
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            connections.forEach(conn => {
                const fromX = this.mapCoordinate(conn.from.x, 0, 8, 0, canvas.width);
                const fromY = this.mapCoordinate(conn.from.y, 0, 4, canvas.height, 0);
                const toX = this.mapCoordinate(conn.to.x, 0, 8, 0, canvas.width);
                const toY = this.mapCoordinate(conn.to.y, 0, 4, canvas.height, 0);
                
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
            });
            
            ctx.restore();
        }, 100);
    }

    mapCoordinate(value, fromMin, fromMax, toMin, toMax) {
        return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
    }

    updatePowerChart(timestamp, power) {
        const time = new Date(timestamp).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        this.powerChart.data.labels.push(time);
        this.powerChart.data.datasets[0].data.push(power);
        
        // обмежуємо до 20 точок
        if (this.powerChart.data.labels.length > 20) {
            this.powerChart.data.labels.shift();
            this.powerChart.data.datasets[0].data.shift();
        }
        
        this.powerChart.update();
    }

    updateTSDiagram(entropyValues, temperatureValues) {
        const cyclePoints = [
            { x: entropyValues.point1, y: temperatureValues.point1 }, // 1: конденсатор
            { x: entropyValues.point2, y: temperatureValues.point2 }, // 2: насос
            { x: entropyValues.point3, y: temperatureValues.point3 }, // 3: випарник
            { x: entropyValues.point4, y: temperatureValues.point4 }, // 4: турбіна
            { x: entropyValues.point1, y: temperatureValues.point1 }  // замикання циклу
        ];
        
        this.tsChart.data.datasets[0].data = cyclePoints;
        this.tsChart.update();
    }

    updateAllCharts(data) {
        this.updatePowerChart(data.timestamp, data.power);
        this.updateTSDiagram(data.entropyValues, data.temperatureValues);
    }
}

// експорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartsManager;
}