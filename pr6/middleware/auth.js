const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Необхідна автентифікація' });
};

const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Необхідна автентифікація' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Недостатньо прав доступу',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

module.exports = { isAuthenticated, hasRole };