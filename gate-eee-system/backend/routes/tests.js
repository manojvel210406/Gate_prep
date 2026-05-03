const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Test, Error: ErrorModel } = require('../models/index');
const Performance = require('../models/Performance');
const User = require('../models/User');

// ─── POST /api/tests/submit ───────────────────────────────────────────────
router.post('/submit', protect, async (req, res) => {
  try {
    const {
      type, mode, title, subjectId, topicIds,
      questions, totalMarks, timeLimit, startedAt
    } = req.body;

    // Calculate results
    let correct = 0, incorrect = 0, skipped = 0, totalScore = 0;
    const slowQuestions = [], easyMissed = [];
    const subjectMap = {};

    const processedQs = questions.map((q, i) => {
      if (q.skipped || q.userAnswer === null || q.userAnswer === undefined) {
        skipped++;
        return { ...q, isCorrect: false, skipped: true };
      }
      const isCorrect = q.userAnswer === q.correctAnswer;
      if (isCorrect) {
        correct++;
        totalScore += (q.marks || 1);
      } else {
        incorrect++;
        totalScore -= (q.negativeMarks || 0.33);
      }

      // Detect slow questions (>3 min for a single question in exam mode)
      if (mode === 'exam' && q.timeTaken > 180) slowQuestions.push(i);
      // Easy questions missed
      if (!isCorrect && q.difficulty === 'easy') easyMissed.push(i);

      // Subject breakdown
      const sId = q.subjectId?.toString() || 'unknown';
      if (!subjectMap[sId]) subjectMap[sId] = { attempted: 0, correct: 0, subjectName: q.subjectName };
      subjectMap[sId].attempted++;
      if (isCorrect) subjectMap[sId].correct++;

      return { ...q, isCorrect };
    });

    const attempted = correct + incorrect;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const percentage = totalMarks > 0 ? Math.max(0, Math.round((totalScore / totalMarks) * 100)) : 0;
    const avgTimePerQuestion = attempted > 0
      ? Math.round(questions.reduce((s, q) => s + (q.timeTaken || 0), 0) / attempted)
      : 0;

    const subjectBreakdown = Object.entries(subjectMap).map(([sId, data]) => ({
      subjectId: sId,
      subjectName: data.subjectName,
      attempted: data.attempted,
      correct: data.correct,
      accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
    }));

    // Panic detection: many wrong + slow answers in last 1/3 of test
    const lastThird = processedQs.slice(Math.floor(processedQs.length * 0.66));
    const lastThirdWrong = lastThird.filter(q => !q.isCorrect && !q.skipped).length;
    const panicDetected = lastThirdWrong > lastThird.length * 0.6;

    // XP reward
    const xpEarned = Math.round(accuracy * 2 + correct * 5 + (mode === 'exam' ? 50 : 20));

    const test = await Test.create({
      userId: req.user._id,
      type, mode, title: title || `${type} Test`,
      subjectId, topicIds,
      questions: processedQs,
      totalQuestions: questions.length,
      attempted, correct, incorrect, skipped,
      score: Math.max(0, totalScore),
      totalMarks, percentage, accuracy,
      timeTaken: questions.reduce((s, q) => s + (q.timeTaken || 0), 0),
      avgTimePerQuestion, timeLimit,
      subjectBreakdown,
      panicDetected, slowQuestions, easyMissed,
      xpEarned,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      completedAt: new Date(),
    });

    // Update performances per topic
    const topicUpdates = {};
    processedQs.forEach(q => {
      if (!q.topicId) return;
      const tId = q.topicId.toString();
      if (!topicUpdates[tId]) topicUpdates[tId] = { correct: 0, total: 0, subjectId: q.subjectId };
      topicUpdates[tId].total++;
      if (q.isCorrect) topicUpdates[tId].correct++;
    });

    for (const [topicId, data] of Object.entries(topicUpdates)) {
      const perf = await Performance.findOneAndUpdate(
        { userId: req.user._id, topicId },
        {
          $inc: { totalAttempts: data.total, correctAnswers: data.correct },
          $set: { subjectId: data.subjectId, lastStudied: new Date() },
        },
        { upsert: true, new: true }
      );

      // Recalculate accuracy and mastery
      perf.accuracy = perf.totalAttempts > 0
        ? Math.round((perf.correctAnswers / perf.totalAttempts) * 100) : 0;
      perf.masteryScore = Math.round(
        perf.accuracy * 0.6 + Math.min(100, perf.totalAttempts * 2) * 0.4
      );
      perf.updateMastery();

      // SM-2 quality based on accuracy
      const quality = perf.accuracy >= 90 ? 5 : perf.accuracy >= 70 ? 4 : perf.accuracy >= 50 ? 3 : 2;
      perf.updateSM2(quality);
      await perf.save();
    }

    // Auto-log errors for wrong answers
    const wrongAnswers = processedQs.filter(q => !q.isCorrect && !q.skipped);
    for (const q of wrongAnswers.slice(0, 10)) {
      if (!q.topicId) continue;
      const errorType = q.difficulty === 'hard' ? 'concept' : 'calculation';
      await ErrorModel.findOneAndUpdate(
        { userId: req.user._id, topicId: q.topicId, fingerprint: `${q.topicId}-${q.correctAnswer}` },
        {
          $inc: { frequency: 1 },
          $set: { lastOccurred: new Date(), subjectId: q.subjectId, errorType, testId: test._id }
        },
        { upsert: true }
      );
    }

    // Update user XP
    const user = await User.findById(req.user._id);
    user.updateXPAndRank(xpEarned);
    await user.save();

    res.status(201).json({
      success: true,
      test: {
        id: test._id,
        title: test.title,
        score: test.score,
        totalMarks: test.totalMarks,
        percentage, accuracy, correct, incorrect, skipped,
        avgTimePerQuestion,
        subjectBreakdown,
        panicDetected,
        slowQuestions,
        easyMissed,
        xpEarned,
        timeTaken: test.timeTaken,
      }
    });
  } catch (error) {
    console.error('Test submit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/tests ────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { type, limit = 20, page = 1 } = req.query;
    const query = { userId: req.user._id };
    if (type) query.type = type;

    const tests = await Test.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-questions');

    const total = await Test.countDocuments(query);
    res.json({ success: true, tests, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/tests/:id ────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, userId: req.user._id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
