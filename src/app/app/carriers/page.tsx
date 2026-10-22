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
  FileText,
  ShieldAlert,
  DollarSign,
  Clock,
  Sparkles,
  Settings,
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
  claimPricingRule?: string;
  claimIndemnityCap?: number | null;
  claimIncludePostage?: boolean;
  claimIncludeVat?: boolean;
  claimStatutoryLossDays?: number;
  claimFilingDeadlineDays?: number;
  claimInvoiceFormat?: string;
  claimCustomDisclaimer?: string;
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

  // REST Connector builder state
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

  // Claim Rules Editor Modal State
  const [claimModal, setClaimModal] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<ConnectedCarrier | null>(null);
  const [savingClaimRules, setSavingClaimRules] = useState(false);
  const [claimForm, setClaimForm] = useState({
    name: '',
    enquiryRecipientEmail: '',
    claimRecipientEmail: '',
    claimPricingRule: 'RETAIL_EX_VAT',
    claimIndemnityCap: '',
    claimIncludePostage: true,
    claimIncludeVat: false,
    claimStatutoryLossDays: 7,
    claimFilingDeadlineDays: 28,
    claimInvoiceFormat: 'DPD_STANDARD',
    claimCustomDisclaimer: '',
  });

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

  // --- REST Connector Modal ---
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

  // --- Claim Rules Modal Handlers ---
  const openClaimEditor = (carrier: ConnectedCarrier) => {
    setEditingCarrier(carrier);
    setClaimForm({
      name: carrier.name || '',
      enquiryRecipientEmail: carrier.enquiryRecipientEmail || '',
      claimRecipientEmail: carrier.claimRecipientEmail || '',
      claimPricingRule: carrier.claimPricingRule || 'RETAIL_EX_VAT',
      claimIndemnityCap: carrier.claimIndemnityCap !== null && carrier.claimIndemnityCap !== undefined ? String(carrier.claimIndemnityCap) : '',
      claimIncludePostage: carrier.claimIncludePostage !== false,
      claimIncludeVat: Boolean(carrier.claimIncludeVat),
      claimStatutoryLossDays: carrier.claimStatutoryLossDays || 7,
      claimFilingDeadlineDays: carrier.claimFilingDeadlineDays || 28,
      claimInvoiceFormat: carrier.claimInvoiceFormat || 'DPD_STANDARD',
      claimCustomDisclaimer: carrier.claimCustomDisclaimer || '',
    });
    setClaimModal(true);
  };

  const applyCarrierPreset = (presetName: string) => {
    switch (presetName) {
      case 'ROYAL_MAIL':
        setClaimForm((prev) => ({
          ...prev,
          claimPricingRule: 'WHOLESALE_COST',
          claimIndemnityCap: '100',
          claimIncludePostage: true,
          claimIncludeVat: false,
          claimStatutoryLossDays: 10,
          claimFilingDeadlineDays: 80,
          claimInvoiceFormat: 'ROYAL_MAIL_P58',
          claimRecipientEmail: 'claims.desk@royalmail.example.com',
          claimCustomDisclaimer: 'Official statutory consignment loss submission pursuant to Royal Mail Postal Scheme terms. Cargo valuation calculated at wholesale merchant manufacturing cost of goods.',
        }));
        break;
      case 'DPD':
        setClaimForm((prev) => ({
          ...prev,
          claimPricingRule: 'RETAIL_EX_VAT',
          claimIndemnityCap: '100',
          claimIncludePostage: true,
          claimIncludeVat: false,
          claimStatutoryLossDays: 7,
          claimFilingDeadlineDays: 28,
          claimInvoiceFormat: 'DPD_STANDARD',
          claimRecipientEmail: 'claims@dpdgroup.co.uk.example.com',
          claimCustomDisclaimer: 'Official Commercial Cargo Loss Claim filed pursuant to DPD Standard Terms of Carriage. Valued at net retail sales invoice excluding VAT.',
        }));
        break;
      case 'EVRI':
        setClaimForm((prev) => ({
          ...prev,
          claimPricingRule: 'CAPPED_INDEMNITY',
          claimIndemnityCap: '20',
          claimIncludePostage: true,
          claimIncludeVat: false,
          claimStatutoryLossDays: 14,
          claimFilingDeadlineDays: 28,
          claimInvoiceFormat: 'EVRI_INDEMNITY',
          claimRecipientEmail: 'claims@evri.com.example.com',
          claimCustomDisclaimer: 'Formal non-delivery indemnity claim pursuant to Evri carriage guidelines. Limited to carrier contractual liability cap of £20.00 plus paid courier carriage.',
        }));
        break;
      case 'YODEL':
        setClaimForm((prev) => ({
          ...prev,
          claimPricingRule: 'CAPPED_INDEMNITY',
          claimIndemnityCap: '50',
          claimIncludePostage: true,
          claimIncludeVat: false,
          claimStatutoryLossDays: 14,
          claimFilingDeadlineDays: 28,
          claimInvoiceFormat: 'YODEL_LOSS',
          claimRecipientEmail: 'claims@yodel.co.uk.example.com',
          claimCustomDisclaimer: 'Consignment declared lost following depot search failure. Demand for carrier indemnity submitted in accordance with Yodel standard account carriage conditions.',
        }));
        break;
      case 'UPS':
        setClaimForm((prev) => ({
          ...prev,
          claimPricingRule: 'RETAIL_EX_VAT',
          claimIndemnityCap: '100',
          claimIncludePostage: true,
          claimIncludeVat: false,
          claimStatutoryLossDays: 7,
          claimFilingDeadlineDays: 30,
          claimInvoiceFormat: 'UPS_COMMERCIAL',
          claimRecipientEmail: 'ukclaims@ups.com.example.com',
          claimCustomDisclaimer: 'Commercial cargo loss demand submitted pursuant to UPS Tariff / Terms and Conditions of Service. Net merchant goods invoice value claimed.',
        }));
        break;
    }
  };

  const handleSaveClaimRules = async () => {
    if (!editingCarrier) return;
    setSavingClaimRules(true);
    try {
      const res = await fetch('/api/carriers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCarrier.id,
          name: claimForm.name,
          enquiryRecipientEmail: claimForm.enquiryRecipientEmail || null,
          claimRecipientEmail: claimForm.claimRecipientEmail || null,
          claimPricingRule: claimForm.claimPricingRule,
          claimIndemnityCap: claimForm.claimIndemnityCap ? parseFloat(claimForm.claimIndemnityCap) : null,
          claimIncludePostage: claimForm.claimIncludePostage,
          claimIncludeVat: claimForm.claimIncludeVat,
          claimStatutoryLossDays: Number(claimForm.claimStatutoryLossDays),
          claimFilingDeadlineDays: Number(claimForm.claimFilingDeadlineDays),
          claimInvoiceFormat: claimForm.claimInvoiceFormat,
          claimCustomDisclaimer: claimForm.claimCustomDisclaimer || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setClaimModal(false);
        await fetchCarriers();
      } else {
        alert(data.error || 'Failed to update carrier rules');
      }
    } catch {
      alert('Network error while saving carrier rules');
    } finally {
      setSavingClaimRules(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Carrier Integration &amp; Claims Governance Center
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Connected Couriers &amp; Claim Rules</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Configure courier claim valuation formulas, indemnity caps, P58/commercial invoice formats, and live API connectors.
          </p>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-serif text-brand-dark uppercase tracking-wider">
            Active Workspace Carrier Accounts ({carriers.length})
          </h2>
          <span className="text-[11px] text-brand-muted">
            All claim commercial invoices and SLA investigations follow these carrier-specific rules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {carriers.map((c) => {
            const connector = c.connectors[0];
            const pricingRuleLabel =
              c.claimPricingRule === 'WHOLESALE_COST'
                ? 'Wholesale Cost of Goods'
                : c.claimPricingRule === 'CAPPED_INDEMNITY'
                ? `Capped Indemnity (£${c.claimIndemnityCap || '0'})`
                : c.claimPricingRule === 'RETAIL_INC_VAT'
                ? 'Retail (Inc VAT)'
                : 'Retail (Ex VAT)';

            return (
              <div key={c.id} className="p-5 rounded-lg bg-white border border-brand-border shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
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

                  {/* Operational Routing Metadata */}
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
                      <span className="text-[10px] text-brand-muted uppercase block">Enquiry / Claims Desk:</span>
                      <span className="font-mono text-[11px] text-brand-dark truncate block">
                        {c.claimRecipientEmail || c.enquiryRecipientEmail || 'Default Claims Portal'}
                      </span>
                    </div>
                  </div>

                  {/* Claim Configuration Profile Summary */}
                  <div className="p-3 rounded-lg bg-brand-cream/60 border border-brand-border space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-brand-dark">
                      <span className="flex items-center gap-1 text-brand-gold">
                        <FileText className="w-3.5 h-3.5" /> Claim Invoice Profile:
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-brand-paper rounded border border-brand-border">
                        {c.claimInvoiceFormat || 'DPD_STANDARD'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-brand-muted">
                      <div>
                        <span className="text-[10px] block">Valuation Basis:</span>
                        <span className="font-semibold text-brand-dark">{pricingRuleLabel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block">Statutory Loss SLA:</span>
                        <span className="font-semibold text-brand-dark">{c.claimStatutoryLossDays || 7} Days</span>
                      </div>
                      <div>
                        <span className="text-[10px] block">Filing Deadline:</span>
                        <span className="font-semibold text-brand-dark">{c.claimFilingDeadlineDays || 28} Days</span>
                      </div>
                      <div>
                        <span className="text-[10px] block">Postage Included:</span>
                        <span className="font-semibold text-emerald-800">{c.claimIncludePostage !== false ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-brand-border/60 text-xs">
                  <div className="text-[11px] text-brand-muted font-mono">
                    {connector ? `Connector v${connector.version} (${connector.status})` : 'Standard Adapter'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openClaimEditor(c)}
                      className="px-3 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Settings className="w-3 h-3 text-brand-gold" /> Configure Claim Rules
                    </button>
                    <button
                      onClick={() => openBuilder(c)}
                      className="px-2.5 py-1.5 rounded bg-white border border-brand-border hover:border-brand-gold text-brand-dark text-xs font-semibold flex items-center gap-1"
                      title="Configure Live REST Connector"
                    >
                      <Code2 className="w-3 h-3 text-brand-muted" /> API
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

      {/* ================= CLAIM RULES CONFIGURATION MODAL ================= */}
      {claimModal && editingCarrier && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-brand-border shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
                  Courier Claims Engine Governance
                </div>
                <h3 className="font-bold text-base text-brand-dark">
                  {editingCarrier.name} ({editingCarrier.code}) Claim Rules &amp; Invoice Format
                </h3>
              </div>
              <button onClick={() => setClaimModal(false)} className="text-brand-muted hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="p-3 bg-brand-cream/70 rounded-lg border border-brand-border space-y-1.5">
              <span className="text-[11px] font-bold text-brand-dark flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                Apply Carrier Industry Preset:
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => applyCarrierPreset('ROYAL_MAIL')}
                  className="px-2.5 py-1 rounded bg-white border border-brand-border hover:border-brand-gold text-[11px] font-semibold text-brand-dark shadow-xs"
                >
                  Royal Mail (P58 / Wholesale)
                </button>
                <button
                  type="button"
                  onClick={() => applyCarrierPreset('DPD')}
                  className="px-2.5 py-1 rounded bg-white border border-brand-border hover:border-brand-gold text-[11px] font-semibold text-brand-dark shadow-xs"
                >
                  DPD UK (Ex-VAT / £100 Cap)
                </button>
                <button
                  type="button"
                  onClick={() => applyCarrierPreset('EVRI')}
                  className="px-2.5 py-1 rounded bg-white border border-brand-border hover:border-brand-gold text-[11px] font-semibold text-brand-dark shadow-xs"
                >
                  Evri (£20 Cap / Indemnity)
                </button>
                <button
                  type="button"
                  onClick={() => applyCarrierPreset('YODEL')}
                  className="px-2.5 py-1 rounded bg-white border border-brand-border hover:border-brand-gold text-[11px] font-semibold text-brand-dark shadow-xs"
                >
                  Yodel (£50 Cap / Loss Claim)
                </button>
                <button
                  type="button"
                  onClick={() => applyCarrierPreset('UPS')}
                  className="px-2.5 py-1 rounded bg-white border border-brand-border hover:border-brand-gold text-[11px] font-semibold text-brand-dark shadow-xs"
                >
                  UPS Express (Commercial Claim)
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Carrier Public Name</label>
                  <input
                    type="text"
                    value={claimForm.name}
                    onChange={(e) => setClaimForm({ ...claimForm, name: e.target.value })}
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Commercial Invoice Format</label>
                  <select
                    value={claimForm.claimInvoiceFormat}
                    onChange={(e) => setClaimForm({ ...claimForm, claimInvoiceFormat: e.target.value })}
                    className="w-full p-2 border border-brand-border rounded font-mono bg-white"
                  >
                    <option value="DPD_STANDARD">DPD UK Official Loss Statement</option>
                    <option value="ROYAL_MAIL_P58">Royal Mail Statutory Form P58</option>
                    <option value="EVRI_INDEMNITY">Evri Non-Delivery &amp; Indemnity Claim</option>
                    <option value="YODEL_LOSS">Yodel Cargo Loss Claim &amp; Tracer</option>
                    <option value="UPS_COMMERCIAL">UPS Commercial Cargo Loss Claim</option>
                    <option value="FEDEX_FORMAL">FedEx Formal Air Waybill Claim</option>
                    <option value="DHL_EXPRESS">DHL Express Cargo Demand</option>
                    <option value="GENERIC">Universal Carrier Loss Invoice</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Enquiry Recipient Email</label>
                  <input
                    type="email"
                    value={claimForm.enquiryRecipientEmail}
                    onChange={(e) => setClaimForm({ ...claimForm, enquiryRecipientEmail: e.target.value })}
                    placeholder="investigations@carrier.com"
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">Claim Adjudication Email</label>
                  <input
                    type="email"
                    value={claimForm.claimRecipientEmail}
                    onChange={(e) => setClaimForm({ ...claimForm, claimRecipientEmail: e.target.value })}
                    placeholder="claims@carrier.com"
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                </div>
              </div>

              {/* Valuation Rules */}
              <div className="p-3.5 rounded-lg bg-brand-paper border border-brand-border space-y-3">
                <div className="font-semibold text-brand-dark text-xs uppercase tracking-wider">
                  Cargo Valuation &amp; Reimbursement Rules
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-brand-muted mb-1">Pricing Valuation Basis:</label>
                    <select
                      value={claimForm.claimPricingRule}
                      onChange={(e) => setClaimForm({ ...claimForm, claimPricingRule: e.target.value })}
                      className="w-full p-2 border border-brand-border rounded font-mono bg-white text-xs"
                    >
                      <option value="RETAIL_EX_VAT">Retail Selling Price (Ex-VAT)</option>
                      <option value="RETAIL_INC_VAT">Retail Selling Price (Inc-VAT)</option>
                      <option value="WHOLESALE_COST">Wholesale Cost of Goods (Mandatory for Royal Mail)</option>
                      <option value="CAPPED_INDEMNITY">Capped Indemnity (Fixed Ceiling e.g. Evri/Yodel)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-brand-muted mb-1">Indemnity Cap (Blank for Uncapped):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={claimForm.claimIndemnityCap}
                      onChange={(e) => setClaimForm({ ...claimForm, claimIndemnityCap: e.target.value })}
                      placeholder="e.g. 20, 50, 100"
                      className="w-full p-2 border border-brand-border rounded font-mono bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={claimForm.claimIncludePostage}
                      onChange={(e) => setClaimForm({ ...claimForm, claimIncludePostage: e.target.checked })}
                      className="rounded text-brand-dark focus:ring-brand-gold"
                    />
                    <span className="font-medium text-brand-dark text-xs">
                      Claim Paid Shipping / Postage Refund
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={claimForm.claimIncludeVat}
                      onChange={(e) => setClaimForm({ ...claimForm, claimIncludeVat: e.target.checked })}
                      className="rounded text-brand-dark focus:ring-brand-gold"
                    />
                    <span className="font-medium text-brand-dark text-xs">
                      Include VAT in Final Claim Total
                    </span>
                  </label>
                </div>
              </div>

              {/* Time Tolerances */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">
                    Statutory Loss Threshold (Days)
                  </label>
                  <input
                    type="number"
                    value={claimForm.claimStatutoryLossDays}
                    onChange={(e) => setClaimForm({ ...claimForm, claimStatutoryLossDays: Number(e.target.value) })}
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                  <span className="text-[10px] text-brand-muted block mt-0.5">
                    Days without delivery before marked eligible for formal claim
                  </span>
                </div>
                <div>
                  <label className="block font-semibold text-brand-dark mb-1">
                    Claim Filing Window (Days)
                  </label>
                  <input
                    type="number"
                    value={claimForm.claimFilingDeadlineDays}
                    onChange={(e) => setClaimForm({ ...claimForm, claimFilingDeadlineDays: Number(e.target.value) })}
                    className="w-full p-2 border border-brand-border rounded font-mono"
                  />
                  <span className="text-[10px] text-brand-muted block mt-0.5">
                    Maximum days from dispatch before claim expires
                  </span>
                </div>
              </div>

              {/* Legal Disclaimer */}
              <div>
                <label className="block font-semibold text-brand-dark mb-1">
                  Carrier-Specific Legal Notice / Disclaimer
                </label>
                <textarea
                  rows={3}
                  value={claimForm.claimCustomDisclaimer}
                  onChange={(e) => setClaimForm({ ...claimForm, claimCustomDisclaimer: e.target.value })}
                  placeholder="Official loss statement pursuant to courier conditions of carriage..."
                  className="w-full p-2 border border-brand-border rounded font-mono text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setClaimModal(false)}
                className="px-4 py-2 rounded bg-brand-cream hover:bg-brand-border font-semibold text-brand-dark text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveClaimRules}
                disabled={savingClaimRules}
                className="px-5 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                {savingClaimRules ? 'Saving Rules...' : 'Save Claim Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

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
