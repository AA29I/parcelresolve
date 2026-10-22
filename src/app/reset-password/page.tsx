'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Lock, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<{ email?: string; userName?: string; organizationName?: string } | null>(null);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('No password reset token provided. Please request a new reset link.');
      setValidating(false);
      return;
    }

    const checkToken = async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          throw new Error(data.error || 'Invalid or expired reset token');
        }
        setTokenInfo(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setTokenError(msg);
      } finally {
        setValidating(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password.length < 8) {
      setSubmitError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please verify.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
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
          <h1 className="text-xl font-serif font-bold text-brand-dark">Set New Password</h1>
          {tokenInfo && (
            <p className="text-xs text-brand-muted mt-1">
              Updating security credentials for <strong className="text-brand-dark">{tokenInfo.email}</strong> ({tokenInfo.organizationName})
            </p>
          )}
        </div>

        {validating && (
          <div className="py-8 flex flex-col items-center justify-center text-xs text-brand-muted font-mono">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-gold mb-2" />
            Verifying cryptographic token security...
          </div>
        )}

        {!validating && tokenError && (
          <div className="space-y-4">
            <div className="p-3.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{tokenError}</span>
            </div>
            <Link
              href="/forgot-password"
              className="block text-center py-2 px-3 rounded bg-brand-dark text-brand-paper text-xs font-semibold hover:bg-brand-ink transition-colors"
            >
              Request a New Reset Link →
            </Link>
          </div>
        )}

        {!validating && !tokenError && success && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Password Updated Successfully</span>
              </div>
              <p>Your workspace password has been changed. You can now authenticate with your new credentials.</p>
            </div>

            <Link
              href="/login"
              className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4 text-brand-gold" />
            </Link>
          </div>
        )}

        {!validating && !tokenError && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-gold" />
                  Updating Security Credentials...
                </>
              ) : (
                'Save New Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-paper">
          <div className="text-xs text-brand-muted font-sans animate-pulse">Verifying reset token...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </React.Suspense>
  );
}
