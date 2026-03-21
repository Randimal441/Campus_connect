const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'ClubsSports', required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

// a user can only have one active request per club
joinRequestSchema.index({ user: 1, club: 1 }, { unique: true });

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
