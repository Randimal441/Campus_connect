const mongoose = require('mongoose');

const participationOptionEnum = [
  'audition_singing',
  'audition_dancing',
  'announcing',
  'sponsorship',
  'organizing_committee',
];

const answerSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true },
    label: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const participationApplicationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Events', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    option: { type: String, enum: participationOptionEnum, required: true, index: true },
    application: {
      fullName: { type: String, default: '' },
      studentId: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      notes: { type: String, default: '' },
      answers: { type: [answerSchema], default: [] },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

participationApplicationSchema.index(
  { event: 1, student: 1, option: 1 },
  { unique: true }
);

module.exports = mongoose.model('ParticipationApplication', participationApplicationSchema);
