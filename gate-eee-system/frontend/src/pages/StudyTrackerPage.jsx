import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Save, BookOpen, Clock, CheckSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const defaultTopic = () => ({ topicName: '', subjectName: '', hoursSpent: 0.5, questionsAttempted: 0, questionsCorrect: 0, notes: '' });

export default function StudyTrackerPage() {
  const [topics, setTopics] = useState([defaultTopic()]);
  const [totalHours, setTotalHours] = useState(2);
  const [focusRating, setFocusRating] = useState(3);
  const [energyLevel, setEnergyLevel] = useState('medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(true);

  const subjects = ['Circuit Theory', 'Signals & Control Systems', 'Electrical Machines', 'Power Electronics', 'Power Systems', 'Engineering Mathematics', 'Analog Circuits', 'Digital Circuits'];

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/study-logs?days=30');
      setLogs(data.logs || []);
    } catch { /* demo mode */ }
  };

  const addTopic = () => setTopics([...topics, defaultTopic()]);
  const removeTopic = (i) => setTopics(topics.filter((_, idx) => idx !== i));
  const updateTopic = (i, field, val) => {
    const updated = [...topics];
    updated[i][field] = val;
    setTopics(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (topics.some(t => !t.topicName || !t.subjectName)) return toast.error('Please fill topic and subject for all entries');
    setLoading(true);
    try {
      const { data } = await api.post('/study-logs', {
        totalHours, topicsCovered: topics, focusRating, energyLevel, notes
      });
      toast.success(`Logged! +${data.xpEarned} XP 🎉 Streak: ${data.streak} days 🔥`);
      setTopics([defaultTopic()]);
      setNotes('');
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log study session');
    } finally {
      setLoading(false);
    }
  };

  // Chart data — last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = logs.filter(l => l.date?.startsWith(dateStr));
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      hours: dayLogs.reduce((s, l) => s + l.totalHours, 0),
    };
  });

  const totalWeekHours = chartData.reduce((s, d) => s + d.hours, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary-900">Study Tracker</h1>
          <p className="text-gray-500 text-sm font-body">Log what you studied today to track progress</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-primary-800 text-sm font-medium hover:bg-primary-50 px-3 py-2 rounded-xl transition-all">
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showForm ? 'Hide Form' : 'Log Session'}
        </button>
      </div>

      {/* Weekly summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'This Week', value: `${totalWeekHours.toFixed(1)}h`, icon: Clock, color: 'text-primary-800' },
          { label: 'Total Topics Logged', value: logs.reduce((s, l) => s + (l.topicsCovered?.length || 0), 0), icon: BookOpen, color: 'text-emerald-600' },
          { label: 'Sessions This Month', value: logs.length, icon: CheckSquare, color: 'text-gold-500' },
        ].map((stat, i) => (
          <div key={i} className="card flex items-center gap-3">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <div className="font-display font-bold text-xl text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 font-body">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="card">
        <h3 className="font-display font-semibold text-gray-900 mb-4">Study Hours — This Week</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fontFamily: 'DM Sans' }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${v.toFixed(1)}h`, 'Study Hours']} />
            <Bar dataKey="hours" fill="#0A3D62" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Log Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-6 animate-slide-up">
          <h3 className="font-display font-semibold text-gray-900 text-lg">Log Today's Study Session</h3>

          {/* Total hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-body">Total Study Time Today</label>
            <div className="flex items-center gap-4">
              <input type="range" min="0.5" max="12" step="0.5" value={totalHours}
                onChange={e => setTotalHours(parseFloat(e.target.value))}
                className="flex-1 accent-primary-800" />
              <div className="w-16 text-center">
                <span className="font-display font-bold text-xl text-primary-800">{totalHours}</span>
                <span className="text-sm text-gray-500 ml-0.5 font-body">hrs</span>
              </div>
            </div>
          </div>

          {/* Topics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 font-body">Topics Covered</label>
              <button type="button" onClick={addTopic}
                className="flex items-center gap-1.5 text-primary-800 text-sm font-medium hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-all">
                <Plus className="w-4 h-4" /> Add Topic
              </button>
            </div>
            {topics.map((topic, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 font-display">Topic {i + 1}</span>
                  {topics.length > 1 && (
                    <button type="button" onClick={() => removeTopic(i)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-body mb-1 block">Topic Name</label>
                    <input value={topic.topicName} onChange={e => updateTopic(i, 'topicName', e.target.value)}
                      className="input-field text-sm" placeholder="e.g. KVL and KCL" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-body mb-1 block">Subject</label>
                    <select value={topic.subjectName} onChange={e => updateTopic(i, 'subjectName', e.target.value)}
                      className="input-field text-sm">
                      <option value="">Select subject...</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-body mb-1 block">Hours Spent</label>
                    <input type="number" min="0.25" max="12" step="0.25" value={topic.hoursSpent}
                      onChange={e => updateTopic(i, 'hoursSpent', parseFloat(e.target.value))}
                      className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-body mb-1 block">Questions (Attempted / Correct)</label>
                    <div className="flex gap-2">
                      <input type="number" min="0" value={topic.questionsAttempted}
                        onChange={e => updateTopic(i, 'questionsAttempted', parseInt(e.target.value) || 0)}
                        className="input-field text-sm" placeholder="Attempted" />
                      <input type="number" min="0" value={topic.questionsCorrect}
                        onChange={e => updateTopic(i, 'questionsCorrect', parseInt(e.target.value) || 0)}
                        className="input-field text-sm" placeholder="Correct" />
                    </div>
                  </div>
                </div>
                <input value={topic.notes} onChange={e => updateTopic(i, 'notes', e.target.value)}
                  className="input-field text-sm" placeholder="Notes about this topic (optional)" />
              </div>
            ))}
          </div>

          {/* Focus and Energy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 font-body mb-2 block">Focus Rating</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setFocusRating(n)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                      focusRating >= n ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>{n}</button>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-1 font-body">1 = Distracted, 5 = Laser focused</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 font-body mb-2 block">Energy Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map(e => (
                  <button key={e} type="button" onClick={() => setEnergyLevel(e)}
                    className={`py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                      energyLevel === e ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>{e}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 font-body mb-1.5 block">Session Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} className="input-field resize-none" placeholder="How did today's session go? Any challenges?" />
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base disabled:opacity-60">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving...' : 'Log Study Session'}
          </button>
        </form>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="card">
          <h3 className="font-display font-semibold text-gray-900 mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {logs.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold font-display text-gray-800 text-sm">
                      {new Date(log.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="badge bg-primary-50 text-primary-700">{log.totalHours}h</span>
                    <span className={`badge ${log.energyLevel === 'high' ? 'bg-emerald-50 text-emerald-700' : log.energyLevel === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      {log.energyLevel} energy
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 font-body mt-0.5">
                    {log.topicsCovered?.map(t => t.topicName).filter(Boolean).join(', ') || 'Topics logged'}
                  </div>
                </div>
                {log.xpEarned > 0 && (
                  <div className="text-xs font-bold text-gold-500 font-mono">+{log.xpEarned} XP</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
