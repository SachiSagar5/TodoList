import React, { useState } from 'react';
import {
  Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle, Shield, Cloud, HardDrive, Sun, Moon
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword, isFirebase } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const clearForm = () => {
    setEmail(''); setPassword(''); setDisplayName('');
    setError(''); setResetSent(false);
  };

  const switchMode = (m: AuthMode) => {
    clearForm();
    setMode(m);
  };

  const friendlyError = (err: unknown): string => {
    const e = err as Record<string, string | undefined>;
    const code = e.code || e.error || '';
    console.error('Auth error:', err);
    const map: Record<string, string> = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign in popup was closed.',
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/operation-not-supported-in-this-environment': 'Google sign-in requires Firebase configuration.',
      'server/unreachable': 'Cannot connect to the server. Make sure to run `npm run server` in another terminal.',
      'server/error': 'Server error. Check the console for details.',
      'Missing fields': 'Please fill in all fields.',
      'Invalid token': 'Session expired. Please sign out and try again.',
    };
    return map[code] || map[e.error || ''] || `Error: ${code || 'unknown'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setResetSent(true);
      } else if (mode === 'signin') {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName.trim());
      }
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Theme toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:shadow-md transition-all"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 mb-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200/60 dark:shadow-indigo-900/40 relative">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
            TaskMaster
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Your personal productivity hub</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Tab switcher */}
          {mode !== 'reset' && (
            <div className="flex border-b border-slate-100 dark:border-slate-700">
              <button
                onClick={() => switchMode('signin')}
                className={cn(
                  "flex-1 py-4 text-sm font-semibold transition-all relative",
                  mode === 'signin'
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                Sign In
                {mode === 'signin' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={cn(
                  "flex-1 py-4 text-sm font-semibold transition-all relative",
                  mode === 'signup'
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                Sign Up
                {mode === 'signup' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {mode === 'reset' && (
              <button
                onClick={() => switchMode('signin')}
                className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 flex items-center gap-1"
              >
                ← Back to Sign In
              </button>
            )}

            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset password'}
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
              {mode === 'signin' && 'Sign in to access your tasks, planner and notes.'}
              {mode === 'signup' && 'Start organizing your life with TaskMaster.'}
              {mode === 'reset' && (isFirebase
                ? "Enter your email and we'll send a reset link."
                : "Enter your email to check if your account exists."
              )}
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Reset success */}
            {resetSent && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                {isFirebase
                  ? '✅ Password reset email sent! Check your inbox.'
                  : '✅ Account found! In local mode, passwords cannot be reset. Please create a new account.'
                }
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200"
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== 'reset' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-indigo-300 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-200"
                    required
                    minLength={6}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {mode === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none shadow-lg shadow-indigo-200/50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'reset' && 'Send Reset Link'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

           
            {/* Features list */}
            {mode === 'signup' && (
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">What you'll get</p>
                <div className="space-y-2.5">
                  {[
                    { icon: '✅', text: 'Task management with due dates & priorities' },
                    { icon: '📅', text: 'Visual calendar planner with events' },
                    { icon: '📝', text: 'Color-coded notes with pinning' },
                    { icon: '🔒', text: 'Private & secure — your data, your space' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <span>{f.icon}</span>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-slate-400 dark:text-slate-500">
          <Shield className="w-3.5 h-3.5" />
          <span>
            {isFirebase
              ? 'Secured by Firebase Authentication & Cloud Firestore'
              : 'Local authentication — data stored in your browser'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
