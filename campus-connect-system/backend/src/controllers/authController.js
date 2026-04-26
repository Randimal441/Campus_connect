const { User, ROLES } = require('../models/UserModel');
const { generateToken } = require('../utils/generateToken');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const signup = async (req, res, next) => {
  try {
    const { fullName, idNumber, email, password, role } = req.body;
    const normalizedFullName = fullName?.trim();
    const normalizedIdNumber = idNumber?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = role?.trim();

    if (!normalizedFullName || !normalizedIdNumber || !normalizedEmail || !password || !normalizedRole) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.',
      });
    }

    if (!ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Student accounts can access immediately; admin/staff roles still require approval.
    const isApproved = normalizedRole === 'super_admin' || normalizedRole === 'student';
    const user = await User.create({
      fullName: normalizedFullName,
      idNumber: normalizedIdNumber,
      email: normalizedEmail,
      password,
      role: normalizedRole,
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
    const identifier = email?.trim();
    const normalizedEmail = identifier?.toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { idNumber: { $regex: `^${escapeRegex(identifier)}$`, $options: 'i' } },
      ],
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.role !== 'student' && !user.isApproved) {
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
