const Events = require('../models/EventsModel');
const ParticipationApplication = require('../models/ParticipationApplicationModel');

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

const normalizeParticipationForms = (value, selectedOptions = []) => {
  if (!value) return [];

  let rawForms = [];

  if (Array.isArray(value)) {
    rawForms = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      rawForms = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  } else {
    rawForms = [value];
  }

  const optionFilter = Array.isArray(selectedOptions) && selectedOptions.length > 0
    ? new Set(selectedOptions)
    : null;

  const result = [];

  rawForms.forEach((form, formIndex) => {
    const option = sanitizeApplicationField(form?.option);
    if (!ALLOWED_PARTICIPATION_OPTIONS.includes(option)) return;
    if (optionFilter && !optionFilter.has(option)) return;

    const rawQuestions = Array.isArray(form?.questions) ? form.questions : [];
    const normalizedQuestions = rawQuestions
      .map((question, questionIndex) => {
        const label = sanitizeApplicationField(question?.label);
        if (!label) return null;

        const keySource = sanitizeApplicationField(question?.key) || `q_${questionIndex + 1}`;
        const key = keySource.toLowerCase().replace(/[^a-z0-9_]+/g, '_');

        return {
          key: key || `q_${questionIndex + 1}`,
          label,
          required: question?.required !== false,
        };
      })
      .filter(Boolean);

    result.push({
      option,
      questions: normalizedQuestions,
      _position: formIndex,
    });
  });

  // Keep only the latest form per option if duplicates are submitted.
  const deduped = [...new Map(result.map((form) => [form.option, form])).values()];
  return deduped
    .sort((a, b) => a._position - b._position)
    .map(({ _position, ...form }) => form);
};

// Get all active events
const getAll = async (req, res, next) => {
  try {
    const items = await Events.find({ isActive: true })
      .populate('createdBy', 'fullName email')
      .sort({ date: 1 })
      .lean();

    const eventIds = items.map((item) => item._id);

    const applications = await ParticipationApplication.find({
      event: { $in: eventIds },
    })
      .populate('student', 'fullName email idNumber')
      .sort({ createdAt: -1 })
      .lean();

    const groupedApplications = applications.reduce((acc, application) => {
      const eventId = String(application.event);
      if (!acc[eventId]) acc[eventId] = [];

      acc[eventId].push({
        _id: application._id,
        student: application.student,
        option: application.option,
        application: application.application,
        appliedAt: application.createdAt,
        status: application.status,
      });

      return acc;
    }, {});

    const enrichedItems = items.map((item) => ({
      ...item,
      participationApplications: groupedApplications[String(item._id)] || [],
    }));

    res.json(enrichedItems);
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
      .select('-participationApplications')
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
    const {
      title,
      description,
      eventType,
      date,
      time,
      location,
      image,
      participationOptions,
      participationForms,
    } = req.body;

    const imagePath = req.file ? `/uploads/events/${req.file.filename}` : image || '';
    const normalizedParticipationOptions = normalizeParticipationOptions(participationOptions);

    const item = await Events.create({
      title,
      description: description || '',
      eventType: eventType || 'event',
      date: date || new Date(),
      time: time || '',
      location: location || '',
      image: imagePath,
      participationOptions: normalizedParticipationOptions,
      participationForms: normalizeParticipationForms(
        participationForms,
        normalizedParticipationOptions
      ),
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
    const item = await Events.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });

    const updateData = { ...req.body };

    if ('title' in updateData) item.title = updateData.title;
    if ('description' in updateData) item.description = updateData.description || '';
    if ('eventType' in updateData) item.eventType = updateData.eventType || 'event';
    if ('date' in updateData) item.date = updateData.date || item.date;
    if ('time' in updateData) item.time = updateData.time || '';
    if ('location' in updateData) item.location = updateData.location || '';
    if ('image' in updateData && !req.file) item.image = updateData.image || '';

    if (req.file) {
      item.image = `/uploads/events/${req.file.filename}`;
    }

    if ('participationOptions' in updateData) {
      item.participationOptions = normalizeParticipationOptions(
        updateData.participationOptions
      );
    }

    if ('participationForms' in updateData) {
      item.participationForms = normalizeParticipationForms(
        updateData.participationForms,
        item.participationOptions
      );
    } else {
      item.participationForms = (item.participationForms || []).filter((form) =>
        item.participationOptions.includes(form.option)
      );
    }

    await item.save();

    const populated = await Events.findById(item._id).populate('createdBy', 'fullName email');
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// Remove event (hard delete)
const remove = async (req, res, next) => {
  try {
    const item = await Events.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });

    await ParticipationApplication.deleteMany({ event: req.params.id });
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

    const item = await Events.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found.' });

    if (!item.isActive) {
      return res.status(400).json({ message: 'This event is not active.' });
    }

    if (!item.participationOptions.includes(option)) {
      return res.status(400).json({ message: 'This option is not available for the selected event.' });
    }

    const participationForm = (item.participationForms || []).find(
      (form) => form.option === option
    );
    const formQuestions = Array.isArray(participationForm?.questions)
      ? participationForm.questions
      : [];

    const alreadyApplied = await ParticipationApplication.findOne({
      event: item._id,
      student: req.user._id,
      option,
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this role.' });
    }

    const submittedAnswers = Array.isArray(application?.answers)
      ? application.answers.map((answer) => ({
          questionKey: sanitizeApplicationField(answer?.questionKey),
          label: sanitizeApplicationField(answer?.label),
          answer: sanitizeApplicationField(answer?.answer),
        }))
      : [];

    if (formQuestions.length > 0) {
      const answersMap = new Map(
        submittedAnswers.map((entry) => [entry.questionKey, entry.answer])
      );

      const missingRequired = formQuestions.some(
        (question) => question.required && !sanitizeApplicationField(answersMap.get(question.key))
      );

      if (missingRequired) {
        return res.status(400).json({
          message: 'Please complete all required questions in the application form.',
        });
      }
    } else {
      const fullName = sanitizeApplicationField(application?.fullName);
      const email = sanitizeApplicationField(application?.email);
      const phone = sanitizeApplicationField(application?.phone);
      const notes = sanitizeApplicationField(application?.notes);

      if (!fullName || !email || !phone || !notes) {
        return res.status(400).json({
          message: 'Please complete the participation application form.',
        });
      }
    }

    const fullName = sanitizeApplicationField(application?.fullName);
    const email = sanitizeApplicationField(application?.email);
    const phone = sanitizeApplicationField(application?.phone);
    const notes = sanitizeApplicationField(application?.notes);

    await ParticipationApplication.create({
      event: item._id,
      student: req.user._id,
      option,
      application: {
        fullName,
        email,
        phone,
        notes,
        answers: submittedAnswers.filter(
          (entry) => entry.questionKey && entry.label && entry.answer
        ),
      },
    });

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