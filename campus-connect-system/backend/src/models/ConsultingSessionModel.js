const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime:   { type: String, required: true }, // e.g. "09:30"
  isBooked:  { type: Boolean, default: false },
  bookedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Booking details filled when student books
  booking: {
    type:{
    studentName:       { type: String },
    academicYear:      { type: String }, // e.g. "Year 2", "3rd Year"
    emergencyContact:  { type: String }, // nearest relative/friend phone number
    mentalStatusAnswers: [
      {
        question: { type: String },
        answer:   { type: String }, // "Never" | "Sometimes" | "Often" | "Always"
      },
    ],
    riskLevel:     { type: String, enum: ['low', 'medium', 'high'], default: null },
    riskSummary:   { type: String }, // AI-generated explanation
    bookedAt:      { type: Date, default: Date.now },
  },
  default: undefined,
}
});



const consultingSessionSchema = new mongoose.Schema(
  {
    counselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    counselorName: { type: String, required: true }, // denormalized for easier access
    day:       { type: String, required: true }, // e.g. "2025-08-15" (ISO date string)
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime:   { type: String, required: true }, // e.g. "12:00"
    place:     { type: String, required: true },
    slots:     [slotSchema],
  },
  { timestamps: true }
);

function generateSlots(startTime, endTime) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM]     = endTime.split(':').map(Number);

  let current = startH * 60 + startM;
  const end   = endH * 60 + endM;

  while (current + 30 <= end) {
    const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    const slotEnd   = `${String(Math.floor((current + 30) / 60)).padStart(2, '0')}:${String((current + 30) % 60).padStart(2, '0')}`;
    slots.push({ startTime: slotStart, endTime: slotEnd, isBooked: false, bookedBy: null });
    current += 30;
  }

  return slots;
}

consultingSessionSchema.statics.generateSlots = generateSlots;

module.exports = mongoose.model('ConsultingSession', consultingSessionSchema);
