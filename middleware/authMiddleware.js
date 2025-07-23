const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  // let token = req.headers.authorization;

  // if (!token || !token.startsWith('Bearer ')) {
  //   return res.status(401).json({ message: 'Not authorized, token missing' });
  // }

  // token = token.split(' ')[1];

  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied, admin only' });
  }
  next();
};
