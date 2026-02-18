const ResourceSharing = require('../models/ResourceSharingModel');

const getAll = async (req, res, next) => {
  try {
    const items = await ResourceSharing.find()
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { title, description, resourceType } = req.body;
    const item = await ResourceSharing.create({
      title,
      description: description || '',
      resourceType: resourceType || 'general',
      createdBy: req.user._id,
    });

    const populated = await ResourceSharing.findById(item._id).populate(
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
    const item = await ResourceSharing.findByIdAndUpdate(
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
    const item = await ResourceSharing.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });
    res.json({ message: 'Removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
