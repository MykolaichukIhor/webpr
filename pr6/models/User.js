const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email обов\'язковий'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Пароль обов\'язковий'],
    minlength: [8, 'Пароль має бути не менше 8 символів']
  },
  name: {
    type: String,
    required: [true, 'Ім\'я обов\'язкове'],
    trim: true
  },
  role: {
    type: String,
    enum: ['solar_engineer', 'wind_engineer', 'coordinator'],
    required: [true, 'Роль обов\'язкова']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// хешування паролю перед збереженням
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);