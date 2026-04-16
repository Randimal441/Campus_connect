const mongoose = require('mongoose');
const ConsultingReview = require('../models/ConsultingReviewModel');
const ConsultingSession = require('../models/ConsultingSessionModel');
const { User } = require('../models/UserModel');

const getApprovedReviewsByConsultant = async (req, res, next) => {
  try {
    const { consultantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
      return res.status(400).json({ message: 'Invalid consultant id.' });
    }

    const reviews = await ConsultingReview.find({
      consultant: consultantId,
      status: 'approved',
    })
      .select('studentName rating text createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

const submitReview = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const { rating, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
      return res.status(400).json({ message: 'Invalid consultant id.' });
    }

    const normalizedText = String(text || '').trim();
    const normalizedRating = Number(rating);

    if (!normalizedText) {
      return res.status(400).json({ message: 'Review text is required.' });
    }

    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer from 1 to 5.' });
    }

    const consultant = await User.findOne({
      _id: consultantId,
      role: 'consultant',
      isApproved: true,
    }).select('fullName');

    if (!consultant) {
      return res.status(404).json({ message: 'Consultant not found.' });
    }

    const hasBookedWithConsultant = await ConsultingSession.exists({
      counselor: consultant._id,
      'slots.bookedBy': req.user._id,
    });

    if (!hasBookedWithConsultant) {
      return res.status(403).json({
        message: 'You can add a review only after booking at least one slot with this consultant.',
      });
    }

    const created = await ConsultingReview.create({
      consultant: consultant._id,
      consultantName: consultant.fullName,
      student: req.user._id,
      studentName: req.user.fullName || 'Student',
      rating: normalizedRating,
      text: normalizedText,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Review submitted successfully. It will appear after admin approval.',
      review: created,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewsForModeration = async (req, res, next) => {
  try {
    const { status = 'all' } = req.query;

    const query = {};
    if (status === 'pending' || status === 'approved' || status === 'rejected') {
      query.status = status;
    }

    const reviews = await ConsultingReview.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

const updateReviewStatus = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: 'Invalid review id.' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected.' });
    }

    const updated = await ConsultingReview.findByIdAndUpdate(
      reviewId,
      {
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApprovedReviewsByConsultant,
  submitReview,
  getReviewsForModeration,
  updateReviewStatus,
};