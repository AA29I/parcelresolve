'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowRight, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    slug: '',
    adminName: '',
    email: '',
    password: '',
    defaultCurrency: 'USD',
    operatingCountry: 'US',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          slug: form.slug,
          adminName: form.adminName,
          email: form.email,
          password: form.password,
          defaultCurrency: form.defaultCurrency,
          operatingCountries: [form.operatingCountry],
          operatingCurrencies: [form.defaultCurrency],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create workspace');

      router.push('/app/onboarding');
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

      <div className="w-full max-w-lg bg-white border border-brand-border rounded-xl shadow-md p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-serif font-bold text-brand-dark">Create Your Workspace</h1>
          <p className="text-xs text-brand-muted mt-1">
            Universal onboarding initiates in an isolated, private workspace.
          </p>
        </div>

        {/* Google Sign-Up Button */}
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
            <span>Register Workspace with Google</span>
          </a>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-brand-border"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-brand-muted">Or Register with Work Email</span>
          <div className="flex-grow border-t border-brand-border"></div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({
                    ...form,
                    companyName: val,
                    slug: form.slug ? form.slug : val.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                  });
                }}
                placeholder="Pacific Merchant Logistics"
                className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Workspace URL Slug</label>
              <div className="flex items-center text-xs">
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="pacific-logistics"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Admin Full Name</label>
              <input
                type="text"
                required
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                placeholder="Marcus Brody"
                className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@pacific.example.com"
                className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-brand-dark mb-1">Default Currency</label>
              <select
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold bg-white font-mono"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="SEK">SEK (kr)</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-brand-dark mb-1">Primary Country</label>
              <select
                value={form.operatingCountry}
                onChange={(e) => setForm({ ...form, operatingCountry: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold bg-white font-mono"
              >
                <option value="US">United States (US)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="DE">Germany (DE)</option>
                <option value="SE">Sweden (SE)</option>
                <option value="CA">Canada (CA)</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-brand-dark mb-1">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Initializing Workspace...' : 'Initialize Workspace & Start Setup'}
            <ArrowRight className="w-3.5 h-3.5 text-brand-gold" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-brand-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-gold font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
