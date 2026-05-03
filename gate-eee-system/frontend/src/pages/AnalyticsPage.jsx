import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { TrendingUp, Target, Zap, Brain, Award, AlertCircle } from 'lucide-react';

const MASTERY_COLORS = {
  mastered: '#10b981', strong: '#3b82f6', medium: '#f59e0b', weak: '#ef4444', 'not-started': '#d1d5db'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
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
};

function MetricCard({ label, value, unit, desc, color, icon: Icon }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500 font-body mb-1">{label}</div>
          <div className={`text-3xl font-bold font-display ${color}`}>
            {value}<span className="text-lg">{unit}</span>
          </div>
          <div className="text-xs text-gray-400 font-body mt-1">{desc}</div>
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600','50').replace('700','50').replace('500','50')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [cognitive, setCognitive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard').catch(() => ({ data: { dashboard: getMockDashboard() } })),
      api.get('/performance').catch(() => ({ data: { performances: getMockPerformances() } })),
      api.get('/analytics/cognitive').catch(() => ({ data: getMockCognitive() })),
    ]).then(([d, p, c]) => {
      setDashboard(d.data.dashboard);
      setPerformances(p.data.performances || getMockPerformances());
      setCognitive(c.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
      {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  // Build radar chart data from subject stats
  const radarData = (dashboard?.subjectStats || []).map(s => ({
    subject: s.subject.split(' ')[0],
    accuracy: s.avgAccuracy,
    mastery: s.avgMastery,
  }));

  // Mastery distribution
  const masteryDist = performances.reduce((acc, p) => {
    const lvl = p.masteryLevel || 'not-started';
    acc[lvl] = (acc[lvl] || 0) + 1;
    return acc;
  }, {});

  const masteryData = Object.entries(masteryDist).map(([k, v]) => ({
    level: k.replace('-', ' '),
    count: v,
    color: MASTERY_COLORS[k],
  }));

  const tabs = ['overview', 'subjects', 'topics', 'cognitive'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-primary-900">Analytics & Insights</h1>
        <p className="text-gray-500 text-sm font-body">Deep dive into your preparation performance</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === t ? 'bg-white text-primary-800 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}>{t}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Health Score" value={dashboard?.user?.healthScore ?? 72} unit="/100" desc="Overall prep readiness" color="text-emerald-600" icon={TrendingUp} />
            <MetricCard label="Avg Accuracy" value={Math.round(dashboard?.recentTests?.reduce((s,t)=>s+t.accuracy,0)/(dashboard?.recentTests?.length||1)||68)} unit="%" desc="Last 5 tests" color="text-primary-800" icon={Target} />
            <MetricCard label="Weekly Hours" value={dashboard?.weeklyStats?.hours ?? 18.5} unit="h" desc="This week" color="text-gold-500" icon={Zap} />
            <MetricCard label="Topics Mastered" value={performances.filter(p=>p.masteryLevel==='mastered'||p.masteryLevel==='strong').length} unit="" desc="Strong + Mastered" color="text-violet-600" icon={Award} />
          </div>

          {/* Radar + Mastery Distribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-display font-semibold text-gray-900 mb-4">Subject Performance Radar</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#0A3D62" fill="#0A3D62" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Mastery" dataKey="mastery" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.1} strokeWidth={2} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12, fontFamily: 'DM Sans' }}>{v}</span>} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-display font-semibold text-gray-900 mb-4">Topic Mastery Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={masteryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="level" tick={{ fontSize: 11, textTransform: 'capitalize' }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, 'Topics']} />
                  <Bar dataKey="count" radius={[6,6,0,0]} maxBarSize={50}>
                    {masteryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3">
                {Object.entries(MASTERY_COLORS).map(([k, color]) => (
                  <div key={k} className="flex items-center gap-1.5 text-xs text-gray-600 font-body capitalize">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    {k.replace('-', ' ')} ({masteryDist[k] || 0})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress over time */}
          {dashboard?.studyHoursTrend?.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-gray-900 mb-4">30-Day Study Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dashboard.studyHoursTrend}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A3D62" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0A3D62" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="hours" name="Hours" stroke="#0A3D62" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {(dashboard?.subjectStats || getMockSubjectStats()).map((s, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold text-gray-900">{s.subject}</h3>
                <div className="flex gap-3">
                  <span className="badge bg-primary-50 text-primary-700">{s.avgAccuracy}% accuracy</span>
                  <span className={`badge ${s.avgMastery >= 70 ? 'bg-emerald-50 text-emerald-700' : s.avgMastery >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {s.avgMastery}% mastery
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1 font-body">
                    <span>Accuracy</span><span>{s.avgAccuracy}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.avgAccuracy}%`, background: s.avgAccuracy >= 70 ? '#10b981' : s.avgAccuracy >= 40 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1 font-body">
                    <span>Mastery</span><span>{s.avgMastery}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-800 rounded-full transition-all duration-700"
                      style={{ width: `${s.avgMastery}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="space-y-3">
          {performances.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-body">No topic performance data yet. Take some tests to see insights here.</p>
            </div>
          ) : (
            performances.map((p, i) => (
              <div key={i} className="card flex items-center gap-4">
                <div className={`w-2 h-12 rounded-full flex-shrink-0`}
                  style={{ background: MASTERY_COLORS[p.masteryLevel] || '#d1d5db' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-display text-gray-800 text-sm">{p.topicId?.name || 'Topic'}</div>
                  <div className="text-xs text-gray-500 font-body">{p.subjectId?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-gray-800">{p.accuracy}%</div>
                  <div className="text-xs text-gray-400 font-body capitalize">{p.masteryLevel?.replace('-',' ')}</div>
                </div>
                <div className="w-24">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.masteryScore}%`, background: MASTERY_COLORS[p.masteryLevel] }} />
                  </div>
                  <div className="text-xs text-gray-400 text-right mt-0.5 font-mono">{p.masteryScore}%</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'cognitive' && cognitive && (
        <div className="space-y-6">
          <div className={`card border-2 ${
            cognitive.cognitiveState === 'burned-out' ? 'border-red-200 bg-red-50' :
            cognitive.cognitiveState === 'fatigued' ? 'border-amber-200 bg-amber-50' :
            cognitive.cognitiveState === 'focused' ? 'border-emerald-200 bg-emerald-50' :
            'border-primary-200 bg-primary-50'
          }`}>
            <div className="flex items-start gap-4">
              <div className="text-4xl">{
                cognitive.cognitiveState === 'burned-out' ? '😮‍💨' :
                cognitive.cognitiveState === 'fatigued' ? '😴' :
                cognitive.cognitiveState === 'focused' ? '🎯' : '⚡'
              }</div>
              <div>
                <div className="font-display font-bold text-lg text-gray-900 capitalize">
                  Cognitive State: {cognitive.cognitiveState}
                </div>
                <div className="text-sm text-gray-600 font-body mt-1">
                  Avg {cognitive.avgDailyHours}h/day · {cognitive.isPerformanceDropping ? '⚠️ Performance declining' : '✅ Performance stable'}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" /> AI Recommendations
            </h3>
            <ul className="space-y-3">
              {cognitive.recommendations?.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-body text-gray-700">
                  <div className="w-5 h-5 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockDashboard() {
  return {
    user: { healthScore: 72, cognitiveState: 'focused' },
    studyHoursTrend: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13-i)*86400000).toISOString().split('T')[0],
      hours: Math.round(Math.random()*4+1),
    })),
    subjectStats: getMockSubjectStats(),
    weakTopics: [],
    dueRevisions: [],
    weeklyStats: { hours: '18.5', activeDays: 5, questionsAttempted: 124 },
    recentTests: [{ accuracy: 72 }, { accuracy: 68 }, { accuracy: 75 }],
  };
}

function getMockSubjectStats() {
  return [
    { subject: 'Circuit Theory', avgAccuracy: 78, avgMastery: 72 },
    { subject: 'Signals & Control', avgAccuracy: 52, avgMastery: 45 },
    { subject: 'Electrical Machines', avgAccuracy: 65, avgMastery: 58 },
    { subject: 'Power Electronics', avgAccuracy: 41, avgMastery: 34 },
    { subject: 'Power Systems', avgAccuracy: 55, avgMastery: 48 },
    { subject: 'Engineering Math', avgAccuracy: 70, avgMastery: 65 },
  ];
}

function getMockPerformances() {
  return [
    { topicId: { name: 'KVL and KCL' }, subjectId: { name: 'Circuit Theory' }, accuracy: 85, masteryLevel: 'strong', masteryScore: 82 },
    { topicId: { name: 'Network Theorems' }, subjectId: { name: 'Circuit Theory' }, accuracy: 72, masteryLevel: 'medium', masteryScore: 68 },
    { topicId: { name: 'Laplace Transform' }, subjectId: { name: 'Signals & Control' }, accuracy: 58, masteryLevel: 'medium', masteryScore: 52 },
    { topicId: { name: 'DC-DC Converters' }, subjectId: { name: 'Power Electronics' }, accuracy: 32, masteryLevel: 'weak', masteryScore: 28 },
    { topicId: { name: 'Fault Analysis' }, subjectId: { name: 'Power Systems' }, accuracy: 25, masteryLevel: 'weak', masteryScore: 22 },
    { topicId: { name: 'Linear Algebra' }, subjectId: { name: 'Engineering Math' }, accuracy: 88, masteryLevel: 'mastered', masteryScore: 91 },
  ];
}

function getMockCognitive() {
  return {
    cognitiveState: 'focused',
    avgDailyHours: '4.2',
    isPerformanceDropping: false,
    recommendations: [
      'Tackle difficult topics — your mind is sharp right now',
      'Schedule a full mock test this weekend',
      'Start new topics in Power Electronics this week',
    ],
  };
}
