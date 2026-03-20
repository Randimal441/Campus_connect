const Events = require('../models/EventsModel');

const ALLOWED_PARTICIPATION_OPTIONS = [
  'audition_singing',
  'audition_dancing',
  'announcing',
  'sponsorship',
  'organizing_committee',
];

const normalizeParticipationOptions = (value) => {
  if (!value) return [];

  let rawValues = [];

  if (Array.isArray(value)) {
    rawValues = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        rawValues = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        rawValues = trimmed.split(',');
      }
    } else {
      rawValues = trimmed.split(',');
    }
  } else {
    rawValues = [value];
  }

  const unique = [...new Set(rawValues.map((item) => String(item).trim()).filter(Boolean))];
  return unique.filter((item) => ALLOWED_PARTICIPATION_OPTIONS.includes(item));
};

const sanitizeApplicationField = (value) => String(value || '').trim();

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
    const { title, description, eventType, date, time, location, image, participationOptions } = req.body;

    const imagePath = req.file ? `/uploads/events/${req.file.filename}` : image || '';

    const item = await Events.create({
      title,
      description: description || '',
      eventType: eventType || 'event',
      date: date || new Date(),
      time: time || '',
      location: location || '',
      image: imagePath,
      participationOptions: normalizeParticipationOptions(participationOptions),
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

    if ('participationOptions' in updateData) {
      updateData.participationOptions = normalizeParticipationOptions(
        updateData.participationOptions
      );
    }

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

// Apply for a specific event participation option
const applyForParticipation = async (req, res, next) => {
  try {
    const { option, application } = req.body;

    if (!ALLOWED_PARTICIPATION_OPTIONS.includes(option)) {
      return res.status(400).json({ message: 'Invalid participation option.' });
    }

    const fullName = sanitizeApplicationField(application?.fullName);
    const email = sanitizeApplicationField(application?.email);
    const phone = sanitizeApplicationField(application?.phone);
    const notes = sanitizeApplicationField(application?.notes);

    if (!fullName || !email || !phone || !notes) {
      return res.status(400).json({
        message: 'Please complete the participation application form.',
      });
    }

    const item = await Events.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });

    if (!item.isActive) {
      return res.status(400).json({ message: 'This event is not active.' });
    }

    if (!item.participationOptions.includes(option)) {
      return res.status(400).json({ message: 'This option is not available for the selected event.' });
    }

    const alreadyApplied = item.participationApplications.some(
      (entry) =>
        String(entry.student) === String(req.user._id) &&
        entry.option === option
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this role.' });
    }

    item.participationApplications.push({
      student: req.user._id,
      option,
      application: {
        fullName,
        email,
        phone,
        notes,
      },
      appliedAt: new Date(),
    });

    await item.save();

    return res.json({
      message: 'Application submitted successfully.',
      eventId: item._id,
      option,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getUpcoming,
  create,
  update,
  remove,
  attendEvent,
  applyForParticipation,
};