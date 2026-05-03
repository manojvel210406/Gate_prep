const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { StudyLog, Test, Error: ErrorModel } = require('../models/index');
const Performance = require('../models/Performance');
const User = require('../models/User');

// ─── Build context for AI mentor ─────────────────────────────────────────
async function buildUserContext(userId) {
  const user = await User.findById(userId);
  const recentLogs = await StudyLog.find({ userId }).sort({ date: -1 }).limit(7);
  const recentTests = await Test.find({ userId }).sort({ createdAt: -1 }).limit(5).select('-questions');
  const weakTopics = await Performance.find({ userId, masteryLevel: { $in: ['weak', 'not-started'] } })
    .limit(5).populate('topicId', 'name').populate('subjectId', 'name');
  const topErrors = await ErrorModel.find({ userId, isResolved: false })
    .sort({ frequency: -1 }).limit(3).populate('topicId', 'name');

  const totalStudyHours = recentLogs.reduce((s, l) => s + l.totalHours, 0);
  const avgAccuracy = recentTests.length
    ? Math.round(recentTests.reduce((s, t) => s + t.accuracy, 0) / recentTests.length) : 0;

  return {
    name: user.name,
    level: user.level,
    currentStage: user.currentStage,
    currentStreak: user.currentStreak,
    healthScore: user.healthScore,
    cognitiveState: user.cognitiveState,
    rank: user.rank,
    weeklyHours: totalStudyHours.toFixed(1),
    avgAccuracy,
    weakTopics: weakTopics.map(p => `${p.topicId?.name} (${p.subjectId?.name})`),
    topErrors: topErrors.map(e => `${e.topicId?.name}: ${e.errorType} error (x${e.frequency})`),
    recentTests: recentTests.map(t => `${t.title}: ${t.accuracy}% accuracy`),
    daysToExam: user.targetDate
      ? Math.max(0, Math.floor((new Date(user.targetDate) - Date.now()) / 86400000))
      : null,
  };
}

// ─── Rule-based AI responses (used as fallback) ───────────────────────────
function generateLocalResponse(message, context) {
  const msg = message.toLowerCase();

  // Greeting
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hey ${context.name}! 👋 Ready to conquer GATE EEE? You have a ${context.currentStreak}-day streak going strong!`;
  }

  // What to study today
  if (msg.includes('study today') || msg.includes('what to study') || msg.includes('today')) {
    let response = `📚 **Today's Plan for ${context.name}**\n\n`;
    if (context.weakTopics.length > 0) {
      response += `🎯 **Priority**: Focus on your weak areas:\n`;
      context.weakTopics.slice(0, 3).forEach((t, i) => { response += `${i+1}. ${t}\n`; });
    }
    if (context.cognitiveState === 'fatigued' || context.cognitiveState === 'burned-out') {
      response += `\n⚠️ You seem ${context.cognitiveState}. Keep it to **2-3 hours** and focus on revision today.`;
    } else {
      response += `\n✅ You're in **${context.cognitiveState}** state — great time to tackle new concepts!`;
    }
    return response;
  }

  // Weak areas
  if (msg.includes('weak') || msg.includes('improve') || msg.includes('struggle')) {
    if (context.weakTopics.length === 0) {
      return `🎉 Great news ${context.name}! No major weak areas detected yet. Keep practicing consistently!`;
    }
    let response = `🔍 **Your Weak Areas** (based on performance data):\n\n`;
    context.weakTopics.forEach((t, i) => { response += `${i+1}. ${t}\n`; });
    response += `\n💡 **My Recommendation**: Spend 30-45 mins daily on each weak topic. Practice at least 10 questions per topic before moving on.`;
    return response;
  }

  // Strategy
  if (msg.includes('strategy') || msg.includes('plan') || msg.includes('approach')) {
    const daysLeft = context.daysToExam;
    let response = `📋 **GATE EEE Strategy for ${context.name}**\n\n`;
    if (daysLeft && daysLeft < 30) {
      response += `⚡ **Final Phase Mode** — Only ${daysLeft} days left!\n`;
      response += `1. No new topics — revision only\n2. 3 mock tests per week\n3. Focus on PYQs from last 5 years\n4. Error review every morning`;
    } else {
      response += `**Stage ${context.currentStage} Strategy**:\n`;
      response += `1. Complete weak topics first\n2. 5-10 practice questions per topic\n3. Weekly mock test\n4. Daily 1-hr revision\n`;
      response += `\nYou're at **${context.avgAccuracy}% avg accuracy** — aim for 75%+ before your exam!`;
    }
    return response;
  }

  // If I were you
  if (msg.includes('if i were you') || msg.includes('recommend') || msg.includes('suggestion')) {
    let response = `🤖 **If I Were You, ${context.name}...**\n\n`;
    if (context.healthScore < 50) {
      response += `Your health score is **${context.healthScore}/100** — needs work!\n\n`;
      response += `I'd focus on:\n1. Consistency over intensity — study every day even if just 1 hour\n`;
      response += `2. Fix the top error: **${context.topErrors[0] || 'review error log'}**\n`;
      response += `3. Don't skip revision — set a 30-min daily revision slot\n`;
    } else {
      response += `You're doing well (Health Score: **${context.healthScore}/100**)! I'd:\n`;
      response += `1. Push accuracy from ${context.avgAccuracy}% to 80%+\n`;
      response += `2. Take one full mock test this week\n`;
      response += `3. Start ${context.weakTopics[0] || 'the next tough topic'} — don't delay it!\n`;
    }
    return response;
  }

  // Error analysis
  if (msg.includes('error') || msg.includes('mistake') || msg.includes('wrong')) {
    if (context.topErrors.length === 0) {
      return `✅ No repeated errors found in your log. Keep practicing!`;
    }
    let response = `❌ **Your Error Fingerprint**:\n\n`;
    context.topErrors.forEach((e, i) => { response += `${i+1}. ${e}\n`; });
    response += `\n💡 Error patterns reveal deeper gaps. Review the concept thoroughly, not just the formula.`;
    return response;
  }

  // Default smart response
  return `Hey ${context.name}! I'm your GATE EEE Mentor 🎓\n\nYou can ask me:\n• "What should I study today?"\n• "Show me my weak areas"\n• "Give me a strategy"\n• "If I were you..." (for personalized advice)\n• "Analyze my errors"\n\nYour current stats: Health Score **${context.healthScore}/100**, Streak **${context.currentStreak} days**, Avg Accuracy **${context.avgAccuracy}%**`;
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const context = await buildUserContext(req.user._id);

    // Try OpenAI if key available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const systemPrompt = `You are an expert GATE EEE (Electrical & Electronics Engineering) mentor and coach. 
