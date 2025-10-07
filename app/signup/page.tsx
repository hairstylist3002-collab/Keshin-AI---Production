"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleEmailSignup, handleEmailSignin, handleGoogleSignin } from "@/lib/authHandler";
import { useAuthContext } from "@/contexts/AuthContext";
import { getAuthErrorMessage, validateEmail, validatePassword, validateName } from "@/utils/auth-utils";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthContext();

  const [isSignup, setIsSignup] = useState(true);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isVisible: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/Hairstylist');
    }
  }, [isAuthenticated, router]);

  // Check for referral code in URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Store referral code for signup
      localStorage.setItem('referralCode', ref);
    }
  }, [searchParams]);

  const resetAuthForms = () => {
    setAuthForm({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
  };

  const updateAuthForm = <K extends keyof typeof authForm>(field: K, value: (typeof authForm)[K]) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    setAuthError('');

    // Validation
    if (!validateEmail(authForm.email)) {
      setAuthError('Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(authForm.password);
    if (!passwordValidation.isValid) {
      setAuthError(passwordValidation.message || 'Invalid password');
      return;
    }

    setAuthLoading(true);

    try {
      const result = await handleEmailSignin(authForm.email, authForm.password);

      if (!result.success) {
        const authError = getAuthErrorMessage({ message: result.error } as any);
        setAuthError(authError.message);
      } else {
        // Successful login - redirect to AI hairstylist
        router.push('/Hairstylist');
      }
    } catch (error) {
      setAuthError('An unexpected error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    setAuthError('');

    // Validation
    const nameValidation = validateName(authForm.name);
    if (!nameValidation.isValid) {
      setAuthError(nameValidation.message || 'Invalid name');
      return;
    }

    if (!validateEmail(authForm.email)) {
      setAuthError('Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(authForm.password);
    if (!passwordValidation.isValid) {
      setAuthError(passwordValidation.message || 'Invalid password');
      return;
    }

    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setAuthLoading(true);

    try {
      // Get referral code from localStorage if exists
      const referralCode = localStorage.getItem('referralCode') || undefined;

      const result = await handleEmailSignup(
        authForm.email,
        authForm.password,
        authForm.name,
        referralCode
      );

      if (!result.success) {
        const authError = getAuthErrorMessage({ message: result.error } as any);
        setAuthError(authError.message);
      } else {
        // Successful signup - show email confirmation notification
        resetAuthForms();

        // Show email confirmation notification
        setNotification({
          isVisible: true,
          title: 'Account Created Successfully!',
          message: 'Please check your email and click the confirmation link to activate your account before signing in.',
          type: 'success'
        });

        // Don't redirect immediately - let user see the notification first
      }
    } catch (error) {
      setAuthError('An unexpected error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);

    try {
      const result = await handleGoogleSignin();
      if (!result.success) {
        const authError = getAuthErrorMessage({ message: result.error } as any);
        setAuthError(authError.message);
      }
      // Note: OAuth redirect will happen automatically, no need to close modal
    } catch (error) {
      setAuthError('An unexpected error occurred with Google sign-in');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased selection:bg-fuchsia-500/20 selection:text-fuchsia-200">
      {/* Background accents */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"></div>
      </div>

      {/* Email Confirmation Notification */}
      {notification.isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative max-w-md w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">{notification.title}</h3>
                <p className="mt-1 text-sm text-neutral-300">{notification.message}</p>
                <button
                  onClick={() => setNotification({ ...notification, isVisible: false })}
                  className="mt-3 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-neutral-400">
              {isSignup ? 'Join thousands getting their perfect hairstyle' : 'Sign in to continue your journey'}
            </p>
          </div>

          {/* Auth Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            {/* Toggle between Sign In/Sign Up */}
            <div className="flex rounded-lg bg-neutral-900/50 p-1 mb-6">
              <button
                onClick={() => setIsSignup(false)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  !isSignup
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignup(true)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isSignup
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Display */}
            {authError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{authError}</p>
              </div>
            )}

            <form className="space-y-4">
              {isSignup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={authForm.name}
                      onChange={(e) => updateAuthForm('name', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-5 py-4 text-white placeholder-neutral-400 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 text-base"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={authForm.email}
                      onChange={(e) => updateAuthForm('email', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-5 py-4 text-white placeholder-neutral-400 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
              )}

              {!isSignup && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={authForm.email}
                    onChange={(e) => updateAuthForm('email', e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-5 py-4 text-white placeholder-neutral-400 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 text-base"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={!isSignup ? "md:col-span-2" : ""}>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={authForm.password}
                    onChange={(e) => updateAuthForm('password', e.target.value)}
                    className={`w-full rounded-lg border border-white/10 bg-neutral-900/50 px-5 py-4 text-white placeholder-neutral-400 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 text-base ${!isSignup ? 'max-w-none' : ''}`}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {isSignup && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(e) => updateAuthForm('confirmPassword', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-5 py-4 text-white placeholder-neutral-400 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 text-base"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={isSignup ? handleSignup : handleLogin}
                disabled={authLoading}
                className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-fuchsia-600/20 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {authLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    {isSignup ? 'Creating account...' : 'Signing in...'}
                  </div>
                ) : (
                  isSignup ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-950 px-2 text-neutral-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
