'use client';

import React from 'react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { CARRIER_CATALOG } from '@/lib/carrier-connectors';
import { CheckCircle2, XCircle, ArrowRight, Layers, Key, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-paper">
      <PublicHeader />

      <div className="py-16 border-b border-brand-border/60 bg-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-2">
              Carrier Integration Center
            </div>
            <h1 className="text-4xl font-serif font-bold text-brand-dark mb-4">
              Direct Accounts, Aggregators & Extension SDK
            </h1>
            <p className="text-brand-muted text-base leading-relaxed">
              Every merchant brings their own carrier contracts. We distinguish aggregators, contracted parties, physical carriers, final-mile handoffs, and claims recipients.
            </p>
          </div>
        </div>
      </div>

      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-xl font-bold font-serif text-brand-dark mb-2">Official Carrier Catalogue & Capability Matrix</h2>
          <p className="text-xs sm:text-sm text-brand-muted">
            Transparent integration capabilities. Couriers without automated API capabilities are explicitly identified.
          </p>
        </div>

        {/* Carrier Table */}
        <div className="overflow-x-auto border border-brand-border rounded-lg bg-white shadow-xs mb-16">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-cream/80 text-brand-dark font-semibold border-b border-brand-border">
              <tr>
                <th className="py-3 px-4">Carrier / Service</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Integration Type</th>
                <th className="py-3 px-4 text-center">Lookup</th>
                <th className="py-3 px-4 text-center">Webhook</th>
                <th className="py-3 px-4 text-center">POD</th>
                <th className="py-3 px-4 text-center">Claims API</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 text-brand-muted">
              {CARRIER_CATALOG.map((c) => (
                <tr key={c.code} className="hover:bg-brand-paper/50">
                  <td className="py-3.5 px-4 font-semibold text-brand-dark">
                    {c.name}
                    <div className="text-[11px] font-mono text-brand-muted">{c.code}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-brand-cream text-brand-dark text-[10px] font-mono">
                      {c.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.connectionType === 'LIVE_API'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.connectionType === 'CONFIGURABLE_API'
                          ? 'bg-blue-100 text-blue-800'
                          : c.connectionType === 'NEEDS_CUSTOM_ADAPTER'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {c.connectionType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {c.capabilities.lookup ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-brand-muted/40 inline" />
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {c.capabilities.webhook ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-brand-muted/40 inline" />
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {c.capabilities.pod ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-brand-muted/40 inline" />
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {c.capabilities.claim ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <XCircle className="w-4 h-4 text-brand-muted/40 inline" />
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] max-w-xs">{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Linnworks Deep Dive */}
        <div className="p-8 rounded-lg bg-white border border-brand-border shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-50 text-purple-900 border border-purple-200 text-xs font-medium">
              Official Linnworks Application Flow
            </div>
            <h3 className="text-2xl font-serif font-bold text-brand-dark">
              Seamless Order & Package-Level Sync
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Connect Linnworks using official application tokens. Automatically sync processed orders, extract package-level tracking numbers, and run incremental or 90-day historical backfills with rate-limit backoff.
            </p>
            <div className="p-3 bg-brand-paper rounded border border-brand-border text-xs text-brand-muted">
              <strong>Non-Linnworks Guarantee:</strong> Workspaces that do not use Linnworks have 100% of platform tracking, enquiry, and claims functionality available via CSV/XLSX imports and direct REST APIs.
            </div>
          </div>
          <div className="lg:col-span-5 bg-brand-cream p-5 rounded-lg border border-brand-border font-mono text-xs space-y-2">
            <div className="text-[11px] text-brand-muted">// LINNWORKS INTEGRATION METRICS</div>
            <div className="flex justify-between py-1 border-b border-brand-border/60">
              <span className="text-brand-muted">Auth Flow:</span>
              <span className="font-semibold text-brand-dark">AuthorizeByApplication</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-border/60">
              <span className="text-brand-muted">Rate Limit Handling:</span>
              <span className="font-semibold text-emerald-700">250 req/min with Backoff</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-border/60">
              <span className="text-brand-muted">Field Provenance:</span>
              <span className="font-semibold text-purple-700">source: &quot;LINNWORKS&quot;</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-brand-muted">Health Ping:</span>
              <span className="font-semibold text-emerald-600">Active (200 OK)</span>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
