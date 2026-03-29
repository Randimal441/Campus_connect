const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['student', 'coach', 'resource_coordinator', 'consultant', 'event_coordinator', 'super_admin'];

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    idNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ROLES, required: true },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = {
  User: mongoose.model('User', userSchema),
  ROLES,
};
