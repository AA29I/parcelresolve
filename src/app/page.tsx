'use client';

import React from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import {
  Package,
  Clock,
  AlertCircle,
  FileCheck2,
  Code2,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Cpu,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-paper">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 border-b border-brand-border/60 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cream border border-brand-border text-xs font-medium text-brand-dark mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Production-Ready Multi-Carrier Tracking & Claims Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-brand-dark tracking-tight leading-[1.1] mb-6">
                Turn Carrier Breaches into <span className="text-brand-gold italic">Recovered Capital</span>.
              </h1>

              <p className="text-base sm:text-lg text-brand-muted leading-relaxed mb-8 max-w-2xl">
                A high-throughput multi-carrier operations system built for 300,000–500,000 parcels annually. Track cross-carrier events in real time, calculate exact business-day SLAs, automate carrier enquiries, and build auditable claims packets in isolated workspaces.
              </p>

              {/* Primary Commercial CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 mb-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-brand-dark hover:bg-brand-ink text-brand-paper font-semibold px-6 py-3 rounded-lg text-sm transition-colors shadow-sm"
                >
                  <span>Create Company Workspace</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold" />
                </Link>

                <Link
                  href="/auth/google"
                  className="inline-flex items-center gap-2.5 bg-white hover:bg-brand-cream border border-brand-border text-brand-dark font-semibold px-5 py-3 rounded-lg text-sm transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-brand-dark hover:text-brand-gold font-semibold px-4 py-3 text-sm transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted">
                <span className="flex items-center gap-1.5 font-medium text-brand-dark">
                  <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                  No shared customer data
                </span>
                <span className="flex items-center gap-1.5 font-medium text-brand-dark">
                  <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                  Self-service REST connector builder
                </span>
                <span className="flex items-center gap-1.5 font-medium text-brand-dark">
                  <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                  HMAC signed outbound webhooks
                </span>
              </div>
            </div>

            {/* Live Operational State Card */}
            <div className="lg:col-span-5">
              <div className="bg-brand-ink text-brand-paper rounded-xl p-5 border border-brand-dark shadow-2xl font-mono text-xs">
                <div className="flex items-center justify-between border-b border-brand-muted/30 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-brand-paper/60 ml-2">PARCELRESOLVE // SLA ENGINE</span>
                  </div>
                  <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/80 px-2 py-0.5 rounded font-sans font-bold">
                    BREACH DETECTED (+32h)
                  </span>
                </div>

                <div className="space-y-3 font-sans">
                  <div>
                    <div className="text-[11px] text-brand-paper/60">TRACKING IDENTIFIER</div>
                    <div className="font-mono text-brand-lightgold text-sm font-semibold tracking-wider">
                      1Z999AA10123456784
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-black/40 border border-white/5">
                      <div className="text-[10px] text-brand-paper/50">CARRIER SERVICE</div>
                      <div className="font-semibold text-brand-paper">UPS Worldwide (48h SLA)</div>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/5">
                      <div className="text-[10px] text-brand-paper/50">LAST PHYSICAL SCAN</div>
                      <div className="font-semibold text-amber-300">Louisville Air Hub, KY</div>
                    </div>
                  </div>

                  {/* SLA Calculation Box */}
                  <div className="p-2.5 rounded bg-black/60 border border-brand-gold/30 text-[11px]">
                    <div className="flex items-center justify-between text-brand-gold font-semibold mb-1">
                      <span>Exact SLA Calculation Audit:</span>
                      <span className="text-[10px] text-brand-paper/60 font-mono">Cutoff: 16:00 EST</span>
                    </div>
                    <p className="text-brand-paper/80 font-mono text-[10px] leading-relaxed">
                      1. Dispatched: Fri Sep 18 14:15 (Met cutoff)
                      <br />2. Business Days: Skips Sat & Sun
                      <br />3. Promised Deadline: Tue Sep 22 16:00
                      <br />4. Current Elapsed: 80.0h (Overdue by 32.0h)
                    </p>
                  </div>

                  <div className="pt-2 border-t border-brand-muted/30 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enquiry Draft Prepared
                    </span>
                    <span className="text-brand-paper/70 font-mono text-[10px]">Claim Value: $668.50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 bg-brand-cream/50 border-b border-brand-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-2">Core Pillars</h2>
            <h3 className="text-3xl sm:text-4xl font-serif font-bold text-brand-dark tracking-tight">
              Built for Operational Truth, Not Vanity Dashboards
            </h3>
            <p className="text-brand-muted mt-4 text-sm sm:text-base">
              Every tracking record stores immutable raw payloads, normalized status enums, and reproducible SLA mathematics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-white border border-brand-border hover:border-brand-gold transition-colors shadow-xs">
              <div className="w-10 h-10 rounded bg-brand-cream flex items-center justify-center text-brand-gold mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-brand-dark mb-2">Exact Business-Day SLAs</h4>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-3">
                Calculates deadlines accounting for carrier cutoff times, weekend exclusions, national holidays, and regional zones. Transparent audit breakdown on every parcel.
              </p>
              <div className="text-xs font-medium text-brand-gold flex items-center gap-1">
                4 Separate Lifecycle States <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-6 rounded-lg bg-white border border-brand-border hover:border-brand-gold transition-colors shadow-xs">
              <div className="w-10 h-10 rounded bg-brand-cream flex items-center justify-center text-brand-gold mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-brand-dark mb-2">Carrier Enquiries & Claims</h4>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-3">
                Automated enquiry drafting at configurable breach thresholds. Generates legal Loss Declarations with statutory disclaimer banners and records recovered values.
              </p>
              <div className="text-xs font-medium text-brand-gold flex items-center gap-1">
                Tracked vs Recovered Balances <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="p-6 rounded-lg bg-white border border-brand-border hover:border-brand-gold transition-colors shadow-xs">
              <div className="w-10 h-10 rounded bg-brand-cream flex items-center justify-center text-brand-gold mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-brand-dark mb-2">Tenant Developer Portal</h4>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed mb-3">
                Custom fields, status mapping overrides, no-code workflow automations with 1-click rollback, scoped API keys, signed outbound webhooks, and carrier adapter SDK.
              </p>
              <div className="text-xs font-medium text-brand-gold flex items-center gap-1">
                Zero Shared Code Access <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Matrix Preview */}
      <section className="py-20 border-b border-brand-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-2">Connected Logistics</h2>
              <h3 className="text-3xl font-serif font-bold text-brand-dark">Carrier Integration Center</h3>
              <p className="text-brand-muted mt-2 text-sm max-w-xl">
                Honest capability matrices. Every courier is explicitly badged as Live API, Configurable API, Needs Custom Adapter, or File Import.
              </p>
            </div>
            <Link
              href="/integrations"
              className="mt-4 md:mt-0 text-xs font-semibold text-brand-dark hover:text-brand-gold inline-flex items-center gap-1.5"
            >
              View All 15+ Carrier Adapters <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded border border-brand-border bg-white text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-brand-dark">UPS Worldwide</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">LIVE API</span>
              </div>
              <div className="text-xs text-brand-muted">Lookup • Webhook • POD • Claims</div>
            </div>

            <div className="p-4 rounded border border-brand-border bg-white text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-brand-dark">USPS Web Tools</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">CONFIGURABLE</span>
              </div>
              <div className="text-xs text-brand-muted">REST Polling • Signature POD</div>
            </div>

            <div className="p-4 rounded border border-brand-border bg-white text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-brand-dark">GLS Logistics</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">CONFIGURABLE</span>
              </div>
              <div className="text-xs text-brand-muted">Lookup • Webhook • POD</div>
            </div>

            <div className="p-4 rounded border border-brand-border bg-white text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-brand-dark">Linnworks WMS</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">OAUTH FLOW</span>
              </div>
              <div className="text-xs text-brand-muted">Dispatched Orders • Tracking Sync</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-brand-dark text-brand-paper text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
            Protect 500,000 Parcels with Absolute Mathematical Rigor.
          </h2>
          <p className="text-brand-muted text-sm sm:text-base max-w-xl mx-auto mb-8">
            Create your isolated workspace today. Configure custom SLA thresholds, import sample CSV data, and recover carrier loss balances.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-brand-gold hover:bg-brand-lightgold text-brand-dark font-semibold px-6 py-3 rounded text-sm transition-colors shadow-md w-full sm:w-auto"
            >
              Create Your Workspace
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/15 text-brand-paper border border-white/20 font-medium px-6 py-3 rounded text-sm transition-colors w-full sm:w-auto"
            >
              Sign In to Existing Workspace
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
