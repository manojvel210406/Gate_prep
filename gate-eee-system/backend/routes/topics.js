const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Topic = require('../models/Topic');
const Performance = require('../models/Performance');

router.get('/', protect, async (req, res) => {
  try {
    const { subjectId } = req.query;
    const query = {};
    if (subjectId) query.subjectId = subjectId;

    const topics = await Topic.find(query)
      .sort({ order: 1 })
      .populate('subjectId', 'name stageLevel')
      .populate('prerequisites', 'name');

    // Attach user performance
    const perfs = await Performance.find({ userId: req.user._id });
    const perfMap = {};
    perfs.forEach(p => { perfMap[p.topicId?.toString()] = p; });

    const result = topics.map(t => {
      const perf = perfMap[t._id.toString()];
      return {
        ...t.toObject(),
        masteryLevel: perf?.masteryLevel || 'not-started',
        masteryScore: perf?.masteryScore || 0,
        accuracy: perf?.accuracy || 0,
        retentionScore: perf?.retentionScore || 100,
        isUnlocked: perf?.isUnlocked || false,
        nextRevisionDue: perf?.nextRevisionDue,
      };
    });

    res.json({ success: true, topics: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/unlock', protect, async (req, res) => {
  try {
    await Performance.findOneAndUpdate(
      { userId: req.user._id, topicId: req.params.id },
      { isUnlocked: true },
      { upsert: true }
    );
    res.json({ success: true, message: 'Topic unlocked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
