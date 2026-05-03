import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Unlock, ChevronDown, ChevronUp, BookOpen, Star, AlertCircle, CheckCircle, Zap } from 'lucide-react';

const STAGE_LABELS = {
  1: 'Foundation',
  2: 'Core Analysis',
  3: 'Machines',
  4: 'Power Electronics',
  5: 'Power Systems',
  6: 'GATE Mode',
};

const MASTERY_CONFIG = {
  mastered:    { label: 'Mastered',     color: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  strong:      { label: 'Strong',       color: 'bg-blue-100 text-blue-700',       bar: 'bg-blue-500' },
  medium:      { label: 'Medium',       color: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-500' },
  weak:        { label: 'Weak',         color: 'bg-red-100 text-red-700',         bar: 'bg-red-500' },
  'not-started':{ label: 'Not Started', color: 'bg-gray-100 text-gray-500',       bar: 'bg-gray-300' },
};

function TopicRow({ topic }) {
  const cfg = MASTERY_CONFIG[topic.masteryLevel] || MASTERY_CONFIG['not-started'];
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className={`w-2 h-8 rounded-full flex-shrink-0 ${cfg.bar}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold font-display text-gray-800 truncate">{topic.name}</span>
          {topic.isFrequentlyAsked && (
            <span className="badge bg-gold-100 text-gold-600 text-xs">🔥 PYQ</span>
          )}
          {topic.priority === 'critical' && (
            <span className="badge bg-red-50 text-red-600 text-xs">Critical</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-gray-400 font-body">{topic.estimatedStudyHours}h est.</span>
          <span className={`badge text-xs ${cfg.color}`}>{cfg.label}</span>
          {topic.accuracy > 0 && (
            <span className="text-xs font-mono text-gray-500">{topic.accuracy}% acc</span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="w-20">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${cfg.bar} rounded-full transition-all duration-500`}
              style={{ width: `${topic.masteryScore || 0}%` }} />
          </div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">{topic.masteryScore || 0}%</div>
        </div>
      </div>
    </div>
  );
}

function SubjectCard({ subject, topics, isOpen, onToggle, userStage }) {
  const isLocked = subject.stageLevel > userStage;
  const topicsByMastery = topics.reduce((acc, t) => {
    acc[t.masteryLevel] = (acc[t.masteryLevel] || 0) + 1;
    return acc;
  }, {});
  const masteredCount = (topicsByMastery.mastered || 0) + (topicsByMastery.strong || 0);
  const progress = topics.length > 0 ? Math.round((masteredCount / topics.length) * 100) : 0;

  return (
    <div className={`card transition-all duration-200 ${isLocked ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4 cursor-pointer" onClick={isLocked ? undefined : onToggle}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${subject.color}15`, border: `2px solid ${subject.color}30` }}>
          {subject.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-gray-900">{subject.name}</h3>
            <span className="badge bg-primary-50 text-primary-700 text-xs">Stage {subject.stageLevel}</span>
            <span className="badge bg-gray-100 text-gray-600 text-xs">{STAGE_LABELS[subject.stageLevel]}</span>
            {isLocked && <span className="badge bg-red-50 text-red-500 text-xs flex items-center gap-1"><Lock className="w-3 h-3" />Locked</span>}
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <div className="flex-1">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, background: subject.color }} />
              </div>
            </div>
            <span className="text-xs text-gray-500 font-body flex-shrink-0">{masteredCount}/{topics.length} topics strong</span>
            <span className="badge bg-gold-100 text-gold-600 text-xs">{subject.weightageInGATE}% GATE</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="font-bold text-lg font-display" style={{ color: subject.color }}>{subject.userMastery || 0}%</div>
            <div className="text-xs text-gray-400 font-body">mastery</div>
          </div>
          {!isLocked && (isOpen
            ? <ChevronUp className="w-5 h-5 text-gray-400" />
            : <ChevronDown className="w-5 h-5 text-gray-400" />)}
          {isLocked && <Lock className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isOpen && !isLocked && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-up">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {Object.entries({ mastered: 'Mastered', strong: 'Strong', medium: 'Medium', weak: 'Weak' }).map(([k, label]) => (
              <div key={k} className={`text-center p-2 rounded-xl ${MASTERY_CONFIG[k].color}`}>
                <div className="font-bold font-display text-lg">{topicsByMastery[k] || 0}</div>
                <div className="text-xs font-body">{label}</div>
              </div>
            ))}
          </div>
          {/* Topics list */}
          <div className="space-y-2">
            {topics.length === 0 ? (
              <div className="text-center py-6 text-gray-400 font-body text-sm">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No topics loaded. Make sure the database is seeded.
              </div>
            ) : (
              topics.map(t => <TopicRow key={t._id} topic={t} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [openSubject, setOpenSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | weak | strong | locked

  useEffect(() => {
    Promise.all([
      api.get('/subjects').catch(() => ({ data: { subjects: getMockSubjects() } })),
      api.get('/topics').catch(() => ({ data: { topics: getMockTopics() } })),
    ]).then(([sRes, tRes]) => {
      const subs = sRes.data.subjects || [];
      const tops = tRes.data.topics || [];
      setSubjects(subs);
      const bySubject = {};
      tops.forEach(t => {
        const sId = t.subjectId?._id || t.subjectId;
        if (!bySubject[sId]) bySubject[sId] = [];
        bySubject[sId].push(t);
      });
      setTopicsBySubject(bySubject);
      // Auto-open current stage subject
      if (subs.length > 0) {
        const currentSub = subs.find(s => s.stageLevel === user?.currentStage);
        if (currentSub) setOpenSubject(currentSub._id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const filteredSubjects = subjects.filter(s => {
    if (filter === 'locked') return s.stageLevel > (user?.currentStage || 1);
    if (filter === 'unlocked') return s.stageLevel <= (user?.currentStage || 1);
    if (filter === 'weak') return (s.userMastery || 0) < 50;
    if (filter === 'strong') return (s.userMastery || 0) >= 70;
    return true;
  });

  const totalTopics = Object.values(topicsBySubject).reduce((s, arr) => s + arr.length, 0);
  const strongTopics = Object.values(topicsBySubject).flat()
    .filter(t => t.masteryLevel === 'strong' || t.masteryLevel === 'mastered').length;
  const weakTopics = Object.values(topicsBySubject).flat().filter(t => t.masteryLevel === 'weak').length;

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-primary-900">EEE Learning Flow</h1>
        <p className="text-gray-500 text-sm font-body">6-stage structured curriculum — unlock as you master each level</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="font-display font-bold text-2xl text-primary-800">{totalTopics}</div>
          <div className="text-sm text-gray-500 font-body">Total Topics</div>
        </div>
        <div className="card text-center">
          <div className="font-display font-bold text-2xl text-emerald-600">{strongTopics}</div>
          <div className="text-sm text-gray-500 font-body">Strong / Mastered</div>
        </div>
        <div className="card text-center">
          <div className="font-display font-bold text-2xl text-red-500">{weakTopics}</div>
          <div className="text-sm text-gray-500 font-body">Need Work</div>
        </div>
      </div>

      {/* Stage progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-gray-900">Stage Progress</h3>
          <span className="text-sm text-primary-800 font-medium font-body">Stage {user?.currentStage}/6</span>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4,5,6].map(stage => (
            <div key={stage} className="flex-1 relative">
              <div className={`h-3 rounded-full ${
                stage < (user?.currentStage || 1) ? 'bg-primary-800' :
                stage === (user?.currentStage || 1) ? 'bg-gold-400' :
                'bg-gray-200'
              }`} />
              <div className={`text-xs text-center mt-1 font-body ${
                stage === (user?.currentStage || 1) ? 'text-gold-600 font-semibold' : 'text-gray-400'
              }`}>{stage}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500 font-body">
          Current: <span className="text-primary-800 font-semibold">{STAGE_LABELS[user?.currentStage]}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'unlocked', 'weak', 'strong', 'locked'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{f}</button>
        ))}
      </div>

      {/* Subject cards */}
      <div className="space-y-4">
        {filteredSubjects.map(subject => (
          <SubjectCard
            key={subject._id}
            subject={subject}
            topics={topicsBySubject[subject._id] || []}
            isOpen={openSubject === subject._id}
            onToggle={() => setOpenSubject(prev => prev === subject._id ? null : subject._id)}
            userStage={user?.currentStage || 1}
          />
        ))}
      </div>
    </div>
  );
}

function getMockSubjects() {
  return [
    { _id: 's1', name: 'Engineering Mathematics', code: 'MATH', stageLevel: 1, color: '#0A3D62', icon: '📐', weightageInGATE: 13, estimatedHours: 45, userMastery: 65, userAccuracy: 70, isUnlocked: true },
    { _id: 's2', name: 'Circuit Theory', code: 'CT', stageLevel: 1, color: '#1e40af', icon: '⚡', weightageInGATE: 15, estimatedHours: 60, userMastery: 72, userAccuracy: 78, isUnlocked: true },
    { _id: 's3', name: 'Signals & Control Systems', code: 'SCS', stageLevel: 2, color: '#065f46', icon: '📡', weightageInGATE: 18, estimatedHours: 70, userMastery: 45, userAccuracy: 52, isUnlocked: true },
    { _id: 's4', name: 'Electrical Machines', code: 'EM', stageLevel: 3, color: '#92400e', icon: '🔧', weightageInGATE: 14, estimatedHours: 55, userMastery: 38, userAccuracy: 45, isUnlocked: false },
    { _id: 's5', name: 'Power Electronics', code: 'PE', stageLevel: 4, color: '#7c3aed', icon: '🔋', weightageInGATE: 12, estimatedHours: 50, userMastery: 0, userAccuracy: 0, isUnlocked: false },
    { _id: 's6', name: 'Power Systems', code: 'PS', stageLevel: 5, color: '#be185d', icon: '🏭', weightageInGATE: 16, estimatedHours: 65, userMastery: 0, userAccuracy: 0, isUnlocked: false },
  ];
}

function getMockTopics() {
  return [
    { _id: 't1', name: 'KVL and KCL', subjectId: { _id: 's2' }, masteryLevel: 'strong', masteryScore: 82, accuracy: 85, estimatedStudyHours: 4, isFrequentlyAsked: true, priority: 'critical' },
    { _id: 't2', name: 'Network Theorems', subjectId: { _id: 's2' }, masteryLevel: 'medium', masteryScore: 62, accuracy: 68, estimatedStudyHours: 6, isFrequentlyAsked: true, priority: 'critical' },
    { _id: 't3', name: 'Transient Analysis', subjectId: { _id: 's2' }, masteryLevel: 'weak', masteryScore: 34, accuracy: 40, estimatedStudyHours: 8, isFrequentlyAsked: true, priority: 'high' },
    { _id: 't4', name: 'Linear Algebra', subjectId: { _id: 's1' }, masteryLevel: 'mastered', masteryScore: 91, accuracy: 88, estimatedStudyHours: 6, isFrequentlyAsked: true, priority: 'critical' },
    { _id: 't5', name: 'Differential Equations', subjectId: { _id: 's1' }, masteryLevel: 'strong', masteryScore: 78, accuracy: 80, estimatedStudyHours: 5, isFrequentlyAsked: true, priority: 'critical' },
    { _id: 't6', name: 'Laplace Transform', subjectId: { _id: 's3' }, masteryLevel: 'medium', masteryScore: 52, accuracy: 58, estimatedStudyHours: 6, isFrequentlyAsked: true, priority: 'critical' },
    { _id: 't7', name: 'Control Systems Stability', subjectId: { _id: 's3' }, masteryLevel: 'weak', masteryScore: 28, accuracy: 35, estimatedStudyHours: 5, isFrequentlyAsked: false, priority: 'high' },
  ];
}
