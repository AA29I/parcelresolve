'use client';

import React from 'react';
import {
  X,
  BookOpen,
  Package,
  Clock,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface OperationsGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OperationsGuideDrawer({ isOpen, onClose }: OperationsGuideDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-brand-border flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-brand-border bg-brand-cream/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-dark text-brand-gold rounded-lg shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-brand-dark">
                Mett Global Claims &amp; Operations Playbook
              </h2>
              <p className="text-xs text-brand-muted">
                Standard Operating Procedures for high-volume courier performance, investigations &amp; cash recovery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-brand-muted hover:text-brand-dark rounded-md hover:bg-brand-paper transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-brand-ink">
          {/* Section 1: End to End Flow */}
          <div className="p-4 rounded-xl bg-brand-paper border border-brand-border space-y-3">
            <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
              <Package className="w-4 h-4 text-brand-gold" />
              1. The 5-Stage Claims &amp; Recovery Workflow
            </div>
            <p className="text-brand-muted leading-relaxed">
              Every day, thousands of parcels are dispatched through multiple couriers. Mett Global tracks every parcel through 5 operational stages:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2.5 bg-white rounded border border-brand-border text-center">
                <span className="font-bold text-brand-gold block text-xs">Stage 1</span>
                <span className="text-brand-dark font-semibold block mt-0.5">Ingestion</span>
                <span className="text-[10px] text-brand-muted block mt-0.5">Linnworks API / Excel</span>
              </div>
              <div className="p-2.5 bg-white rounded border border-brand-border text-center">
                <span className="font-bold text-brand-gold block text-xs">Stage 2</span>
                <span className="text-brand-dark font-semibold block mt-0.5">Live Radar</span>
                <span className="text-[10px] text-brand-muted block mt-0.5">SLA late tracking</span>
              </div>
              <div className="p-2.5 bg-white rounded border border-brand-border text-center">
                <span className="font-bold text-brand-gold block text-xs">Stage 3</span>
                <span className="text-brand-dark font-semibold block mt-0.5">Exceptions</span>
                <span className="text-[10px] text-brand-muted block mt-0.5">Stalled &gt;48h tracers</span>
              </div>
              <div className="p-2.5 bg-white rounded border border-brand-border text-center">
                <span className="font-bold text-brand-gold block text-xs">Stage 4</span>
                <span className="text-brand-dark font-semibold block mt-0.5">Claim Sheet</span>
                <span className="text-[10px] text-brand-muted block mt-0.5">Statutory loss passed</span>
              </div>
              <div className="p-2.5 bg-white rounded border border-brand-border text-center">
                <span className="font-bold text-brand-gold block text-xs">Stage 5</span>
                <span className="text-brand-dark font-semibold block mt-0.5">Recovery</span>
                <span className="text-[10px] text-brand-muted block mt-0.5">Credit note / payout</span>
              </div>
            </div>
          </div>

          {/* Section 2: Linnworks & Custom Columns */}
          <div className="p-4 rounded-xl bg-white border border-brand-border shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
              <Cpu className="w-4 h-4 text-brand-gold" />
              2. How Linnworks Data Ingestion Works
            </div>
            <div className="space-y-2 text-brand-muted leading-relaxed">
              <p>
                <strong>Method A — Automated API Sync:</strong> Enter your Linnworks Developer Application ID, Secret, and Token in the <em>Linnworks &amp; Ingestion</em> tab. Mett Global syncs processed orders automatically every night, fetching item SKUs, costs, tracking numbers, and customer addresses.
              </p>
              <p>
                <strong>Method B — Drag &amp; Drop Excel / CSV:</strong> Drag any Linnworks dispatch report or Courier Performance spreadsheet into the upload zone. The engine accepts <em>any column arrangement</em> and automatically identifies the 20 core dimensions (`OrderId`, `Processed`, `Country`, `Source`, `Postal Service`, `Tracking Number`, `Status`, `Date`, `SLA`, `Courier Name`).
              </p>
              <p>
                <strong>Custom Fields:</strong> Any column your company uses that isn’t a standard field (e.g., `batch_id`, `warehouse_bay`, `special_instructions`) is preserved as a custom attribute on the parcel so zero data is lost.
              </p>
            </div>
          </div>

          {/* Section 3: SLA Mathematics & Late Classification */}
          <div className="p-4 rounded-xl bg-white border border-brand-border shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
              <Clock className="w-4 h-4 text-brand-gold" />
              3. SLA Calculation &amp; Late Variance Formula
            </div>
            <p className="text-brand-muted leading-relaxed">
              The platform calculates delivery deadlines using standard carrier business day algorithms:
            </p>
            <ul className="list-disc ml-4 space-y-1 text-brand-muted">
              <li>
                <strong>Cutoff Time:</strong> Dispatches after the warehouse cutoff (e.g. 16:00) advance the SLA clock to 09:00 AM the next business day.
              </li>
              <li>
                <strong>Weekend &amp; Holiday Skipping:</strong> Saturdays and Sundays are excluded from business transit time.
              </li>
              <li>
                <strong>Late Classification:</strong> Consignments are categorized into:
                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">Within Transit Time</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">1 Day Late</span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-semibold">2 Days Late</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-semibold">3 Days Late</span>
                  <span className="px-2 py-0.5 bg-red-200 text-red-900 rounded font-bold">More Than 3 Days Late</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Section 4: Carrier Invoice Rules Matrix */}
          <div className="p-4 rounded-xl bg-white border border-brand-border shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
              <FileText className="w-4 h-4 text-brand-gold" />
              4. Why Courier Invoice Formats Are Different
            </div>
            <p className="text-brand-muted leading-relaxed">
              Each courier rejects claims if the invoice isn&apos;t calculated to their exact contract rules:
            </p>
            <div className="space-y-2 border border-brand-border rounded-lg overflow-hidden">
              <div className="p-2.5 bg-brand-paper border-b border-brand-border flex items-start gap-2">
                <span className="font-bold text-brand-dark w-28 shrink-0">Royal Mail:</span>
                <span className="text-brand-muted">
                  Requires <strong>Statutory Form P58</strong> calculated at <strong>Wholesale Cost of Goods</strong>. If you submit a retail invoice with customer VAT, Royal Mail will legally reject it.
                </span>
              </div>
              <div className="p-2.5 bg-white border-b border-brand-border flex items-start gap-2">
                <span className="font-bold text-brand-dark w-28 shrink-0">DPD UK:</span>
                <span className="text-brand-muted">
                  Requires a Commercial Loss Statement calculated at <strong>Retail Net Selling Price excluding VAT</strong> plus paid postage refund.
                </span>
              </div>
              <div className="p-2.5 bg-brand-paper border-b border-brand-border flex items-start gap-2">
                <span className="font-bold text-brand-dark w-28 shrink-0">Evri (Hermes):</span>
                <span className="text-brand-muted">
                  Enforces standard carrier indemnity capped at <strong>£20.00 flat</strong> per parcel (excluding carriage).
                </span>
              </div>
              <div className="p-2.5 bg-white flex items-start gap-2">
                <span className="font-bold text-brand-dark w-28 shrink-0">Yodel:</span>
                <span className="text-brand-muted">
                  Requires formal dock search confirmation with loss compensation capped at <strong>£50.00 default</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Automated Tracing & Communication */}
          <div className="p-4 rounded-xl bg-brand-cream/70 border border-brand-border space-y-2">
            <div className="flex items-center gap-2 text-brand-dark font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              5. Automated Carrier Tracers &amp; Loss Declaration
            </div>
            <p className="text-brand-muted leading-relaxed">
              When a package stops moving for &gt;48h, click <strong>&quot;Send Courier Inquiry&quot;</strong>. Mett Global dispatches an official inquiry to the courier&apos;s investigations desk. When the courier confirms the parcel cannot be found, the system marks it <strong>LOST</strong> and automatically generates the compliant claim invoice for submission!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-border bg-brand-paper flex items-center justify-between">
          <span className="text-xs text-brand-muted">Mett Global Logistics Claims Engine v2.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-brand-dark text-brand-paper font-semibold hover:bg-brand-ink transition-colors"
          >
            Got it, return to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