You are personalized, data-driven, and motivating. You have access to the student's real performance data.

Student Profile:
- Name: ${context.name}
- Level: ${context.level}
- Current Stage: ${context.currentStage}/6
- Study Streak: ${context.currentStreak} days
- Health Score: ${context.healthScore}/100
- Weekly Study Hours: ${context.weeklyHours}
- Avg Test Accuracy: ${context.avgAccuracy}%
- Cognitive State: ${context.cognitiveState}
- Weak Areas: ${context.weakTopics.join(', ') || 'None detected yet'}
- Top Errors: ${context.topErrors.join(', ') || 'None'}
- Days to Exam: ${context.daysToExam || 'Not set'}

Be concise, specific, and actionable. Use markdown formatting with emojis. 
When relevant, reference their actual data to make advice feel personalized.`;

        const messages = [
          ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: message }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 500,
          temperature: 0.7,
        });

        return res.json({
          success: true,
          response: completion.choices[0].message.content,
          source: 'ai',
        });
      } catch (aiError) {
        console.log('OpenAI fallback to local:', aiError.message);
      }
    }

    // Local rule-based response
    const response = generateLocalResponse(message, context);
    res.json({ success: true, response, source: 'local' });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/ai/daily-plan ───────────────────────────────────────────────
router.get('/daily-plan', protect, async (req, res) => {
  try {
    const context = await buildUserContext(req.user._id);
    const user = await User.findById(req.user._id);

    // Adaptive plan based on cognitive state
    const hoursAvailable = user.dailyHoursGoal;
    const plan = [];

    if (context.cognitiveState === 'burned-out') {
      plan.push({ time: '1h', activity: 'Light revision of strong topics', type: 'revision', priority: 1 });
      plan.push({ time: '30min', activity: 'Review error log', type: 'error-review', priority: 2 });
    } else if (context.cognitiveState === 'fatigued') {
      plan.push({ time: '1.5h', activity: `Revision: ${context.weakTopics[0] || 'Any weak topic'}`, type: 'revision', priority: 1 });
      plan.push({ time: '1h', activity: 'Practice questions (easy-medium)', type: 'practice', priority: 2 });
      plan.push({ time: '30min', activity: 'Error review', type: 'error-review', priority: 3 });
    } else {
      if (context.weakTopics.length > 0) {
        plan.push({ time: `${Math.min(2, hoursAvailable * 0.4).toFixed(1)}h`, activity: `Learn: ${context.weakTopics[0]}`, type: 'learning', priority: 1 });
      }
      plan.push({ time: `${Math.min(1.5, hoursAvailable * 0.3).toFixed(1)}h`, activity: 'Practice test (20 questions)', type: 'practice', priority: 2 });
      plan.push({ time: `${Math.min(1, hoursAvailable * 0.2).toFixed(1)}h`, activity: 'Spaced revision', type: 'revision', priority: 3 });
      if (hoursAvailable > 3) {
        plan.push({ time: '30min', activity: 'Error log review', type: 'error-review', priority: 4 });
      }
    }

    const nextBestAction = plan[0];

    res.json({
      success: true,
      plan,
      nextBestAction,
      cognitiveState: context.cognitiveState,
      healthScore: context.healthScore,
      message: `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${context.name}! Here's your personalized plan for today.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
