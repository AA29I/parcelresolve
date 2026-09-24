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
  ArrowUpDown,
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
} from 'lucide-react';

interface ParcelItem {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  recipientName: string;
  recipientCity: string;
  recipientState?: string;
  recipientCountry: string;
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
  currency: string;
  latestStatusDescription?: string;
  lastPhysicalScanAt?: string;
  lastScanLocation?: string;
  lastApiCheckAt?: string;
  slaCalculationDetail?: string;
  carrier: { id: string; name: string; code: string };
  warehouse?: { name: string; city: string };
  customFieldValues?: string;
}

interface KpiSummary {
  totalParcels: number;
  inTransit: number;
  late: number;
  exceptions: number;
  activeEnquiries: number;
  pendingClaims: number;
}

export default function DashboardPage() {
  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [kpis, setKpis] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState<ParcelItem | null>(null);
  const [parcelDetailLoading, setParcelDetailLoading] = useState(false);
  const [parcelDetailData, setParcelDetailData] = useState<any>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isBreachedFilter, setIsBreachedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (isBreachedFilter === 'BREACHED') params.append('isBreached', 'true');
      if (isBreachedFilter === 'ON_TIME') params.append('isBreached', 'false');
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/parcels?${params.toString()}`);
      const data = await res.json();
      setParcels(data.parcels || []);
      setKpis(data.kpiSummary || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, [statusFilter, isBreachedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParcels();
  };

  const openParcelDrawer = async (p: ParcelItem) => {
    setSelectedParcel(p);
    setParcelDetailLoading(true);
    setRefreshMessage(null);
    try {
      const res = await fetch(`/api/parcels/${p.id}`);
      const data = await res.json();
      setParcelDetailData(data.parcel);
    } finally {
      setParcelDetailLoading(false);
    }
  };

  const handleOnDemandRefresh = async (parcelId: string) => {
    setRefreshingId(parcelId);
    setRefreshMessage(null);
    try {
      const res = await fetch(`/api/parcels/${parcelId}/refresh`, { method: 'POST' });
      const data = await res.json();
      setRefreshMessage(data.message);
      if (data.success) {
        // Refresh local views
        await fetchParcels();
        if (selectedParcel?.id === parcelId) {
          const detailRes = await fetch(`/api/parcels/${parcelId}`);
          const detailData = await detailRes.json();
          setParcelDetailData(detailData.parcel);
        }
      }
    } finally {
      setRefreshingId(null);
    }
  };

  const handleCreateEnquiry = async (parcelId: string) => {
    const res = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelId, enquiryType: 'SLA_BREACH', sendingMode: 'STAFF_APPROVAL' }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`Carrier Enquiry Draft ${data.referenceNumber} created successfully!`);
      await fetchParcels();
      if (selectedParcel?.id === parcelId) {
        const detailRes = await fetch(`/api/parcels/${parcelId}`);
        const detailData = await detailRes.json();
        setParcelDetailData(detailData.parcel);
      }
    }
  };

  const handleCreateClaim = async (parcelId: string) => {
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelId, reason: 'LOST_IN_TRANSIT' }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`Claim Dossier ${data.claim.claimNumber} prepared with statutory Loss Declaration!`);
      await fetchParcels();
      if (selectedParcel?.id === parcelId) {
        const detailRes = await fetch(`/api/parcels/${parcelId}`);
        const detailData = await detailRes.json();
        setParcelDetailData(detailData.parcel);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Tracking Engine & SLA Operations
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Active Consignments</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Indexed real-time tracking, exact business-hour SLA monitoring, and exception resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/api/exports/parcels"
            className="px-3 py-2 rounded bg-white border border-brand-border text-xs font-semibold text-brand-dark hover:border-brand-gold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Export Filtered CSV
          </Link>
          <button
            onClick={() => fetchParcels()}
            className="p-2 rounded bg-white border border-brand-border text-brand-muted hover:text-brand-dark transition-colors shadow-xs"
            title="Refresh Table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted font-medium uppercase tracking-wider">Total Volume</div>
          <div className="text-xl font-bold font-serif text-brand-dark mt-1">
            {kpis?.totalParcels.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5">Synchronized Parcels</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted font-medium uppercase tracking-wider">In Transit</div>
          <div className="text-xl font-bold font-serif text-blue-700 mt-1">
            {kpis?.inTransit.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5">Active Carrier Custody</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-red-700 font-medium uppercase tracking-wider">SLA Breached</div>
          <div className="text-xl font-bold font-serif text-red-700 mt-1">
            {kpis?.late.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-red-600/80 mt-0.5">Overdue Delivery Date</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-amber-800 font-medium uppercase tracking-wider">Exceptions</div>
          <div className="text-xl font-bold font-serif text-amber-700 mt-1">
            {kpis?.exceptions.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">Hub Hindrance Scans</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted font-medium uppercase tracking-wider">Active Enquiries</div>
          <div className="text-xl font-bold font-serif text-purple-700 mt-1">
            {kpis?.activeEnquiries.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5">Carrier Inquiries Open</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted font-medium uppercase tracking-wider">Pending Claims</div>
          <div className="text-xl font-bold font-serif text-brand-gold mt-1">
            {kpis?.pendingClaims.toLocaleString() || 0}
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5">Awaiting Reimbursement</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-lg bg-white border border-brand-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking #, order #, recipient name, zip..."
              className="w-full pl-8 pr-3 py-1.5 border border-brand-border rounded focus:outline-none focus:border-brand-gold text-xs"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 rounded bg-brand-cream hover:bg-brand-border font-semibold text-brand-dark transition-colors">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-brand-muted">
            <Filter className="w-3 h-3" /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-brand-border bg-white text-brand-dark focus:outline-none text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="EXCEPTION">Exceptions Only</option>
            <option value="LOST">Lost in Transit</option>
            <option value="DAMAGED">Damaged</option>
            <option value="RETURNED_TO_SENDER">Returned to Sender</option>
          </select>

          <select
            value={isBreachedFilter}
            onChange={(e) => setIsBreachedFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-brand-border bg-white text-brand-dark focus:outline-none text-xs"
          >
            <option value="ALL">All SLA States</option>
            <option value="BREACHED">Breached SLA Only</option>
            <option value="ON_TIME">On-Time Only</option>
          </select>
        </div>
      </div>

      {/* Main Parcels Table */}
      <div className="overflow-x-auto border border-brand-border rounded-lg bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-cream/80 text-brand-dark font-semibold border-b border-brand-border">
            <tr>
              <th className="py-3 px-4">Tracking & Order</th>
              <th className="py-3 px-4">Carrier & Depot</th>
              <th className="py-3 px-4">Status & Exception</th>
              <th className="py-3 px-4">Last Physical Scan</th>
              <th className="py-3 px-4">SLA Deadline & Delay</th>
              <th className="py-3 px-4">Enquiry / Claim</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/60 text-brand-muted">
            {parcels.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-brand-muted">
                  No parcels matching the active filter criteria.
                </td>
              </tr>
            ) : (
              parcels.map((p) => {
                const isLate = p.isBreached && p.trackingStatus !== 'DELIVERED';
                return (
                  <tr
                    key={p.id}
                    onClick={() => openParcelDrawer(p)}
                    className="hover:bg-brand-paper/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-brand-dark flex items-center gap-1.5">
                        <span>{p.trackingNumber}</span>
                      </div>
                      <div className="text-[11px] text-brand-muted">
                        {p.orderNumber} • {p.recipientName} ({p.recipientCity}, {p.recipientCountry})
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-brand-dark">{p.carrier.name}</div>
                      <div className="text-[10px] text-brand-muted font-mono">{p.warehouse?.name || 'Main Warehouse'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.trackingStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.trackingStatus === 'EXCEPTION'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : p.trackingStatus === 'LOST' || p.trackingStatus === 'DAMAGED'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {p.trackingStatus.replace(/_/g, ' ')}
                      </span>
                      {p.latestStatusDescription && (
                        <div className="text-[10px] text-brand-muted truncate max-w-xs mt-0.5">
                          {p.latestStatusDescription}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-brand-dark">
                        {p.lastScanLocation || 'Distribution Gateway'}
                      </div>
                      <div className="text-[10px] text-brand-muted font-mono">
                        {p.lastPhysicalScanAt ? new Date(p.lastPhysicalScanAt).toLocaleString() : 'Pending Scan'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] text-brand-dark">
                        {new Date(p.promisedDeliveryDate).toLocaleDateString()}
                      </div>
                      {isLate ? (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-mono">
                          +{p.breachHours}h Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-mono">On Schedule</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[11px]">
                        {p.investigationStatus !== 'NONE' && (
                          <span className="text-purple-800 font-mono font-medium block">
                            Enquiry: {p.investigationStatus}
                          </span>
                        )}
                        {p.claimStatus !== 'NOT_ELIGIBLE' && (
                          <span className="text-amber-800 font-mono font-medium block">
                            Claim: {p.claimStatus}
                          </span>
                        )}
                        {p.recoveryStatus === 'PAID_IN_FULL' && (
                          <span className="text-emerald-700 font-mono font-bold block">
                            Paid: {p.currency} {p.declaredValue}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOnDemandRefresh(p.id)}
                        disabled={refreshingId === p.id}
                        className="p-1 rounded hover:bg-brand-cream text-brand-muted hover:text-brand-dark transition-colors inline-block"
                        title="On-Demand Carrier Refresh"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === p.id ? 'animate-spin text-brand-gold' : ''}`} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Parcel Detail Drawer */}
      {selectedParcel && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-brand-border">
            {/* Drawer Header */}
            <div className="p-5 border-b border-brand-border bg-brand-cream/80 flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-gold">
                  Consignment Inspection Dossier
                </div>
                <div className="text-lg font-mono font-bold text-brand-dark">
                  {selectedParcel.trackingNumber}
                </div>
                <div className="text-xs text-brand-muted">
                  Order #{selectedParcel.orderNumber} • {selectedParcel.carrier.name}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOnDemandRefresh(selectedParcel.id)}
                  disabled={refreshingId === selectedParcel.id}
                  className="px-2.5 py-1.5 rounded bg-white border border-brand-border hover:border-brand-gold text-xs font-semibold text-brand-dark flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshingId === selectedParcel.id ? 'animate-spin text-brand-gold' : ''}`} />
                  Refresh Carrier
                </button>
                <button
                  onClick={() => setSelectedParcel(null)}
                  className="p-1.5 rounded hover:bg-brand-border text-brand-muted hover:text-brand-dark"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification / Rate Limit Message */}
            {refreshMessage && (
              <div className="m-4 p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{refreshMessage}</span>
              </div>
            )}

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* 4 Core Decoupled Statuses */}
              <div className="p-4 rounded-lg bg-brand-paper border border-brand-border">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted mb-2">
                  Decoupled Platform Status Matrix
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-white border border-brand-border">
                    <span className="text-[9px] text-brand-muted block uppercase">1. Tracking</span>
                    <span className="font-bold text-brand-dark">{selectedParcel.trackingStatus}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-brand-border">
                    <span className="text-[9px] text-brand-muted block uppercase">2. Investigation</span>
                    <span className="font-bold text-purple-700">{selectedParcel.investigationStatus}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-brand-border">
                    <span className="text-[9px] text-brand-muted block uppercase">3. Claim</span>
                    <span className="font-bold text-amber-700">{selectedParcel.claimStatus}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-brand-border">
                    <span className="text-[9px] text-brand-muted block uppercase">4. Recovery</span>
                    <span className="font-bold text-emerald-700">{selectedParcel.recoveryStatus}</span>
                  </div>
                </div>
              </div>

              {/* Exact SLA Calculation Audit Trail */}
              <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-xs text-brand-dark flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-gold" /> SLA Calculation Audit Breakdown
                  </h3>
                  {selectedParcel.isBreached && (
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold font-mono">
                      BREACHED (+{selectedParcel.breachHours}h)
                    </span>
                  )}
                </div>
                <div className="p-3 bg-brand-paper rounded border border-brand-border font-mono text-[11px] text-brand-dark leading-relaxed whitespace-pre-line">
                  {selectedParcel.slaCalculationDetail || 'Standard 48 business hours SLA calculated.'}
                </div>
              </div>

              {/* Quick Actions (Enquiry / Claim) */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleCreateEnquiry(selectedParcel.id)}
                  className="flex-1 py-2 px-3 rounded bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Draft Carrier Enquiry
                </button>
                <button
                  onClick={() => handleCreateClaim(selectedParcel.id)}
                  className="flex-1 py-2 px-3 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-brand-gold" /> Prepare Claim Packet
                </button>
              </div>

              {/* Chronological Scan Timeline */}
              <div>
                <h3 className="font-semibold text-xs text-brand-dark mb-3">
                  Chronological Physical Scans ({parcelDetailData?.trackingEvents?.length || 0})
                </h3>

                {parcelDetailLoading ? (
                  <div className="py-4 text-center text-xs text-brand-muted font-mono">Loading timeline...</div>
                ) : (
                  <div className="border-l-2 border-brand-border ml-3 space-y-4 pl-4 font-mono text-xs">
                    {parcelDetailData?.trackingEvents?.map((ev: any, idx: number) => (
                      <div key={ev.id || idx} className="relative">
                        <span
                          className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                            ev.normalizedStatus === 'DELIVERED'
                              ? 'bg-emerald-600'
                              : ev.normalizedStatus === 'EXCEPTION'
                              ? 'bg-amber-600'
                              : 'bg-brand-gold'
                          }`}
                        ></span>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-brand-dark font-sans">{ev.normalizedStatus}</span>
                          <span className="text-[10px] text-brand-muted">
                            {new Date(ev.eventTimestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-brand-muted text-[11px] font-sans mt-0.5">{ev.statusDescription}</p>
                        {ev.locationCity && (
                          <div className="text-[10px] text-brand-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {ev.locationCity}, {ev.locationState || ''} {ev.locationCountry || ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
