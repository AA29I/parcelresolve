'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  AlertCircle,
  FileCheck2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Send,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  FileText,
  TrendingUp,
  Globe,
  Truck,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import HelpTooltip from '@/components/HelpTooltip';
import TrackingJourneyDrawer from '@/components/TrackingJourneyDrawer';

interface ParcelItem {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  recipientName: string;
  recipientAddress?: string;
  recipientCity: string;
  recipientState?: string;
  recipientCountry: string;
  sourceChannel?: string;
  channelReference?: string;
  postalServiceName?: string;
  trackingStatus: string;
  investigationStatus: string;
  claimStatus: string;
  recoveryStatus: string;
  isBreached: boolean;
  breachHours: number;
  stalledHours: number;
  dispatchDate: string;
  promisedDeliveryDate: string;
  declaredValue: number;
  shippingCost?: number;
  currency: string;
  itemsSummary?: string;
  itemsJson?: string;
  latestStatusDescription?: string;
  lastPhysicalScanAt?: string;
  lastScanLocation?: string;
  carrier: { id: string; name: string; code: string };
  warehouse?: { name: string; city: string };
  enquiries?: { id: string; status: string; referenceNumber: string }[];
  claims?: { id: string; status: string; claimNumber: string; approvedAmount: number; recoveredAmount: number }[];
}

interface KpiSummary {
  totalParcels: number;
  delivered: number;
  inTransit: number;
  late: number;
  exceptions: number;
  activeEnquiries: number;
  pendingClaims: number;
  claimSheet: number;
}

interface CarrierStat {
  code: string;
  name: string;
  total: number;
  delivered: number;
  inTransit: number;
  exception: number;
  late: number;
  onTimeRate: number;
}

interface CountryStat {
  country: string;
  total: number;
  delivered: number;
  exception: number;
  deliveryRate: number;
}

