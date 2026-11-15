const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect('/api/auth');
  }

  next();
};

const requireApiAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      message: 'Please log in.',
    });
  }

  next();
};

module.exports = { requireAuth, requireApiAuth };