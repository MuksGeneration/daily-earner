/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DailyEarnerLogo } from './DailyEarnerLogo';
import { useApp } from '../context/AppContext';
import { Lock, Phone, Gift, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

type AuthMode = 'signup' | 'login';

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const { registerUser, loginUser } = useApp();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sign Up Form State
  const [signupForm, setSignupForm] = useState({
    phone: '+256',
    name: '',
    loginPassword: '',
    confirmPassword: '',
    tradePassword: '',
    invitationCode: '',
  });

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    phone: '+256',
    password: '',
  });

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!signupForm.phone || signupForm.phone.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number' });
      return;
    }
    if (!signupForm.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your full name' });
      return;
    }
    if (signupForm.loginPassword.length < 6) {
      setMessage({ type: 'error', text: 'Login password must be at least 6 characters' });
      return;
    }
    if (signupForm.loginPassword !== signupForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (!/^\d{6}$/.test(signupForm.tradePassword)) {
      setMessage({ type: 'error', text: 'Trade password must be exactly 6 digits' });
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(
        signupForm.name,
        signupForm.phone,
        signupForm.loginPassword,
        signupForm.invitationCode,
        signupForm.tradePassword
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Account created successfully! Logging in...' });
        setTimeout(() => {
          onAuthSuccess?.();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || 'Registration failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during registration' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!loginForm.phone || loginForm.phone.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number' });
      return;
    }
    if (!loginForm.password) {
      setMessage({ type: 'error', text: 'Please enter your password' });
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(loginForm.phone, loginForm.password);
      if (result.success) {
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        setTimeout(() => {
          onAuthSuccess?.();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || 'Login failed.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during login' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-emerald-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <DailyEarnerLogo className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Daily Earner</h1>
          <p className="text-sm text-slate-600 mt-1">Smart Bot Store & Referral Hub</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => {
                setMode('signup');
                setMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-all ${
                mode === 'signup'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-all ${
                mode === 'login'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg flex gap-2 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-semibold text-sm">
                    +256|
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={signupForm.phone}
                    onChange={handleSignupChange}
                    placeholder="Enter phone number"
                    className="w-full pl-16 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={signupForm.name}
                  onChange={handleSignupChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Login Password (at least 6 characters)
                </label>
                <input
                  type="password"
                  name="loginPassword"
                  value={signupForm.loginPassword}
                  onChange={handleSignupChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Login Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={signupForm.confirmPassword}
                  onChange={handleSignupChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  🔑 Trade Password (6 digits)
                </label>
                <input
                  type="password"
                  name="tradePassword"
                  value={signupForm.tradePassword}
                  onChange={handleSignupChange}
                  placeholder="6-digit trade password"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  Referral Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="invitationCode"
                  value={signupForm.invitationCode}
                  onChange={handleSignupChange}
                  placeholder="Enter a registered user's referral code"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-semibold text-sm">
                    +256|
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={loginForm.phone}
                    onChange={handleLoginChange}
                    placeholder="Enter phone number"
                    className="w-full pl-16 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Login Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center text-xs text-slate-600">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-emerald-600 font-semibold hover:text-emerald-700"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-emerald-600 font-semibold hover:text-emerald-700"
                >
                  Log In
                </button>
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <p className="font-semibold mb-1">🚀 Welcome to Daily Earner!</p>
            <p className="leading-relaxed">
              Join thousands earning passive income with our AI-powered trading bots. Secure your account with strong passwords and start earning today.
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-emerald-100 p-2.5 rounded-lg">
              <Lock className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-slate-700 font-semibold">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-slate-700 font-semibold">Mobile First</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-purple-100 p-2.5 rounded-lg">
              <Gift className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-slate-700 font-semibold">Earn Now</span>
          </div>
        </div>
      </div>
    </div>
  );
};
