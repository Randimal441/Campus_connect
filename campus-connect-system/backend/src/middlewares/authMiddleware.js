const { verifyToken } = require('../utils/generateToken');
const { User } = require('../models/UserModel');

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    
    // Check query params if not in headers (useful for direct file downloads)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. No token.' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized. Invalid token.' });
  }
};

// const optionalAuth = async (req, res, next) => {
//   try {
//     let token = req.headers.authorization;
//     if (token && token.startsWith('Bearer ')) {
//       token = token.slice(7);
//     }

//     if (token) {
//       const decoded = verifyToken(token);
//       const user = await User.findById(decoded.id).select('-password');
//       if (user) {
//         req.user = user;
//       }
//     }
//     next();
//   } catch (error) {
//     // Ignore auth errors for optional auth
//     next();
//   }
// };

module.exports = { protect };
