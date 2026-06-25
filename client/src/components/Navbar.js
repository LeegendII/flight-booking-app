'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logout, setUser } from '../store/bookingSlice';
import { authApi } from '../services/api';
import { Plane, LogOut, LayoutDashboard, History, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.booking);

  useEffect(() => {
    if (token && !user) {
      async function fetchProfile() {
        try {
          const profile = await authApi.getProfile();
          if (!profile) {
            dispatch(logout());
            return;
          }
          dispatch(setUser(profile));
        } catch (err) {
          console.error('Failed to auto-fetch user profile:', err);
          dispatch(logout());
        }
      }
      fetchProfile();
    }
  }, [token, user, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border glass shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="bg-brand-primary p-2 rounded-xl text-white shadow-md shadow-brand-primary/20">
            <Plane className="w-6 h-6 rotate-45" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
              SkyFlow
            </span>
            <span className="text-[10px] block font-bold text-slate-400 tracking-wider uppercase -mt-1">
              Airlines
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-white transition-colors">
            Search Flights
          </Link>
          
          {user && (
            <>
              <Link href="/history" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-white transition-colors flex items-center gap-1">
                <History className="w-4 h-4" /> My Bookings
              </Link>
              
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary dark:hover:text-white transition-colors flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" /> Admin Panel
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Auth status buttons */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-400">Welcome back,</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.fullName}</span>
              </div>
              
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full border border-card-border bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-500" />
                )}
              </div>
              
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-all"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover px-4 py-2 rounded-xl shadow-md shadow-brand-primary/10 transition-all hover:scale-[1.02]"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
