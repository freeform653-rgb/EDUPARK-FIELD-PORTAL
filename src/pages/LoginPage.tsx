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
  ArrowRight,
  Loader2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Invalid credentials. Access restricted to admin only.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[400px]">
        {/* Brand Emblem & Portal Name */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-skyblue-500 to-skyblue-400 text-white shadow-lg shadow-skyblue-500/25 mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Edupark Field Portal
          </h1>
        </div>

        {/* Medium-Sized Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-7">
          {/* Only Admin Notice Header */}
          <div className="text-center pb-4 mb-5 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Only Admin Can Access The Portal</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sign In</h2>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Username
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
                  placeholder="Enter username"
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
                  placeholder="Enter password"
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
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-navy-800 to-navy-900 hover:from-navy-900 hover:to-black shadow-md shadow-navy-950/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
