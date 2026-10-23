'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowRight, ShieldCheck, AlertCircle, Building2, Mail, User } from 'lucide-react';

export default function GoogleAuthPortalPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your Google email address');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || email.split('@')[0],
          companyName: companyName.trim(),
          defaultCurrency: currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate with Google');
      }
      router.push('/app/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-brand-paper px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded bg-brand-dark flex items-center justify-center text-brand-gold font-serif font-bold text-sm border border-brand-gold/40">
          MG
        </div>
        <div>
          <span className="font-semibold text-xl tracking-tight text-brand-dark font-sans block leading-none">
            Mett <span className="text-brand-gold font-serif">Global</span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand-muted block mt-0.5">
            ParcelResolve OS
          </span>
        </div>
      </Link>

      <div className="w-full max-w-md bg-white border border-brand-border rounded-xl shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-brand-border">
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-brand-dark">Sign in with Google</h1>
            <p className="text-xs text-brand-muted">
              Continue to ParcelResolve with your Google or Google Workspace account
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleGoogleContinue} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1">
              Google Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com or you@company.com"
                className="w-full pl-8 pr-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-dark mb-1">
              Your Full Name <span className="text-brand-muted font-normal">(for new accounts)</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full pl-8 pr-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                Company / Workspace Name <span className="text-brand-muted font-normal">(if new)</span>
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. RDX Sports UK"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold bg-white font-mono"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in to Workspace...' : 'Continue with Google Account'}
            <ArrowRight className="w-3.5 h-3.5 text-brand-gold" />
          </button>
        </form>

        <div className="pt-3 border-t border-brand-border flex items-center justify-between text-[11px] text-brand-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Isolated Workspace Provisioning
          </span>
          <Link href="/login" className="text-brand-gold font-semibold hover:underline">
            Back to Email Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
