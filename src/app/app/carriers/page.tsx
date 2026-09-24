'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Code2,
  RotateCcw,
  Send,
  AlertCircle,
  Check,
  X,
  Play,
} from 'lucide-react';
import { CARRIER_CATALOG } from '@/lib/carrier-connectors';

interface ConnectedCarrier {
  id: string;
  code: string;
  name: string;
  category: string;
  connectionType: string;
  capabilities: string;
  contractedParty: string;
  physicalCarrier: string;
  finalMileCarrier: string;
  enquiryRecipientEmail?: string;
  claimRecipientEmail?: string;
  isLive: boolean;
  connectors: {
    id: string;
    version: number;
    status: string;
    testSuccess: boolean;
    baseUrl: string;
    trackingEndpoint: string;
  }[];
}

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<ConnectedCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectorModal, setConnectorModal] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState('');
  const [builderForm, setBuilderForm] = useState({
    name: 'Carrier Custom REST Connector',
    baseUrl: 'https://api.ups.example.com/track',
    trackingEndpoint: '/v1/shipments/{trackingNumber}',
    authType: 'BEARER',
    sampleTrackingNumber: '1Z999TEST001',
    responseStatusPath: 'shipment.status.code',
    responseTimestampPath: 'shipment.lastScan.timestamp',
    responseLocationPath: 'shipment.lastScan.depot',
    responseMessagePath: 'shipment.lastScan.activity',
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [activeConnectorId, setActiveConnectorId] = useState<string | null>(null);

  const fetchCarriers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/carriers');
      const data = await res.json();
      setCarriers(data.connectedCarriers || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const openBuilder = (carrier: ConnectedCarrier) => {
    setSelectedCarrierId(carrier.id);
    const existing = carrier.connectors[0];
    if (existing) {
      setActiveConnectorId(existing.id);
      setBuilderForm({
        ...builderForm,
        baseUrl: existing.baseUrl,
        trackingEndpoint: existing.trackingEndpoint,
      });
    } else {
      setActiveConnectorId(null);
    }
    setTestResult(null);
    setConnectorModal(true);
  };

  const handleTestConnector = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      // First save or get connector ID
      let connectorId = activeConnectorId;
      if (!connectorId) {
        const createRes = await fetch('/api/connectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carrierId: selectedCarrierId,
            ...builderForm,
          }),
        });
        const createData = await createRes.json();
        connectorId = createData.connector.id;
        setActiveConnectorId(connectorId);
      }

      const res = await fetch(`/api/connectors/${connectorId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleTrackingNumber: builderForm.sampleTrackingNumber }),
      });
      const data = await res.json();
      setTestResult(data.testResult);
    } finally {
      setTestLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!activeConnectorId) return;
    const res = await fetch(`/api/connectors/${activeConnectorId}/publish`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`Connector published successfully as Version ${data.connector.version}!`);
      setConnectorModal(false);
      await fetchCarriers();
    } else {
      alert(data.error || 'Failed to publish');
    }
  };

  const handleRollback = async (connectorId: string) => {
    if (!confirm('Rollback to previous version snapshot?')) return;
    const res = await fetch(`/api/connectors/${connectorId}/rollback`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await fetchCarriers();
    } else {
      alert(data.error || 'Rollback failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Carrier Integration Center
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Connected Couriers & REST Connectors</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Contracted accounts, aggregators, physical couriers, and self-service REST connector builder.
          </p>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold font-serif text-brand-dark uppercase tracking-wider">
          Active Workspace Carrier Accounts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {carriers.map((c) => {
            const connector = c.connectors[0];
            return (
              <div key={c.id} className="p-5 rounded-lg bg-white border border-brand-border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-brand-dark">{c.name}</span>
                    <span className="ml-2 font-mono text-[10px] text-brand-muted">({c.code})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      c.connectionType === 'LIVE_API'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {c.connectionType.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-brand-paper p-3 rounded border border-brand-border/60">
                  <div>
                    <span className="text-[10px] text-brand-muted uppercase block">Contracted Shipper:</span>
                    <span className="font-medium text-brand-dark truncate block">{c.contractedParty}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-muted uppercase block">Physical Freight:</span>
                    <span className="font-medium text-brand-dark">{c.physicalCarrier} &rarr; {c.finalMileCarrier}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-brand-border/40">
                    <span className="text-[10px] text-brand-muted uppercase block">Enquiry / Claim Destination:</span>
                    <span className="font-mono text-[11px] text-brand-dark truncate block">{c.enquiryRecipientEmail || 'Default Portal'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-brand-border/60 text-xs">
                  <div className="text-[11px] text-brand-muted font-mono">
                    {connector ? `Connector v${connector.version} (${connector.status})` : 'No custom connector'}
                  </div>

                  <div className="flex items-center gap-2">
                    {connector && connector.version > 1 && (
                      <button
                        onClick={() => handleRollback(connector.id)}
                        className="px-2 py-1 rounded bg-brand-cream hover:bg-brand-border text-[10px] font-semibold text-brand-dark flex items-center gap-1"
                        title="Rollback to previous version"
                      >
                        <RotateCcw className="w-3 h-3 text-brand-gold" /> Rollback
                      </button>
                    )}
                    <button
                      onClick={() => openBuilder(c)}
                      className="px-3 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Code2 className="w-3 h-3 text-brand-gold" /> Configure REST Connector
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Capability Catalogue */}
      <div className="pt-6 border-t border-brand-border">
        <h2 className="text-sm font-bold font-serif text-brand-dark uppercase tracking-wider mb-2">
          Global Carrier Catalogue Matrix
        </h2>
        <div className="overflow-x-auto border border-brand-border rounded-lg bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-cream/80 text-brand-dark font-semibold border-b border-brand-border">
              <tr>
                <th className="py-2.5 px-4">Courier</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Status Badge</th>
                <th className="py-2.5 px-4 text-center">Lookup</th>
                <th className="py-2.5 px-4 text-center">Webhook</th>
                <th className="py-2.5 px-4 text-center">POD</th>
                <th className="py-2.5 px-4 text-center">Claims</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 text-brand-muted">
              {CARRIER_CATALOG.map((item) => (
                <tr key={item.code} className="hover:bg-brand-paper/50">
                  <td className="py-2.5 px-4 font-semibold text-brand-dark">{item.name}</td>
                  <td className="py-2.5 px-4 font-mono text-[10px]">{item.category}</td>
                  <td className="py-2.5 px-4 font-mono text-[10px] font-bold">{item.connectionType}</td>
                  <td className="py-2.5 px-4 text-center">
                    {item.capabilities.lookup ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> : <XCircle className="w-3.5 h-3.5 text-gray-300 inline" />}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {item.capabilities.webhook ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> : <XCircle className="w-3.5 h-3.5 text-gray-300 inline" />}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {item.capabilities.pod ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> : <XCircle className="w-3.5 h-3.5 text-gray-300 inline" />}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {item.capabilities.claim ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> : <XCircle className="w-3.5 h-3.5 text-gray-300 inline" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REST/JSON Connector Builder Modal */}
      {connectorModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-brand-border shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-brand-dark">REST/JSON Connector Builder</h3>
                <div className="text-[11px] text-brand-muted">Define endpoints, JSON dot-paths, and run live test harness</div>
              </div>
              <button onClick={() => setConnectorModal(false)} className="text-brand-muted hover:text-brand-dark">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Base URL</label>
                  <input
                    type="text"
                    value={builderForm.baseUrl}
                    onChange={(e) => setBuilderForm({ ...builderForm, baseUrl: e.target.value })}
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Tracking Endpoint</label>
                  <input
                    type="text"
                    value={builderForm.trackingEndpoint}
                    onChange={(e) => setBuilderForm({ ...builderForm, trackingEndpoint: e.target.value })}
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Auth Type</label>
                  <select
                    value={builderForm.authType}
                    onChange={(e) => setBuilderForm({ ...builderForm, authType: e.target.value })}
                    className="w-full p-2 border border-brand-border rounded font-mono bg-white"
                  >
                    <option value="BEARER">Bearer Token</option>
                    <option value="API_KEY">API Key in Header (x-api-key)</option>
                    <option value="NONE">Public / None</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Sample Tracking #</label>
                  <input
                    type="text"
                    value={builderForm.sampleTrackingNumber}
                    onChange={(e) => setBuilderForm({ ...builderForm, sampleTrackingNumber: e.target.value })}
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded bg-brand-cream/80 border border-brand-border space-y-2">
                <div className="font-semibold text-brand-dark text-[11px] uppercase tracking-wider">
                  Dot-Notation JSONPath Extraction
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-brand-muted mb-0.5">Status Code Path:</label>
                    <input
                      type="text"
                      value={builderForm.responseStatusPath}
                      onChange={(e) => setBuilderForm({ ...builderForm, responseStatusPath: e.target.value })}
                      className="w-full p-1.5 border border-brand-border rounded font-mono bg-white text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-brand-muted mb-0.5">Timestamp Path:</label>
                    <input
                      type="text"
                      value={builderForm.responseTimestampPath}
                      onChange={(e) => setBuilderForm({ ...builderForm, responseTimestampPath: e.target.value })}
                      className="w-full p-1.5 border border-brand-border rounded font-mono bg-white text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Test Harness Execution */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestConnector}
                  disabled={testLoading}
                  className="px-3 py-2 rounded bg-brand-cream hover:bg-brand-border font-semibold text-brand-dark flex items-center gap-1.5 transition-colors"
                >
                  <Play className={`w-3.5 h-3.5 text-brand-gold ${testLoading ? 'animate-spin' : ''}`} />
                  {testLoading ? 'Testing...' : 'Test Against Sample Tracking #'}
                </button>

                {testResult?.success && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Publish Version Snapshot
                  </button>
                )}
              </div>

              {/* Test Output Inspection */}
              {testResult && (
                <div className="p-3 rounded bg-brand-ink text-brand-paper font-mono text-[11px] space-y-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between text-brand-gold font-bold">
                    <span>STATUS: {testResult.statusCode} OK</span>
                    <span>NORMALIZED: {testResult.normalizedStatus}</span>
                  </div>
                  <div>Request URL: {testResult.requestUrl}</div>
                  <div className="text-brand-muted">Extracted Normalized Events:</div>
                  <pre className="text-[10px] text-brand-lightgold overflow-x-auto">
                    {JSON.stringify(testResult.normalizedEvents, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
