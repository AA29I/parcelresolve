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

  // Check URL query for automatic demo trigger
  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'apex-global' || demo === 'nordic-craft') {
      handleDemoLogin(demo);
    }
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
