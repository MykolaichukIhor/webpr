const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const crypto = require('crypto');

// ===== ОТРИМАННЯ СЕКРЕТУ (для тестування) =====
let testSecret = 'my-test-secret-key-2024';

// ===== ГЕНЕРАЦІЯ HMAC ПІДПИСУ =====
router.post('/generate-signature', (req, res) => {
  try {
    const { payload, secret } = req.body;
    
    if (!payload || !secret) {
      return res.status(400).json({ 
        error: 'Потрібні payload і secret у тілі запиту' 
      });
    }
    
    // переконуємось, що payload - це рядок
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // створюємо HMAC
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadStr);
    const signature = hmac.digest('hex');
    
    console.log('=== Згенеровано підпис ===');
    console.log('Secret:', secret);
    console.log('Payload:', payloadStr);
    console.log('Signature:', signature);
    
    res.json({
      success: true,
      secret: secret,
      payload: payloadStr,
      signature: signature,
      curl_example: `curl -X POST http://localhost:3000/webhooks/verify -H "Content-Type: application/json" -H "x-webhook-signature: ${signature}" -H "x-webhook-secret: ${secret}" -d '${payloadStr}'`
    });
  } catch (err) {
    console.error('Помилка генерації:', err);
    res.status(500).json({ error: 'Помилка генерації підпису: ' + err.message });
  }
});

// ===== ПЕРЕВІРКА HMAC ПІДПИСУ =====
router.post('/verify', (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const secret = req.headers['x-webhook-secret'] || testSecret;
    
    // отримуємо RAW body як рядок
    const payload = JSON.stringify(req.body);
    
    console.log('=== Перевірка HMAC ===');
    console.log('Отриманий підпис:', signature);
    console.log('Секрет:', secret);
    console.log('Payload рядок:', payload);
    console.log('Payload обʼєкт:', req.body);
    
    // генеруємо очікуваний підпис
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    console.log('Очікуваний підпис:', expectedSignature);
    console.log('Співпадає:', signature === expectedSignature);
    
    if (!signature) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Відсутній заголовок x-webhook-signature',
        help: 'Додайте заголовок x-webhook-signature з HMAC підписом'
      });
    }
    
    if (signature === expectedSignature) {
      res.json({ 
        valid: true, 
        message: '✅ Підпис валідний! Дані достовірні.',
        signature: expectedSignature,
        data: req.body
      });
    } else {
      res.status(401).json({ 
        valid: false, 
        message: '❌ Невірний підпис! Дані могли бути змінені.',
        received_signature: signature,
        expected_signature: expectedSignature,
        hint: 'Перевірте секретний ключ та правильність даних'
      });
    }
  } catch (err) {
    console.error('Помилка верифікації:', err);
    res.status(500).json({ error: 'Помилка перевірки підпису: ' + err.message });
  }
});

// ===== ТЕСТОВИЙ ВЕБХУК (просто логує) =====
router.post('/test', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  console.log('=== 📨 ОТРИМАНО ВЕБХУК ===');
  console.log('Час:', new Date().toISOString());
  console.log('Заголовки:', JSON.stringify(req.headers, null, 2));
  console.log('Тіло:', JSON.stringify(req.body, null, 2));
  console.log('Підпис:', signature || 'відсутній');
  
  res.json({
    success: true,
    message: '✅ Вебхук отримано успішно',
    received_data: req.body,
    signature: signature,
    timestamp: new Date().toISOString()
  });
});

// ===== ЗМІНА ТЕСТОВОГО СЕКРЕТУ =====
router.post('/set-secret', (req, res) => {
  const { secret } = req.body;
  if (!secret) {
    return res.status(400).json({ error: 'Вкажіть secret' });
  }
  testSecret = secret;
  console.log('Секрет змінено на:', secret);
  res.json({ message: 'Секрет оновлено', secret: secret });
});

// ===== ОТРИМАННЯ ПОТОЧНОГО СЕКРЕТУ =====
router.get('/get-secret', (req, res) => {
  res.json({ secret: testSecret });
});

// ===== РЕЄСТРАЦІЯ ВЕБХУКА (потрібна авторизація) =====
router.post('/register', isAuthenticated, async (req, res) => {
  try {
    const { url, events } = req.body;
    
    if (!url || !url.startsWith('https://')) {
      return res.status(400).json({ error: 'URL має починатися з https://' });
    }
    
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    
    const webhook = {
      userId: req.user._id,
      url: url,
      events: events || ['generation.update'],
      secret: webhookSecret,
      createdAt: new Date(),
      active: true
    };
    
    console.log('✅ Зареєстровано вебхук:', {
      url: webhook.url,
      events: webhook.events,
      secret: webhookSecret
    });
    
    res.status(201).json({
      message: 'Вебхук успішно зареєстровано',
      webhook: {
        url: webhook.url,
        events: webhook.events,
        secret: webhookSecret
      }
    });
  } catch (err) {
    console.error('Помилка реєстрації вебхука:', err);
    res.status(500).json({ error: 'Помилка реєстрації вебхука' });
  }
});

module.exports = router;