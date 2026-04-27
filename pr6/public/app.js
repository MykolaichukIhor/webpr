let csrfToken = '';

// ===== ОТРИМАННЯ CSRF ТОКЕНА =====
async function getCsrfToken() {
    try {
        const response = await fetch('/csrf-token');
        if (response.ok) {
            const result = await response.json();
            csrfToken = result.csrfToken;
            console.log('CSRF токен отримано');
        } else {
            console.error('Помилка отримання CSRF токена');
        }
    } catch (err) {
        console.error('Помилка CSRF:', err);
    }
}

// Отримуємо токен одразу
getCsrfToken();

// ===== ДОПОМІЖНІ ФУНКЦІЇ =====
function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => { successDiv.style.display = 'none'; }, 3000);
    }
}

// ===== РЕЄСТРАЦІЯ =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value
        };

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            // Оновлюємо CSRF токен
            if (result.csrfToken) {
                csrfToken = result.csrfToken;
            }

            if (response.ok) {
                showSuccess('Реєстрація успішна! Перенаправлення...');
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            } else {
                const msg = result.error || (result.errors && result.errors[0]?.msg) || 'Помилка';
                showError(msg);
                // Якщо помилка CSRF - отримуємо новий токен
                if (response.status === 403) {
                    await getCsrfToken();
                }
            }
        } catch (err) {
            showError('Помилка з\'єднання з сервером');
        }
    });
}

// ===== ЛОГІН =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.csrfToken) {
                csrfToken = result.csrfToken;
            }

            if (response.ok) {
                window.location.href = 'dashboard.html';
            } else {
                showError(result.error || 'Невірний email або пароль');
                if (response.status === 403) {
                    await getCsrfToken();
                }
            }
        } catch (err) {
            showError('Помилка з\'єднання з сервером');
        }
    });
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const response = await fetch('/auth/status');
        const result = await response.json();

        if (!result.authenticated) {
            window.location.href = 'login.html';
            return;
        }

        if (result.csrfToken) {
            csrfToken = result.csrfToken;
        }

        document.getElementById('userName').textContent = result.user.name;
        document.getElementById('userEmail').textContent = result.user.email;
        document.getElementById('userRole').textContent = result.user.role;

        if (result.user.role === 'coordinator') {
            document.getElementById('balanceTab').style.display = 'inline-block';
        }

        if (result.user.role === 'solar_engineer' || result.user.role === 'coordinator') {
            loadSolarData();
        }
        if (result.user.role === 'wind_engineer' || result.user.role === 'coordinator') {
            loadWindData();
        }

    } catch (err) {
        showError('Помилка завантаження даних');
    }
}

async function loadSolarData() {
    const el = document.getElementById('solarData');
    if (!el) return;
    
    try {
        const response = await fetch('/api/v1/solar/generation');
        const result = await response.json();
        
        el.textContent = response.ok 
            ? JSON.stringify(result, null, 2) 
            : '❌ ' + (result.error || 'Доступ заборонено');
    } catch (err) {
        el.textContent = 'Помилка завантаження';
    }
}

async function loadWindData() {
    const el = document.getElementById('windData');
    if (!el) return;
    
    try {
        const response = await fetch('/api/v1/wind/generation');
        const result = await response.json();
        
        el.textContent = response.ok 
            ? JSON.stringify(result, null, 2) 
            : '❌ ' + (result.error || 'Доступ заборонено');
    } catch (err) {
        el.textContent = 'Помилка завантаження';
    }
}

async function adjustBalance() {
    const source = document.getElementById('balanceSource').value;
    const adjustment = document.getElementById('balanceAdjustment').value;
    const reason = document.getElementById('balanceReason').value;
    const resultEl = document.getElementById('balanceResult');

    if (!adjustment || !reason) {
        resultEl.textContent = '❌ Заповніть всі поля';
        return;
    }

    try {
        const response = await fetch('/api/v1/balance/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: source,
                adjustment: parseFloat(adjustment),
                reason: reason
            })
        });

        const result = await response.json();
        resultEl.textContent = JSON.stringify(result, null, 2);
    } catch (err) {
        resultEl.textContent = 'Помилка виконання';
    }
}

function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById('solarSection').style.display = 'none';
    document.getElementById('windSection').style.display = 'none';
    document.getElementById('balanceSection').style.display = 'none';

    if (tab === 'solar') {
        document.querySelector('[data-tab="solar"]').classList.add('active');
        document.getElementById('solarSection').style.display = 'block';
        loadSolarData();
    } else if (tab === 'wind') {
        document.querySelector('[data-tab="wind"]').classList.add('active');
        document.getElementById('windSection').style.display = 'block';
        loadWindData();
    } else if (tab === 'balance') {
        document.querySelector('[data-tab="balance"]').classList.add('active');
        document.getElementById('balanceSection').style.display = 'block';
    }
}

async function logout() {
    try {
        await fetch('/auth/logout', { 
            method: 'POST',
            headers: { 'X-CSRF-Token': csrfToken }
        });
    } catch (err) {}
    window.location.href = 'login.html';
}

// ===== ПРИВ'ЯЗКА ПОДІЙ =====
if (window.location.pathname.includes('dashboard')) {
    loadDashboard();
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            showTab(this.dataset.tab);
        });
    });
    
    document.getElementById('refreshSolarBtn')?.addEventListener('click', loadSolarData);
    document.getElementById('refreshWindBtn')?.addEventListener('click', loadWindData);
    document.getElementById('applyBalanceBtn')?.addEventListener('click', adjustBalance);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}