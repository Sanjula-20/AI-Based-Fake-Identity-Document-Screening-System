import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/screen');
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await login('demo@shieldai.com', 'demo1234');
      if (res.success) {
        navigate('/screen');
      } else {
        setError(res.message || 'Demo login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-xl relative">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-200 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900">Sign In to ShieldAI</h1>
          <p className="text-xs text-slate-500">Access PAN card screening & fraud analysis dossier</p>
        </div>

        {/* 1-Click Quick Demo Sign In */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 font-heading">
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>Instant Screening Access</span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">DEMO</span>
          </div>
          <p className="text-[11px] text-slate-600">Sign in instantly to test PAN card verification without typing credentials.</p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2"
          >
            <span>⚡ 1-Click Quick Demo Sign In</span>
          </button>
        </div>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">or sign in with email</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-heading">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 transition shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-heading">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 transition shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In with Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
