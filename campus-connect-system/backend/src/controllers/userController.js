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
    const { fullName, idNumber } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (idNumber) updates.idNumber = idNumber;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
