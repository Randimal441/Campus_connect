module.exports = {
  secret: process.env.JWT_SECRET || 'campus-connect-dev-secret',
  expiresIn: '7d',
};
