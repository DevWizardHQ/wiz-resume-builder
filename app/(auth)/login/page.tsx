'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader2, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { login } from '@/app/(auth)/auth-actions';

function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const urlMessage = searchParams.get('message');

  const [error, setError] = useState<string | null>(urlError);
  const [infoMessage, setInfoMessage] = useState<string | null>(urlMessage);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (urlError) setError(urlError);
    if (urlMessage) setInfoMessage(urlMessage);
  }, [urlError, urlMessage]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfoMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if (result && result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Logo & Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-slate-900 via-primary to-slate-800 dark:from-slate-100 dark:via-primary dark:to-slate-300 bg-clip-text text-transparent">
            Wiz Resume
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Sign in to access your resumes and ATS optimization tools
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && !error && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-3 text-emerald-700 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Back to Home Link */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
