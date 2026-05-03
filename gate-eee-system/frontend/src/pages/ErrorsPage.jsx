import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, Filter, X, RefreshCw, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const ERROR_TYPES = {
  concept:      { label: 'Concept Error',       color: '#ef4444', bg: 'bg-red-50',    text: 'text-red-700',   icon: '🧠', desc: 'Fundamental misunderstanding' },
  formula:      { label: 'Formula Error',       color: '#f59e0b', bg: 'bg-amber-50',  text: 'text-amber-700', icon: '📐', desc: 'Wrong formula applied' },
  calculation:  { label: 'Calculation Error',   color: '#8b5cf6', bg: 'bg-violet-50', text: 'text-violet-700',icon: '🔢', desc: 'Arithmetic mistake' },
  reading:      { label: 'Reading Error',       color: '#06b6d4', bg: 'bg-cyan-50',   text: 'text-cyan-700',  icon: '👁️', desc: 'Misread question' },
  'time-pressure': { label: 'Time Pressure',   color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700',icon: '⏱️', desc: 'Rushed under pressure' },
};

function ErrorCard({ error, onResolve }) {
  const cfg = ERROR_TYPES[error.errorType] || ERROR_TYPES.concept;
  return (
    <div className={`card border-l-4 transition-all ${error.isResolved ? 'opacity-50' : ''}`}
      style={{ borderLeftColor: cfg.color }}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display font-semibold text-gray-900 text-sm">{error.topicId?.name || 'Unknown Topic'}</div>
              <div className="text-xs text-gray-500 font-body">{error.subjectId?.name}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`badge ${cfg.bg} ${cfg.text} text-xs`}>{cfg.label}</span>
              {error.frequency > 1 && (
                <span className="badge bg-red-100 text-red-700 text-xs font-mono">×{error.frequency}</span>
              )}
            </div>
          </div>
          {error.questionText && (
            <p className="text-xs text-gray-600 font-body mt-2 line-clamp-2 bg-gray-50 rounded-lg p-2">
              {error.questionText}
            </p>
          )}
          {error.errorDescription && (
            <p className="text-xs text-gray-500 font-body mt-1 italic">{error.errorDescription}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-400 font-body">
              Last: {new Date(error.lastOccurred || error.createdAt).toLocaleDateString()}
            </div>
            {!error.isResolved && (
              <button onClick={() => onResolve(error._id)}
                className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all">
                <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
              </button>
            )}
            {error.isResolved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Resolved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorsPage() {
  const [errors, setErrors] = useState([]);
  const [fingerprint, setFingerprint] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active | resolved | all
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { fetchErrors(); }, []);

  const fetchErrors = async () => {
    try {
      const params = filter === 'active' ? '?resolved=false' : filter === 'resolved' ? '?resolved=true' : '';
      const { data } = await api.get(`/errors${params}`);
      setErrors(data.errors || []);
      setFingerprint(data.fingerprint || {});
    } catch {
      setErrors(getMockErrors());
      setFingerprint({ concept: 5, formula: 8, calculation: 3, reading: 2, 'time-pressure': 1 });
    } finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); fetchErrors(); }, [filter]);

  const handleResolve = async (id) => {
    try {
      await api.put(`/errors/${id}/resolve`);
      toast.success('Error marked as resolved ✅');
      fetchErrors();
    } catch {
      toast.error('Failed to resolve error');
    }
  };

  const pieData = Object.entries(fingerprint)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({ name: ERROR_TYPES[k]?.label || k, value: v, color: ERROR_TYPES[k]?.color }));

  const barData = Object.entries(fingerprint).map(([k, v]) => ({
    type: ERROR_TYPES[k]?.icon + ' ' + (ERROR_TYPES[k]?.label?.split(' ')[0] || k),
    count: v,
    color: ERROR_TYPES[k]?.color,
  }));

  const filteredErrors = errors.filter(e => typeFilter === 'all' || e.errorType === typeFilter);
  const totalErrors = Object.values(fingerprint).reduce((s, v) => s + v, 0);
  const topErrorType = Object.entries(fingerprint).sort((a,b)=>b[1]-a[1])[0];

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-5xl mx-auto">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-primary-900">Error Intelligence System</h1>
        <p className="text-gray-500 text-sm font-body">Track, analyze, and eliminate your mistake patterns</p>
      </div>

      {/* Error Fingerprint */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-semibold text-gray-900 mb-4">Your Error Fingerprint</h3>
          {totalErrors === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-body text-sm">No errors logged yet. Take tests to see your error patterns.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="font-display font-semibold text-gray-900 mb-4">Error Frequency by Type</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Errors']} />
              <Bar dataKey="count" radius={[6,6,0,0]} maxBarSize={40}>
                {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Root cause insight */}
      {topErrorType && topErrorType[1] > 0 && (
        <div className={`card border border-dashed ${ERROR_TYPES[topErrorType[0]]?.bg} border-${ERROR_TYPES[topErrorType[0]]?.color}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{ERROR_TYPES[topErrorType[0]]?.icon}</span>
            <div>
              <div className="font-display font-semibold text-gray-900">
                Root Cause Alert: {ERROR_TYPES[topErrorType[0]]?.label}
              </div>
              <div className="text-sm text-gray-600 font-body mt-1">
                Your most common error type is <strong>{ERROR_TYPES[topErrorType[0]]?.label}</strong> ({topErrorType[1]} occurrences).{' '}
                {topErrorType[0] === 'concept' && 'This suggests gaps in fundamental understanding — revisit the core concepts, not just formulas.'}
                {topErrorType[0] === 'formula' && 'Build a formula sheet and practice deriving formulas from first principles.'}
                {topErrorType[0] === 'calculation' && 'Slow down on arithmetic. Double-check units and signs.'}
                {topErrorType[0] === 'reading' && 'Read each question twice before attempting. Underline key terms.'}
                {topErrorType[0] === 'time-pressure' && 'Practice more timed tests to build speed and confidence.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {['active', 'resolved', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f ? 'bg-white text-primary-800 shadow-sm' : 'text-gray-500'
              }`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setTypeFilter('all')}
            className={`badge cursor-pointer ${typeFilter === 'all' ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
            All Types
          </button>
          {Object.entries(ERROR_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setTypeFilter(typeFilter === k ? 'all' : k)}
              className={`badge cursor-pointer ${typeFilter === k ? 'text-white' : `${v.bg} ${v.text}`}`}
              style={typeFilter === k ? { background: v.color } : {}}>
              {v.icon} {v.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Error list */}
      <div className="space-y-3">
        {filteredErrors.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-body">
              {filter === 'active' ? 'No active errors! Great work.' : 'No errors found for this filter.'}
            </p>
          </div>
        ) : (
          filteredErrors.map(error => (
            <ErrorCard key={error._id} error={error} onResolve={handleResolve} />
          ))
        )}
      </div>
    </div>
  );
}

function getMockErrors() {
  return [
    { _id: 'e1', topicId: { name: 'Thevenin Theorem' }, subjectId: { name: 'Circuit Theory' }, errorType: 'formula', questionText: 'Find the Thevenin equivalent of the given network...', frequency: 3, lastOccurred: new Date(), isResolved: false },
    { _id: 'e2', topicId: { name: 'Laplace Transform' }, subjectId: { name: 'Signals & Control' }, errorType: 'concept', questionText: 'Find the inverse Laplace transform of 1/(s²+4)...', frequency: 2, lastOccurred: new Date(), isResolved: false },
    { _id: 'e3', topicId: { name: 'Induction Motor Slip' }, subjectId: { name: 'Electrical Machines' }, errorType: 'calculation', questionText: 'A 4-pole induction motor running at 1440 RPM. Find slip...', frequency: 1, lastOccurred: new Date(), isResolved: false },
    { _id: 'e4', topicId: { name: 'Buck Converter' }, subjectId: { name: 'Power Electronics' }, errorType: 'concept', questionText: 'For a buck converter with duty cycle 0.6...', frequency: 4, lastOccurred: new Date(), isResolved: false },
    { _id: 'e5', topicId: { name: 'Per Unit System' }, subjectId: { name: 'Power Systems' }, errorType: 'formula', questionText: 'Convert the impedance to per unit system...', frequency: 2, lastOccurred: new Date(), isResolved: true },
  ];
}
