const mongoose = require('mongoose');

const participationOptionEnum = [
  'audition_singing',
  'audition_dancing',
  'announcing',
  'sponsorship',
  'organizing_committee',
];

const participationQuestionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const participationFormSchema = new mongoose.Schema(
  {
    option: { type: String, enum: participationOptionEnum, required: true },
    questions: { type: [participationQuestionSchema], default: [] },
  },
  { _id: false }
);

const eventsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    eventType: {
      type: String,
      enum: [
        'event',
        'chill_session',
        'club_event',
        'competition',
        'workshop',
        'conference',
        'cultural_event',
        'exhibition',
      ],
      required: true,
    },
    date: { type: Date, required: true },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    image: { type: String, default: '' },
    participationOptions: [{ type: String, enum: participationOptionEnum }],
    participationForms: { type: [participationFormSchema], default: [] },
    participationApplications: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        option: { type: String, enum: participationOptionEnum, required: true },
        application: {
          fullName: { type: String, default: '' },
          email: { type: String, default: '' },
          phone: { type: String, default: '' },
          notes: { type: String, default: '' },
          answers: {
            type: [
              {
                questionKey: { type: String, required: true },
                label: { type: String, required: true },
                answer: { type: String, required: true },
              },
            ],
            default: [],
          },
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
