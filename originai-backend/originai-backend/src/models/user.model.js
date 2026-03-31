const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ['student', 'researcher', 'admin'],
      default: 'student',
    },
    institution: { type: String, trim: true },
    domain: {
      type: String,
      enum: [
        'Computer Science & AI',
        'Biotechnology',
        'Mechanical Engineering',
        'Medicine & Health',
        'Physics',
        'Chemistry',
        'Social Sciences',
        'Other',
      ],
    },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Stats
    totalAnalyses: { type: Number, default: 0 },
    averageOriginalityScore: { type: Number, default: 0 },

    // Tokens for password reset / email verify
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,

    refreshToken: { type: String, select: false },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual — analyses relationship
userSchema.virtual('analyses', {
  ref: 'Analysis',
  localField: '_id',
  foreignField: 'user',
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method — compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method — update analysis stats
userSchema.methods.updateStats = async function (newScore) {
  const total = this.totalAnalyses;
  this.averageOriginalityScore =
    (this.averageOriginalityScore * total + newScore) / (total + 1);
  this.totalAnalyses += 1;
  await this.save();
};

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
