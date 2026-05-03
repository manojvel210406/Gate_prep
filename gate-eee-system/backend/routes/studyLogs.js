const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { StudyLog } = require('../models/index');
const User = require('../models/User');

// ─── POST /api/study-logs ─────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { date, topicsCovered, totalHours, focusRating, energyLevel, notes } = req.body;

    // Calculate XP based on study time
    const xpEarned = Math.round(totalHours * 50 + (topicsCovered?.length || 0) * 20);

    const log = await StudyLog.create({
      userId: req.user.id,
      date: date || new Date(),
      topicsCovered,
      totalHours,
      totalQuestions: topicsCovered?.reduce((s, t) => s + (t.questionsAttempted || 0), 0) || 0,
      focusRating,
      energyLevel,
      notes,
      xpEarned,
    });

    // Update user streak and XP
    const user = await User.findById(req.user.id);
    const today = new Date();
    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    if (!lastStudy || lastStudy.toDateString() === yesterday.toDateString()) {
      user.currentStreak += 1;
      if (user.currentStreak > user.longestStreak) user.longestStreak = user.currentStreak;
    } else if (!lastStudy || lastStudy.toDateString() !== today.toDateString()) {
      user.currentStreak = 1;
    }

    user.lastStudyDate = today;
    user.updateXPAndRank(xpEarned);
    await user.save();

    res.status(201).json({ success: true, log, xpEarned, streak: user.currentStreak });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/study-logs ──────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { days = 30, limit = 50 } = req.query;
    const since = new Date(); since.setDate(since.getDate() - parseInt(days));

    const logs = await StudyLog.find({
      userId: req.user.id,
      date: { $gte: since }
    })
    .sort({ date: -1 })
    .limit(parseInt(limit))
    .populate('topicsCovered.topicId', 'name');

    // Summary stats
    const totalHours = logs.reduce((s, l) => s + l.totalHours, 0);
    const totalQuestions = logs.reduce((s, l) => s + l.totalQuestions, 0);
    const activeDays = new Set(logs.map(l => new Date(l.date).toDateString())).size;

    res.json({
      success: true,
      logs,
      summary: { totalHours, totalQuestions, activeDays, avgHoursPerDay: activeDays ? (totalHours / activeDays).toFixed(1) : 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/study-logs/heatmap ──────────────────────────────────────────
router.get('/heatmap', protect, async (req, res) => {
  try {
    const since = new Date(); since.setFullYear(since.getFullYear() - 1);

    const logs = await StudyLog.aggregate([
      { $match: { userId: req.user._id, date: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        hours: { $sum: '$totalHours' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, heatmap: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
