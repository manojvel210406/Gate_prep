const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Performance = require('../models/Performance');

router.get('/', protect, async (req, res) => {
  try {
    const perfs = await Performance.find({ userId: req.user._id })
      .populate('topicId', 'name gateWeightage pyqFrequency')
      .populate('subjectId', 'name color');
    res.json({ success: true, performances: perfs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/heatmap', protect, async (req, res) => {
  try {
    const perfs = await Performance.find({ userId: req.user._id })
      .populate('topicId', 'name')
      .populate('subjectId', 'name');

    const heatmap = perfs.map(p => ({
      topic: p.topicId?.name || 'Unknown',
      subject: p.subjectId?.name || 'Unknown',
      masteryScore: p.masteryScore,
      accuracy: p.accuracy,
      masteryLevel: p.masteryLevel,
      retentionScore: p.retentionScore,
    }));

    res.json({ success: true, heatmap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
