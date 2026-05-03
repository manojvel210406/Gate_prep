const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  avatar: { type: String, default: null },

  // ── Onboarding ──────────────────────────────────────────────────────────
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  targetDate: { type: Date },
  dailyHoursGoal: { type: Number, default: 4 },
  currentStage: { type: Number, default: 1, min: 1, max: 6 },
  onboardingCompleted: { type: Boolean, default: false },

  // ── Gamification ────────────────────────────────────────────────────────
  xp: { type: Number, default: 0 },
  rank: {
    type: String,
    enum: ['Apprentice', 'Scholar', 'Engineer', 'Expert', 'Master', 'GATE Champion'],
    default: 'Apprentice',
  },
  achievements: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    unlockedAt: Date,
  }],

  // ── Streak ──────────────────────────────────────────────────────────────
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastStudyDate: { type: Date },

  // ── Learning DNA ────────────────────────────────────────────────────────
  learningStyle: {
    type: String,
    enum: ['visual', 'analytical', 'practice-first', 'theory-first'],
    default: 'analytical',
  },
  cognitiveState: {
    type: String,
    enum: ['fresh', 'focused', 'fatigued', 'burned-out'],
    default: 'fresh',
  },

  // ── Scores ──────────────────────────────────────────────────────────────
  healthScore: { type: Number, default: 50, min: 0, max: 100 },
  readinessScore: { type: Number, default: 0, min: 0, max: 100 },

  preferences: {
    notifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    reminderTime: { type: String, default: '08:00' },
  },

  isFinalPhase: { type: Boolean, default: false },
  finalPhaseStartDate: { type: Date },

}, { timestamps: true });

// ─── Pre-save: Hash Password ──────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

UserSchema.methods.updateXPAndRank = function (xpGained) {
  this.xp += xpGained;
  const ranks = [
    { min: 0, rank: 'Apprentice' },
    { min: 500, rank: 'Scholar' },
    { min: 1500, rank: 'Engineer' },
    { min: 3500, rank: 'Expert' },
    { min: 7000, rank: 'Master' },
    { min: 12000, rank: 'GATE Champion' },
  ];
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (this.xp >= ranks[i].min) { this.rank = ranks[i].rank; break; }
  }
};

// ─── Indexes ──────────────────────────────────────────────────────────────
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);
