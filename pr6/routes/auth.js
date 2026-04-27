const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// генерація нового CSRF токена
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// реєстрація
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Невірний формат email'),
  body('password').isLength({ min: 8 }).withMessage('Пароль має бути не менше 8 символів'),
  body('name').trim().isLength({ min: 2 }).escape().withMessage('Ім\'я має бути не менше 2 символів'),
  body('role').isIn(['solar_engineer', 'wind_engineer', 'coordinator']).withMessage('Невірна роль')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, name, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Користувач з таким email вже існує' });
    }

    const user = await User.create({ email, password, name, role });

    // оновлюємо CSRF токен після реєстрації
    req.session.csrfToken = generateCsrfToken();

    res.status(201).json({
      message: 'Реєстрація успішна',
      csrfToken: req.session.csrfToken,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Помилка реєстрації:', err);
    res.status(500).json({ error: 'Помилка сервера при реєстрації' });
  }
});

// логін
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: 'Помилка сервера' });
    if (!user) return res.status(401).json({ error: info.message || 'Невірний email або пароль' });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Помилка входу' });

      // оновлюємо CSRF токен після входу
      req.session.csrfToken = generateCsrfToken();

      return res.json({
        message: 'Вхід успішний',
        csrfToken: req.session.csrfToken,
        user: { id: user._id, email: user.email, name: user.name, role: user.role }
      });
    });
  })(req, res, next);
});

// логаут
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Помилка виходу' });
    req.session.destroy(() => {
      res.json({ message: 'Вихід успішний' });
    });
  });
});

// перевірка статусу
router.get('/status', isAuthenticated, (req, res) => {
  // оновлюємо CSRF токен
  req.session.csrfToken = generateCsrfToken();

  res.json({
    authenticated: true,
    csrfToken: req.session.csrfToken,
    user: { id: req.user._id, email: req.user.email, name: req.user.name, role: req.user.role }
  });
});

module.exports = router;