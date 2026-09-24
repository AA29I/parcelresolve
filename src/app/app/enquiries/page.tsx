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
  createdAt: string;
  parcel: {
    trackingNumber: string;
    orderNumber: string;
    recipientName: string;
    destinationZone: string;
    breachHours: number;
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

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== 'ALL' ? `/api/enquiries?status=${statusFilter}` : '/api/enquiries';
      const res = await fetch(url);
      const data = await res.json();
      setEnquiries(data.enquiries || []);
      if (selectedEnquiry) {
        const refreshed = data.enquiries.find((e: EnquiryItem) => e.id === selectedEnquiry.id);
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

  const handleAddReply = async (id: string, senderType: 'STAFF' | 'CARRIER') => {
    if (!replyText.trim()) return;
    setActionLoading(true);
    try {
      await fetch(`/api/enquiries/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageBody: replyText,
          senderType,
        }),
      });
      setReplyText('');
      await fetchEnquiries();
    } finally {
      setActionLoading(false);
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
            Automated non-delivery drafts, approval gates, email deduplication, and follow-up tracking.
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

                  <div className="flex items-center justify-between text-[10px] text-brand-muted pt-2 border-t border-brand-border/60">
                    <span>{enq.messages.length} messages</span>
                    <span>Created: {new Date(enq.createdAt).toLocaleDateString()}</span>
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
                    Enquiry Details & Communication Log
                  </div>
                  <h2 className="text-lg font-bold text-brand-dark font-mono">
                    {selectedEnquiry.referenceNumber}
                  </h2>
                  <div className="text-xs text-brand-muted mt-0.5">
                    Target: {selectedEnquiry.recipientEmail} • Mode: {selectedEnquiry.sendingMode}
                  </div>
                </div>

                {selectedEnquiry.status === 'PENDING_APPROVAL' && (
                  <button
                    onClick={() => handleApprove(selectedEnquiry.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve & Dispatch
                  </button>
                )}
              </div>

              {/* Subject & Initial Body */}
              <div className="p-4 rounded-lg bg-brand-paper border border-brand-border font-mono text-xs text-brand-dark whitespace-pre-line leading-relaxed">
                <div className="font-sans font-bold text-xs mb-2 text-brand-dark">Subject: {selectedEnquiry.subject}</div>
                {selectedEnquiry.body}
              </div>

              {/* Message Thread */}
              <div>
                <h3 className="text-xs font-semibold text-brand-dark mb-3">Audit Thread & Replies</h3>
                <div className="space-y-3 font-mono text-xs">
                  {selectedEnquiry.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg border ${
                        m.senderType === 'CARRIER'
                          ? 'bg-purple-50/50 border-purple-200'
                          : m.senderType === 'STAFF'
                          ? 'bg-white border-brand-border'
                          : 'bg-brand-cream/60 border-brand-border text-brand-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1 font-sans">
                        <span className="font-semibold text-brand-dark">
                          {m.senderName} ({m.senderType})
                        </span>
                        <span className="text-brand-muted text-[10px]">
                          {new Date(m.messageTimestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-dark leading-relaxed font-sans">{m.messageBody}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <div className="pt-4 border-t border-brand-border space-y-3">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Record carrier update or internal notes..."
                  className="w-full p-3 border border-brand-border rounded text-xs focus:outline-none focus:border-brand-gold font-sans"
                ></textarea>

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-brand-muted">
                    Record carrier reply or staff note:
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddReply(selectedEnquiry.id, 'CARRIER')}
                      disabled={actionLoading || !replyText.trim()}
                      className="px-3 py-1.5 rounded bg-brand-cream hover:bg-brand-border text-brand-dark text-xs font-medium transition-colors"
                    >
                      Simulate Carrier Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddReply(selectedEnquiry.id, 'STAFF')}
                      disabled={actionLoading || !replyText.trim()}
                      className="px-3 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold transition-colors"
                    >
                      Add Staff Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-brand-muted">
              Select an enquiry on the left to inspect thread and actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
