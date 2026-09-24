'use client';

import React, { useState, useEffect } from 'react';
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
  carrier: { name: string; code: string };
  assignedUser?: { name: string; email: string };
  documents: {
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    isGeneratedDeclaration: boolean;
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
  const [decisionModal, setDecisionModal] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'APPROVED' | 'REJECTED' | 'SETTLED'>('APPROVED');
  const [decisionAmount, setDecisionAmount] = useState<number>(0);
  const [creditNoteRef, setCreditNoteRef] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const winRate =
    financials && financials.totalClaimed > 0
      ? Math.round((financials.totalApproved / financials.totalClaimed) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Freight Loss & Reimbursement Engine
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Claims Recovery Portal</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Automated claim packets, statutory loss declarations, credit note recording, and recovered capital accounting.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded border border-brand-border bg-white text-brand-dark text-xs focus:outline-none"
        >
          <option value="ALL">All Claim Statuses</option>
          <option value="READY_TO_SUBMIT">Ready to Submit</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Carrier Review</option>
          <option value="APPROVED">Approved Claims</option>
          <option value="CLOSED">Settled & Closed</option>
          <option value="REJECTED">Rejected Claims</option>
        </select>
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
              <th className="py-3 px-4">Filing Deadline</th>
              <th className="py-3 px-4 text-right">Decision / Action</th>
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
              claims.map((clm) => (
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

                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div>{new Date(clm.filingDeadline).toLocaleDateString()}</div>
                  </td>

                  <td className="py-3 px-4 text-right space-x-1">
                    <a
                      href={`/api/claims/${clm.id}/declaration`}
                      download
                      className="p-1.5 rounded hover:bg-brand-cream text-brand-muted hover:text-brand-dark inline-block"
                      title="Download Loss Declaration"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-gold" />
                    </a>

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
              ))
            )}
          </tbody>
        </table>
      </div>

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
