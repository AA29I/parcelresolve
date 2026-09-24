'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  DollarSign,
  TrendingUp,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  Check,
  X,
  Send,
  Plus,
  Printer,
  ExternalLink,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

interface ClaimItem {
  id: string;
  claimNumber: string;
  carrierClaimReference?: string;
  reason: string;
  status: string;
  claimedAmount: number;
  approvedAmount: number;
  recoveredAmount: number;
  currency: string;
  filingDeadline: string;
  earliestFilingDate: string;
  submittedAt?: string;
  declarationText?: string;
  creditNoteReference?: string;
  createdAt: string;
  parcel: {
    id: string;
    trackingNumber: string;
    orderNumber: string;
    recipientName: string;
    dispatchDate: string;
    recoveryStatus: string;
  };
  carrier: { id: string; name: string; code: string };
  assignedUser?: { name: string; email: string };
  documents: {
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    isGeneratedDeclaration: boolean;
  }[];
  invoices?: {
    id: string;
    invoiceNumber: string;
    carrierFormat: string;
    totalClaimedAmount: number;
    currency: string;
    status: string;
  }[];
}

interface FinancialSummary {
  totalClaimed: number;
  totalApproved: number;
  totalRecovered: number;
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [financials, setFinancials] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Decision Modal state
  const [decisionModal, setDecisionModal] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'APPROVED' | 'REJECTED' | 'SETTLED'>('APPROVED');
  const [decisionAmount, setDecisionAmount] = useState<number>(0);
  const [creditNoteRef, setCreditNoteRef] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Send Claim to Courier Modal state
  const [sendClaimModal, setSendClaimModal] = useState(false);
  const [claimToSend, setClaimToSend] = useState<ClaimItem | null>(null);
  const [customCourierEmail, setCustomCourierEmail] = useState('');
  const [sendClaimLoading, setSendClaimLoading] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  // Manual Claim Creation Modal state
  const [manualClaimModal, setManualClaimModal] = useState(false);
  const [manualTracking, setManualTracking] = useState('');
  const [manualReason, setManualReason] = useState('LOST_IN_TRANSIT');
  const [manualFormat, setManualFormat] = useState('UPS_STANDARD');
  const [manualCurrency, setManualCurrency] = useState('USD');
  const [manualClaimedTotal, setManualClaimedTotal] = useState<number>(125.0);
  const [manualLineItems, setManualLineItems] = useState<
    { description: string; sku: string; quantity: number; unitPrice: number; lineTotal: number }[]
  >([
    { description: 'Contracted Consignment Goods', sku: 'SKU-001', quantity: 1, unitPrice: 110.0, lineTotal: 110.0 },
    { description: 'Contracted Carriage / Postage', sku: 'POST-001', quantity: 1, unitPrice: 15.0, lineTotal: 15.0 },
  ]);
  const [manualCustomFields, setManualCustomFields] = useState<{ key: string; value: string }[]>([
    { key: 'po_reference', value: 'PO-99201' },
    { key: 'hazard_class', value: 'NON-REG' },
  ]);
  const [manualEvidence, setManualEvidence] = useState<{ url: string; label: string; type: string }[]>([
    { url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600', label: 'Depot Damage Inspection Scan', type: 'DAMAGE_PHOTO' },
  ]);
  const [manualSendImmediately, setManualSendImmediately] = useState(true);
  const [manualCreating, setManualCreating] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== 'ALL' ? `/api/claims?status=${statusFilter}` : '/api/claims';
      const res = await fetch(url);
      const data = await res.json();
      setClaims(data.claims || []);
      setFinancials(data.financialSummary || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const openDecisionModal = (claim: ClaimItem, action: 'APPROVED' | 'REJECTED' | 'SETTLED') => {
    setSelectedClaim(claim);
    setDecisionAction(action);
    setDecisionAmount(claim.claimedAmount);
    setCreditNoteRef(claim.creditNoteReference || `CRN-${claim.carrier.code}-${Date.now().toString().slice(-5)}`);
    setDecisionModal(true);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setActionLoading(true);

    try {
      await fetch(`/api/claims/${selectedClaim.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionAction,
          approvedAmount: decisionAction === 'APPROVED' ? decisionAmount : undefined,
          recoveredAmount: decisionAction === 'SETTLED' ? decisionAmount : undefined,
          creditNoteReference: creditNoteRef,
          denialReason: decisionAction === 'REJECTED' ? denialReason : undefined,
        }),
      });
      setDecisionModal(false);
      await fetchClaims();
    } finally {
      setActionLoading(false);
    }
  };

  const openSendClaimModal = (claim: ClaimItem) => {
    setClaimToSend(claim);
    setCustomCourierEmail(`claims@${claim.carrier.code.toLowerCase()}-support.example.com`);
    setSendSuccessMsg(null);
    setSendClaimModal(true);
  };

  const handleSendClaimToCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimToSend) return;
    setSendClaimLoading(true);

    try {
      const res = await fetch(`/api/claims/${claimToSend.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customRecipientEmail: customCourierEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendSuccessMsg(data.message);
        await fetchClaims();
        setTimeout(() => {
          setSendClaimModal(false);
        }, 1500);
      }
    } finally {
      setSendClaimLoading(false);
    }
  };

  const handleAddLineItem = () => {
    setManualLineItems([
      ...manualLineItems,
      { description: 'Item Description', sku: `SKU-${Date.now().toString().slice(-4)}`, quantity: 1, unitPrice: 25.0, lineTotal: 25.0 },
    ]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setManualLineItems(manualLineItems.filter((_, i) => i !== idx));
  };

  const handleUpdateLineItem = (idx: number, field: string, value: any) => {
    const updated = [...manualLineItems];
    (updated[idx] as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[idx].lineTotal = Math.round(Number(updated[idx].quantity || 0) * Number(updated[idx].unitPrice || 0) * 100) / 100;
    }
    setManualLineItems(updated);
    const newTotal = updated.reduce((sum, item) => sum + item.lineTotal, 0);
    setManualClaimedTotal(Math.round(newTotal * 100) / 100);
  };

  const handleAddCustomField = () => {
    setManualCustomFields([...manualCustomFields, { key: 'custom_field', value: '' }]);
  };

  const handleAddEvidence = () => {
    setManualEvidence([...manualEvidence, { url: '', label: 'Photo Description', type: 'DAMAGE_PHOTO' }]);
  };

  const handleManualClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualCreating(true);
    setManualError(null);

    try {
      const customObj: Record<string, string> = {};
      manualCustomFields.forEach((cf) => {
        if (cf.key.trim()) customObj[cf.key.trim()] = cf.value;
      });

      const res = await fetch('/api/claims/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: manualTracking,
          reason: manualReason,
          carrierFormat: manualFormat,
          currency: manualCurrency,
          claimedAmount: manualClaimedTotal,
          lineItems: manualLineItems,
          customFields: customObj,
          evidenceImages: manualEvidence.filter((ev) => ev.url.trim().length > 0),
          sendImmediately: manualSendImmediately,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create manual claim');
      }

      setManualClaimModal(false);
      await fetchClaims();
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : String(err));
    } finally {
      setManualCreating(false);
    }
  };

  const winRate =
    financials && financials.totalClaimed > 0
      ? Math.round((financials.totalApproved / financials.totalClaimed) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Freight Loss & Reimbursement Engine
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Claims Recovery Portal</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Automated claim packets, courier-customized loss invoices, statutory loss declarations, and courier dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (claims.length > 0) {
                setManualTracking(claims[0].parcel.trackingNumber);
              }
              setManualClaimModal(true);
            }}
            className="px-3.5 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-brand-gold" /> Create Custom Claim & Invoice
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded border border-brand-border bg-white text-brand-dark text-xs focus:outline-none"
          >
            <option value="ALL">All Claim Statuses</option>
            <option value="READY_TO_SUBMIT">Ready to Submit</option>
            <option value="SUBMITTED">Submitted to Courier</option>
            <option value="UNDER_REVIEW">Under Carrier Review</option>
            <option value="APPROVED">Approved Claims</option>
            <option value="CLOSED">Settled & Closed</option>
            <option value="REJECTED">Rejected Claims</option>
          </select>
        </div>
      </div>

      {/* Financial Recovery KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted font-medium uppercase tracking-wider">Total Value Claimed</div>
          <div className="text-2xl font-bold font-serif text-brand-dark mt-1">
            ${financials?.totalClaimed.toFixed(2) || '0.00'}
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5">Filing Submissions</div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted font-medium uppercase tracking-wider">Carrier Approved</div>
          <div className="text-2xl font-bold font-serif text-blue-700 mt-1">
            ${financials?.totalApproved.toFixed(2) || '0.00'}
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5">Liability Acknowledged</div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-emerald-700 font-medium uppercase tracking-wider">Actually Recovered</div>
          <div className="text-2xl font-bold font-serif text-emerald-700 mt-1">
            ${financials?.totalRecovered.toFixed(2) || '0.00'}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">EFT / Freight Credit Notes</div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted font-medium uppercase tracking-wider">Claim Approval Rate</div>
          <div className="text-2xl font-bold font-serif text-brand-gold mt-1">
            {winRate}%
          </div>
          <div className="text-[10px] text-brand-muted mt-0.5">Win Rate on Filings</div>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="overflow-x-auto border border-brand-border rounded-lg bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-cream/80 text-brand-dark font-semibold border-b border-brand-border">
            <tr>
              <th className="py-3 px-4">Claim # & Carrier</th>
              <th className="py-3 px-4">Consignment Reference</th>
              <th className="py-3 px-4">Reason & Status</th>
              <th className="py-3 px-4 text-right">Claimed Value</th>
              <th className="py-3 px-4 text-right">Approved / Recovered</th>
              <th className="py-3 px-4">Courier Loss Invoice</th>
              <th className="py-3 px-4 text-right">Courier Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/60 text-brand-muted">
            {claims.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-brand-muted">
                  No claims found in this view.
                </td>
              </tr>
            ) : (
              claims.map((clm) => {
                const invoice = clm.invoices && clm.invoices.length > 0 ? clm.invoices[0] : null;
                const invoiceDoc = clm.documents.find((d) => d.documentType === 'INVOICE_DECLARATION');
                const invoiceNumber = invoice?.invoiceNumber || (invoiceDoc ? invoiceDoc.fileName.replace('.pdf', '') : `INV-CLM-${clm.carrier.code}-${clm.id.slice(-4)}`);

                return (
                  <tr key={clm.id} className="hover:bg-brand-paper/70 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-brand-dark">{clm.claimNumber}</div>
                      <div className="text-[10px] text-brand-muted font-sans">{clm.carrier.name}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-brand-dark">{clm.parcel.trackingNumber}</div>
                      <div className="text-[10px] text-brand-muted font-sans">
                        {clm.parcel.orderNumber} • {clm.parcel.recipientName}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          clm.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : clm.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                            : clm.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : clm.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {clm.status.replace(/_/g, ' ')}
                      </span>
                      <div className="text-[10px] text-brand-muted mt-0.5">{clm.reason.replace(/_/g, ' ')}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-brand-dark">
                      {clm.currency} {clm.claimedAmount.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <div className="text-emerald-700 font-bold">
                        {clm.currency} {clm.recoveredAmount.toFixed(2)}
                      </div>
                      {clm.creditNoteReference && (
                        <div className="text-[10px] text-brand-muted font-mono">{clm.creditNoteReference}</div>
                      )}
                    </td>

                    {/* Dedicated Printable Invoice Link */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <a
                        href={`/invoices/${invoiceNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-cream hover:bg-brand-border text-brand-dark text-[11px] font-semibold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-gold" />
                        <span>{invoiceNumber}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </td>

                    {/* Courier Dispatch & Decision Actions */}
                    <td className="py-3 px-4 text-right space-x-1">
                      {/* Send Claim to Courier Button */}
                      {clm.status !== 'CLOSED' && clm.status !== 'APPROVED' && clm.status !== 'SUBMITTED' && (
                        <button
                          onClick={() => openSendClaimModal(clm)}
                          className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold inline-flex items-center gap-1 shadow-xs"
                          title="Dispatch claim dossier directly to courier"
                        >
                          <Send className="w-3 h-3" /> Send to Courier
                        </button>
                      )}

                      {clm.status === 'SUBMITTED' && (
                        <span className="text-[10px] text-blue-700 font-semibold px-2 py-1 bg-blue-50 rounded">
                          Dispatched
                        </span>
                      )}

                      {clm.status !== 'CLOSED' && clm.status !== 'APPROVED' && (
                        <button
                          onClick={() => openDecisionModal(clm, 'APPROVED')}
                          className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold inline-block"
                        >
                          Approve
                        </button>
                      )}

                      {clm.status === 'APPROVED' && clm.recoveredAmount < clm.approvedAmount && (
                        <button
                          onClick={() => openDecisionModal(clm, 'SETTLED')}
                          className="px-2 py-1 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-[10px] font-bold inline-block"
                        >
                          Settle Funds
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Send Claim To Courier Modal */}
      {sendClaimModal && claimToSend && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-brand-border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-blue-600" /> Dispatch Claim Dossier to Courier
                </h3>
                <div className="text-[11px] text-brand-muted font-mono mt-0.5">
                  Claim #{claimToSend.claimNumber} • {claimToSend.carrier.name}
                </div>
              </div>
              <button onClick={() => setSendClaimModal(false)} className="text-brand-muted hover:text-brand-dark">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sendSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {sendSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSendClaimToCourier} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">
                    Courier Claims Department Email Address:
                  </label>
                  <input
                    type="email"
                    required
                    value={customCourierEmail}
                    onChange={(e) => setCustomCourierEmail(e.target.value)}
                    className="w-full p-2 border border-brand-border rounded font-mono text-xs focus:outline-none focus:border-brand-gold"
                  />
                  <p className="text-[10px] text-brand-muted mt-1">
                    Standard routing for {claimToSend.carrier.name} cargo claims and loss statements.
                  </p>
                </div>

                <div className="p-3 bg-brand-cream rounded border border-brand-border text-[11px] text-brand-muted space-y-1.5 leading-relaxed">
                  <div className="font-bold text-brand-dark">Transmitted Dossier Contents:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Certified Carrier Claim Loss Invoice (with tracking barcode & breakdown)</li>
                    <li>Statutory Non-Sales Loss Declaration & Carriage Indemnity Covenants</li>
                    <li>Consignment Waybill: <strong>{claimToSend.parcel.trackingNumber}</strong></li>
                    <li>Total Reimbursement Demanded: <strong>{claimToSend.currency} {claimToSend.claimedAmount.toFixed(2)}</strong></li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSendClaimModal(false)}
                    className="px-3 py-1.5 rounded border border-brand-border bg-white text-brand-dark font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendClaimLoading}
                    className="px-4 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendClaimLoading ? 'Transmitting Dossier...' : 'Dispatch Claim Email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manual Claim & Custom Invoice Builder Modal */}
      {manualClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-brand-border shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="font-bold text-base font-serif text-brand-dark flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-gold" /> Create Custom Claim & Courier Loss Invoice
                </h3>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  Tailor invoice format, currency, itemized loss lines, custom fields, and photo evidence for courier reimbursement.
                </div>
              </div>
              <button onClick={() => setManualClaimModal(false)} className="text-brand-muted hover:text-brand-dark">
                <X className="w-4 h-4" />
              </button>
            </div>

            {manualError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded text-red-700 text-xs">
                {manualError}
              </div>
            )}

            <form onSubmit={handleManualClaimSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Consignment Tracking Number *</label>
                  <input
                    type="text"
                    required
                    value={manualTracking}
                    onChange={(e) => setManualTracking(e.target.value)}
                    placeholder="e.g. 1Z9999999999999999"
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Courier Invoice Format Template</label>
                  <select
                    value={manualFormat}
                    onChange={(e) => setManualFormat(e.target.value)}
                    className="w-full p-2 border border-brand-border rounded bg-white"
                  >
                    <option value="UPS_STANDARD">UPS Standard Cargo Claim Format</option>
                    <option value="FEDEX_FORMAL">FedEx Formal Loss Statement Format</option>
                    <option value="DHL_EXPRESS">DHL Express Cargo Claims Format</option>
                    <option value="GLS_EUROPE">GLS European Schadensanzeige Format</option>
                    <option value="GENERIC">Universal Carrier Indemnity Format</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Loss Reason</label>
                  <select
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="w-full p-2 border border-brand-border rounded bg-white"
                  >
                    <option value="LOST_IN_TRANSIT">Lost in Transit (Non-Delivery)</option>
                    <option value="DAMAGE_IN_TRANSIT">Damaged in Transit</option>
                    <option value="SLA_BREACH_PENALTY">SLA Breach Penalty</option>
                    <option value="INCORRECT_DELIVERY">Incorrect Delivery / Misrouted</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Claim Currency</label>
                  <select
                    value={manualCurrency}
                    onChange={(e) => setManualCurrency(e.target.value)}
                    className="w-full p-2 border border-brand-border rounded bg-white"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                  </select>
                </div>
              </div>

              {/* Itemized Lines Editor */}
              <div className="border border-brand-border rounded p-3 bg-brand-paper/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-dark">Itemized Cargo & Carriage Schedule</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-[11px] font-semibold text-brand-gold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item Line
                  </button>
                </div>

                <div className="space-y-2">
                  {manualLineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <input
                        type="text"
                        placeholder="Item Description"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                        className="col-span-5 p-1.5 border border-brand-border rounded bg-white"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={item.sku}
                        onChange={(e) => handleUpdateLineItem(idx, 'sku', e.target.value)}
                        className="col-span-2 p-1.5 border border-brand-border rounded bg-white font-mono"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleUpdateLineItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="col-span-2 p-1.5 border border-brand-border rounded bg-white text-center"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="col-span-2 p-1.5 border border-brand-border rounded bg-white text-right font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="col-span-1 text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="text-right font-bold text-brand-dark pt-1">
                  Total Claimed Amount: <span className="font-mono text-amber-700">{manualCurrency} {manualClaimedTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Custom Fields Editor */}
              <div className="border border-brand-border rounded p-3 bg-brand-paper/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-dark">Courier Custom Fields (e.g. PO Ref, Hazard Class, Customs No)</span>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="text-[11px] font-semibold text-brand-gold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Field
                  </button>
                </div>

                <div className="space-y-1.5">
                  {manualCustomFields.map((cf, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Field Key (e.g. po_ref)"
                        value={cf.key}
                        onChange={(e) => {
                          const updated = [...manualCustomFields];
                          updated[idx].key = e.target.value;
                          setManualCustomFields(updated);
                        }}
                        className="w-1/3 p-1.5 border border-brand-border rounded bg-white font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={cf.value}
                        onChange={(e) => {
                          const updated = [...manualCustomFields];
                          updated[idx].value = e.target.value;
                          setManualCustomFields(updated);
                        }}
                        className="w-2/3 p-1.5 border border-brand-border rounded bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Images */}
              <div className="border border-brand-border rounded p-3 bg-brand-paper/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-dark flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-brand-gold" /> Certified Damage Photos & Proof of Value
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEvidence}
                    className="text-[11px] font-semibold text-brand-gold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Evidence Image
                  </button>
                </div>

                <div className="space-y-2">
                  {manualEvidence.map((ev, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        type="url"
                        placeholder="Image URL (e.g. https://...)"
                        value={ev.url}
                        onChange={(e) => {
                          const updated = [...manualEvidence];
                          updated[idx].url = e.target.value;
                          setManualEvidence(updated);
                        }}
                        className="col-span-7 p-1.5 border border-brand-border rounded bg-white text-[11px] font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Label"
                        value={ev.label}
                        onChange={(e) => {
                          const updated = [...manualEvidence];
                          updated[idx].label = e.target.value;
                          setManualEvidence(updated);
                        }}
                        className="col-span-5 p-1.5 border border-brand-border rounded bg-white text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Immediately Checkbox */}
              <div className="flex items-center gap-2 p-2 bg-brand-cream/60 rounded">
                <input
                  type="checkbox"
                  id="sendImmediately"
                  checked={manualSendImmediately}
                  onChange={(e) => setManualSendImmediately(e.target.checked)}
                  className="rounded text-brand-gold focus:ring-brand-gold"
                />
                <label htmlFor="sendImmediately" className="text-xs font-semibold text-brand-dark cursor-pointer">
                  Transmit claim dossier and invoice directly to courier claims email immediately upon generation
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setManualClaimModal(false)}
                  className="px-3 py-1.5 rounded border border-brand-border bg-white text-brand-dark font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualCreating}
                  className="px-5 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper font-semibold shadow-xs"
                >
                  {manualCreating ? 'Generating Claim Invoice...' : 'Create Claim & Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Recorder Modal */}
      {decisionModal && selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-brand-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-brand-dark">Record Carrier Decision</h3>
                <div className="text-[11px] text-brand-muted font-mono">Claim {selectedClaim.claimNumber}</div>
              </div>
              <button onClick={() => setDecisionModal(false)} className="text-brand-muted hover:text-brand-dark">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-brand-dark mb-1">Decision Action</label>
                <select
                  value={decisionAction}
                  onChange={(e) => setDecisionAction(e.target.value as any)}
                  className="w-full p-2 border border-brand-border rounded font-semibold bg-white"
                >
                  <option value="APPROVED">Approve Liability (Carrier Accepted)</option>
                  <option value="SETTLED">Settle / Record Recovered Funds</option>
                  <option value="REJECTED">Reject / Denial from Carrier</option>
                </select>
              </div>

              {decisionAction !== 'REJECTED' && (
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">
                    {decisionAction === 'SETTLED' ? 'Actual Recovered Funds Amount' : 'Approved Claim Amount'} ({selectedClaim.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={decisionAmount}
                    onChange={(e) => setDecisionAmount(parseFloat(e.target.value))}
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-brand-dark mb-1">Carrier Credit Memo / EFT Reference</label>
                <input
                  type="text"
                  value={creditNoteRef}
                  onChange={(e) => setCreditNoteRef(e.target.value)}
                  placeholder="e.g. UPS-CRN-991204"
                  className="w-full p-2 border border-brand-border rounded font-mono"
                />
              </div>

              <div className="p-3 bg-brand-cream rounded border border-brand-border text-[11px] text-brand-muted leading-relaxed">
                <strong>Statutory Notice:</strong> Recording recovery automatically updates the separate <code>recoveryStatus</code> balance on the underlying parcel.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionModal(false)}
                  className="px-3 py-1.5 rounded border border-brand-border bg-white text-brand-dark font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper font-semibold"
                >
                  {actionLoading ? 'Recording...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
