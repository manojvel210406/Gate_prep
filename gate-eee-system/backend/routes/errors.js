// routes/errors.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Error: ErrorModel } = require('../models/index');

router.get('/', protect, async (req, res) => {
  try {
    const { resolved, type, limit = 20 } = req.query;
    const query = { userId: req.user._id };
    if (resolved !== undefined) query.isResolved = resolved === 'true';
    if (type) query.errorType = type;

    const errors = await ErrorModel.find(query)
      .sort({ frequency: -1, lastOccurred: -1 })
      .limit(parseInt(limit))
      .populate('topicId', 'name')
      .populate('subjectId', 'name');

    // Error fingerprint summary
    const fingerprint = {
      concept: 0, formula: 0, calculation: 0, reading: 0, 'time-pressure': 0
    };
    errors.forEach(e => { fingerprint[e.errorType] = (fingerprint[e.errorType] || 0) + e.frequency; });

    res.json({ success: true, errors, fingerprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { topicId, subjectId, questionText, correctAnswer, userAnswer, errorType, errorDescription } = req.body;
    const fingerprint = `${topicId}-${errorType}-${correctAnswer}`.replace(/\s/g, '');
    const existing = await ErrorModel.findOne({ userId: req.user._id, fingerprint });
    if (existing) {
      existing.frequency += 1; existing.lastOccurred = new Date();
      await existing.save();
      return res.json({ success: true, error: existing, isNew: false });
    }
    const error = await ErrorModel.create({
      userId: req.user._id, topicId, subjectId,
      questionText, correctAnswer, userAnswer,
      errorType, errorDescription, fingerprint
    });
    res.status(201).json({ success: true, error, isNew: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/resolve', protect, async (req, res) => {
  try {
    const error = await ErrorModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isResolved: true, resolvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, error });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
