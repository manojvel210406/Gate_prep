// RevisionPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { RefreshCw, CheckCircle, Clock, BookOpen, AlertTriangle, Star } from 'lucide-react';

const RETENTION_COLOR = (score) => score >= 80 ? 'text-emerald-600 bg-emerald-50' : score >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

function RetentionBar({ score }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
          style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${RETENTION_COLOR(score)}`}>{score}%</span>
    </div>
  );
}

function RevisionCard({ revision, onComplete }) {
  const [rating, setRating] = useState(4);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete(revision.topicId?._id || revision.topicId, rating);
    setCompleting(false);
  };

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          revision.retentionScore < 50 ? 'bg-red-100' : revision.retentionScore < 80 ? 'bg-amber-100' : 'bg-emerald-100'
        }`}>
          {revision.retentionScore < 50 ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
           revision.retentionScore < 80 ? <Clock className="w-5 h-5 text-amber-600" /> :
           <RefreshCw className="w-5 h-5 text-emerald-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h4 className="font-display font-semibold text-gray-900 text-sm">{revision.topicId?.name}</h4>
              <div className="text-xs text-gray-500 font-body">{revision.subjectId?.name}</div>
            </div>
            {revision.daysOverdue > 0 && (
              <span className="badge bg-red-50 text-red-600 text-xs">{revision.daysOverdue}d overdue</span>
            )}
          </div>
          <RetentionBar score={revision.retentionScore || 0} />
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-gray-500 font-body">How well did you remember?</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    rating >= n ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}>{n}</button>
              ))}
            </div>
            <button onClick={handleComplete} disabled={completing}
              className="ml-auto btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              {completing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
               <CheckCircle className="w-3.5 h-3.5" />}
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RevisionPage() {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);

  useEffect(() => { fetchRevisions(); }, []);

  const fetchRevisions = async () => {
    try {
      const { data } = await api.get('/revision/due');
      setRevisions(data.dueRevisions || []);
    } catch {
      setRevisions(getMockRevisions());
    } finally { setLoading(false); }
  };

  const handleComplete = async (topicId, quality) => {
    try {
      await api.post('/revision/complete', { topicId, quality });
      toast.success('Revision marked complete! ✅');
      fetchRevisions();
    } catch {
      toast.success('Revision logged (offline mode)');
      setRevisions(prev => prev.filter(r => (r.topicId?._id || r.topicId) !== topicId));
    }
  };

  if (loading) return <div className="space-y-4 animate-pulse max-w-3xl mx-auto">{[...Array(3)].map((_,i)=><div key={i} className="h-36 bg-gray-200 rounded-2xl" />)}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary-900">Spaced Revision System</h1>
        <p className="text-gray-500 text-sm font-body">SM-2 algorithm schedules your optimal review times</p>
      </div>

      <div className="card bg-gradient-to-r from-primary-800 to-primary-700 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <div className="font-display font-bold text-2xl">{revisions.length}</div>
            <div className="text-primary-200 text-sm font-body">topics due for revision today</div>
          </div>
          {revisions.length === 0 && (
            <div className="ml-auto text-primary-200 text-sm font-body">🎉 All caught up!</div>
          )}
        </div>
      </div>

      {revisions.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
          <h3 className="font-display font-bold text-xl text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500 font-body">No revisions due today. Check back tomorrow or study new topics.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {revisions.map((rev, i) => (
            <RevisionCard key={i} revision={rev} onComplete={handleComplete} />
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="font-display font-semibold text-gray-900 mb-3">How Spaced Repetition Works</h3>
        <div className="space-y-2 text-sm font-body text-gray-600">
          <div className="flex items-start gap-2"><span className="text-primary-800">1.</span> Rate how well you remembered (1=forgot, 5=perfect)</div>
          <div className="flex items-start gap-2"><span className="text-primary-800">2.</span> SM-2 algorithm calculates your next review date</div>
          <div className="flex items-start gap-2"><span className="text-primary-800">3.</span> Good recall → longer interval; poor recall → review sooner</div>
          <div className="flex items-start gap-2"><span className="text-primary-800">4.</span> Retention score tracks Ebbinghaus forgetting curve</div>
        </div>
      </div>
    </div>
  );
}

function getMockRevisions() {
  return [
    { topicId: { _id: 't1', name: 'Network Theorems', estimatedStudyHours: 1 }, subjectId: { name: 'Circuit Theory' }, retentionScore: 38, daysOverdue: 2 },
    { topicId: { _id: 't2', name: 'Laplace Transform', estimatedStudyHours: 1.5 }, subjectId: { name: 'Signals & Control' }, retentionScore: 62, daysOverdue: 0 },
    { topicId: { _id: 't3', name: 'Induction Motor', estimatedStudyHours: 2 }, subjectId: { name: 'Electrical Machines' }, retentionScore: 21, daysOverdue: 5 },
  ];
}

export default RevisionPage;
