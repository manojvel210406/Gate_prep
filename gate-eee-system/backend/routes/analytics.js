const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { StudyLog, Test } = require('../models/index');
const Performance = require('../models/Performance');
const User = require('../models/User');

// ─── GET /api/analytics/dashboard ─────────────────────────────────────────
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Last 30 days study logs
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await StudyLog.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 });
    const recentTests = await Test.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }).limit(10);
    const performances = await Performance.find({ userId }).populate('topicId', 'name').populate('subjectId', 'name');

    // Study hours trend (daily)
    const studyHoursTrend = recentLogs.map(l => ({
      date: l.date.toISOString().split('T')[0],
      hours: l.totalHours,
    }));

    // Weekly performance
    const weeklyLogs = recentLogs.filter(l => l.date >= sevenDaysAgo);
    const weeklyHours = weeklyLogs.reduce((s, l) => s + l.totalHours, 0);

    // Accuracy trend from tests
    const accuracyTrend = recentTests.map(t => ({
      date: t.createdAt.toISOString().split('T')[0],
      accuracy: t.accuracy,
      score: t.percentage,
    }));

    // Subject-wise performance
    const subjectPerformance = {};
    performances.forEach(p => {
      if (!p.subjectId) return;
      const sName = p.subjectId.name;
      if (!subjectPerformance[sName]) {
        subjectPerformance[sName] = { totalAccuracy: 0, count: 0, masteryScores: [] };
      }
      subjectPerformance[sName].totalAccuracy += p.accuracy;
      subjectPerformance[sName].count += 1;
      subjectPerformance[sName].masteryScores.push(p.masteryScore);
    });

    const subjectStats = Object.entries(subjectPerformance).map(([name, data]) => ({
      subject: name,
      avgAccuracy: data.count ? Math.round(data.totalAccuracy / data.count) : 0,
      avgMastery: data.masteryScores.length
        ? Math.round(data.masteryScores.reduce((a, b) => a + b, 0) / data.masteryScores.length)
        : 0,
    }));

    // Weak topics (mastery < 40%)
    const weakTopics = performances
      .filter(p => p.masteryLevel === 'weak' || p.masteryLevel === 'not-started')
      .slice(0, 5)
      .map(p => ({
        topic: p.topicId?.name || 'Unknown',
        subject: p.subjectId?.name || 'Unknown',
        masteryScore: p.masteryScore,
        accuracy: p.accuracy,
      }));

    // Due revisions
    const dueRevisions = await Performance.find({
      userId,
      nextRevisionDue: { $lte: new Date() },
      masteryLevel: { $ne: 'not-started' },
    }).limit(5).populate('topicId', 'name').populate('subjectId', 'name');

    // Calculate Health Score
    const consistencyScore = Math.min(100, (weeklyHours / (user.dailyHoursGoal * 7)) * 100);
    const avgAccuracy = recentTests.length
      ? recentTests.reduce((s, t) => s + t.accuracy, 0) / recentTests.length
      : 50;
    const masteryAvg = performances.length
      ? performances.reduce((s, p) => s + p.masteryScore, 0) / performances.length
      : 0;

    const healthScore = Math.round((consistencyScore * 0.3) + (avgAccuracy * 0.4) + (masteryAvg * 0.3));

    // Update user health score
    await User.findByIdAndUpdate(userId, { healthScore });

    res.json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          rank: user.rank,
          xp: user.xp,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          currentStage: user.currentStage,
          healthScore,
          cognitiveState: user.cognitiveState,
        },
        studyHoursTrend,
        accuracyTrend,
        subjectStats,
        weakTopics,
        dueRevisions: dueRevisions.map(r => ({
          topic: r.topicId?.name,
          subject: r.subjectId?.name,
          retentionScore: r.retentionScore,
          daysOverdue: Math.floor((Date.now() - r.nextRevisionDue) / 86400000),
        })),
        weeklyStats: {
          hours: weeklyHours.toFixed(1),
          questionsAttempted: weeklyLogs.reduce((s, l) => s + l.totalQuestions, 0),
          activeDays: new Set(weeklyLogs.map(l => l.date.toDateString())).size,
        },
        recentTests: recentTests.slice(0, 5).map(t => ({
          title: t.title,
          type: t.type,
          score: t.percentage,
          accuracy: t.accuracy,
          date: t.createdAt,
        })),
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/analytics/progress ─────────────────────────────────────────
router.get('/progress', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30' } = req.query;

    const since = new Date(); since.setDate(since.getDate() - parseInt(period));

    // Weekly aggregated study data
    const weeklyData = await StudyLog.aggregate([
      { $match: { userId, date: { $gte: since } } },
      { $group: {
        _id: { $week: '$date' },
        totalHours: { $sum: '$totalHours' },
        totalQuestions: { $sum: '$totalQuestions' },
        days: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Test performance over time
    const testTrend = await Test.find({
      userId,
      createdAt: { $gte: since }
    }).sort({ createdAt: 1 }).select('accuracy percentage createdAt type');

    res.json({ success: true, weeklyData, testTrend });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/analytics/cognitive ─────────────────────────────────────────
router.get('/cognitive', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Detect fatigue: study >6 hrs/day for 3+ consecutive days
    const recentLogs = await StudyLog.find({ userId }).sort({ date: -1 }).limit(7);
    const last3Days = recentLogs.slice(0, 3);
    const avgHours = last3Days.reduce((s, l) => s + l.totalHours, 0) / (last3Days.length || 1);

    // Detect performance drop
    const recentTests = await Test.find({ userId }).sort({ createdAt: -1 }).limit(5);
    const accuracies = recentTests.map(t => t.accuracy);
    const isDropping = accuracies.length >= 3 &&
      accuracies[0] < accuracies[2] - 10; // 10% drop in recent tests

    let cognitiveState = 'focused';
    if (avgHours > 8) cognitiveState = 'burned-out';
    else if (avgHours > 6 || isDropping) cognitiveState = 'fatigued';
    else if (avgHours >= 4) cognitiveState = 'focused';
    else cognitiveState = 'fresh';

    // Update user
    await User.findByIdAndUpdate(userId, { cognitiveState });

    const recommendations = {
      'burned-out': ['Take a full rest day', 'Light revision only', 'Prioritize sleep'],
      'fatigued': ['Reduce study to 4 hours', 'Focus on revision', 'Take short breaks'],
      'focused': ['Tackle difficult topics', 'Full study session', 'New concepts OK'],
      'fresh': ['Ideal for new topics', 'Push study hours', 'Challenge yourself'],
    };

    res.json({
      success: true,
      cognitiveState,
      avgDailyHours: avgHours.toFixed(1),
      isPerformanceDropping: isDropping,
      recommendations: recommendations[cognitiveState],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
