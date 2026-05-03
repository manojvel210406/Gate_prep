import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// ─── Question bank (demo data) ─────────────────────────────────────────────
const DEMO_QUESTIONS = [
  { id: 'q1', topicId: null, subjectName: 'Circuit Theory', questionText: 'In a series RLC circuit at resonance, the impedance is:', options: ['Maximum', 'Minimum (= R)', 'Zero', 'Equal to XL'], correctAnswer: 1, difficulty: 'easy', marks: 1, negativeMarks: 0.33 },
  { id: 'q2', topicId: null, subjectName: 'Circuit Theory', questionText: 'The Thevenin equivalent resistance is found by:', options: ['Short-circuiting all voltage sources', 'Open-circuiting all current sources and short-circuiting voltage sources', 'Only open-circuiting voltage sources', 'Replacing all sources with their internal resistances'], correctAnswer: 1, difficulty: 'medium', marks: 1, negativeMarks: 0.33 },
  { id: 'q3', topicId: null, subjectName: 'Signals & Control', questionText: 'The Laplace transform of a unit step function u(t) is:', options: ['1/s²', '1/s', 's', '1/(s+1)'], correctAnswer: 1, difficulty: 'easy', marks: 1, negativeMarks: 0.33 },
  { id: 'q4', topicId: null, subjectName: 'Signals & Control', questionText: 'A system is BIBO stable if all poles of its transfer function are:', options: ['On the imaginary axis', 'In the right half of s-plane', 'In the left half of s-plane', 'At the origin'], correctAnswer: 2, difficulty: 'medium', marks: 1, negativeMarks: 0.33 },
  { id: 'q5', topicId: null, subjectName: 'Electrical Machines', questionText: 'The efficiency of a transformer is maximum when:', options: ['Iron loss = 0', 'Copper loss = 0', 'Iron loss = Copper loss', 'Load is maximum'], correctAnswer: 2, difficulty: 'easy', marks: 1, negativeMarks: 0.33 },
  { id: 'q6', topicId: null, subjectName: 'Electrical Machines', questionText: 'Slip of an induction motor at full load is typically:', options: ['0 to 1%', '2 to 5%', '10 to 15%', '20 to 30%'], correctAnswer: 1, difficulty: 'easy', marks: 1, negativeMarks: 0.33 },
  { id: 'q7', topicId: null, subjectName: 'Power Electronics', questionText: 'In a buck converter, the output voltage is:', options: ['Always greater than input', 'Always less than input', 'Equal to input', 'Can be greater or less than input'], correctAnswer: 1, difficulty: 'medium', marks: 2, negativeMarks: 0.67 },
  { id: 'q8', topicId: null, subjectName: 'Power Electronics', questionText: 'The device used for controlled rectification in power electronics is:', options: ['Diode', 'BJT', 'SCR (Thyristor)', 'JFET'], correctAnswer: 2, difficulty: 'easy', marks: 1, negativeMarks: 0.33 },
  { id: 'q9', topicId: null, subjectName: 'Power Systems', questionText: 'Per unit system is used in power systems to:', options: ['Simplify calculations involving different voltage levels', 'Increase accuracy', 'Reduce power losses', 'Improve power factor'], correctAnswer: 0, difficulty: 'easy', marks: 1, negativeMarks: 0.33 },
  { id: 'q10', topicId: null, subjectName: 'Power Systems', questionText: 'The fault current in a 3-phase short circuit is limited by:', options: ['Load resistance', 'Synchronous reactance', 'Armature resistance', 'Field resistance'], correctAnswer: 1, difficulty: 'hard', marks: 2, negativeMarks: 0.67 },
];

