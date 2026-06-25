import React, { useState } from 'react';
import {
  Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle, Shield, Cloud, HardDrive
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword, isFirebase } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 mb-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200/60 relative">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-violet-600 to-purple-600 bg-clip-text text-transparent">
            TaskMaster
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your personal productivity hub</p>
        </div>

        {/* Mode badge */}
        <div className="flex justify-center mb-4">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold",
            isFirebase
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-amber-50 text-amber-600 border border-amber-200"
          )}>
            {isFirebase ? <Cloud className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
            {isFirebase ? 'Cloud Mode — Firebase Connected' : 'Local Mode — Data stored in browser'}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Tab switcher */}
          {mode !== 'reset' && (
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => switchMode('signin')}
                className={cn(
                  "flex-1 py-4 text-sm font-semibold transition-all relative",
                  mode === 'signin'
                    ? "text-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                Sign In
                {mode === 'signin' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={cn(
                  "flex-1 py-4 text-sm font-semibold transition-all relative",
                  mode === 'signup'
                    ? "text-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                Sign Up
                {mode === 'signup' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {mode === 'reset' && (
              <button
                onClick={() => switchMode('signin')}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700 mb-4 flex items-center gap-1"
              >
                ← Back to Sign In
              </button>
            )}

            <h2 className="text-xl font-bold text-slate-800 mb-1">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset password'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {mode === 'signin' && 'Sign in to access your tasks, planner and notes.'}
              {mode === 'signup' && 'Start organizing your life with TaskMaster.'}
              {mode === 'reset' && (isFirebase
                ? "Enter your email and we'll send a reset link."
                : "Enter your email to check if your account exists."
              )}
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Reset success */}
            {resetSent && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-100">
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
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== 'reset' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                    required
                    minLength={6}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
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

            {/* Google sign in — only with Firebase */}
            {mode !== 'reset' && (
              <>
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={loading || !isFirebase}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:pointer-events-none",
                    isFirebase
                      ? "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
                      : "border-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                  )}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                  {!isFirebase && <span className="text-[10px] ml-1">(Requires Firebase)</span>}
                </button>
              </>
            )}

            {/* Features list */}
            {mode === 'signup' && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">What you'll get</p>
                <div className="space-y-2.5">
                  {[
                    { icon: '✅', text: 'Task management with due dates & priorities' },
                    { icon: '📅', text: 'Visual calendar planner with events' },
                    { icon: '📝', text: 'Color-coded notes with pinning' },
                    { icon: '🔒', text: 'Private & secure — your data, your space' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
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
        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-slate-400">
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
