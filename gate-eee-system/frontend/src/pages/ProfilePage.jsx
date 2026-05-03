import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Award, Flame, Star, Target, Clock, Settings, ChevronRight, Zap, Shield } from 'lucide-react';

const ACHIEVEMENTS = [
  { id: 'first-test', name: 'First Test', icon: '🎯', desc: 'Completed your first mock test', unlocked: true },
  { id: 'streak-7', name: 'Week Warrior', icon: '🔥', desc: '7-day study streak', unlocked: true },
  { id: 'accuracy-80', name: 'Sharpshooter', icon: '🏹', desc: 'Achieved 80%+ accuracy', unlocked: false },
  { id: 'streak-30', name: 'Iron Discipline', icon: '⚔️', desc: '30-day study streak', unlocked: false },
  { id: 'mastered-5', name: 'Topic Master', icon: '🎓', desc: 'Mastered 5 topics', unlocked: true },
  { id: 'gate-champion', name: 'GATE Champion', icon: '🏆', desc: 'Complete all 6 stages', unlocked: false },
  { id: 'error-hunter', name: 'Error Hunter', icon: '🔍', desc: 'Resolved 10 error patterns', unlocked: false },
  { id: 'night-owl', name: 'Night Owl', icon: '🦉', desc: 'Studied past midnight', unlocked: true },
];

const RANK_THRESHOLDS = [
  { rank: 'Apprentice', min: 0, max: 499, color: 'text-gray-500' },
  { rank: 'Scholar', min: 500, max: 1499, color: 'text-blue-600' },
  { rank: 'Engineer', min: 1500, max: 3499, color: 'text-emerald-600' },
  { rank: 'Expert', min: 3500, max: 6999, color: 'text-violet-600' },
  { rank: 'Master', min: 7000, max: 11999, color: 'text-amber-600' },
  { rank: 'GATE Champion', min: 12000, max: 99999, color: 'text-gold-500' },
];

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({
    name: user?.name || '',
    dailyHoursGoal: user?.dailyHoursGoal || 4,
    targetDate: user?.targetDate ? new Date(user.targetDate).toISOString().split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save');
    } finally { setSaving(false); }
  };

  const currentRank = RANK_THRESHOLDS.find(r => (user?.xp || 0) >= r.min && (user?.xp || 0) <= r.max);
  const nextRank = RANK_THRESHOLDS.find(r => r.min > (user?.xp || 0));
  const xpProgress = nextRank
    ? (((user?.xp || 0) - (currentRank?.min || 0)) / (nextRank.min - (currentRank?.min || 0))) * 100
    : 100;

  const daysToExam = user?.targetDate
    ? Math.max(0, Math.floor((new Date(user.targetDate) - Date.now()) / 86400000))
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Profile hero */}
      <div className="card bg-gradient-to-br from-primary-800 to-primary-700 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl font-bold font-display border-2 border-white/30">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-2xl">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-gold-400" />
              <span className={`font-semibold text-gold-300`}>{user?.rank}</span>
            </div>
            <div className="text-primary-200 text-sm font-body mt-0.5">{user?.email}</div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-3xl text-gold-400">{user?.xp?.toLocaleString()}</div>
            <div className="text-primary-200 text-xs font-body">total XP</div>
            {daysToExam !== null && (
              <div className="mt-2 bg-white/10 px-3 py-1 rounded-lg text-xs font-body text-primary-200">
                {daysToExam} days to GATE
              </div>
            )}
          </div>
        </div>

        {/* XP Progress */}
        {nextRank && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-primary-200 font-body mb-1.5">
              <span>{currentRank?.rank}</span>
              <span>{nextRank.rank} at {nextRank.min.toLocaleString()} XP</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gold-400 rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%` }} />
            </div>
            <div className="text-xs text-primary-200 font-body mt-1">
              {(nextRank.min - (user?.xp || 0)).toLocaleString()} XP to {nextRank.rank}
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Flame, label: 'Streak', value: `${user?.currentStreak || 0}d`, color: 'text-orange-500 bg-orange-50' },
          { icon: Zap, label: 'Best Streak', value: `${user?.longestStreak || 0}d`, color: 'text-primary-800 bg-primary-50' },
          { icon: Target, label: 'Health', value: `${user?.healthScore || 0}%`, color: 'text-emerald-600 bg-emerald-50' },
          { icon: Clock, label: 'Daily Goal', value: `${user?.dailyHoursGoal || 4}h`, color: 'text-violet-600 bg-violet-50' },
        ].map((s, i) => (
          <div key={i} className="card text-center p-4">
            <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="font-display font-bold text-lg text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 font-body">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {['overview', 'achievements', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-white text-primary-800 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-display font-semibold text-gray-900 mb-4">Rank Progression</h3>
            <div className="space-y-3">
              {RANK_THRESHOLDS.map((r, i) => {
                const isCurrentOrPast = (user?.xp || 0) >= r.min;
                const isCurrent = r.rank === user?.rank;
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isCurrent ? 'bg-primary-50 border border-primary-100' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCurrentOrPast ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {isCurrentOrPast ? '✓' : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold font-display text-sm ${r.color}`}>{r.rank}</div>
                      <div className="text-xs text-gray-400 font-body">{r.min.toLocaleString()} – {r.max < 99999 ? r.max.toLocaleString() : '∞'} XP</div>
                    </div>
                    {isCurrent && <span className="badge bg-primary-800 text-white text-xs">Current</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="grid grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((a, i) => (
            <div key={i} className={`card transition-all ${!a.unlocked ? 'opacity-40 grayscale' : ''}`}>
              <div className="text-3xl mb-2">{a.icon}</div>
              <h4 className="font-display font-bold text-gray-900 text-sm">{a.name}</h4>
              <p className="text-xs text-gray-500 font-body mt-0.5">{a.desc}</p>
              {a.unlocked ? (
                <span className="badge bg-gold-100 text-gold-600 text-xs mt-2">Unlocked ✨</span>
              ) : (
                <span className="badge bg-gray-100 text-gray-400 text-xs mt-2">Locked 🔒</span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className="card space-y-5">
          <h3 className="font-display font-semibold text-gray-900">Study Preferences</h3>

          <div>
            <label className="text-sm font-medium text-gray-700 font-body mb-1.5 block">Display Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 font-body mb-1.5 block">
              Daily Study Goal: <span className="text-primary-800 font-bold">{form.dailyHoursGoal}h</span>
            </label>
            <input type="range" min="1" max="12" step="0.5" value={form.dailyHoursGoal}
              onChange={e => setForm({ ...form, dailyHoursGoal: parseFloat(e.target.value) })}
              className="w-full accent-primary-800" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 font-body mb-1.5 block">Target Exam Date</label>
            <input type="date" value={form.targetDate}
              onChange={e => setForm({ ...form, targetDate: e.target.value })}
              className="input-field" />
          </div>

          <button onClick={saveProfile} disabled={saving}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Settings className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}
