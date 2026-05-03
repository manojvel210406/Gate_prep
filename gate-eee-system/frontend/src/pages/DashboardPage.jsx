import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  TrendingUp, Flame, Target, Brain, AlertCircle, ChevronRight,
  BookOpen, Clock, CheckCircle, Zap, Award, RefreshCw, ArrowUp,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ─── Sub-components ───────────────────────────────────────────────────────

function HealthScoreRing({ score = 0 }) {
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="120" height="120" className="drop-shadow-sm">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f0f0f0" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" className="health-ring transition-all duration-1000" />
      <text x="60" y="55" textAnchor="middle" className="text-2xl font-bold"
        fill="#0A3D62" style={{ fontSize: 22, fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
        {score}
      </text>
      <text x="60" y="72" textAnchor="middle" fill="#888"
        style={{ fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}>
        /100
      </text>
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-800',
    gold: 'bg-gold-100 text-gold-500',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold font-display text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 font-body">{label}</div>
        {sub && <div className="text-xs text-gray-400 font-body">{sub}</div>}
      </div>
    </div>
  );
}

function WeakTopicBadge({ topic, subject, score }) {
  return (
    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
      <div>
        <div className="text-sm font-semibold font-display text-gray-800">{topic}</div>
        <div className="text-xs text-gray-500 font-body">{subject}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-red-600 font-mono">{score}%</div>
        <div className="text-xs text-red-400 font-body">mastery</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-3 text-sm font-body">
        <div className="text-gray-500 mb-1">{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.unit || ''}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, planRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/ai/daily-plan'),
        ]);
        setData(dashRes.data.dashboard);
        setPlan(planRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        // Use mock data for demo
        setData(getMockData(user));
        setPlan(getMockPlan(user));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stageNames = {1:'Circuit Theory', 2:'Signals & Control', 3:'Electrical Machines', 4:'Power Electronics', 5:'Power Systems', 6:'GATE Mode'};

  return (
    <div className="space-y-6 animate-slide-up max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm font-body mt-0.5">
            Stage {user?.currentStage}: <span className="text-primary-800 font-medium">{stageNames[user?.currentStage]}</span>
            {data?.user?.cognitiveState && <span className="ml-2">· You're feeling <span className="font-medium">{data.user.cognitiveState}</span></span>}
          </p>
        </div>
        {user?.currentStreak > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl border border-orange-100">
            <Flame className="w-4 h-4 fire-icon" />
            <span className="font-bold font-display">{user.currentStreak}</span>
            <span className="text-sm font-body">day streak</span>
          </div>
        )}
      </div>

      {/* Next Best Action Banner */}
      {plan?.nextBestAction && (
        <div className="bg-gradient-to-r from-primary-800 to-primary-700 rounded-2xl p-5 text-white flex items-center gap-4">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-gold-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-primary-200 font-body font-medium uppercase tracking-wide">Next Best Action</div>
            <div className="font-display font-semibold text-base mt-0.5">{plan.nextBestAction.activity}</div>
            <div className="text-primary-200 text-sm font-body">{plan.nextBestAction.time} recommended</div>
          </div>
          <button className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1">
            Start <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Health Score" value={`${data?.user?.healthScore ?? 0}`} sub="Overall readiness" color="primary" />
        <StatCard icon={Clock} label="Weekly Hours" value={`${data?.weeklyStats?.hours ?? 0}h`} sub={`${data?.weeklyStats?.activeDays ?? 0} active days`} color="green" />
        <StatCard icon={CheckCircle} label="Questions" value={data?.weeklyStats?.questionsAttempted ?? 0} sub="This week" color="amber" />
        <StatCard icon={Award} label="XP Points" value={user?.xp?.toLocaleString() ?? 0} sub={user?.rank} color="gold" />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Score + Study Chart — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Study Hours Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-gray-900">Study Hours — Last 30 Days</h3>
              <span className="badge bg-primary-50 text-primary-700">{data?.weeklyStats?.hours ?? 0}h this week</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data?.studyHoursTrend ?? []}>
                <defs>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A3D62" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0A3D62" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'DM Sans' }}
                  tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="hours" name="Hours" stroke="#0A3D62" strokeWidth={2}
                  fill="url(#hoursGrad)" dot={{ r: 3, fill: '#0A3D62' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy Trend */}
          {data?.accuracyTrend?.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-gray-900 mb-4">Test Accuracy Trend</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data.accuracyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#D4AF37"
                    strokeWidth={2.5} dot={{ r: 4, fill: '#D4AF37' }} unit="%" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject Performance */}
          {data?.subjectStats?.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.subjectStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="subject" tick={{ fontSize: 11, width: 120 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgAccuracy" name="Accuracy" radius={[0, 6, 6, 0]}>
                    {data.subjectStats.map((entry, i) => (
                      <Cell key={i} fill={entry.avgAccuracy >= 70 ? '#10b981' : entry.avgAccuracy >= 40 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Health Score Ring */}
          <div className="card text-center">
            <h3 className="font-display font-semibold text-gray-900 mb-3">Preparation Health</h3>
            <div className="flex justify-center">
              <HealthScoreRing score={data?.user?.healthScore ?? 0} />
            </div>
            <div className={`mt-3 text-sm font-medium font-body ${
              (data?.user?.healthScore ?? 0) >= 70 ? 'text-emerald-600' :
              (data?.user?.healthScore ?? 0) >= 40 ? 'text-amber-600' : 'text-red-500'
            }`}>
              {(data?.user?.healthScore ?? 0) >= 70 ? '🎯 On Track!' :
               (data?.user?.healthScore ?? 0) >= 40 ? '📈 Improving' : '⚠️ Needs Attention'}
            </div>
            {data?.user?.cognitiveState && (
              <div className="mt-2 badge bg-primary-50 text-primary-700">
                State: {data.user.cognitiveState}
              </div>
            )}
          </div>

          {/* Weak Topics */}
          {data?.weakTopics?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="font-display font-semibold text-gray-900">Weak Areas</h3>
              </div>
              <div className="space-y-2">
                {data.weakTopics.slice(0, 4).map((t, i) => (
                  <WeakTopicBadge key={i} topic={t.topic} subject={t.subject} score={t.masteryScore} />
                ))}
              </div>
            </div>
          )}

          {/* Due Revisions */}
          {data?.dueRevisions?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-amber-500" />
                <h3 className="font-display font-semibold text-gray-900">Due for Revision</h3>
              </div>
              <div className="space-y-2">
                {data.dueRevisions.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl">
                    <div>
                      <div className="text-sm font-semibold font-display text-gray-800">{r.topic}</div>
                      <div className="text-xs text-gray-500 font-body">{r.subject}</div>
                    </div>
                    <div className="text-xs text-amber-600 font-bold font-mono">
                      {r.retentionScore}% retention
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Plan */}
          {plan?.plan?.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-gray-900 mb-3">Today's Plan</h3>
              <div className="space-y-2">
                {plan.plan.map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
                    i === 0 ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      i === 0 ? 'bg-primary-800 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium font-body text-gray-800 leading-tight">{item.activity}</div>
                      <div className={`text-xs font-mono mt-0.5 ${i === 0 ? 'text-primary-600' : 'text-gray-400'}`}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
      <div className="h-20 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-56 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// Mock data for demo when backend not connected
function getMockData(user) {
  return {
    user: { healthScore: 72, cognitiveState: 'focused', currentStreak: 5, rank: user?.rank || 'Scholar', xp: user?.xp || 450 },
    studyHoursTrend: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
      hours: Math.round(Math.random() * 4 + 1),
    })),
    accuracyTrend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      accuracy: Math.round(Math.random() * 25 + 55),
    })),
    subjectStats: [
      { subject: 'Circuit Theory', avgAccuracy: 78 },
      { subject: 'Signals & Control', avgAccuracy: 52 },
      { subject: 'Electrical Machines', avgAccuracy: 65 },
      { subject: 'Power Electronics', avgAccuracy: 41 },
    ],
    weakTopics: [
      { topic: 'DC-DC Converters', subject: 'Power Electronics', masteryScore: 32 },
      { topic: 'State Space Analysis', subject: 'Signals & Control', masteryScore: 38 },
      { topic: 'Fault Analysis', subject: 'Power Systems', masteryScore: 25 },
    ],
    dueRevisions: [
      { topic: 'Network Theorems', subject: 'Circuit Theory', retentionScore: 54 },
      { topic: 'Laplace Transform', subject: 'Signals', retentionScore: 67 },
    ],
    weeklyStats: { hours: '18.5', activeDays: 5, questionsAttempted: 124 },
    recentTests: [],
  };
}
function getMockPlan(user) {
  return {
    plan: [
      { activity: 'Study: DC-DC Converters (weak area)', time: '1.5h', type: 'learning' },
      { activity: 'Practice Test — Power Electronics (20 Qs)', time: '45min', type: 'practice' },
      { activity: 'Spaced Revision: Network Theorems', time: '30min', type: 'revision' },
      { activity: 'Error Log Review', time: '20min', type: 'error-review' },
    ],
    nextBestAction: { activity: 'Study: DC-DC Converters (weak area)', time: '1.5h' },
    cognitiveState: 'focused',
  };
}
