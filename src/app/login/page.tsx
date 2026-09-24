'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowRight, ShieldCheck, Check, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fast demo switcher handler
  const handleDemoLogin = async (slug: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoOrgSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');
      router.push('/app/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLoading(false);
    }
  };

  // Check URL query for automatic demo trigger or error messages
  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'apex-global' || demo === 'nordic-craft') {
      handleDemoLogin(demo);
    }
    const err = searchParams.get('error');
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      router.push('/app/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-brand-paper px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded bg-brand-dark flex items-center justify-center text-brand-gold">
          <Package className="w-4 h-4" />
        </div>
        <span className="font-semibold text-xl tracking-tight text-brand-dark font-sans">
          Parcel<span className="text-brand-gold">Resolve</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-white border border-brand-border rounded-xl shadow-md p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-serif font-bold text-brand-dark">Sign In to Your Workspace</h1>
          <p className="text-xs text-brand-muted mt-1">
            Access your isolated tenant tracking, SLA policies, and claims.
          </p>
        </div>

        {/* Quick Demo Workspace Selector */}
        <div className="p-4 rounded-lg bg-brand-cream/80 border border-brand-border space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-brand-dark uppercase tracking-wider">
            <span>One-Click Demonstration Workspaces</span>
            <span className="text-[10px] text-brand-gold font-mono">Isolated</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('apex-global')}
              className="w-full text-left p-2.5 rounded bg-white border border-brand-border hover:border-brand-gold transition-all text-xs flex items-center justify-between group disabled:opacity-50"
            >
              <div>
                <div className="font-bold text-brand-dark group-hover:text-brand-gold">
                  Company A: Apex Global Logistics
                </div>
                <div className="text-[10px] text-brand-muted">
                  admin@apexglobal.example.com • UPS Direct • USD
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-gold opacity-60 group-hover:opacity-100" />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('nordic-craft')}
              className="w-full text-left p-2.5 rounded bg-white border border-brand-border hover:border-brand-gold transition-all text-xs flex items-center justify-between group disabled:opacity-50"
            >
              <div>
                <div className="font-bold text-brand-dark group-hover:text-brand-gold">
                  Company B: Nordic Craft Goods
                </div>
                <div className="text-[10px] text-brand-muted">
                  admin@nordiccraft.example.com • GLS Europe • EUR
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-gold opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <div>
          <a
            href="/api/auth/google"
            className="w-full py-2.5 px-4 rounded bg-white hover:bg-brand-paper border border-brand-border text-xs font-semibold text-brand-dark transition-all flex items-center justify-center gap-2.5 shadow-xs hover:border-brand-gold group"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google Workspace</span>
          </a>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-brand-border"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-brand-muted">Or Sign In with Email</span>
          <div className="flex-grow border-t border-brand-border"></div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourcompany.com"
              className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-brand-dark">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-brand-gold hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-brand-muted">
          Need a new workspace?{' '}
          <Link href="/signup" className="text-brand-gold font-semibold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-paper">
          <div className="text-xs text-brand-muted font-sans animate-pulse">Loading workspace portal...</div>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
