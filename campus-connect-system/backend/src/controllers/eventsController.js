const Events = require('../models/EventsModel');

const getAll = async (req, res, next) => {
  try {
    const items = await Events.find({ isActive: true })
      .populate('createdBy', 'fullName email')
      .sort({ date: 1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { title, description, eventType, date, location } = req.body;
    const item = await Events.create({
      title,
      description: description || '',
      eventType: eventType || 'event',
      date: date || new Date(),
      location: location || '',
      createdBy: req.user._id,
    });

    const populated = await Events.findById(item._id).populate(
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
    const item = await Events.findByIdAndUpdate(
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
    const item = await Events.findByIdAndUpdate(
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

const attendEvent = async (req, res, next) => {
  try {
    const item = await Events.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });
    if (!item.attendees.includes(req.user._id)) {
      item.attendees.push(req.user._id);
      await item.save();
    }

    const populated = await Events.findById(item._id)
      .populate('createdBy', 'fullName email')
      .populate('attendees', 'fullName email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove, attendEvent };
