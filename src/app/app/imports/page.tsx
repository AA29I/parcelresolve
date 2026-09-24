'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  FileText,
  Table,
} from 'lucide-react';

export default function ImportsPage() {
  const [csvText, setCsvText] = useState(
`tracking_number,order_reference,courier_name,consignee,street_address,dest_city,dest_state,dest_zip,dest_country,shipment_date,declared_amount,currency,hazard_class
1Z999BULK001,ORD-99101,UPS,Alex Morgan,100 Ocean Drive,Miami,FL,33139,US,2026-09-20,180.00,USD,None
1Z999BULK002,ORD-99102,UPS,David Chen,45 Market Street,San Francisco,CA,94105,US,2026-09-20,320.00,USD,UN3481 Lithium Battery
1Z999BULK003,ORD-99103,UPS,Emily Watson,12 King Street,London,London,EC2V 8AU,GB,2026-09-21,450.00,USD,None`
  );

  const [previewData, setPreviewData] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handlePreview = async () => {
    setLoadingPreview(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/imports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      setPreviewData(data);
      setMapping(data.detectedMappings || {});
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteImport = async () => {
    setExecuting(true);
    try {
      const res = await fetch('/api/imports/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'merchant_dispatch_feed.csv',
          csvText,
          mapping,
        }),
      });
      const data = await res.json();
      setImportResult(data);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Data Ingestion & Extraction Engine
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">CSV & XLSX Bulk Importer</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Validation previews, reusable column mappings, duplicate detection, upsert support, and row error reporting.
          </p>
        </div>

        <a
          href="/api/exports/parcels"
          download
          className="px-3 py-2 rounded bg-white border border-brand-border text-xs font-semibold text-brand-dark hover:border-brand-gold flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" /> Export All Workspace Parcels
        </a>
      </div>

      {/* CSV Input Card */}
      <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-brand-dark flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-brand-gold" />
            Paste Raw CSV Data or Drag & Drop File
          </label>
          <span className="text-[11px] text-brand-muted font-mono">RFC-4180 Compliant Parser</span>
        </div>

        <textarea
          rows={6}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Paste comma-separated rows with headers..."
          className="w-full p-3 border border-brand-border rounded font-mono text-xs focus:outline-none focus:border-brand-gold bg-brand-paper/50"
        ></textarea>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loadingPreview || !csvText.trim()}
            className="px-4 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-gold ${loadingPreview ? 'animate-spin' : ''}`} />
            {loadingPreview ? 'Parsing Headers...' : 'Generate Preview & Detect Mappings'}
          </button>
        </div>
      </div>

      {/* Preview & Mapping Table */}
      {previewData && (
        <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-brand-dark">Column Mapping & Preview</h2>
              <div className="text-[11px] text-brand-muted">
                Estimated {previewData.totalEstimatedRows} row(s) detected in file
              </div>
            </div>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={executing}
              className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {executing ? 'Ingesting Parcels...' : 'Execute Ingestion (Upsert Mode)'}
            </button>
          </div>

          {/* Interactive Mapping Selectors */}
          <div className="p-4 rounded-lg bg-brand-cream/80 border border-brand-border space-y-3">
            <div className="text-xs font-semibold text-brand-dark uppercase tracking-wider">
              Verify Automated Field Mappings:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-brand-muted text-[11px] mb-1">Tracking Number *</label>
                <select
                  value={mapping.trackingNumber || ''}
                  onChange={(e) => setMapping({ ...mapping, trackingNumber: e.target.value })}
                  className="w-full p-1.5 border border-brand-border rounded bg-white text-xs font-mono"
                >
                  <option value="">-- Choose Column --</option>
                  {previewData.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-brand-muted text-[11px] mb-1">Order Reference</label>
                <select
                  value={mapping.orderNumber || ''}
                  onChange={(e) => setMapping({ ...mapping, orderNumber: e.target.value })}
                  className="w-full p-1.5 border border-brand-border rounded bg-white text-xs font-mono"
                >
                  <option value="">-- Choose Column --</option>
                  {previewData.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-brand-muted text-[11px] mb-1">Recipient Name</label>
                <select
                  value={mapping.recipientName || ''}
                  onChange={(e) => setMapping({ ...mapping, recipientName: e.target.value })}
                  className="w-full p-1.5 border border-brand-border rounded bg-white text-xs font-mono"
                >
                  <option value="">-- Choose Column --</option>
                  {previewData.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-brand-muted text-[11px] mb-1">Dispatch Date *</label>
                <select
                  value={mapping.dispatchDate || ''}
                  onChange={(e) => setMapping({ ...mapping, dispatchDate: e.target.value })}
                  className="w-full p-1.5 border border-brand-border rounded bg-white text-xs font-mono"
                >
                  <option value="">-- Choose Column --</option>
                  {previewData.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sample Rows Table */}
          <div>
            <div className="text-xs font-semibold text-brand-dark mb-2">Sample Preview (First 5 Rows)</div>
            <div className="overflow-x-auto border border-brand-border rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-brand-paper border-b border-brand-border">
                  <tr>
                    {previewData.headers.map((h: string) => (
                      <th key={h} className="p-2 text-brand-dark">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60 text-brand-muted">
                  {previewData.sampleRows.map((row: any, i: number) => (
                    <tr key={i}>
                      {previewData.headers.map((h: string) => (
                        <td key={h} className="p-2 truncate max-w-xs">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Execution Results Card */}
      {importResult && (
        <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Batch Ingestion Completed Successfully
          </div>
          <div className="grid grid-cols-4 gap-2 font-mono text-xs text-emerald-950">
            <div className="p-2 bg-white rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase">Total Rows:</span>
              <span className="font-bold">{importResult.totalRows}</span>
            </div>
            <div className="p-2 bg-white rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase">Inserted New:</span>
              <span className="font-bold">{importResult.insertedCount}</span>
            </div>
            <div className="p-2 bg-white rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase">Updated Existing:</span>
              <span className="font-bold">{importResult.updatedCount}</span>
            </div>
            <div className="p-2 bg-white rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase">Error Rows:</span>
              <span className="font-bold">{importResult.errorRows}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
