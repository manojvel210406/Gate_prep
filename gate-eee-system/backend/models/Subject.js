// models/Subject.js
const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  stageLevel: { type: Number, required: true, min: 1, max: 6 },
  description: String,
  color: { type: String, default: '#0A3D62' },
  icon: { type: String, default: '⚡' },
  weightageInGATE: { type: Number, default: 10 }, // percentage
  totalTopics: { type: Number, default: 0 },
  estimatedHours: { type: Number, default: 40 },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
