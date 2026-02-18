const Consulting = require('../models/ConsultingModel');

const getAll = async (req, res, next) => {
  try {
    const items = await Consulting.find()
      .populate('consultant', 'fullName email')
      .populate('bookedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const item = await Consulting.create({
      title,
      description: description || '',
      consultant: req.user._id,
    });

    const populated = await Consulting.findById(item._id).populate(
      'consultant',
      'fullName email'
    );
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const bookSession = async (req, res, next) => {
  try {
    const item = await Consulting.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });
    if (item.status !== 'available') {
      return res.status(400).json({ message: 'Session not available.' });
    }

    item.bookedBy = req.user._id;
    item.status = 'booked';
    item.scheduledAt = req.body.scheduledAt || new Date();
    await item.save();

    const populated = await Consulting.findById(item._id)
      .populate('consultant', 'fullName email')
      .populate('bookedBy', 'fullName email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const item = await Consulting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('consultant', 'fullName email')
      .populate('bookedBy', 'fullName email');

    if (!item) return res.status(404).json({ message: 'Not found.' });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const item = await Consulting.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });
    res.json({ message: 'Removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, bookSession, update, remove };
