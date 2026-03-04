const Events = require('../models/EventsModel');

// Get all active events
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

// Get upcoming events
const getUpcoming = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const items = await Events.find({
      isActive: true,
      date: { $gte: startOfToday },
    })
      .populate('createdBy', 'fullName email')
      .sort({ date: 1 });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

// Create event
const create = async (req, res, next) => {
  try {
    const { title, description, eventType, date, time, location, image } = req.body;

    const imagePath = req.file ? `/uploads/events/${req.file.filename}` : image || '';

    const item = await Events.create({
      title,
      description: description || '',
      eventType: eventType || 'event',
      date: date || new Date(),
      time: time || '',
      location: location || '',
      image: imagePath,
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

// Update event
const update = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/events/${req.file.filename}`;
    }

    const item = await Events.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email');

    if (!item) return res.status(404).json({ message: 'Not found.' });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

// Remove event (hard delete)
const remove = async (req, res, next) => {
  try {
    const item = await Events.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });
    res.json({ message: 'Removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// Attend event
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

module.exports = { getAll, getUpcoming, create, update, remove, attendEvent };