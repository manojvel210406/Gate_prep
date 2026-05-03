const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  code: { type: String },
  description: String,

  // ── Dependency Graph ─────────────────────────────────────────────────────
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
  unlocks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],

  // ── Weightage & Priority ─────────────────────────────────────────────────
  gateWeightage: { type: Number, default: 1 }, // marks in GATE typically
  pyqFrequency: { type: Number, default: 0 }, // times asked in PYQs
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },

  // ── Content ───────────────────────────────────────────────────────────────
  estimatedStudyHours: { type: Number, default: 2 },
  keyFormulas: [String],
  keyConcepts: [String],
  commonMistakes: [String],

  // ── PYQ Tags ─────────────────────────────────────────────────────────────
  pyqYears: [Number],
  isFrequentlyAsked: { type: Boolean, default: false },

  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

}, { timestamps: true });

TopicSchema.index({ subjectId: 1 });
TopicSchema.index({ pyqFrequency: -1 });

module.exports = mongoose.model('Topic', TopicSchema);
