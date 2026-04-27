const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User');

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // шукаємо користувача
    const user = await User.findOne({ email });
    
    if (!user) {
      return done(null, false, { message: 'Невірний email або пароль' });
    }
    
    // перевіряємо пароль
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return done(null, false, { message: 'Невірний email або пароль' });
    }
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// зберігаємо ID користувача в сесії
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// отримуємо користувача з сесії
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;