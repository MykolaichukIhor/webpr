const express = require('express');
const session = require('express-session');
const passport = require('./config/passport'); // імпортуємо налаштований passport
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhooks');

const app = express();

// ===== ПІДКЛЮЧЕННЯ ДО MONGODB =====
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/renewable_energy', {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('MongoDB підключено'))
.catch(err => console.error('Помилка підключення MongoDB:', err));

// ===== ВЛАСНИЙ CSRF ЗАХИСТ =====
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromSession = req.session.csrfToken;

  if (!tokenFromHeader || !tokenFromSession || tokenFromHeader !== tokenFromSession) {
    return res.status(403).json({ 
      error: 'Невірний CSRF токен. Оновіть сторінку і спробуйте знову.',
      hint: 'API та Webhooks не потребують CSRF токену'
    });
  }

  next();
}

// ===== RATE LIMITER =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Перевищено ліміт запитів. Спробуйте пізніше.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Забагато спроб. Спробуйте через 15 хвилин.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Перевищено ліміт API запитів.'
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Сесії
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ===== CSRF TOKEN ENDPOINT =====
app.get('/csrf-token', (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }
  res.json({ csrfToken: req.session.csrfToken });
});

// ===== WEBHOOKS (БЕЗ CSRF) =====
app.use('/webhooks', webhookRoutes);

// ===== API (БЕЗ CSRF, з rate limit) =====
app.use('/api', apiLimiter, apiRoutes);

// ===== AUTH (З CSRF, з rate limit) =====
app.use('/auth', authLimiter, csrfProtection, authRoutes);

// загальний ліміт
app.use('/', limiter);

// HTML сторінки
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не знайдено' });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущено: http://localhost:${PORT}`);
  console.log(`Webhooks: http://localhost:${PORT}/webhooks (без CSRF)`);
  console.log(`API: http://localhost:${PORT}/api (без CSRF)`);
  console.log(`Auth: http://localhost:${PORT}/auth (з CSRF)`);
});

module.exports = app;