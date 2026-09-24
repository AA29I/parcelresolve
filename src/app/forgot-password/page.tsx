'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, ArrowLeft, Mail, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request');
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-brand-paper px-4 py-12">
      {/* Brand Header */}
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
          <h1 className="text-xl font-serif font-bold text-brand-dark">Reset Your Password</h1>
          <p className="text-xs text-brand-muted mt-1">
            Enter the email address registered with your workspace to receive reset instructions.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Reset Instructions Dispatched</span>
              </div>
              <p>
                We have processed a password reset request for <strong className="font-semibold">{result.email}</strong>.
              </p>
              <p className="text-[11px] text-emerald-700">
                Link expires in {result.expiresInMinutes || 60} minutes.
              </p>
            </div>

            {/* Instant Demo Link Box */}
            {result.resetUrl && (
              <div className="p-3.5 rounded bg-brand-cream border border-brand-border space-y-2">
                <div className="text-[10px] font-bold text-brand-dark uppercase tracking-wider font-mono">
                  Immediate Access / Demo Link:
                </div>
                <div className="text-[11px] text-brand-muted break-all font-mono p-2 bg-white rounded border border-brand-border/80">
                  {result.resetUrl}
                </div>
                <a
                  href={result.resetUrl}
                  className="block text-center py-2 px-3 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors"
                >
                  Click Here to Set New Password Now →
                </a>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs text-brand-gold font-semibold hover:underline inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Workspace Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apexglobal.example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-gold" />
                  Generating Reset Token...
                </>
              ) : (
                'Send Password Reset Link'
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-brand-muted hover:text-brand-dark transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
