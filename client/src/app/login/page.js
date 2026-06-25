'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { setUser, setToken } from '../../store/bookingSlice';
import { authApi } from '../../services/api';
import { Mail, Lock, ShieldAlert, Chrome, Plane } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(email, password);
      dispatch(setUser(data.user));
      dispatch(setToken(data.token));
      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Simulate Google Authentication
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const mockGoogleId = `google_${Math.floor(Math.random() * 1000000)}`;
      const mockEmail = `google_traveler${Math.floor(Math.random() * 100)}@gmail.com`;
      const data = await authApi.googleAuth(
        mockEmail,
        'Skyward Traveler',
        mockGoogleId,
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60'
      );
      dispatch(setUser(data.user));
      dispatch(setToken(data.token));
      router.push('/');
    } catch (err) {
      setError('Google Authentication simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md bg-card border border-card-border rounded-3xl shadow-xl overflow-hidden glass p-8">
        
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-brand-primary p-3 rounded-2xl text-white shadow-lg shadow-brand-primary/25 mb-3">
            <Plane className="w-8 h-8 rotate-45" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Access your bookings and flight status alerts.
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl flex items-center gap-2 mb-6">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@skyflow.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl focus:bg-white text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-card-border rounded-2xl focus:bg-white text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-2xl shadow-lg shadow-brand-primary/15 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <hr className="w-full border-slate-200 dark:border-slate-800" />
          <span className="absolute bg-card dark:bg-gray-950 px-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
            or continue with
          </span>
        </div>

        {/* Google OAuth Simulation */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 border border-card-border bg-card dark:bg-slate-900 text-sm font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <Chrome className="w-5 h-5 text-red-500" />
          <span>Google Accounts</span>
        </button>

        {/* Sign up link */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-brand-primary hover:underline">
            Register free
          </Link>
        </p>

      </div>
    </div>
  );
}
