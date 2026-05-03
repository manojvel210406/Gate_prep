const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },

  // ── Core Metrics ─────────────────────────────────────────────────────────
  accuracy: { type: Number, default: 0, min: 0, max: 100 },
  avgTimePerQuestion: { type: Number, default: 0 }, // seconds
  totalAttempts: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },

  // ── Mastery ───────────────────────────────────────────────────────────────
  masteryLevel: {
    type: String,
    enum: ['not-started', 'weak', 'medium', 'strong', 'mastered'],
    default: 'not-started',
  },
  masteryScore: { type: Number, default: 0, min: 0, max: 100 }, // 0-100

  // ── Retention (Forgetting Curve) ──────────────────────────────────────────
  retentionScore: { type: Number, default: 100, min: 0, max: 100 },
  lastStudied: { type: Date },
  nextRevisionDue: { type: Date },
  revisionCount: { type: Number, default: 0 },

  // ── Spaced Repetition ─────────────────────────────────────────────────────
  easeFactor: { type: Number, default: 2.5 },  // SM-2 algorithm
  interval: { type: Number, default: 1 },       // days until next review

  // ── Trend ─────────────────────────────────────────────────────────────────
  weeklyScores: [{
    week: Date,
    accuracy: Number,
    attempts: Number,
  }],

  isUnlocked: { type: Boolean, default: false },
  studyHours: { type: Number, default: 0 },

}, { timestamps: true });

// ─── Compound Indexes ─────────────────────────────────────────────────────
PerformanceSchema.index({ userId: 1, topicId: 1 }, { unique: true });
PerformanceSchema.index({ userId: 1, subjectId: 1 });
PerformanceSchema.index({ userId: 1, nextRevisionDue: 1 });

// ─── Methods ──────────────────────────────────────────────────────────────
PerformanceSchema.methods.updateMastery = function () {
  const score = this.masteryScore;
  if (score === 0) this.masteryLevel = 'not-started';
  else if (score < 40) this.masteryLevel = 'weak';
  else if (score < 70) this.masteryLevel = 'medium';
  else if (score < 90) this.masteryLevel = 'strong';
  else this.masteryLevel = 'mastered';
};

// SM-2 Spaced Repetition Algorithm
PerformanceSchema.methods.updateSM2 = function (quality) {
  // quality: 0-5 (5=perfect, 3=correct with effort, 0-2=incorrect)
  if (quality >= 3) {
    if (this.revisionCount === 0) this.interval = 1;
    else if (this.revisionCount === 1) this.interval = 6;
    else this.interval = Math.round(this.interval * this.easeFactor);
    this.easeFactor = Math.max(1.3, this.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    this.interval = 1;
    this.revisionCount = 0;
  }
  this.revisionCount += 1;
  this.nextRevisionDue = new Date(Date.now() + this.interval * 24 * 60 * 60 * 1000);
};

// Retention decay (Ebbinghaus)
PerformanceSchema.methods.calculateRetention = function () {
  if (!this.lastStudied) return 100;
  const daysSince = (Date.now() - this.lastStudied) / (1000 * 60 * 60 * 24);
  const stability = this.revisionCount * 2 + 1;
  this.retentionScore = Math.round(100 * Math.exp(-daysSince / stability));
  return this.retentionScore;
};

module.exports = mongoose.model('Performance', PerformanceSchema);
