// routes/revision.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { RevisionSchedule } = require('../models/index');
const Performance = require('../models/Performance');

router.get('/due', protect, async (req, res) => {
  try {
    const due = await Performance.find({
      userId: req.user._id,
      nextRevisionDue: { $lte: new Date() },
      masteryLevel: { $nin: ['not-started', 'mastered'] },
    })
    .sort({ nextRevisionDue: 1, retentionScore: 1 })
    .limit(10)
    .populate('topicId', 'name estimatedStudyHours')
    .populate('subjectId', 'name');

    // Also decay retention scores
    for (const p of due) {
      p.calculateRetention();
      await p.save();
    }

    res.json({ success: true, dueRevisions: due });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/complete', protect, async (req, res) => {
  try {
    const { topicId, quality } = req.body; // quality 0-5
    const perf = await Performance.findOne({ userId: req.user._id, topicId });
    if (!perf) return res.status(404).json({ success: false, message: 'Performance record not found' });
    perf.updateSM2(quality || 4);
    perf.revisionCount += 1;
    perf.lastStudied = new Date();
    perf.calculateRetention();
    await perf.save();
    res.json({ success: true, performance: perf, nextRevision: perf.nextRevisionDue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
