const { User } = require('../models/UserModel');

const getProfile = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, idNumber, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (typeof fullName === 'string' && fullName.trim()) {
      user.fullName = fullName.trim();
    }

    if (typeof idNumber === 'string' && idNumber.trim()) {
      user.idNumber = idNumber.trim();
    }

    if (typeof email === 'string' && email.trim()) {
      user.email = email.trim().toLowerCase();
    }

    if (typeof password === 'string' && password.trim()) {
      if (password.trim().length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
      }
      user.password = password.trim();
    }

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      res.status(400);
      return next(new Error('Email is already in use'));
    }
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
