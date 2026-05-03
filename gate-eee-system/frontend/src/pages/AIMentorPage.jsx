import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User, Zap, RefreshCw, Lightbulb, Target, TrendingUp, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { icon: Target, label: 'What to study today?', text: 'What should I study today based on my performance?' },
  { icon: AlertCircle, label: 'My weak areas', text: 'Show me my weak areas and how to fix them' },
  { icon: TrendingUp, label: 'Strategy advice', text: 'Give me a strategy for GATE EEE preparation' },
  { icon: Brain, label: 'If I were you...', text: 'If I were you, what would you do right now to improve?' },
  { icon: Lightbulb, label: 'Analyze my errors', text: 'Analyze my error patterns and tell me what they reveal' },
  { icon: Zap, label: 'Final phase tips', text: 'What should I do in the last 15 days before GATE?' },
];

// Dummy AlertCircle import fix
function AlertCircle(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <div className="w-8 h-8 bg-primary-800 rounded-xl flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-gold-400" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-card border border-gray-100">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-gray-200' : 'bg-primary-800'}`}>
        {isUser ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-gold-400" />}
      </div>
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm font-body leading-relaxed shadow-sm ${
          isUser
            ? 'bg-primary-800 text-white rounded-br-sm'
            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
        }`}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-primary-900 prose-strong:text-primary-800 prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400 font-body px-1">
          {new Date(msg.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function AIMentorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your **GATE EEE AI Mentor**.\n\nI have access to your performance data, study history, and weak areas. Ask me anything — from what to study today, to personalized strategy advice.\n\nTry one of the quick prompts below, or type your own question!`,
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    api.get('/ai/daily-plan').then(r => setPlan(r.data)).catch(() => {});
  }, []);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/ai/chat', { message: msg, history });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
        source: data.source,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I'm having trouble connecting right now. Here's what I can tell you based on your profile:\n\n**Health Score:** ${user?.healthScore ?? '—'}/100\n**Current Streak:** ${user?.currentStreak ?? 0} days\n**Rank:** ${user?.rank ?? 'Apprentice'}\n\nTry asking me again in a moment!`,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared! I'm still here. What would you like to know, ${user?.name?.split(' ')[0]}?`,
      timestamp: Date.now(),
    }]);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary-800" /> AI Mentor
          </h1>
          <p className="text-gray-500 text-sm font-body">Personalized guidance powered by your performance data</p>
        </div>
        <button onClick={clearChat} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" /> Clear
        </button>
      </div>

      {/* Daily plan banner */}
      {plan?.plan?.length > 0 && (
        <div className="flex-shrink-0 bg-gradient-to-r from-primary-800 to-primary-700 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-semibold font-display">Today's AI-Generated Plan</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {plan.plan.map((item, i) => (
              <div key={i} className="flex-shrink-0 bg-white/10 rounded-xl px-3 py-2 text-xs font-body">
                <div className="font-semibold text-white">{item.time}</div>
                <div className="text-primary-200 mt-0.5">{item.activity.length > 35 ? item.activity.slice(0, 35) + '…' : item.activity}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chat window */}
        <div className="flex-1 flex flex-col card p-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="border-t border-gray-100 p-3 flex gap-2 overflow-x-auto flex-shrink-0 bg-gray-50/50">
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p.text)} disabled={loading}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                <p.icon className="w-3 h-3" />
                {p.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask your mentor anything... (Enter to send)"
                className="flex-1 input-field resize-none min-h-[44px] max-h-32 py-3 leading-relaxed text-sm"
                style={{ overflow: 'auto' }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 bg-primary-800 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Side panel — user context */}
        <div className="w-56 flex-shrink-0 space-y-4 hidden xl:block">
          <div className="card">
            <h4 className="font-display font-semibold text-gray-900 text-sm mb-3">Your Profile</h4>
            <div className="space-y-2 text-sm font-body">
              {[
                { label: 'Rank', value: user?.rank },
                { label: 'XP', value: user?.xp?.toLocaleString() },
                { label: 'Streak', value: `${user?.currentStreak ?? 0} days 🔥` },
                { label: 'Stage', value: `${user?.currentStage}/6` },
                { label: 'Health', value: `${user?.healthScore ?? 0}/100` },
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400">{s.label}</span>
                  <span className="font-semibold text-primary-900 font-mono text-xs">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4 className="font-display font-semibold text-gray-900 text-sm mb-3">Mentor Tips</h4>
            <div className="space-y-2 text-xs text-gray-600 font-body">
              <p>💡 Be specific — "Why am I struggling with Thevenin's theorem?" gets better answers than "help me"</p>
              <p>🎯 Ask for strategies tailored to your exam date</p>
              <p>📊 The mentor uses your real performance data to personalize advice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
