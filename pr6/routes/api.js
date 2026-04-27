const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');


const balanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Забагато спроб балансування. Спробуйте пізніше.'
  }
});



// ===== ОТРИМАННЯ ДАНИХ СОНЯЧНОЇ ГЕНЕРАЦІЇ =====
router.get('/v1/solar/generation', isAuthenticated, hasRole('solar_engineer', 'coordinator'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'solar_engineer') {
      query.engineerId = req.user._id;
    }

    const data = [];
    
    res.json({
      source: 'solar',
      count: data.length,
      data: data
    });
  } catch (err) {
    console.error('Помилка отримання даних:', err);
    res.status(500).json({ error: 'Помилка отримання даних сонячної генерації' });
  }
});

// ===== ОТРИМАННЯ ДАНИХ ВІТРОВОЇ ГЕНЕРАЦІЇ =====
router.get('/v1/wind/generation', isAuthenticated, hasRole('wind_engineer', 'coordinator'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'wind_engineer') {
      query.engineerId = req.user._id;
    }
    
    
    const data = [];
    
    res.json({
      source: 'wind',
      count: data.length,
      data: data
    });
  } catch (err) {
    console.error('Помилка отримання даних:', err);
    res.status(500).json({ error: 'Помилка отримання даних вітрової генерації' });
  }
});

// ===== БАЛАНСУВАННЯ ГЕНЕРАЦІЇ (тільки для coordinator) =====
router.post('/v1/balance/adjust', [
  body('source')
    .isIn(['solar', 'wind'])
    .withMessage('Джерело має бути solar або wind'),
  body('adjustment')
    .isFloat({ min: -1000, max: 1000 })
    .withMessage('Коригування має бути в межах -1000 до 1000 МВт'),
  body('reason')
    .trim()
    .isLength({ min: 5 })
    .escape()
    .withMessage('Вкажіть причину коригування (мін. 5 символів)')
], isAuthenticated, hasRole('coordinator'), balanceLimiter, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { source, adjustment, reason } = req.body;
    
    const balanceResult = {
      action: 'adjustment',
      source: source,
      adjustment: adjustment,
      reason: reason,
      coordinator: req.user.email,
      timestamp: new Date(),
      status: 'applied'
    };
    
    res.json({
      message: 'Балансування успішно застосовано',
      result: balanceResult
    });
  } catch (err) {
    console.error('Помилка балансування:', err);
    res.status(500).json({ error: 'Помилка виконання балансування' });
  }
});

module.exports = router;