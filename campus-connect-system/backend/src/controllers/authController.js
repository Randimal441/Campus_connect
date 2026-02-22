const { User, ROLES } = require('../models/UserModel');
const { generateToken } = require('../utils/generateToken');

const signup = async (req, res, next) => {
  try {
    const { fullName, idNumber, email, password, role } = req.body;

    if (!fullName || !idNumber || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const isApproved = role === 'super_admin';
    const user = await User.create({
      fullName,
      idNumber,
      email,
      password,
      role,
      isApproved,
    });

    const token = generateToken({ id: user._id, role: user.role });
    res.status(201).json({
      message: isApproved
        ? 'Signup successful. You can log in.'
        : 'Signup successful. Your account is pending approval by Super Admin.',
      token: isApproved ? token : null,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (!user.isApproved) {
      return res
        .status(403)
        .json({ message: 'Account pending approval by Super Admin.' });
    }

    const token = generateToken({ id: user._id, role: user.role });
    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
