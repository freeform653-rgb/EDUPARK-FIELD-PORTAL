import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Database,
  ArrowRight
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLiveSupabase } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Please enter your administrator username or email.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Emblem */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-skyblue-500 to-skyblue-400 text-white shadow-xl shadow-skyblue-500/25 mb-4">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Edupark Field Portal
          </h1>
          <p className="text-sm font-medium text-slate-300 mt-1">
            Internal Campus Donation & Field Operations Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Administrator Sign In</h2>
              <p className="text-xs text-slate-500">Authorized personnel only</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-navy-50 text-navy-800 border border-navy-200">
              <ShieldCheck className="w-3.5 h-3.5 text-navy-600" />
              <span>Admin Portal</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Admin Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or admin@edupark.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-skyblue-500/20 focus:border-skyblue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-navy-800 to-navy-900 hover:from-navy-900 hover:to-black shadow-md shadow-navy-950/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Database & Initial Setup Credentials Help Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Database className="w-3.5 h-3.5 text-skyblue-600" />
                <span>Default Admin Credentials:</span>
              </div>
              <p className="font-mono text-[11px] text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 flex justify-between">
                <span>User: <strong>admin</strong></span>
                <span>Pass: <strong>edupark@admin2025</strong></span>
              </p>
              <p className="text-[11px] text-slate-500 leading-normal">
                {isLiveSupabase
                  ? 'Connected to live Supabase Auth.'
                  : 'Operating in secure local mode. Can also be customized in your environment variables (.env).'}
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Protected educational administration system. No public or student registration.
        </p>
      </div>
    </div>
  );
};
