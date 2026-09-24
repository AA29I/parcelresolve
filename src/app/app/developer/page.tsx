'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Key,
  Send,
  Terminal,
  RotateCcw,
  Plus,
  CheckCircle2,
  Play,
  Layers,
  Copy,
  Check,
  AlertCircle,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = useState<'workflows' | 'custom_fields' | 'api_keys' | 'webhooks' | 'sdk_test'>('workflows');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Workflow modal
  const [newWorkflowModal, setNewWorkflowModal] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    name: 'Auto-Draft Enquiry on Severe Breach',
    description: 'Triggers carrier enquiry draft when breach exceeds 18 business hours',
    triggerEvent: 'SLA_BREACHED',
    conditionField: 'breachHours',
    conditionOperator: 'GREATER_THAN',
    conditionValue: 18,
    actionType: 'CREATE_ENQUIRY_DRAFT',
  });

  // New Key modal
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('ERP Integration Key');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  // New Custom Field modal
  const [newFieldModal, setNewFieldModal] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    entityType: 'PARCEL',
    fieldKey: 'customs_tax_id',
    fieldLabel: 'Customs Tax Identifier',
    fieldType: 'TEXT',
  });

  // SDK Test state
  const [sdkRunning, setSdkRunning] = useState(false);
  const [sdkResult, setSdkResult] = useState<any>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [wfRes, cfRes, akRes, whRes] = await Promise.all([
        fetch('/api/developer/workflows').then((r) => r.json()),
        fetch('/api/developer/custom-fields').then((r) => r.json()),
        fetch('/api/developer/api-keys').then((r) => r.json()),
        fetch('/api/developer/webhooks').then((r) => r.json()),
      ]);
      setWorkflows(wfRes.rules || []);
      setCustomFields(cfRes.fields || []);
      setApiKeys(akRes.keys || []);
      setWebhooks(whRes.webhooks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/developer/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: workflowForm.name,
        description: workflowForm.description,
        triggerEvent: workflowForm.triggerEvent,
        conditions: [
          {
            field: workflowForm.conditionField,
            operator: workflowForm.conditionOperator,
            value: workflowForm.conditionValue,
          },
        ],
        actions: [{ type: workflowForm.actionType, parameters: {} }],
      }),
    });
    if (res.ok) {
      setNewWorkflowModal(false);
      await fetchAllData();
    }
  };

  const handleRollbackWorkflow = async (ruleId: string, versionNumber: number) => {
    if (!confirm(`Rollback this workflow rule to Version ${versionNumber}?`)) return;
    const res = await fetch(`/api/developer/workflows/${ruleId}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetVersionNumber: versionNumber }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`Workflow rolled back to Version ${versionNumber} baseline!`);
      await fetchAllData();
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/developer/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: keyName, scopes: ['parcels:read', 'parcels:write', 'tracking:read'] }),
    });
    const data = await res.json();
    if (data.success) {
      setGeneratedSecret(data.secretKey);
      await fetchAllData();
    }
  };

  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/developer/custom-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fieldForm),
    });
    if (res.ok) {
      setNewFieldModal(false);
      await fetchAllData();
    }
  };

  const handleRunSdkTest = async () => {
    setSdkRunning(true);
    setSdkResult(null);
    try {
      const res = await fetch('/api/developer/sdk-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleTrackingNumber: 'DPD015099182049' }),
      });
      const data = await res.json();
      setSdkResult(data);
    } finally {
      setSdkRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Tenant Developer Mode
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Tenant Developer Portal</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Configure custom fields, build event workflows with version rollback, manage API keys, and test custom carrier adapters.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border text-xs font-semibold text-brand-muted space-x-6">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'workflows' ? 'border-b-2 border-brand-gold text-brand-dark' : 'hover:text-brand-dark'
          }`}
        >
          No-Code Workflows & Rollbacks
        </button>
        <button
          onClick={() => setActiveTab('custom_fields')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'custom_fields' ? 'border-b-2 border-brand-gold text-brand-dark' : 'hover:text-brand-dark'
          }`}
        >
          Custom Fields & Schemas
        </button>
        <button
          onClick={() => setActiveTab('api_keys')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'api_keys' ? 'border-b-2 border-brand-gold text-brand-dark' : 'hover:text-brand-dark'
          }`}
        >
          Scoped API Keys
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'webhooks' ? 'border-b-2 border-brand-gold text-brand-dark' : 'hover:text-brand-dark'
          }`}
        >
          Outbound HMAC Webhooks
        </button>
        <button
          onClick={() => setActiveTab('sdk_test')}
          className={`pb-2.5 transition-colors ${
            activeTab === 'sdk_test' ? 'border-b-2 border-brand-gold text-brand-dark' : 'hover:text-brand-dark'
          }`}
        >
          Carrier Adapter SDK Harness
        </button>
      </div>

      {/* Tab 1: Workflows */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-brand-muted">
              Declarative event automation. Rules create immutable version snapshots on edit and support 1-click rollback.
            </div>
            <button
              onClick={() => setNewWorkflowModal(true)}
              className="px-3 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Workflow Rule
            </button>
          </div>

          <div className="space-y-3">
            {workflows.map((rule) => {
              const conditions = JSON.parse(rule.conditions || '[]');
              const actions = JSON.parse(rule.actions || '[]');
              return (
                <div key={rule.id} className="p-5 rounded-lg bg-white border border-brand-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-brand-dark">{rule.name}</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-brand-cream text-[10px] font-mono text-brand-dark">
                        v{rule.version}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-mono bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      ACTIVE
                    </span>
                  </div>

                  <p className="text-xs text-brand-muted">{rule.description}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-brand-paper p-3 rounded border border-brand-border">
                    <div>
                      <span className="text-[10px] text-brand-muted uppercase font-sans block">Trigger:</span>
                      <span className="font-bold text-brand-dark">{rule.triggerEvent}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-muted uppercase font-sans block">Conditions:</span>
                      <span>{conditions.map((c: any) => `${c.field} ${c.operator} ${c.value}`).join(' AND ')}</span>
                    </div>
                  </div>

                  {/* Version Rollback History */}
                  {rule.versions && rule.versions.length > 1 && (
                    <div className="pt-2 border-t border-brand-border/60">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted mb-1">
                        Historical Version Snapshots & Rollback
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rule.versions.map((v: any) => (
                          <button
                            key={v.id}
                            onClick={() => handleRollbackWorkflow(rule.id, v.versionNumber)}
                            className="px-2 py-1 rounded bg-brand-cream hover:bg-brand-border text-[10px] font-mono text-brand-dark border border-brand-border flex items-center gap-1"
                          >
                            <RotateCcw className="w-2.5 h-2.5 text-brand-gold" /> Restore v{v.versionNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Custom Fields */}
      {activeTab === 'custom_fields' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-brand-muted">
              Add custom typed fields to parcels, orders, and claims. Fully searchable and validated.
            </div>
            <button
              onClick={() => setNewFieldModal(true)}
              className="px-3 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Define Custom Field
            </button>
          </div>

          <div className="overflow-x-auto border border-brand-border rounded-lg bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-cream/80 text-brand-dark font-semibold border-b border-brand-border">
                <tr>
                  <th className="p-3">Field Key</th>
                  <th className="p-3">Label</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Data Type</th>
                  <th className="p-3">Searchable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-brand-muted font-mono">
                {customFields.map((f) => (
                  <tr key={f.id} className="hover:bg-brand-paper/50">
                    <td className="p-3 font-bold text-brand-dark">{f.fieldKey}</td>
                    <td className="p-3 font-sans">{f.fieldLabel}</td>
                    <td className="p-3">{f.entityType}</td>
                    <td className="p-3">{f.fieldType}</td>
                    <td className="p-3 text-emerald-700">YES</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: API Keys */}
      {activeTab === 'api_keys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-brand-muted">
              Generate tenant-scoped API keys with specific permission scopes.
            </div>
            <button
              onClick={() => setNewKeyModal(true)}
              className="px-3 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create API Key
            </button>
          </div>

          {generatedSecret && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-xs space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                API Key Generated (Copy Now — Not Shown Again)
              </div>
              <div className="p-2 bg-white rounded border border-emerald-200 font-mono text-emerald-950 font-bold select-all">
                {generatedSecret}
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-brand-border rounded-lg bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-cream/80 text-brand-dark font-semibold border-b border-brand-border">
                <tr>
                  <th className="p-3">Key Name</th>
                  <th className="p-3">Key Prefix</th>
                  <th className="p-3">Scopes</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-brand-muted font-mono">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-brand-paper/50">
                    <td className="p-3 font-sans font-bold text-brand-dark">{k.name}</td>
                    <td className="p-3">{k.keyPrefix}...</td>
                    <td className="p-3 text-[10px]">{JSON.parse(k.scopes || '[]').join(', ')}</td>
                    <td className="p-3 text-emerald-700 font-bold">ACTIVE</td>
                    <td className="p-3 text-[10px]">{new Date(k.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="text-xs text-brand-muted">
            Outbound webhooks signed with HMAC-SHA256 headers (<code>X-ParcelResolve-Signature</code>).
          </div>

          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-4 rounded-lg bg-white border border-brand-border shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-brand-dark">{wh.name}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    SUBSCRIBED
                  </span>
                </div>
                <div className="font-mono text-xs text-brand-muted truncate">Target URL: {wh.targetUrl}</div>
                <div className="text-[10px] text-brand-muted font-mono">
                  Shared Secret: {wh.secretKey.slice(0, 10)}... (HMAC-SHA256)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: SDK Test Harness */}
      {activeTab === 'sdk_test' && (
        <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-brand-dark">Carrier Extension SDK Test Harness</h2>
            <p className="text-xs text-brand-muted">
              Execute and assert custom code carrier adapters (e.g. SOAP/XML or custom crypto) in an isolated sandbox environment.
            </p>
          </div>

          <button
            onClick={handleRunSdkTest}
            disabled={sdkRunning}
            className="px-4 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-brand-gold ${sdkRunning ? 'animate-spin' : ''}`} />
            {sdkRunning ? 'Running Test Harness...' : 'Execute DPD European Adapter Test Harness'}
          </button>

          {sdkResult && (
            <div className="p-4 rounded-lg bg-brand-ink text-brand-paper font-mono text-xs space-y-2 overflow-x-auto">
              <div className="flex items-center justify-between text-brand-gold font-bold">
                <span>TEST HARNESS RESULT: {sdkResult.harnessResult?.passed ? 'PASSED (0 ERRORS)' : 'FAILED'}</span>
                <span>DURATION: {sdkResult.harnessResult?.durationMs}ms</span>
              </div>
              <div className="text-brand-muted">Adapter: {sdkResult.adapter?.name} (v{sdkResult.adapter?.version})</div>
              <pre className="text-[11px] text-brand-lightgold overflow-x-auto">
                {JSON.stringify(sdkResult.harnessResult?.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* New Workflow Modal */}
      {newWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-brand-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="font-bold text-sm text-brand-dark">New Workflow Rule</h3>
              <button onClick={() => setNewWorkflowModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={workflowForm.name}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Trigger Event</label>
                <select
                  value={workflowForm.triggerEvent}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, triggerEvent: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="SLA_BREACHED">SLA Breached Overdue</option>
                  <option value="TRACKING_STATUS_CHANGED">Tracking Status Changed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Safe Action</label>
                <select
                  value={workflowForm.actionType}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, actionType: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="CREATE_ENQUIRY_DRAFT">Create Carrier Enquiry Draft</option>
                  <option value="AUTO_SEND_ENQUIRY">Auto-Send Carrier Enquiry</option>
                  <option value="DISPATCH_WEBHOOK">Dispatch Outbound Webhook</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewWorkflowModal(false)} className="px-3 py-1.5 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-dark text-white rounded font-semibold">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Field Modal */}
      {newFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-brand-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="font-bold text-sm text-brand-dark">Define Custom Field</h3>
              <button onClick={() => setNewFieldModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateCustomField} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Field Key (database identifier)</label>
                <input
                  type="text"
                  required
                  value={fieldForm.fieldKey}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldKey: e.target.value })}
                  className="w-full p-2 border rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Display Label</label>
                <input
                  type="text"
                  required
                  value={fieldForm.fieldLabel}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldLabel: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Data Type</label>
                <select
                  value={fieldForm.fieldType}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="BOOLEAN">Boolean (True/False)</option>
                  <option value="DATE">Date</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewFieldModal(false)} className="px-3 py-1.5 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-dark text-white rounded font-semibold">Save Field</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {newKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-brand-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="font-bold text-sm text-brand-dark">Generate Tenant API Key</h3>
              <button onClick={() => setNewKeyModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Key Name / Description</label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="p-3 bg-brand-cream rounded border text-[11px] text-brand-muted">
                Key will be granted <code>parcels:read</code>, <code>parcels:write</code>, and <code>tracking:read</code> scopes for this workspace.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNewKeyModal(false)} className="px-3 py-1.5 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-brand-dark text-white rounded font-semibold">Generate Key</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
