const mongoose = require('mongoose');

const consultingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    consultant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['available', 'booked', 'completed'], default: 'available' },
    scheduledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consulting', consultingSchema);
