import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', level: 'beginner' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.level);
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    { value: 'beginner', label: '🌱 Beginner', desc: 'Just starting out' },
    { value: 'intermediate', label: '📚 Intermediate', desc: 'Have some knowledge' },
    { value: 'advanced', label: '🎯 Advanced', desc: 'Final stage prep' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4">
            <Zap className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="font-display font-bold text-white text-3xl">Join GATE EEE</h1>
          <p className="text-primary-200 mt-1 text-sm font-body">Start your intelligent preparation journey</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-display font-bold text-primary-900 text-2xl mb-1">Create Account</h2>
          <p className="text-gray-500 text-sm mb-6 font-body">Your personalized GATE prep starts here</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-body">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field pl-10" placeholder="Arjun Sharma" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-body">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-body">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-10 pr-10" placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-body">Current Level</label>
              <div className="grid grid-cols-3 gap-2">
                {levels.map(l => (
                  <button key={l.value} type="button"
                    onClick={() => setForm({ ...form, level: l.value })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.level === l.value ? 'border-primary-800 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="text-sm font-semibold font-display">{l.label}</div>
                    <div className="text-xs text-gray-500 font-body">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-60 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : <>Get Started <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 font-body">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-800 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