type TabType = 'SUMMARY' | 'DELIVERED' | 'IN_TRANSIT' | 'EXCEPTIONS' | 'CLAIM_SHEET';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('SUMMARY');
  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [kpis, setKpis] = useState<KpiSummary | null>(null);
  const [carrierStats, setCarrierStats] = useState<CarrierStat[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected parcel & modals
  const [selectedParcel, setSelectedParcel] = useState<ParcelItem | null>(null);
  const [trackingDrawerParcel, setTrackingDrawerParcel] = useState<ParcelItem | null>(null);
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);
  const [invoiceSuccessMsg, setInvoiceSuccessMsg] = useState<{ invoiceNumber: string; url: string } | null>(null);
  const [batchQueryModal, setBatchQueryModal] = useState(false);
  const [batchQuerying, setBatchQuerying] = useState(false);
  const [batchQueryDone, setBatchQueryDone] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('ALL');

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (carrierFilter !== 'ALL') params.append('carrierId', carrierFilter);
      if (searchQuery) params.append('search', searchQuery);

      // Apply tab-specific status constraints
      if (activeTab === 'DELIVERED') {
        params.append('status', 'DELIVERED');
      } else if (activeTab === 'IN_TRANSIT') {
        params.append('status', 'IN_TRANSIT');
      } else if (activeTab === 'EXCEPTIONS') {
        params.append('status', 'EXCEPTION');
      } else if (activeTab === 'CLAIM_SHEET') {
        params.append('claimStatus', 'READY_TO_SUBMIT');
      }

      const res = await fetch(`/api/parcels?${params.toString()}`);
      const data = await res.json();
      setParcels(data.parcels || []);
      setKpis(data.kpiSummary || null);
      if (data.carrierBreakdown) setCarrierStats(data.carrierBreakdown);
      if (data.countryBreakdown) setCountryStats(data.countryBreakdown);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, [activeTab, carrierFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParcels();
  };

  // 1-Click Auto Claim Invoice Generator
  const handleGenerateClaimInvoice = async (parcelId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGeneratingInvoiceId(parcelId);
    setInvoiceSuccessMsg(null);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcelId, lossReason: 'LOST_IN_TRANSIT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate claim invoice');
      setInvoiceSuccessMsg({
        invoiceNumber: data.invoice.invoiceNumber,
        url: `/invoices/${data.invoice.invoiceNumber}`,
      });
      await fetchParcels();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingInvoiceId(null);
    }
  };

  // 1-Click Batch Carrier Enquiry Trigger
  const handleExecuteBatchQuery = async () => {
    setBatchQuerying(true);
    try {
      // Find stalled exception parcels
      const exceptionParcels = parcels.filter((p) => p.trackingStatus === 'EXCEPTION');
      for (const p of exceptionParcels.slice(0, 5)) {
        await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parcelId: p.id,
            enquiryType: 'STALLED_IN_TRANSIT',
            sendingMode: 'AUTO_SEND',
            notes: `Batch enquiry auto-dispatched for stalled movement (${p.stalledHours}h inactivity).`,
          }),
        });
      }
      setBatchQueryDone(true);
      await fetchParcels();
      setTimeout(() => {
        setBatchQueryModal(false);
        setBatchQueryDone(false);
      }, 2000);
    } finally {
      setBatchQuerying(false);
    }
  };

  // Compute late categorization (mirrors the master formula)
  const getSlaLateBadge = (p: ParcelItem) => {
    if (p.trackingStatus === 'DELIVERED') {
      if (!p.isBreached) {
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Timely Delivered</span>;
      }
      const daysLate = Math.max(1, Math.round(p.breachHours / 24));
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          {daysLate === 1 ? '1 Day Late' : daysLate === 2 ? '2 Days Late' : `${daysLate} Days Late`}
        </span>
      );
    }

    // In transit or Exception
    if (!p.isBreached) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Within Transit Time</span>;
    }
    const daysLate = Math.max(1, Math.round(p.breachHours / 24));
    if (daysLate >= 3) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">More Than 3 Days Late</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">{daysLate} Day Late</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-brand-gold/15 text-brand-dark font-mono">
              Mett Global Intelligence
            </span>
            <span className="text-xs text-brand-muted">• Universal Multi-Carrier Live Engine</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Courier Performance & Claims Radar</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Real-time multi-carrier tracking normalization, statutory SLA breach monitoring, and automated commercial claims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/imports"
            className="px-3 py-2 rounded bg-brand-dark text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Package className="w-3.5 h-3.5 text-brand-gold" /> Import Manifest (Excel/CSV)
          </Link>
          <Link
            href="/api/exports/parcels"
            className="px-3 py-2 rounded bg-white border border-brand-border text-xs font-semibold text-brand-dark hover:border-brand-gold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Export CSV
          </Link>
          <button
            onClick={() => fetchParcels()}
            className="p-2 rounded bg-white border border-brand-border text-brand-muted hover:text-brand-dark transition-colors shadow-xs"
            title="Refresh Radar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5-Tab Operational Master Switcher */}
      <div className="border-b border-brand-border bg-white rounded-t-lg px-2 pt-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'SUMMARY'
                ? 'border-brand-gold text-brand-dark bg-brand-cream/50'
                : 'border-transparent text-brand-muted hover:text-brand-dark hover:bg-brand-paper'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-brand-gold" />
            <span>Summary &amp; KPIs</span>
            <HelpTooltip
              title="Courier Summary & Scorecard"
              text="Executive carrier performance league table, on-time delivery percentages, and country breakdown."
            />
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-border/60">
              {kpis?.totalParcels || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('DELIVERED')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'DELIVERED'
                ? 'border-emerald-600 text-brand-dark bg-emerald-50/50'
                : 'border-transparent text-brand-muted hover:text-brand-dark hover:bg-brand-paper'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Delivered Ledger</span>
            <HelpTooltip
              title="Delivered & Late Delivery Refunds"
              text="All verified delivered consignments. Identifies guaranteed service breaches so late-delivery postage refunds can be claimed."
            />
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
              {kpis?.delivered || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('IN_TRANSIT')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'IN_TRANSIT'
                ? 'border-blue-600 text-brand-dark bg-blue-50/50'
                : 'border-transparent text-brand-muted hover:text-brand-dark hover:bg-brand-paper'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>In-Transit Radar</span>
            <HelpTooltip
              title="Active In-Transit Pipeline"
              text="All live parcels moving in carrier custody with real-time countdown clocks (Within Transit Time, 1-3+ Days Late)."
            />
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
              {kpis?.inTransit || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'EXCEPTIONS'
                ? 'border-amber-600 text-brand-dark bg-amber-50/50'
                : 'border-transparent text-brand-muted hover:text-brand-dark hover:bg-brand-paper'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Exception Center</span>
            <HelpTooltip
              title="Stalled Exceptions (>48h)"
              text="Parcels stalled with no tracking scan for >48h, depot holds, address queries, or damages. 1-click dispatches an official carrier tracer inquiry."
            />
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
              {kpis?.exceptions || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CLAIM_SHEET')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'CLAIM_SHEET'
                ? 'border-red-600 text-brand-dark bg-red-50/50'
                : 'border-transparent text-brand-muted hover:text-brand-dark hover:bg-brand-paper'
            }`}
          >
            <DollarSign className="w-4 h-4 text-red-600" />
            <span>Claim Sheet (Recovery)</span>
            <HelpTooltip
              title="Statutory Loss Cash Recovery"
              text="Parcels that have crossed the carrier statutory loss threshold without delivery. 1-click generates an official courier claim commercial invoice."
            />
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-100 text-red-900 font-bold">
              {kpis?.claimSheet || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Notice when Claim Invoice is Generated */}
      {invoiceSuccessMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Claim Commercial Invoice <strong>{invoiceSuccessMsg.invoiceNumber}</strong> generated successfully with carrier-tailored indemnity rules!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={invoiceSuccessMsg.url}
              target="_blank"
              className="px-3 py-1.5 rounded bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View / Print PDF
            </Link>
            <button
              onClick={() => setInvoiceSuccessMsg(null)}
              className="p-1 rounded hover:bg-emerald-200/50 text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE SUMMARY (Master Summary by Carrier & Country)              */}
      {/* ========================================================================= */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
              <div className="text-[10px] text-brand-muted font-medium uppercase">Total Units</div>
              <div className="text-xl font-bold font-serif text-brand-dark mt-1">
                {kpis?.totalParcels.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-brand-muted mt-0.5">Ingested Consignments</div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
              <div className="text-[10px] text-emerald-700 font-medium uppercase">Delivered</div>
              <div className="text-xl font-bold font-serif text-emerald-700 mt-1">
                {kpis?.delivered.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">
                {kpis?.totalParcels ? Math.round(((kpis.delivered) / kpis.totalParcels) * 100) : 0}% Ratio
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
              <div className="text-[10px] text-blue-700 font-medium uppercase">In-Transit</div>
              <div className="text-xl font-bold font-serif text-blue-700 mt-1">
                {kpis?.inTransit.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-blue-600/80 mt-0.5">Active Transit</div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
              <div className="text-[10px] text-red-700 font-medium uppercase">SLA Breached</div>
              <div className="text-xl font-bold font-serif text-red-700 mt-1">
                {kpis?.late.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-red-600/80 mt-0.5">Overdue Delivery</div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
              <div className="text-[10px] text-amber-800 font-medium uppercase">Exceptions</div>
              <div className="text-xl font-bold font-serif text-amber-700 mt-1">
                {kpis?.exceptions.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-amber-700/80 mt-0.5">Stalled & Hindered</div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
              <div className="text-[10px] text-purple-700 font-medium uppercase">Enquiries</div>
              <div className="text-xl font-bold font-serif text-purple-700 mt-1">
                {kpis?.activeEnquiries.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-purple-600/80 mt-0.5">Carrier Queries</div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
              <div className="text-[10px] text-brand-gold font-medium uppercase">Claim Sheet</div>
              <div className="text-xl font-bold font-serif text-brand-gold mt-1">
                {kpis?.claimSheet.toLocaleString() || 0}
              </div>
              <div className="text-[10px] text-brand-muted mt-0.5">Statutory Loss Ready</div>
            </div>
          </div>

          {/* Master Carrier League Table */}
          <div className="bg-white border border-brand-border rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-serif font-bold text-brand-dark flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand-gold" />
                  <span>Carrier Performance League Table</span>
                </h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  Automated delivery ratio, on-time percentage, and exception rate across all connected couriers.
                </p>
              </div>
              <Link
                href="/app/carriers"
                className="text-xs font-semibold text-brand-gold hover:underline flex items-center gap-1"
              >
                Configure Carrier Claim Rules <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-cream/60 text-brand-dark font-semibold border-b border-brand-border">
                  <tr>
                    <th className="py-2.5 px-4">Courier Service</th>
                    <th className="py-2.5 px-4 text-center">Total Volume</th>
                    <th className="py-2.5 px-4 text-center">Delivered</th>
                    <th className="py-2.5 px-4 text-center">In-Transit</th>
                    <th className="py-2.5 px-4 text-center">Exceptions</th>
                    <th className="py-2.5 px-4 text-center">SLA Breaches</th>
                    <th className="py-2.5 px-4 text-right">On-Time Delivery %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {carrierStats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-brand-muted">
                        No carrier dispatches recorded in this workspace.
                      </td>
                    </tr>
                  ) : (
                    carrierStats.map((c) => (
                      <tr key={c.code} className="hover:bg-brand-paper/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-brand-dark flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-gold" />
                          <span>{c.name}</span>
                          <span className="text-[10px] font-mono text-brand-muted">({c.code})</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-medium">{c.total}</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-700">{c.delivered}</td>
                        <td className="py-3 px-4 text-center font-mono text-blue-700">{c.inTransit}</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-700">{c.exception}</td>
                        <td className="py-3 px-4 text-center font-mono text-red-700">{c.late}</td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold font-mono ${
                              c.onTimeRate >= 95
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.onTimeRate >= 85
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-red-100 text-red-900'
                            }`}
                          >
                            {c.onTimeRate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Countrywise Performance Grid */}
          <div className="bg-white border border-brand-border rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-brand-border">
              <h2 className="text-sm font-serif font-bold text-brand-dark flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-gold" />
                <span>Destination Country Performance Radar</span>
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Delivery and exception rates across UK, European Union, North America, and Global destinations.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4">
              {countryStats.map((ct) => (
                <div key={ct.country} className="p-3 rounded border border-brand-border bg-brand-paper/40">
                  <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                    <span>{ct.country}</span>
                    <span className="text-[10px] font-mono text-brand-muted">{ct.total} parcels</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                    {ct.deliveryRate}%
                  </div>
                  <div className="text-[10px] text-brand-muted mt-0.5">
                    {ct.delivered} Delivered • {ct.exception} Exc
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TABS 2 - 5: OPERATIONAL TABLES WITH CONTEXTUAL ACTIONS                     */}
      {/* ========================================================================= */}
      {activeTab !== 'SUMMARY' && (
        <div className="space-y-4">
          {/* Header Bar specific to the active tab */}
          <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-serif font-bold text-brand-dark flex items-center gap-2">
                {activeTab === 'DELIVERED' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {activeTab === 'IN_TRANSIT' && <Truck className="w-4 h-4 text-blue-600" />}
                {activeTab === 'EXCEPTIONS' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {activeTab === 'CLAIM_SHEET' && <DollarSign className="w-4 h-4 text-red-600" />}
                <span>
                  {activeTab === 'DELIVERED' && 'Delivered Consignments Ledger'}
                  {activeTab === 'IN_TRANSIT' && 'In-Transit Active Radar'}
                  {activeTab === 'EXCEPTIONS' && 'Exception & Stalled Investigation Center'}
                  {activeTab === 'CLAIM_SHEET' && 'Loss Recovery & Carrier Claim Sheet'}
                </span>
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                {activeTab === 'DELIVERED' && 'Verified deliveries with signature PODs and SLA breach audits for money-back guarantees.'}
                {activeTab === 'IN_TRANSIT' && 'Active parcels moving within carrier networks with live transit countdown.'}
                {activeTab === 'EXCEPTIONS' && 'Parcels with no movement scan for >48h or courier hindrance scans. Batch query ready.'}
                {activeTab === 'CLAIM_SHEET' && 'Parcels exceeding carrier loss thresholds (e.g. 7d DPD, 10d Royal Mail). 1-Click invoice generation.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'EXCEPTIONS' && (
                <button
                  onClick={() => setBatchQueryModal(true)}
                  className="px-3.5 py-2 rounded bg-purple-700 text-white font-semibold text-xs hover:bg-purple-800 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Batch Query Couriers
                </button>
              )}

              {activeTab === 'CLAIM_SHEET' && (
                <div className="text-right">
                  <div className="text-[10px] text-brand-muted uppercase font-mono">Unclaimed Capital</div>
                  <div className="text-sm font-bold font-mono text-red-700">
                    £{parcels.reduce((sum, p) => sum + (p.declaredValue || 0), 0).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search & Carrier Filter Row */}
          <div className="p-3 rounded-lg bg-white border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracking #, order #, recipient name, city, postcode..."
                  className="w-full pl-8 pr-3 py-1.5 border border-brand-border rounded focus:outline-none focus:border-brand-gold text-xs"
                />
              </div>
              <button type="submit" className="px-3 py-1.5 rounded bg-brand-cream hover:bg-brand-border font-semibold text-brand-dark transition-colors">
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <span className="text-brand-muted text-xs flex items-center gap-1">
                <Filter className="w-3 h-3" /> Carrier:
              </span>
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-brand-border bg-white text-brand-dark focus:outline-none text-xs"
              >
                <option value="ALL">All Couriers</option>
                {carrierStats.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Operational Parcels Table */}
          <div className="overflow-x-auto border border-brand-border rounded-lg bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-cream/80 text-brand-dark font-semibold border-b border-brand-border">
                <tr>
                  <th className="py-3 px-4">Consignment & Order</th>
                  <th className="py-3 px-4">Courier & Postal Service</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Dispatch & SLA Deadline</th>
                  <th className="py-3 px-4">SLA Performance</th>
                  <th className="py-3 px-4">Latest Scan Checkpoint</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-brand-muted">
                {parcels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-brand-muted">
                      No consignments currently in this operational category.
                    </td>
                  </tr>
                ) : (
                  parcels.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedParcel(p)}
                      className="hover:bg-brand-paper/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-brand-dark flex items-center gap-1.5">
                          <span>{p.trackingNumber}</span>
                        </div>
                        <div className="text-[11px] text-brand-muted">
                          Order #{p.orderNumber} {p.sourceChannel ? `• ${p.sourceChannel}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-brand-dark">{p.carrier.name}</div>
                        <div className="text-[10px] text-brand-muted font-mono">{p.postalServiceName || p.carrier.code}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-brand-dark">{p.recipientName}</div>
                        <div className="text-[10px] text-brand-muted">
                          {p.recipientCity}, {p.recipientCountry}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div>Dispatched: {new Date(p.dispatchDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-brand-muted">
                          Promised: {new Date(p.promisedDeliveryDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {getSlaLateBadge(p)}
                        {p.stalledHours > 0 && p.trackingStatus !== 'DELIVERED' && (
                          <div className="text-[10px] text-amber-800 font-mono mt-0.5">
                            Stalled: {Math.round(p.stalledHours)}h no scan
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-[11px] text-brand-dark truncate">
                          {p.latestStatusDescription || 'Inducted into courier network'}
                        </div>
                        <div className="text-[10px] text-brand-muted font-mono">
                          {p.lastScanLocation || 'Depot'} • {p.lastPhysicalScanAt ? new Date(p.lastPhysicalScanAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scan Pending'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {activeTab === 'CLAIM_SHEET' ? (
                          <button
                            onClick={(e) => handleGenerateClaimInvoice(p.id, e)}
                            disabled={generatingInvoiceId === p.id}
                            className="px-3 py-1.5 rounded bg-red-700 text-white font-semibold text-[11px] hover:bg-red-800 transition-colors shadow-xs disabled:opacity-50"
                          >
                            {generatingInvoiceId === p.id ? 'Generating...' : 'Create Claim Invoice'}
                          </button>
                        ) : activeTab === 'EXCEPTIONS' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedParcel(p);
                            }}
                            className="px-2.5 py-1 rounded bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 font-semibold text-[11px] transition-colors"
                          >
                            Query Courier
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedParcel(p);
                            }}
                            className="text-brand-gold hover:underline font-semibold text-xs flex items-center gap-1 justify-end ml-auto"
                          >
                            Details <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / SLIDE-OVER MODAL FOR PARCEL DETAILS & CLAIM ACTIONS               */}
      {/* ========================================================================= */}
      {selectedParcel && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div>
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-brand-gold">
                  {selectedParcel.carrier.name} Consignment
                </span>
                <h2 className="text-lg font-serif font-bold text-brand-dark">
                  {selectedParcel.trackingNumber}
                </h2>
                <div className="text-xs text-brand-muted">Order #{selectedParcel.orderNumber}</div>
              </div>
              <button
                onClick={() => setSelectedParcel(null)}
                className="p-2 rounded-full hover:bg-brand-cream text-brand-muted hover:text-brand-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-3.5 rounded-lg bg-brand-cream/60 border border-brand-border flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-brand-dark">Direct Claim Action</div>
                <div className="text-[11px] text-brand-muted">
                  Generate courier-compliant indemnity invoice & statutory loss package.
                </div>
              </div>
              <button
                onClick={() => handleGenerateClaimInvoice(selectedParcel.id)}
                disabled={generatingInvoiceId === selectedParcel.id}
                className="px-3.5 py-2 rounded bg-red-700 text-white font-semibold text-xs hover:bg-red-800 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                {generatingInvoiceId === selectedParcel.id ? 'Generating...' : 'Generate Claim Invoice'}
              </button>
            </div>

            {/* Consignment Specification Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded border border-brand-border">
                <span className="text-brand-muted block text-[10px] uppercase font-mono">Consignee</span>
                <span className="font-semibold text-brand-dark text-sm">{selectedParcel.recipientName}</span>
                <div className="text-brand-muted mt-0.5">
                  {selectedParcel.recipientCity}, {selectedParcel.recipientState || ''} {selectedParcel.recipientCountry}
                </div>
              </div>

              <div className="p-3 rounded border border-brand-border">
                <span className="text-brand-muted block text-[10px] uppercase font-mono">Cargo Value</span>
                <span className="font-semibold text-brand-dark text-sm">
                  {selectedParcel.currency} {selectedParcel.declaredValue.toFixed(2)}
                </span>
                <div className="text-brand-muted mt-0.5">
                  Postage: {selectedParcel.currency} {(selectedParcel.shippingCost || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Itemized Consignment Lines */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider font-mono">
                Consignment Item Contents
              </h3>
              <div className="p-3 rounded-lg border border-brand-border bg-brand-paper/30 text-xs">
                {selectedParcel.itemsJson && selectedParcel.itemsJson !== '[]' ? (
                  <div className="space-y-2">
                    {JSON.parse(selectedParcel.itemsJson).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-brand-border/40 last:border-0">
                        <div>
                          <span className="font-semibold text-brand-dark">{item.title}</span>
                          <span className="text-[10px] font-mono text-brand-muted block">SKU: {item.sku} • Qty: {item.quantity}</span>
                        </div>
                        <span className="font-mono font-bold text-brand-dark">
                          {selectedParcel.currency} {Number(item.lineTotal || item.unitRetailPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-brand-muted">
                    {selectedParcel.itemsSummary || 'Standard Contracted Consignment Goods'}
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Status History Checkpoint */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider font-mono">
                Live Scan Audit Trail
              </h3>
              <div className="p-3 rounded-lg border border-brand-border bg-white space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                  <div>
                    <div className="font-semibold text-brand-dark">
                      {selectedParcel.latestStatusDescription || 'Dispatched from Fulfillment Hub'}
                    </div>
                    <div className="text-[10px] text-brand-muted font-mono">
                      Location: {selectedParcel.lastScanLocation || 'Gateway Depot'} • Recorded: {selectedParcel.lastPhysicalScanAt ? new Date(selectedParcel.lastPhysicalScanAt).toLocaleString() : 'Recent'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-brand-border flex justify-end">
              <button
                onClick={() => setSelectedParcel(null)}
                className="px-4 py-2 rounded bg-brand-paper border border-brand-border text-xs font-semibold text-brand-dark hover:bg-brand-cream transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BATCH QUERY COURIERS MODAL                                                */}
      {/* ========================================================================= */}
      {batchQueryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-brand-border p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-bold font-serif text-brand-dark">
                  Autonomous Courier Investigation Dispatcher
                </h3>
              </div>
              <button
                onClick={() => setBatchQueryModal(false)}
                className="p-1 rounded hover:bg-brand-cream text-brand-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-brand-muted">
              The system has identified <strong>{kpis?.exceptions || 0} stalled exception shipments</strong> across carrier hubs (Evri, DPD, Royal Mail, Yodel).
            </p>

            <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200 text-xs text-purple-900 space-y-1.5 font-mono">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                <span>Automated Query Dispatch Package:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Auto-groups consignments by Carrier Account Contact Desk</li>
                <li>Attaches Consignment Tracking Barcodes & Warehouse Dispatch Dates</li>
                <li>Requests depot search before statutory claim loss expiration</li>
              </ul>
            </div>

            {batchQueryDone ? (
              <div className="p-3 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Carrier Enquiry Dossiers Dispatched Successfully!</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBatchQueryModal(false)}
                  className="px-3 py-1.5 rounded border border-brand-border text-xs font-semibold text-brand-dark hover:bg-brand-paper"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchQuery}
                  disabled={batchQuerying}
                  className="px-4 py-2 rounded bg-purple-700 text-white font-semibold text-xs hover:bg-purple-800 transition-colors shadow-xs disabled:opacity-60 flex items-center gap-1.5"
                >
                  {batchQuerying ? 'Dispatching Enquiries...' : 'Approve & Dispatch Queries'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
