const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false, timestamps: true }
);

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    subject: { type: String, default: 'General', trim: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratings: [ratingSchema],
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    reports: [reportSchema],
    downloadCount: { type: Number, default: 0 },
    aiSummary: { type: String, default: null },
  },
  { timestamps: true }
);

// Recalculate average rating helper
studyMaterialSchema.methods.recalcRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, r) => acc + r.value, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
};

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
