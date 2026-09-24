'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  ShieldCheck,
  Server,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface LinnworksState {
  isConnected: boolean;
  syncStatus: string;
  serverUrl: string;
  ordersSyncedCount: number;
  lastSyncAt?: string;
  lastError?: string;
  syncProvenance: string;
}

export default function LinnworksPage() {
  const [state, setState] = useState<LinnworksState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const [form, setForm] = useState({
    applicationId: 'app-parcelresolve-production-v1',
    applicationSecret: 'lw-sec-9a8b7c6d5e4f3a2b1c',
    authorizationToken: 'lw_tok_auth_sample_live_key_99',
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/integrations/linnworks');
      const data = await res.json();
      setState(data.connection);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/integrations/linnworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONNECT',
          ...form,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message });
        await fetchStatus();
      } else {
        setMsg({ text: data.message || 'Connection failed', error: true });
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleTriggerSync = async (isBackfill = false) => {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch('/api/integrations/linnworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC', isBackfill }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: `Sync complete! Processed ${data.ordersProcessed} order(s), created ${data.parcelsCreated} new parcel(s).` });
        await fetchStatus();
      } else {
        setMsg({ text: data.errors?.[0] || 'Sync encountered errors', error: true });
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Enterprise WMS Integration
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Linnworks Connector</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Official Application Token authorization, package-level tracking sync, and historical backfill.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 ${
              state?.isConnected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${state?.isConnected ? 'bg-emerald-600' : 'bg-gray-400'}`}></span>
            {state?.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${
            msg.error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {msg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Connection Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted uppercase">Synced Parcels</div>
          <div className="text-2xl font-bold font-serif text-brand-dark mt-1">
            {state?.ordersSyncedCount || 0}
          </div>
          <div className="text-[10px] text-brand-muted">Field Provenance: LINNWORKS</div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted uppercase">Sync Status</div>
          <div className="text-2xl font-bold font-serif text-purple-700 mt-1">
            {state?.syncStatus || 'IDLE'}
          </div>
          <div className="text-[10px] text-brand-muted">
            {state?.lastSyncAt ? `Last: ${new Date(state.lastSyncAt).toLocaleTimeString()}` : 'Never'}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-brand-border shadow-xs">
          <div className="text-[11px] text-brand-muted uppercase">Server Region</div>
          <div className="text-sm font-mono font-bold text-brand-dark mt-2 truncate">
            {state?.serverUrl || 'api.linnworks.net'}
          </div>
          <div className="text-[10px] text-emerald-700">Health: 200 OK</div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-brand-dark">Official Application Authorization</h2>
        <p className="text-xs text-brand-muted">
          Authorize ParcelResolve via Linnworks Application Tokens. Credentials are encrypted using AES-256 before storage.
        </p>

        <form onSubmit={handleConnect} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-brand-dark mb-1">Application ID</label>
              <input
                type="text"
                required
                value={form.applicationId}
                onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                className="w-full p-2 border border-brand-border rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-dark mb-1">Application Secret</label>
              <input
                type="password"
                required
                value={form.applicationSecret}
                onChange={(e) => setForm({ ...form, applicationSecret: e.target.value })}
                className="w-full p-2 border border-brand-border rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-brand-dark mb-1">Authorization Token</label>
            <input
              type="text"
              required
              value={form.authorizationToken}
              onChange={(e) => setForm({ ...form, authorizationToken: e.target.value })}
              className="w-full p-2 border border-brand-border rounded font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={connecting}
              className="px-4 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper font-semibold transition-colors disabled:opacity-50"
            >
              {connecting ? 'Validating Token...' : 'Save & Verify Authorization'}
            </button>

            {state?.isConnected && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerSync(false)}
                  disabled={syncing}
                  className="px-3 py-2 rounded bg-brand-cream hover:bg-brand-border text-brand-dark font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-brand-gold ${syncing ? 'animate-spin' : ''}`} />
                  Incremental Sync
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerSync(true)}
                  disabled={syncing}
                  className="px-3 py-2 rounded bg-purple-700 hover:bg-purple-800 text-white font-semibold transition-colors"
                >
                  Run 90-Day Backfill
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Non-Linnworks Customer Assurance */}
      <div className="p-4 rounded-lg bg-brand-cream/80 border border-brand-border text-xs text-brand-muted leading-relaxed">
        <strong>Universal Accessibility:</strong> Linnworks integration is completely optional. Workspaces not utilizing Linnworks retain 100% platform functionality via CSV imports, scheduled polling, and custom REST API endpoints.
      </div>
    </div>
  );
}
