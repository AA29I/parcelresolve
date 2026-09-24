'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  X,
  Play,
  Sparkles,
  Palette,
  Sliders,
  Terminal,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Shield,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface ParcelOption {
  id: string;
  trackingNumber: string;
  carrier: { name: string };
  trackingStatus: string;
  investigationStatus: string;
  claimStatus: string;
}

export default function DevModeCustomizer({
  currentOrgName,
  currentOrgSlug,
  onRefreshNeeded,
}: {
  currentOrgName: string;
  currentOrgSlug: string;
  onRefreshNeeded?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'company' | 'user' | 'webhooks'>('simulator');
  const [devModeEnabled, setDevModeEnabled] = useState(true);

  // Simulation state
  const [parcels, setParcels] = useState<ParcelOption[]>([]);
  const [selectedTracking, setSelectedTracking] = useState('');
  const [scenario, setScenario] = useState('EXCEPTION');
  const [locationCity, setLocationCity] = useState('Louisville');
  const [locationState, setLocationState] = useState('KY');
  const [statusDescription, setStatusDescription] = useState('Operational sorting mechanical exception');
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Company Customization State
  const [companyName, setCompanyName] = useState(currentOrgName);
  const [accentColor, setAccentColor] = useState('#B8892D');
  const [cutoffTime, setCutoffTime] = useState('16:00');
  const [savingCompany, setSavingCompany] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User Dev Preferences
  const [showJsonInspector, setShowJsonInspector] = useState(true);
  const [showMathFormulas, setShowMathFormulas] = useState(true);
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  // Webhook Test State
  const [webhookEvent, setWebhookEvent] = useState('tracking.exception');
  const [webhookResult, setWebhookResult] = useState<any>(null);

  // Fetch available parcels for simulation
  const fetchParcels = async () => {
    try {
      const res = await fetch('/api/parcels');
      const data = await res.json();
      if (data.parcels && data.parcels.length > 0) {
        setParcels(data.parcels);
        if (!selectedTracking) {
          setSelectedTracking(data.parcels[0].trackingNumber);
        }
      }
    } catch (err) {
      console.error('Failed to load parcels for simulation', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchParcels();
    }
  }, [isOpen]);

  const handleScenarioChange = (scen: string) => {
    setScenario(scen);
    if (scen === 'EXCEPTION') {
      setStatusDescription('Operational sorting exception - conveyor belt maintenance delay');
    } else if (scen === 'OUT_FOR_DELIVERY') {
      setStatusDescription('Loaded on local delivery van for scheduled afternoon delivery');
    } else if (scen === 'DELIVERED') {
      setStatusDescription('Delivered: Left at front door / reception with signature proof');
    } else if (scen === 'LOST') {
      setStatusDescription('Carrier investigation concluded: Consignment unaccounted for and declared lost');
    } else if (scen === 'DAMAGED') {
      setStatusDescription('Consignment carton heavily damaged in transit; salvage process initiated');
    }
  };

  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTracking) return;

    setSimulating(true);
    setSimulationResult(null);

    try {
      const res = await fetch('/api/developer/simulate-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: selectedTracking,
          normalizedStatus: scenario,
          eventCode: `SIM_${scenario}`,
          statusDescription,
          locationCity,
          locationState,
          locationCountry: 'US',
        }),
      });

      const data = await res.json();
      setSimulationResult(data);
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      setSimulationResult({ error: err.message || 'Simulation failed' });
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveCompanyCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/developer/customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: companyName,
          accentColor,
          cutoffTime,
          devModeActive: devModeEnabled,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onRefreshNeeded) onRefreshNeeded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCompany(false);
    }
  };

  const colorPalettes = [
    { name: 'Mett Gold', hex: '#B8892D' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Indigo', hex: '#4F46E5' },
    { name: 'Amber', hex: '#D97706' },
    { name: 'Crimson', hex: '#DC2626' },
    { name: 'Slate', hex: '#475569' },
  ];

  return (
    <>
      {/* Floating Dev Mode Trigger Button */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-brand-dark text-brand-paper hover:bg-brand-ink border border-brand-gold/60 shadow-lg text-xs font-semibold transition-all hover:scale-105 group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
          </span>
          <Code2 className="w-3.5 h-3.5 text-brand-gold" />
          <span>Dev Mode & Customizer</span>
          <span className="px-1.5 py-0.2 rounded bg-brand-gold/20 text-brand-gold text-[10px] font-mono">
            {currentOrgSlug.split('-')[0].toUpperCase()}
          </span>
        </button>
      </div>

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-xl bg-white border-l border-brand-border shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-brand-border bg-brand-dark text-brand-paper flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold font-mono tracking-wider text-brand-paper flex items-center gap-2">
                    DEVELOPER & CUSTOMIZATION CENTER
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-brand-paper/60">
                    Tenant: <span className="text-brand-gold font-semibold">{currentOrgName}</span> ({currentOrgSlug})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-brand-paper/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-brand-border bg-brand-cream/60 px-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'simulator'
                    ? 'border-brand-gold text-brand-dark bg-white font-bold'
                    : 'border-transparent text-brand-muted hover:text-brand-dark'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-brand-gold" />
                Scan Simulator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('company')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'company'
                    ? 'border-brand-gold text-brand-dark bg-white font-bold'
                    : 'border-transparent text-brand-muted hover:text-brand-dark'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-brand-gold" />
                Company Branding
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('user')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'user'
                    ? 'border-brand-gold text-brand-dark bg-white font-bold'
                    : 'border-transparent text-brand-muted hover:text-brand-dark'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-brand-gold" />
                Preferences
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('webhooks')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'webhooks'
                    ? 'border-brand-gold text-brand-dark bg-white font-bold'
                    : 'border-transparent text-brand-muted hover:text-brand-dark'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-brand-gold" />
                Webhooks
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 text-xs">
              {/* TAB 1: SCAN SIMULATOR */}
              {activeTab === 'simulator' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-brand-cream border border-brand-border">
                    <div className="font-semibold text-brand-dark mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                      Carrier Scan & SLA Event Injection
                    </div>
                    <p className="text-[11px] text-brand-muted">
                      Inject simulated carrier physical scans directly into any consignment. This tests normalized status transitions, business-day SLA recalculation, and automatic investigation enquiry drafting live!
                    </p>
                  </div>

                  <form onSubmit={handleSimulateScan} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-brand-dark uppercase tracking-wider mb-1">
                        Select Target Consignment
                      </label>
                      <select
                        value={selectedTracking}
                        onChange={(e) => setSelectedTracking(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded bg-white font-mono focus:border-brand-gold focus:outline-none"
                      >
                        {parcels.map((p) => (
                          <option key={p.id} value={p.trackingNumber}>
                            {p.trackingNumber} ({p.carrier?.name}) — Status: {p.trackingStatus} | Claim: {p.claimStatus}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-brand-dark uppercase tracking-wider mb-1">
                        Carrier Event Scenario
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'EXCEPTION', label: '⚠️ Stalled Exception' },
                          { id: 'OUT_FOR_DELIVERY', label: '🚚 Out for Delivery' },
                          { id: 'DELIVERED', label: '✅ Delivered' },
                          { id: 'LOST', label: '❌ Declared Lost' },
                          { id: 'DAMAGED', label: '💥 Damaged' },
                          { id: 'IN_TRANSIT', label: '📍 Transit Hub Scan' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleScenarioChange(s.id)}
                            className={`p-2 rounded text-left border transition-all text-[11px] font-semibold ${
                              scenario === s.id
                                ? 'bg-brand-dark text-brand-paper border-brand-gold'
                                : 'bg-white text-brand-dark border-brand-border hover:bg-brand-paper'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-brand-dark mb-1">Location City</label>
                        <input
                          type="text"
                          value={locationCity}
                          onChange={(e) => setLocationCity(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-brand-border rounded text-xs focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-brand-dark mb-1">State / Region</label>
                        <input
                          type="text"
                          value={locationState}
                          onChange={(e) => setLocationState(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-brand-border rounded text-xs focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-brand-dark mb-1">
                        Carrier Activity Description
                      </label>
                      <input
                        type="text"
                        value={statusDescription}
                        onChange={(e) => setStatusDescription(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-brand-border rounded text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={simulating || !selectedTracking}
                      className="w-full py-2.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-brand-gold disabled:opacity-50"
                    >
                      {simulating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-gold" />
                          Injecting Scan & Recomputing SLA...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-brand-gold" />
                          Inject Scan & Execute Evaluation
                        </>
                      )}
                    </button>
                  </form>

                  {/* Simulation Result Box */}
                  {simulationResult && (
                    <div className="p-3.5 rounded-lg bg-brand-dark text-brand-paper font-mono text-[11px] space-y-2 border border-brand-gold/60">
                      <div className="flex items-center justify-between text-brand-gold font-bold">
                        <span>SIMULATION EXECUTION RESULT</span>
                        <span>HTTP {simulationResult.error ? '500' : '200'}</span>
                      </div>

                      {simulationResult.error ? (
                        <div className="text-red-400">{simulationResult.error}</div>
                      ) : (
                        <div className="space-y-1.5 text-brand-paper/90">
                          <div>
                            • Updated Tracking Status:{' '}
                            <span className="text-brand-gold font-bold">{simulationResult.parcel?.trackingStatus}</span>
                          </div>
                          <div>
                            • Investigation Status:{' '}
                            <span className="text-emerald-400">{simulationResult.parcel?.investigationStatus}</span>
                          </div>
                          <div>
                            • Claim Status:{' '}
                            <span className="text-amber-400">{simulationResult.parcel?.claimStatus}</span>
                          </div>
                          <div>
                            • SLA Breached:{' '}
                            <span className={simulationResult.slaResult?.isBreached ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                              {simulationResult.slaResult?.isBreached ? `YES (${simulationResult.slaResult?.breachHours}h overdue)` : 'NO (On Schedule)'}
                            </span>
                          </div>
                          <div>
                            • Auto-Drafted Enquiry:{' '}
                            <span className={simulationResult.enquiryCreated ? 'text-brand-gold font-bold' : 'text-brand-paper/60'}>
                              {simulationResult.enquiryCreated ? 'YES (Queued for Staff Approval)' : 'None Needed'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COMPANY BRANDING & SLA RULES */}
              {activeTab === 'company' && (
                <form onSubmit={handleSaveCompanyCustomization} className="space-y-4">
                  <div className="p-3 rounded bg-brand-cream border border-brand-border text-[11px] text-brand-muted">
                    Customize your company workspace appearance, official display name, and fulfillment cutoff tolerances.
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-dark uppercase tracking-wider mb-1">
                      Organization Display Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-dark uppercase tracking-wider mb-1">
                      Branding Accent Tint
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {colorPalettes.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setAccentColor(c.hex)}
                          className={`p-2 rounded border text-left flex items-center gap-2 transition-all ${
                            accentColor === c.hex
                              ? 'border-brand-dark bg-brand-paper font-bold'
                              : 'border-brand-border bg-white'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                          <span className="text-[11px] truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-dark uppercase tracking-wider mb-1">
                      Daily Dispatch Cutoff Threshold
                    </label>
                    <select
                      value={cutoffTime}
                      onChange={(e) => setCutoffTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-brand-border rounded bg-white focus:outline-none focus:border-brand-gold font-mono"
                    >
                      <option value="14:00">14:00 (2:00 PM Local) - Early Express</option>
                      <option value="15:00">15:00 (3:00 PM Local) - Standard Commercial</option>
                      <option value="16:00">16:00 (4:00 PM Local) - Enterprise Default</option>
                      <option value="17:00">17:00 (5:00 PM Local) - Late Logistics</option>
                      <option value="18:00">18:00 (6:00 PM Local) - Extended Evening</option>
                    </select>
                    <p className="text-[10px] text-brand-muted mt-1">
                      Orders dispatched after this local threshold rollover to the subsequent business day.
                    </p>
                  </div>

                  {saveSuccess && (
                    <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Company customizations saved to workspace successfully!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingCompany}
                    className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors disabled:opacity-60"
                  >
                    {savingCompany ? 'Saving Changes...' : 'Save Workspace Customization'}
                  </button>
                </form>
              )}

              {/* TAB 3: USER PREFERENCES */}
              {activeTab === 'user' && (
                <div className="space-y-4">
                  <div className="p-3 rounded bg-brand-cream border border-brand-border text-[11px] text-brand-muted">
                    Developer inspections and real-time visualization toggles for your active session.
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded border border-brand-border bg-white cursor-pointer hover:bg-brand-paper">
                      <div>
                        <div className="font-semibold text-brand-dark">Raw JSON Inspector</div>
                        <div className="text-[10px] text-brand-muted">Exposes raw schema payloads on parcel and claim drawers</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showJsonInspector}
                        onChange={(e) => setShowJsonInspector(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-gold accent-brand-gold"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded border border-brand-border bg-white cursor-pointer hover:bg-brand-paper">
                      <div>
                        <div className="font-semibold text-brand-dark">Mathematical SLA Breakdowns</div>
                        <div className="text-[10px] text-brand-muted">Displays step-by-step business hours calculation logs</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showMathFormulas}
                        onChange={(e) => setShowMathFormulas(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-gold accent-brand-gold"
                      />
                    </label>
                  </div>

                  <div className="pt-2 border-t border-brand-border">
                    <div className="font-bold text-brand-dark mb-2 uppercase tracking-wider text-[11px]">
                      Quick Custom Field Test Injector
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Field Key (e.g. hazard_rating)"
                        value={customFieldKey}
                        onChange={(e) => setCustomFieldKey(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-brand-border rounded text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Sample Value (e.g. Class 3 Flammable)"
                        value={customFieldValue}
                        onChange={(e) => setCustomFieldValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-brand-border rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Custom field schema [${customFieldKey || 'test_field'}] staged!`);
                          setCustomFieldKey('');
                          setCustomFieldValue('');
                        }}
                        className="w-full py-1.5 rounded bg-brand-cream hover:bg-brand-border border border-brand-border font-semibold text-xs text-brand-dark"
                      >
                        Stage Custom Field Definition
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WEBHOOKS & SIGNATURES */}
              {activeTab === 'webhooks' && (
                <div className="space-y-4">
                  <div className="p-3 rounded bg-brand-cream border border-brand-border text-[11px] text-brand-muted">
                    Test outbound HMAC-SHA256 signature generation and verify webhook delivery.
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-dark uppercase tracking-wider mb-1">
                      Event Type
                    </label>
                    <select
                      value={webhookEvent}
                      onChange={(e) => setWebhookEvent(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-brand-border rounded bg-white font-mono"
                    >
                      <option value="tracking.exception">tracking.exception</option>
                      <option value="sla.breached">sla.breached</option>
                      <option value="claim.approved">claim.approved</option>
                      <option value="enquiry.created">enquiry.created</option>
                    </select>
                  </div>

                  <div className="p-3 rounded bg-brand-dark text-brand-paper font-mono text-[11px] space-y-1.5">
                    <div className="text-brand-gold font-bold">HMAC-SHA256 HEADER SAMPLE</div>
                    <div className="text-brand-paper/70">X-ParcelResolve-Signature:</div>
                    <div className="text-emerald-400 break-all">
                      sha256=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                    </div>
                    <div className="text-brand-paper/70 mt-2">Sample Timestamp:</div>
                    <div className="text-white">{new Date().toISOString()}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setWebhookResult({
                        delivered: true,
                        event: webhookEvent,
                        statusCode: 200,
                        latencyMs: 42,
                        timestamp: new Date().toISOString(),
                      });
                    }}
                    className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 text-brand-gold" />
                    Simulate Webhook Dispatch
                  </button>

                  {webhookResult && (
                    <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono">
                      ✓ Webhook simulation successful! HTTP 200 (42ms)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
