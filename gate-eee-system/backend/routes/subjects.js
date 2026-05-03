// routes/subjects.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Performance = require('../models/Performance');

router.get('/', protect, async (req, res) => {
  try {
    const subjects = await Subject.find({ }).sort({ stageLevel: 1, order: 1 });
    // Attach user performance per subject
    const perfs = await Performance.find({ userId: req.user._id });
    const perfMap = {};
    perfs.forEach(p => {
      const sId = p.subjectId?.toString();
      if (!sId) return;
      if (!perfMap[sId]) perfMap[sId] = { totalAcc: 0, count: 0, mastery: 0 };
      perfMap[sId].totalAcc += p.accuracy;
      perfMap[sId].mastery += p.masteryScore;
      perfMap[sId].count += 1;
    });
    const result = subjects.map(s => ({
      ...s.toObject(),
      userAccuracy: perfMap[s._id] ? Math.round(perfMap[s._id].totalAcc / perfMap[s._id].count) : 0,
      userMastery: perfMap[s._id] ? Math.round(perfMap[s._id].mastery / perfMap[s._id].count) : 0,
      isUnlocked: s.stageLevel <= req.user.currentStage,
    }));
    res.json({ success: true, subjects: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
