import React from 'react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { Clock, Shield, FileCheck2, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-paper">
      <PublicHeader />

      <div className="py-16 border-b border-brand-border/60 bg-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-2">Platform Capabilities</div>
            <h1 className="text-4xl font-serif font-bold text-brand-dark mb-4">
              Engineered for Enterprise Shipping Operations
            </h1>
            <p className="text-brand-muted text-base leading-relaxed">
              Designed from first principles to handle up to 500,000 parcels and 7,000 claims annually without performance degradation or data leakage.
            </p>
          </div>
        </div>
      </div>

      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Feature 1: Tracking Engine */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-brand-gold" /> Tracking Engine & Event Deduplication
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark">
              Immutable Raw Scans with Normalized Chronology
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Couriers frequently transmit duplicate scans, omit intermediate hub transfers, or deliver events out of order. ParcelResolve stores the immutable raw webhook/poll payload alongside normalized event records, reordering scans by physical timestamp and preventing state regression.
            </p>
            <ul className="space-y-2 text-xs text-brand-dark">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                <span>Deterministic hashing eliminates duplicate scans across webhooks and polling.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                <span>On-demand refresh button executes live carrier check with respectful rate limiting.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                <span>Indexed dashboard queries guarantee sub-100ms response times at scale.</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 p-6 rounded-lg bg-brand-cream border border-brand-border font-mono text-xs">
            <div className="text-brand-muted text-[11px] mb-2">// SAMPLE NORMALIZED CHRONOLOGY</div>
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-white border border-brand-border flex items-center justify-between">
                <div>
                  <span className="font-semibold text-brand-dark">DELIVERED</span>
                  <div className="text-[11px] text-brand-muted">Left at Reception • Signed: J. Adams</div>
                </div>
                <span className="text-[10px] text-brand-muted">14:22:00 EST</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-brand-border flex items-center justify-between">
                <div>
                  <span className="font-semibold text-brand-dark">OUT_FOR_DELIVERY</span>
                  <div className="text-[11px] text-brand-muted">Loaded onto delivery van #402</div>
                </div>
                <span className="text-[10px] text-brand-muted">08:15:00 EST</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-brand-border flex items-center justify-between text-brand-muted line-through">
                <div>
                  <span>IN_TRANSIT (DUPLICATE SKIPPED)</span>
                  <div className="text-[11px]">Repeated hub scan payload</div>
                </div>
                <span className="text-[10px]">04:10:00 EST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: 4 Lifecycle States */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-12 border-t border-brand-border/60">
          <div className="lg:col-span-6 order-2 lg:order-1 p-6 rounded-lg bg-brand-cream border border-brand-border font-mono text-xs">
            <div className="text-brand-muted text-[11px] mb-3">// 4 DECOUPLED OPERATIONAL LIFECYCLES</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded border border-brand-border">
                <div className="text-[10px] text-brand-muted uppercase">1. Tracking Status</div>
                <div className="font-bold text-amber-700 mt-1">EXCEPTION</div>
                <div className="text-[11px] text-brand-muted mt-0.5">Physical transit state</div>
              </div>
              <div className="p-3 bg-white rounded border border-brand-border">
                <div className="text-[10px] text-brand-muted uppercase">2. Investigation Status</div>
                <div className="font-bold text-blue-700 mt-1">OPEN</div>
                <div className="text-[11px] text-brand-muted mt-0.5">Carrier enquiry active</div>
              </div>
              <div className="p-3 bg-white rounded border border-brand-border">
                <div className="text-[10px] text-brand-muted uppercase">3. Claim Status</div>
                <div className="font-bold text-purple-700 mt-1">READY_TO_SUBMIT</div>
                <div className="text-[11px] text-brand-muted mt-0.5">Filing packet formed</div>
              </div>
              <div className="p-3 bg-white rounded border border-brand-border">
                <div className="text-[10px] text-brand-muted uppercase">4. Recovery Status</div>
                <div className="font-bold text-emerald-700 mt-1">PARTIALLY_PAID</div>
                <div className="text-[11px] text-brand-muted mt-0.5">Balance credited: $450</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-brand-gold" /> Strict Decoupled Lifecycle
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark">
              A Breached SLA Is Not Automatically a Lost Parcel
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Many naive platforms conflate late delivery with a claim. In reality, a late scan triggers an operational investigation; only when confirmed missing does insurance or carrier liability apply. ParcelResolve tracks tracking, enquiry, claim, and cash recovery independently.
            </p>
          </div>
        </div>

        {/* Feature 3: Statutory Declaration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-12 border-t border-brand-border/60">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
              <FileCheck2 className="w-3.5 h-3.5 text-brand-gold" /> Legal Compliance
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark">
              Statutory Claim Declarations with Full Itemization
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Carriers reject claims that confuse loss declarations with original commercial sales invoices. ParcelResolve generates compliant loss statements with clear legal disclaimers, itemized freight charges, and audit verification keys.
            </p>
          </div>
          <div className="lg:col-span-6 p-6 rounded-lg bg-brand-cream border border-brand-border font-mono text-[11px] text-brand-dark">
            <div className="bg-white p-4 rounded border border-brand-border shadow-xs">
              <div className="text-red-700 font-bold border-b border-red-200 pb-2 mb-2 text-[10px]">
                *** OFFICIAL CLAIM DECLARATION / LOSS STATEMENT FOR CARRIER REIMBURSEMENT ***
                <br /><span className="text-brand-muted font-normal">DISCLAIMER: NOT AN ORIGINAL COMMERCIAL SALES INVOICE OR CONSUMER TAX INVOICE.</span>
              </div>
              <div className="text-brand-muted space-y-1">
                <div>Consignment Tracking: 1Z999AA10123456784</div>
                <div>Contracted Shipper: Apex Global Logistics LLC</div>
                <div>Direct Loss Claimed: USD 640.00 + Freight USD 28.50</div>
                <div className="font-bold text-brand-dark pt-1">Total Recovery Claimed: USD 668.50</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-brand-dark text-brand-paper text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-serif font-bold mb-4">Ready to Inspect the Working System?</h3>
          <p className="text-brand-muted text-sm mb-6">Launch Company A or Company B in our live sandboxes.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-lightgold text-brand-dark font-semibold px-6 py-2.5 rounded text-sm transition-colors"
          >
            Open Live Sandbox Switcher <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
