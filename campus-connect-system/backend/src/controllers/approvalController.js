const { User } = require('../models/UserModel');

const getPendingUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isApproved: false })
      .select('fullName idNumber email role createdAt')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.isApproved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.json({ message: 'User approved successfully.', user: { id: user._id, email: user.email } });
  } catch (error) {
    next(error);
  }
};

const rejectUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User rejected and removed.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPendingUsers, approveUser, rejectUser };
