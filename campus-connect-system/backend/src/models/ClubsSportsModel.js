const mongoose = require('mongoose');

const clubsSportsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['club', 'sport'], required: true },
    sportType: { type: String, default: '' },          // e.g. Football, Chess, Photography
    coachInfo: { type: String, default: '' },           // free-text coach bio / contact
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'disabled'],
      default: 'pending_approval',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },         // soft-delete
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClubsSports', clubsSportsSchema);
