const mongoose = require('mongoose');

const participationOptionEnum = [
  'audition_singing',
  'audition_dancing',
  'announcing',
  'sponsorship',
  'organizing_committee',
];

const eventsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    eventType: { type: String, enum: ['event', 'chill_session'], required: true },
    date: { type: Date, required: true },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    image: { type: String, default: '' },
    participationOptions: [{ type: String, enum: participationOptionEnum }],
    participationApplications: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        option: { type: String, enum: participationOptionEnum, required: true },
        application: {
          fullName: { type: String, required: true },
          email: { type: String, required: true },
          phone: { type: String, required: true },
          notes: { type: String, required: true },
        },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Events', eventsSchema);
