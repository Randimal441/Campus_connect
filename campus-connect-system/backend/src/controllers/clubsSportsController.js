const ClubsSports = require('../models/ClubsSportsModel');

const getAll = async (req, res, next) => {
  try {
    const items = await ClubsSports.find({ isActive: true })
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    const item = await ClubsSports.create({
      title,
      description: description || '',
      category: category || 'club',
      createdBy: req.user._id,
    });

    const populated = await ClubsSports.findById(item._id).populate(
      'createdBy',
      'fullName email'
    );
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const item = await ClubsSports.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email');

    if (!item) return res.status(404).json({ message: 'Not found.' });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const item = await ClubsSports.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Not found.' });
    res.json({ message: 'Removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