// ─── Timer display component ───────────────────────────────────────────────
function TimerDisplay({ seconds, isWarning }) {
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${isWarning ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-primary-50 text-primary-800'}`}>
      <Clock className="w-4 h-4" />
      {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  );
}

// ─── Result Summary ────────────────────────────────────────────────────────
function TestResults({ result, onRetake, onBack }) {
  const pieData = [
    { name: 'Correct', value: result.correct, color: '#10b981' },
    { name: 'Incorrect', value: result.incorrect, color: '#ef4444' },
    { name: 'Skipped', value: result.skipped, color: '#d1d5db' },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="card text-center py-8">
        <div className={`text-6xl font-bold font-display mb-2 ${result.percentage >= 70 ? 'text-emerald-600' : result.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
          {result.percentage}%
        </div>
        <div className="text-gray-500 font-body">Score: {result.score.toFixed(2)} / {result.totalMarks}</div>
        {result.panicDetected && (
          <div className="mt-3 inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4" /> Panic pattern detected in last few questions
          </div>
        )}
        <div className="mt-3 inline-flex items-center gap-2 bg-gold-100 text-gold-600 px-4 py-2 rounded-xl text-sm font-semibold">
          +{result.xpEarned} XP earned!
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Correct', value: result.correct, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
          { label: 'Incorrect', value: result.incorrect, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
          { label: 'Skipped', value: result.skipped, color: 'text-gray-500', bg: 'bg-gray-50', icon: Flag },
        ].map((s, i) => (
          <div key={i} className={`card ${s.bg} text-center`}>
            <s.icon className={`w-6 h-6 mx-auto mb-1 ${s.color}`} />
            <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 font-body">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-semibold text-gray-900 mb-3">Attempt Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-display font-semibold text-gray-900 mb-3">Performance Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Accuracy', value: `${result.accuracy}%` },
              { label: 'Avg Time / Question', value: `${result.avgTimePerQuestion}s` },
              { label: 'Total Time', value: `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` },
              { label: 'Easy Questions Missed', value: result.easyMissed?.length || 0 },
            ].map((m, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600 font-body">{m.label}</span>
                <span className="text-sm font-semibold font-mono text-gray-900">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-outline flex-1">Back to Tests</button>
        <button onClick={onRetake} className="btn-primary flex-1">Retake Test</button>
      </div>
    </div>
  );
}

// ─── Main Mock Test Page ───────────────────────────────────────────────────
export default function MockTestPage() {
  const [phase, setPhase] = useState('setup'); // setup | test | results
  const [testConfig, setTestConfig] = useState({ type: 'practice', mode: 'practice', timeLimit: 30 });
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  const [qStartTime, setQStartTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (phase !== 'test' || !timeLeft) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, timeLeft]);

  const startTest = () => {
    const qs = DEMO_QUESTIONS.slice(0, testConfig.questionCount || 10);
    setQuestions(qs);
    setAnswers({});
    setFlagged(new Set());
    setCurrent(0);
    setQuestionTimes({});
    setQStartTime(Date.now());
    if (testConfig.mode === 'exam') {
      setTimeLeft((testConfig.timeLimit || 30) * 60);
    } else {
      setTimeLeft(null);
    }
    setPhase('test');
  };

  const recordTimeForCurrent = useCallback(() => {
    const elapsed = Math.round((Date.now() - qStartTime) / 1000);
    setQuestionTimes(prev => ({ ...prev, [current]: (prev[current] || 0) + elapsed }));
    setQStartTime(Date.now());
  }, [current, qStartTime]);

  const navigate = (idx) => {
    recordTimeForCurrent();
    setCurrent(idx);
    setQStartTime(Date.now());
  };

  const handleAnswer = (optIdx) => {
    setAnswers(prev => ({ ...prev, [current]: optIdx }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const unattempted = questions.length - Object.keys(answers).length;
      if (unattempted > 0 && !window.confirm(`You have ${unattempted} unanswered questions. Submit anyway?`)) return;
    }
    recordTimeForCurrent();
    clearInterval(timerRef.current);
    setSubmitting(true);

    const processedQs = questions.map((q, i) => ({
      ...q,
      userAnswer: answers[i] !== undefined ? answers[i] : null,
      skipped: answers[i] === undefined,
      timeTaken: questionTimes[i] || 0,
    }));

    const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0);

    try {
      const { data } = await api.post('/tests/submit', {
        type: testConfig.type,
        mode: testConfig.mode,
        title: `${testConfig.mode === 'exam' ? 'Exam Mode' : 'Practice'} — ${new Date().toLocaleDateString()}`,
        questions: processedQs,
        totalMarks,
        startedAt: new Date(Date.now() - (questions.length * 120000)),
      });
      setResult(data.test);
    } catch {
      // Local calculation fallback
      let correct = 0, incorrect = 0, skipped = 0, score = 0;
      processedQs.forEach(q => {
        if (q.skipped) { skipped++; return; }
        if (q.userAnswer === q.correctAnswer) { correct++; score += (q.marks || 1); }
        else { incorrect++; score -= (q.negativeMarks || 0.33); }
      });
      const attempted = correct + incorrect;
      const totalMarks2 = questions.reduce((s, q) => s + (q.marks || 1), 0);
      setResult({
        correct, incorrect, skipped,
        score: Math.max(0, score),
        totalMarks: totalMarks2,
        percentage: Math.max(0, Math.round((Math.max(0, score) / totalMarks2) * 100)),
        accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
        timeTaken: Object.values(questionTimes).reduce((s, t) => s + t, 0),
        avgTimePerQuestion: attempted > 0 ? Math.round(Object.values(questionTimes).reduce((s, t) => s + t, 0) / attempted) : 0,
        panicDetected: false,
        easyMissed: [],
        xpEarned: Math.round(correct * 10 + 20),
      });
    } finally {
      setSubmitting(false);
      setPhase('results');
    }
  };

  if (phase === 'results' && result) {
    return <TestResults result={result} onRetake={() => setPhase('setup')} onBack={() => setPhase('setup')} />;
  }

  if (phase === 'test') {
    const q = questions[current];
    const answered = Object.keys(answers).length;
    const progress = (answered / questions.length) * 100;
    const isWarning = timeLeft !== null && timeLeft < 300;

    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-slide-up">
        {/* Top bar */}
        <div className="card flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-body">{answered}/{questions.length} answered</span>
              <span className="text-xs text-gray-500 font-body">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-800 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {timeLeft !== null && <TimerDisplay seconds={timeLeft} isWarning={isWarning} />}
          <button onClick={() => handleSubmit(false)} disabled={submitting}
            className="btn-primary px-4 py-2 text-sm">
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Question */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <span className="badge bg-primary-50 text-primary-800 font-mono">Q{current + 1}</span>
                <span className={`badge ${q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700' : q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                  {q.difficulty}
                </span>
                <span className="badge bg-gray-100 text-gray-600">{q.subjectName}</span>
                <span className="badge bg-gold-100 text-gold-600">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                <button onClick={() => {
                  const f = new Set(flagged);
                  f.has(current) ? f.delete(current) : f.add(current);
                  setFlagged(f);
                }} className={`ml-auto p-1.5 rounded-lg transition-colors ${flagged.has(current) ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-400'}`}>
                  <Flag className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-800 font-body text-base leading-relaxed mb-6">{q.questionText}</p>
              <div className="space-y-3">
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(i)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all font-body text-sm ${
                      answers[current] === i
                        ? 'border-primary-800 bg-primary-50 text-primary-900 font-medium'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}>
                    <span className="font-mono font-semibold text-gray-400 mr-3">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
              {testConfig.mode === 'practice' && answers[current] !== undefined && (
                <div className={`mt-4 p-3 rounded-xl text-sm font-body ${answers[current] === q.correctAnswer ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                  {answers[current] === q.correctAnswer
                    ? '✅ Correct!'
                    : `❌ Incorrect. Correct answer: ${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}`}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button onClick={() => navigate(Math.max(0, current - 1))} disabled={current === 0}
                className="btn-outline flex items-center gap-2 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex-1" />
              {current < questions.length - 1
                ? <button onClick={() => navigate(current + 1)} className="btn-primary flex items-center gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                : <button onClick={() => handleSubmit(false)} className="btn-gold flex items-center gap-2">
                    Submit Test <CheckCircle className="w-4 h-4" />
                  </button>
              }
            </div>
          </div>

          {/* Question palette */}
          <div className="card h-fit">
            <h4 className="font-display font-semibold text-gray-800 text-sm mb-3">Question Palette</h4>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((_, i) => (
                <button key={i} onClick={() => navigate(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                    i === current ? 'bg-primary-800 text-white scale-110' :
                    flagged.has(i) ? 'bg-amber-400 text-white' :
                    answers[i] !== undefined ? 'bg-emerald-100 text-emerald-800' :
                    'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{i + 1}</button>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 text-xs font-body">
              {[
                { color: 'bg-emerald-100', label: 'Answered' },
                { color: 'bg-gray-100', label: 'Not visited' },
                { color: 'bg-amber-400', label: 'Flagged' },
                { color: 'bg-primary-800', label: 'Current' },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-500">
                  <div className={`w-4 h-4 rounded ${l.color}`} /> {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Setup screen
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary-900">Mock Test System</h1>
        <p className="text-gray-500 text-sm font-body">Practice with GATE-style questions and get instant analysis</p>
      </div>

      <div className="card space-y-6">
        <h3 className="font-display font-semibold text-gray-900 text-lg">Configure Your Test</h3>

        <div>
          <label className="text-sm font-medium text-gray-700 font-body mb-2 block">Test Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'practice', label: '📝 Practice Mode', desc: 'See answers immediately' },
              { value: 'mock-full', label: '🎯 Exam Mode', desc: 'Timed, no instant answers' },
            ].map(t => (
              <button key={t.value} type="button"
                onClick={() => setTestConfig(c => ({ ...c, type: t.value, mode: t.value === 'mock-full' ? 'exam' : 'practice' }))}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  testConfig.type === t.value ? 'border-primary-800 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="font-semibold font-display text-gray-800 text-sm">{t.label}</div>
                <div className="text-xs text-gray-500 font-body mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 font-body mb-2 block">Number of Questions</label>
          <div className="flex gap-2">
            {[5, 10, 20, 30].map(n => (
              <button key={n} type="button"
                onClick={() => setTestConfig(c => ({ ...c, questionCount: n }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  (testConfig.questionCount || 10) === n ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{n}</button>
            ))}
          </div>
        </div>

        {testConfig.mode === 'exam' && (
          <div>
            <label className="text-sm font-medium text-gray-700 font-body mb-2 block">
              Time Limit: <span className="text-primary-800 font-bold">{testConfig.timeLimit} minutes</span>
            </label>
            <input type="range" min="10" max="180" step="5" value={testConfig.timeLimit || 30}
              onChange={e => setTestConfig(c => ({ ...c, timeLimit: parseInt(e.target.value) }))}
              className="w-full accent-primary-800" />
            <div className="flex justify-between text-xs text-gray-400 font-body mt-1">
              <span>10 min</span><span>3 hours</span>
            </div>
          </div>
        )}

        <div className="bg-primary-50 rounded-2xl p-4 text-sm font-body">
          <div className="font-semibold font-display text-primary-900 mb-2">Test Summary</div>
          <div className="space-y-1 text-primary-700">
            <div>• {testConfig.questionCount || 10} questions from GATE EEE curriculum</div>
            <div>• {testConfig.mode === 'exam' ? `${testConfig.timeLimit || 30} minute time limit` : 'No time limit — see answers immediately'}</div>
            <div>• Marking: +1 to +2 correct, −⅓ negative marking</div>
            <div>• Full analysis after submission</div>
          </div>
        </div>

        <button onClick={startTest} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
          <BarChart3 className="w-4 h-4" /> Start Test
        </button>
      </div>
    </div>
  );
}
