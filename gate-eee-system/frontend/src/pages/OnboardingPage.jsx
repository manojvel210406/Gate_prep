import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, ChevronRight, Target, Clock, Calendar, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, title: 'Your Level', desc: 'Tell us where you are right now' },
  { id: 2, title: 'Exam Date', desc: 'When is your GATE exam?' },
  { id: 3, title: 'Daily Goal', desc: 'How many hours can you study daily?' },
  { id: 4, title: 'Learning Style', desc: 'How do you learn best?' },
];

export default function OnboardingPage() {
  const { completeOnboarding, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    level: user?.level || 'beginner',
    targetDate: '',
    dailyHoursGoal: 4,
    learningStyle: 'analytical',
    currentStage: 1,
  });

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding(data);
      toast.success('Setup complete! Welcome to your GATE journey 🚀');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Setup failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    { value: 'beginner', label: '🌱 Beginner', desc: 'Starting from scratch', stage: 1 },
    { value: 'intermediate', label: '📚 Intermediate', desc: 'Covered basics already', stage: 2 },
    { value: 'advanced', label: '🎯 Advanced', desc: 'Near-exam revision', stage: 5 },
  ];

  const styles = [
    { value: 'analytical', icon: '🧮', label: 'Analytical', desc: 'Theory first, then practice' },
    { value: 'practice-first', icon: '✍️', label: 'Practice First', desc: 'Learn by doing questions' },
    { value: 'visual', icon: '📊', label: 'Visual', desc: 'Diagrams and charts' },
    { value: 'theory-first', icon: '📖', label: 'Theory First', desc: 'Deep understanding first' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4">
            <Zap className="w-7 h-7 text-gold-400" />
          </div>
          <h1 className="font-display font-bold text-white text-2xl">Let's set up your plan</h1>
          <p className="text-primary-200 text-sm mt-1">{steps[step-1].desc}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {steps.map(s => (
            <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s.id <= step ? 'bg-gold-400' : 'bg-white/20'}`} />
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="font-display font-bold text-primary-900 text-xl mb-6">{steps[step-1].title}</h2>

          {step === 1 && (
            <div className="space-y-3">
              {levels.map(l => (
                <button key={l.value} type="button"
                  onClick={() => setData({ ...data, level: l.value, currentStage: l.stage })}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    data.level === l.value ? 'border-primary-800 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="font-semibold font-display text-gray-800">{l.label}</div>
                  <div className="text-sm text-gray-500 font-body mt-0.5">{l.desc}</div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl">
                <Calendar className="w-8 h-8 text-primary-800" />
                <div>
                  <div className="font-semibold font-display text-primary-900">GATE Exam Date</div>
                  <div className="text-sm text-gray-500 font-body">Typically in February</div>
                </div>
              </div>
              <input type="date" value={data.targetDate}
                onChange={e => setData({ ...data, targetDate: e.target.value })}
                className="input-field" min={new Date().toISOString().split('T')[0]} />
              <p className="text-xs text-gray-400 font-body">This helps us calculate your readiness score and adjust your plan</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl">
                <Clock className="w-8 h-8 text-primary-800" />
                <div>
                  <div className="font-display font-bold text-3xl text-primary-900">{data.dailyHoursGoal}h</div>
                  <div className="text-sm text-gray-500 font-body">per day</div>
                </div>
              </div>
              <input type="range" min="1" max="12" step="0.5" value={data.dailyHoursGoal}
                onChange={e => setData({ ...data, dailyHoursGoal: parseFloat(e.target.value) })}
                className="w-full accent-primary-800" />
              <div className="flex justify-between text-xs text-gray-400 font-body">
                <span>1h (Light)</span><span>6h (Intense)</span><span>12h (Maximum)</span>
              </div>
              <div className={`p-3 rounded-xl text-sm font-body ${
                data.dailyHoursGoal >= 8 ? 'bg-red-50 text-red-700' :
                data.dailyHoursGoal >= 5 ? 'bg-emerald-50 text-emerald-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {data.dailyHoursGoal >= 8 ? '⚠️ Very intense — make sure to include breaks and rest days' :
                 data.dailyHoursGoal >= 5 ? '✅ Great! This is a solid study schedule' :
                 '💡 Consider adding more study time if possible'}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-2 gap-3">
              {styles.map(s => (
                <button key={s.value} type="button"
                  onClick={() => setData({ ...data, learningStyle: s.value })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    data.learningStyle === s.value ? 'border-primary-800 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="font-semibold font-display text-sm text-gray-800">{s.label}</div>
                  <div className="text-xs text-gray-500 font-body mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="btn-outline flex-1">Back</button>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={loading}
                className="btn-gold flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-primary-900/30 border-t-primary-900 rounded-full animate-spin" /> : null}
                Launch My Plan 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
