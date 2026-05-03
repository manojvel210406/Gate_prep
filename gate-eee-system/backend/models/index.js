const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════
// STUDY LOG MODEL
// ═══════════════════════════════════════════════════════════
const StudyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true, default: Date.now },

  // What was studied
  topicsCovered: [{
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    topicName: String,
    subjectName: String,
    hoursSpent: { type: Number, default: 0 },
    questionsAttempted: { type: Number, default: 0 },
    questionsCorrect: { type: Number, default: 0 },
    notes: String,
  }],

  totalHours: { type: Number, required: true, min: 0, max: 24 },
  totalQuestions: { type: Number, default: 0 },

  // Session quality
  focusRating: { type: Number, min: 1, max: 5 }, // user self-report
  energyLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

  // Cognitive state detected
  cognitiveState: {
    type: String,
    enum: ['fresh', 'focused', 'fatigued', 'burned-out'],
    default: 'focused',
  },

  notes: String,
  xpEarned: { type: Number, default: 0 },

}, { timestamps: true });

StudyLogSchema.index({ userId: 1, date: -1 });

// ═══════════════════════════════════════════════════════════
// TEST MODEL
// ═══════════════════════════════════════════════════════════
const QuestionSchema = new mongoose.Schema({
  questionId: String,
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  questionText: String,
  options: [String],
  correctAnswer: Number,
  userAnswer: Number,
  isCorrect: Boolean,
  timeTaken: Number,  // seconds
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0.33 },
  skipped: { type: Boolean, default: false },
}, { _id: false });

const TestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: {
    type: String,
    enum: ['practice', 'mock-full', 'mock-subject', 'micro-quiz', 'pyq'],
    required: true,
  },
  mode: { type: String, enum: ['practice', 'exam'], default: 'practice' },
  title: { type: String, default: 'Practice Test' },

  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],

  // Results
  questions: [QuestionSchema],
  totalQuestions: { type: Number, required: true },
  attempted: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  incorrect: { type: Number, default: 0 },
  skipped: { type: Number, default: 0 },

  score: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },

  timeTaken: { type: Number, default: 0 }, // total seconds
  avgTimePerQuestion: { type: Number, default: 0 },
  timeLimit: { type: Number }, // seconds, null = no limit

  // Analysis
  subjectBreakdown: [{
    subjectName: String,
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    attempted: Number,
    correct: Number,
    accuracy: Number,
  }],

  difficultyBreakdown: {
    easy: { attempted: Number, correct: Number },
    medium: { attempted: Number, correct: Number },
    hard: { attempted: Number, correct: Number },
  },

  // Behavioral
  panicDetected: { type: Boolean, default: false },
  slowQuestions: [Number],  // question indices that took too long
  easyMissed: [Number],     // easy questions answered wrong

  xpEarned: { type: Number, default: 0 },
  rank: String, // percentile rank if mock

  startedAt: { type: Date },
  completedAt: { type: Date },

}, { timestamps: true });

TestSchema.index({ userId: 1, createdAt: -1 });
TestSchema.index({ userId: 1, type: 1 });

// ═══════════════════════════════════════════════════════════
// ERROR INTELLIGENCE MODEL
// ═══════════════════════════════════════════════════════════
const ErrorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },

  questionText: String,
  correctAnswer: String,
  userAnswer: String,

  errorType: {
    type: String,
    enum: ['concept', 'formula', 'calculation', 'reading', 'time-pressure'],
    required: true,
  },
  errorDescription: String,

  // Root cause analysis
  rootCause: String,
  frequency: { type: Number, default: 1 },
  lastOccurred: { type: Date, default: Date.now },

  // Error fingerprint
  fingerprint: String,  // hash of error pattern

  isResolved: { type: Boolean, default: false },
  resolvedAt: Date,

  revision: [{
    date: Date,
    success: Boolean,
  }],

}, { timestamps: true });

ErrorSchema.index({ userId: 1, topicId: 1 });
ErrorSchema.index({ userId: 1, errorType: 1 });
ErrorSchema.index({ userId: 1, isResolved: 1 });

// ═══════════════════════════════════════════════════════════
// REVISION SCHEDULE MODEL
// ═══════════════════════════════════════════════════════════
const RevisionScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  scheduledDate: { type: Date, required: true },
  priority: { type: String, enum: ['urgent', 'high', 'medium', 'low'], default: 'medium' },
  reason: String,
  completed: { type: Boolean, default: false },
  completedAt: Date,
}, { timestamps: true });

RevisionScheduleSchema.index({ userId: 1, scheduledDate: 1 });

module.exports = {
  StudyLog: mongoose.model('StudyLog', StudyLogSchema),
  Test: mongoose.model('Test', TestSchema),
  Error: mongoose.model('Error', ErrorSchema),
  RevisionSchedule: mongoose.model('RevisionSchedule', RevisionScheduleSchema),
};
