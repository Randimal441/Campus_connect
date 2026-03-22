const Events = require('../models/EventsModel');
const ParticipationApplication = require('../models/ParticipationApplicationModel');

const ALLOWED_PARTICIPATION_OPTIONS = [
  'audition_singing',
  'audition_dancing',
  'announcing',
  'sponsorship',
  'organizing_committee',
];
const ALLOWED_APPLICATION_STATUSES = ['approved', 'rejected'];
const EMAIL_HAS_AT_REGEX = /^[^\s@]+@[^\s@]+$/;

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

const normalizeSubmittedAnswers = (rawAnswers) => (
  Array.isArray(rawAnswers)
    ? rawAnswers.map((answer) => ({
        questionKey: sanitizeApplicationField(answer?.questionKey),
        label: sanitizeApplicationField(answer?.label),
        answer: sanitizeApplicationField(answer?.answer),
      }))
    : []
);

const validateApplicationPayload = (application, formQuestions) => {
  const submittedAnswers = normalizeSubmittedAnswers(application?.answers);

  if (formQuestions.length > 0) {
    const answersMap = new Map(
      submittedAnswers.map((entry) => [entry.questionKey, entry.answer])
    );

    const missingRequired = formQuestions.some(
      (question) => question.required && !sanitizeApplicationField(answersMap.get(question.key))
    );

    if (missingRequired) {
      throw new Error('Please complete all required questions in the application form.');
    }
  } else {
    const fullName = sanitizeApplicationField(application?.fullName);
    const email = sanitizeApplicationField(application?.email);
    const phone = sanitizeApplicationField(application?.phone);
    const notes = sanitizeApplicationField(application?.notes);

    if (!fullName || !email || !phone || !notes) {
      throw new Error('Please complete the participation application form.');
    }

    if (!EMAIL_HAS_AT_REGEX.test(email)) {
      throw new Error('Email address must include @.');
    }
  }

  const fullName = sanitizeApplicationField(application?.fullName);
  const email = sanitizeApplicationField(application?.email);
  const phone = sanitizeApplicationField(application?.phone);
  const notes = sanitizeApplicationField(application?.notes);

  return {
    fullName,
    email,
    phone,
    notes,
    answers: submittedAnswers.filter(
      (entry) => entry.questionKey && entry.label && entry.answer
    ),
  };
};

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
        reviewedAt: application.reviewedAt,
        reviewedBy: application.reviewedBy,
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

    const validatedApplication = validateApplicationPayload(application, formQuestions);

    const created = await ParticipationApplication.create({
      event: item._id,
      student: req.user._id,
      option,
      application: validatedApplication,
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
      applicationId: created._id,
      option,
      status: 'pending',
      application: created.application,
    });
  } catch (error) {
    if (error.message?.includes('Please complete') || error.message?.includes('must include @')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// Get logged-in student's participation applications across events
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await ParticipationApplication.find({
      student: req.user._id,
    })
      .select('event option status application createdAt reviewedAt')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = applications.map((entry) => ({
      id: entry._id,
      eventId: entry.event,
      option: entry.option,
      status: entry.status,
      application: entry.application,
      appliedAt: entry.createdAt,
      reviewedAt: entry.reviewedAt,
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

// Update participation application status by admin roles
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id: eventId, applicationId } = req.params;
    const nextStatus = String(req.body?.status || '').trim().toLowerCase();

    if (!ALLOWED_APPLICATION_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        message: 'Invalid status. Allowed statuses are approved or rejected.',
      });
    }

    const application = await ParticipationApplication.findById(applicationId)
      .populate('student', 'fullName email idNumber')
      .lean();

    if (!application || String(application.event) !== String(eventId)) {
      return res.status(404).json({ message: 'Application not found for this event.' });
    }

    const updated = await ParticipationApplication.findByIdAndUpdate(
      applicationId,
      {
        status: nextStatus,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    )
      .populate('student', 'fullName email idNumber')
      .lean();

    res.json({
      message: `Application ${nextStatus} successfully.`,
      application: {
        _id: updated._id,
        event: updated.event,
        student: updated.student,
        option: updated.option,
        application: updated.application,
        status: updated.status,
        appliedAt: updated.createdAt,
        reviewedAt: updated.reviewedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateOwnParticipationApplication = async (req, res, next) => {
  try {
    const { id: eventId, applicationId } = req.params;
    const item = await Events.findById(eventId);
    if (!item) return res.status(404).json({ message: 'Event not found.' });

    const participationApplication = await ParticipationApplication.findOne({
      _id: applicationId,
      event: eventId,
      student: req.user._id,
    });

    if (!participationApplication) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (participationApplication.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending applications can be updated.' });
    }

    const participationForm = (item.participationForms || []).find(
      (form) => form.option === participationApplication.option
    );
    const formQuestions = Array.isArray(participationForm?.questions)
      ? participationForm.questions
      : [];

    const validatedApplication = validateApplicationPayload(req.body?.application, formQuestions);

    participationApplication.application = validatedApplication;
    await participationApplication.save();

    return res.json({
      message: 'Application updated successfully.',
      eventId,
      applicationId: participationApplication._id,
      option: participationApplication.option,
      status: participationApplication.status,
      application: participationApplication.application,
    });
  } catch (error) {
    if (error.message?.includes('Please complete') || error.message?.includes('must include @')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const removeOwnParticipationApplication = async (req, res, next) => {
  try {
    const { id: eventId, applicationId } = req.params;

    const participationApplication = await ParticipationApplication.findOne({
      _id: applicationId,
      event: eventId,
      student: req.user._id,
    });

    if (!participationApplication) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (participationApplication.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending applications can be removed.' });
    }

    await ParticipationApplication.deleteOne({ _id: participationApplication._id });

    return res.json({
      message: 'Application removed successfully.',
      eventId,
      applicationId,
      option: participationApplication.option,
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
  getMyApplications,
  updateOwnParticipationApplication,
  removeOwnParticipationApplication,
  updateApplicationStatus,
};