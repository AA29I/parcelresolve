'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Check,
  User,
  ShieldAlert,
  ArrowUpRight,
  FileCheck2,
  CornerDownLeft,
} from 'lucide-react';

interface EnquiryItem {
  id: string;
  referenceNumber: string;
  enquiryType: string;
  status: string;
  sendingMode: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt?: string;
  lastReplyAt?: string;
  replyCount: number;
  followUpDueDate?: string;
  followUpSequenceCount: number;
  escalationTier: string;
  createdAt: string;
  parcel: {
    id: string;
    trackingNumber: string;
    orderNumber: string;
    recipientName: string;
    destinationZone: string;
    breachHours: number;
    stalledHours: number;
    declaredValue: number;
    currency: string;
  };
  carrier: { name: string; code: string };
  assignedUser?: { name: string; email: string };
  messages: {
    id: string;
    senderType: string;
    senderName: string;
    messageBody: string;
    messageTimestamp: string;
  }[];
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState<string | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== 'ALL' ? `/api/enquiries?status=${statusFilter}` : '/api/enquiries';
      const res = await fetch(url);
      const data = await res.json();
      setEnquiries(data.enquiries || []);
      if (selectedEnquiry) {
        const refreshed = (data.enquiries || []).find((e: EnquiryItem) => e.id === selectedEnquiry.id);
        if (refreshed) setSelectedEnquiry(refreshed);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/enquiries/${id}/approve`, { method: 'POST' });
      await fetchEnquiries();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendFollowUp = async (id: string) => {
    setActionLoading(true);
    setFollowUpMsg(null);
    try {
      const res = await fetch(`/api/enquiries/${id}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setFollowUpMsg(`Escalation Notice (${data.escalationTier}) dispatched to courier!`);
        await fetchEnquiries();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateCarrierReply = async (id: string, outcome: 'PACKAGE_LOST' | 'PACKAGE_FOUND' | 'NEED_MORE_INFO') => {
    setActionLoading(true);
    setFollowUpMsg(null);
    let sampleText = '';
    if (outcome === 'PACKAGE_LOST') {
      sampleText = 'Carrier Claims Unit: Package has been searched at depot dock and is officially declared Lost in Transit. Please submit your formal claim and loss invoice for reimbursement adjudication.';
    } else if (outcome === 'PACKAGE_FOUND') {
      sampleText = 'Carrier Operations Desk: Consignment has been located at distribution hub. It is staged on trailer #402 and scheduled for delivery by tomorrow 17:00.';
    } else {
      sampleText = 'Carrier Support: We have initiated an investigation tracer. Please provide the commercial invoice and signed consignee denial of receipt declaration.';
    }

    try {
      const res = await fetch(`/api/enquiries/${id}/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          messageBody: sampleText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFollowUpMsg(
          outcome === 'PACKAGE_LOST'
            ? 'Carrier confirmed loss! Parcel marked LOST & Loss Invoice auto-generated.'
            : 'Inbound carrier reply ingested and status updated.'
        );
        await fetchEnquiries();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddStaffReply = async (id: string) => {
    if (!replyText.trim()) return;
    setActionLoading(true);
    try {
      await fetch(`/api/enquiries/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageBody: replyText,
          senderType: 'STAFF',
        }),
      });
      setReplyText('');
      await fetchEnquiries();
    } finally {
      setActionLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'REMINDER_1':
        return { label: 'Reminder #1 (48h Tracer)', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'REMINDER_2':
        return { label: 'Reminder #2 (96h SLA Default)', color: 'bg-orange-100 text-orange-900 border-orange-300' };
      case 'FINAL_DEMAND':
        return { label: 'Final Demand (Claim Attached)', color: 'bg-red-100 text-red-900 border-red-300' };
      case 'INITIAL':
      default:
        return { label: 'Initial Notice Dispatched', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Carrier Communication & Escalation
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Carrier Enquiries Desk</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Automated courier non-delivery notices, multi-turn follow-up cadence, and inbound response ingestion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded border border-brand-border bg-white text-brand-dark text-xs focus:outline-none"
          >
            <option value="ALL">All Enquiries</option>
            <option value="DRAFT">Drafts</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="SENT">Sent / Awaiting Reply</option>
            <option value="CARRIER_REPLIED">Carrier Replied</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Enquiries List */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-brand-muted font-mono">Loading enquiries...</div>
          ) : enquiries.length === 0 ? (
            <div className="p-8 text-center rounded-lg bg-white border border-brand-border text-xs text-brand-muted">
              No carrier enquiries in this view.
            </div>
          ) : (
            enquiries.map((enq) => {
              const isSelected = selectedEnquiry?.id === enq.id;
              const tierBadge = getTierBadge(enq.escalationTier);

              return (
                <div
                  key={enq.id}
                  onClick={() => setSelectedEnquiry(enq)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-brand-gold ring-1 ring-brand-gold/40 shadow-xs'
                      : 'bg-white border-brand-border hover:border-brand-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-brand-dark">
                      {enq.referenceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        enq.status === 'SENT'
                          ? 'bg-blue-100 text-blue-800'
                          : enq.status === 'CARRIER_REPLIED'
                          ? 'bg-purple-100 text-purple-800'
                          : enq.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : enq.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {enq.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-brand-dark truncate mb-1">
                    Trk #{enq.parcel.trackingNumber} • {enq.carrier.name}
                  </div>

                  <div className="text-[11px] text-brand-muted line-clamp-2 mb-2">
                    {enq.subject}
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-brand-border/60">
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${tierBadge.color}`}>
                      {tierBadge.label}
                    </span>
                    <span className="text-brand-muted">{enq.messages.length} messages</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Enquiry Thread & Detail */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-brand-border p-6 shadow-xs min-h-[500px]">
          {selectedEnquiry ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-brand-border pb-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-gold">
                    Enquiry Dossier & Follow-Up Cadence
                  </div>
                  <h2 className="text-lg font-bold text-brand-dark font-mono">
                    {selectedEnquiry.referenceNumber}
                  </h2>
                  <div className="text-xs text-brand-muted mt-0.5">
                    Target: <span className="font-mono text-brand-dark font-semibold">{selectedEnquiry.recipientEmail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedEnquiry.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleApprove(selectedEnquiry.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Dispatch
                    </button>
                  )}

                  {selectedEnquiry.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleSendFollowUp(selectedEnquiry.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded bg-orange-700 hover:bg-orange-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Send next escalation notice in follow-up sequence"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Send Follow-Up Notice
                    </button>
                  )}
                </div>
              </div>

              {/* Status / Notice Alert Banner */}
              {followUpMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{followUpMsg}</span>
                </div>
              )}

              {/* Follow-Up Cadence Status Card */}
              <div className="p-3.5 bg-brand-paper rounded-lg border border-brand-border text-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-brand-muted uppercase font-bold">Escalation Cadence Level</div>
                  <div className="font-bold text-brand-dark font-mono text-sm mt-0.5">
                    {getTierBadge(selectedEnquiry.escalationTier).label}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-brand-muted uppercase font-bold">Notices Dispatched</div>
                  <div className="font-bold text-brand-dark font-mono text-sm mt-0.5">
                    {selectedEnquiry.followUpSequenceCount} notices sent
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-brand-muted uppercase font-bold">Follow-Up Due Date</div>
                  <div className="font-bold text-amber-800 font-mono text-xs mt-0.5">
                    {selectedEnquiry.followUpDueDate ? new Date(selectedEnquiry.followUpDueDate).toLocaleString() : 'Pending'}
                  </div>
                </div>
              </div>

              {/* Interactive Courier Response Simulator (for Demo) */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-lg space-y-2">
                <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                  <span>Simulate Inbound Courier Email Reply (Office Demo / QA):</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulateCarrierReply(selectedEnquiry.id, 'PACKAGE_LOST')}
                    disabled={actionLoading}
                    className="px-2.5 py-1.5 rounded bg-white hover:bg-purple-100 text-red-700 border border-red-300 text-[11px] font-semibold transition-colors shadow-xs"
                  >
                    1. Simulate: Package Deemed Lost (Auto-Creates Claim & Invoice)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateCarrierReply(selectedEnquiry.id, 'PACKAGE_FOUND')}
                    disabled={actionLoading}
                    className="px-2.5 py-1.5 rounded bg-white hover:bg-purple-100 text-emerald-700 border border-emerald-300 text-[11px] font-semibold transition-colors shadow-xs"
                  >
                    2. Simulate: Package Located at Depot
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateCarrierReply(selectedEnquiry.id, 'NEED_MORE_INFO')}
                    disabled={actionLoading}
                    className="px-2.5 py-1.5 rounded bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 text-[11px] font-semibold transition-colors shadow-xs"
                  >
                    3. Simulate: Request Proof of Value
                  </button>
                </div>
              </div>

              {/* Subject & Initial Body */}
              <div className="p-4 rounded-lg bg-brand-paper border border-brand-border font-mono text-xs text-brand-dark whitespace-pre-line leading-relaxed">
                <div className="font-sans font-bold text-xs mb-2 text-brand-dark">Subject: {selectedEnquiry.subject}</div>
                {selectedEnquiry.body}
              </div>

              {/* Message Thread */}
              <div>
                <h3 className="text-xs font-semibold text-brand-dark mb-3">Audit Thread & Multi-Turn Replies ({selectedEnquiry.messages.length})</h3>
                <div className="space-y-3 font-mono text-xs max-h-72 overflow-y-auto">
                  {selectedEnquiry.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg border ${
                        m.senderType === 'CARRIER'
                          ? 'bg-purple-50/70 border-purple-200'
                          : m.senderType === 'STAFF'
                          ? 'bg-white border-brand-border'
                          : 'bg-brand-cream/60 border-brand-border text-brand-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1 font-sans">
                        <span className="font-semibold text-brand-dark flex items-center gap-1.5">
                          {m.senderType === 'CARRIER' && <span className="w-2 h-2 rounded-full bg-purple-600"></span>}
                          {m.senderType === 'STAFF' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                          {m.senderName} ({m.senderType})
                        </span>
                        <span className="text-brand-muted text-[10px]">
                          {new Date(m.messageTimestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-dark leading-relaxed font-sans whitespace-pre-line">{m.messageBody}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Composer */}
              <div className="pt-4 border-t border-brand-border space-y-3">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type staff counter-response to courier (attaching updates, instructions, or notes)..."
                  className="w-full p-3 border border-brand-border rounded text-xs focus:outline-none focus:border-brand-gold font-sans"
                ></textarea>

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-brand-muted">
                    Sends official counter-response back to <strong className="text-brand-dark">{selectedEnquiry.recipientEmail}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddStaffReply(selectedEnquiry.id)}
                    disabled={actionLoading || !replyText.trim()}
                    className="px-4 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3 h-3 text-brand-gold" /> Send Staff Response
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-brand-muted">
              Select an enquiry on the left to inspect thread, follow-up cadence, and simulate courier responses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
