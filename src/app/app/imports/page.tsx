'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  Table,
  X,
  ClipboardPaste,
  GripVertical,
} from 'lucide-react';

interface ImportResult {
  totalRows: number;
  insertedCount: number;
  updatedCount: number;
  newCustomFieldsCreated: string[];
  sampleProcessed: {
    trackingNumber: string;
    orderNumber: string;
    carrier: string;
    customFieldsCount: number;
  }[];
}

interface Carrier {
  id: string;
  name: string;
  code: string;
}

export default function ImportsPage() {
  // --- Bulk Import State ---
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Manual Entry State ---
  const [showManual, setShowManual] = useState(false);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [manualForm, setManualForm] = useState({
    trackingNumber: '',
    orderNumber: '',
    carrierId: '',
    recipientName: '',
    recipientAddress: '',
    recipientCity: '',
    recipientState: '',
    recipientPostalCode: '',
    recipientCountry: '',
    declaredValue: '',
    currency: 'USD',
    shippingCost: '',
    weightKg: '',
    itemsSummary: '',
    dispatchDate: new Date().toISOString().split('T')[0],
  });
  const [manualCustomFields, setManualCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualResult, setManualResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load carriers for manual form
  useEffect(() => {
    fetch('/api/carriers')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCarriers(data);
        else if (data.carriers) setCarriers(data.carriers);
      })
      .catch(() => {});
  }, []);

  // --- Client-side CSV Parser (for preview only) ---
  const parseCSVForPreview = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setParsedHeaders([]);
      setParsedRows([]);
      return;
    }
    // Auto-detect delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
      delimiter = '\t';
    } else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
      delimiter = ';';
    }

    const splitLine = (line: string): string[] => {
      if (delimiter === '\t') {
        return line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      }
      const row: string[] = [];
      let currentField = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          row.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      row.push(currentField.trim());
      return row;
    };

    const headers = splitLine(lines[0]);
    const rows = lines.slice(1, 6).map(splitLine); // Preview first 5 rows
    setParsedHeaders(headers);
    setParsedRows(rows);
  }, []);

  // --- File Handlers ---
  const handleFileRead = useCallback(
    (file: File) => {
      setImportResult(null);
      setImportError('');
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvText(text);
        parseCSVForPreview(text);
      };
      reader.readAsText(file);
    },
    [parseCSVForPreview]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead]
  );

  const handlePasteChange = useCallback(
    (text: string) => {
      setCsvText(text);
      setFileName('');
      parseCSVForPreview(text);
    },
    [parseCSVForPreview]
  );

  // --- Bulk Import Handler ---
  const handleImport = async () => {
    setImporting(true);
    setImportError('');
    setImportResult(null);
    try {
      const res = await fetch('/api/parcels/dynamic-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: csvText }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setImportError(data.error || 'Import failed');
      } else {
        setImportResult(data);
      }
    } catch (err) {
      setImportError('Network error during import. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // --- Manual Parcel Submit ---
  const handleManualSubmit = async () => {
    setManualSubmitting(true);
    setManualResult(null);
    try {
      const customFields: Record<string, string> = {};
      manualCustomFields.forEach((f) => {
        if (f.key.trim() && f.value.trim()) {
          customFields[f.key.trim()] = f.value.trim();
        }
      });

      const res = await fetch('/api/parcels/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...manualForm,
          declaredValue: manualForm.declaredValue ? Number(manualForm.declaredValue) : 0,
          shippingCost: manualForm.shippingCost ? Number(manualForm.shippingCost) : 0,
          weightKg: manualForm.weightKg ? Number(manualForm.weightKg) : 1,
          customFields,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setManualResult({ success: false, message: data.error || 'Failed to create parcel' });
      } else {
        setManualResult({
          success: true,
          message: `Parcel ${data.parcel?.trackingNumber || manualForm.trackingNumber} created successfully.`,
        });
        // Reset form
        setManualForm({
          trackingNumber: '',
          orderNumber: '',
          carrierId: manualForm.carrierId,
          recipientName: '',
          recipientAddress: '',
          recipientCity: '',
          recipientState: '',
          recipientPostalCode: '',
          recipientCountry: '',
          declaredValue: '',
          currency: 'USD',
          shippingCost: '',
          weightKg: '',
          itemsSummary: '',
          dispatchDate: new Date().toISOString().split('T')[0],
        });
        setManualCustomFields([]);
      }
    } catch {
      setManualResult({ success: false, message: 'Network error creating parcel.' });
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
            Universal Data Ingestion Engine
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Import & Create Parcels</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Upload any CSV/TSV file or paste spreadsheet data. All columns are accepted — unknown fields are preserved as custom attributes.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="px-3 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-brand-gold" />
            {showManual ? 'Hide Manual Entry' : 'Create Single Parcel'}
          </button>
          <a
            href="/api/exports/parcels"
            download
            className="px-3 py-2 rounded bg-white border border-brand-border text-xs font-semibold text-brand-dark hover:border-brand-gold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" /> Export All
          </a>
        </div>
      </div>

      {/* ====================== MANUAL ENTRY PANEL ====================== */}
      {showManual && (
        <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-brand-dark">Manual Parcel Creation</h2>
              <p className="text-[11px] text-brand-muted">
                Add any fields you need. Only Tracking Number, Carrier, Name &amp; Address are required.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="p-1 text-brand-muted hover:text-brand-dark"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'trackingNumber', label: 'Tracking Number *', placeholder: '1Z999AA...' },
              { key: 'orderNumber', label: 'Order Reference', placeholder: 'ORD-12345' },
              { key: 'recipientName', label: 'Recipient Name *', placeholder: 'John Smith' },
              { key: 'recipientAddress', label: 'Address *', placeholder: '100 Main St' },
              { key: 'recipientCity', label: 'City', placeholder: 'London' },
              { key: 'recipientState', label: 'State / Province', placeholder: 'CA' },
              { key: 'recipientPostalCode', label: 'Postal Code', placeholder: '90210' },
              { key: 'recipientCountry', label: 'Country', placeholder: 'US' },
              { key: 'declaredValue', label: 'Declared Value', placeholder: '250.00' },
              { key: 'currency', label: 'Currency', placeholder: 'USD' },
              { key: 'shippingCost', label: 'Shipping Cost', placeholder: '12.50' },
              { key: 'weightKg', label: 'Weight (kg)', placeholder: '2.5' },
              { key: 'itemsSummary', label: 'Items Description', placeholder: 'Electronics, 2x widget' },
              { key: 'dispatchDate', label: 'Dispatch Date', placeholder: '2026-09-25' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-[11px] text-brand-muted mb-1">{field.label}</label>
                <input
                  type={field.key === 'dispatchDate' ? 'date' : 'text'}
                  value={(manualForm as any)[field.key]}
                  onChange={(e) =>
                    setManualForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="w-full p-1.5 border border-brand-border rounded bg-white text-xs font-mono focus:outline-none focus:border-brand-gold"
                />
              </div>
            ))}

            {/* Carrier Selector */}
            <div>
              <label className="block text-[11px] text-brand-muted mb-1">Carrier *</label>
              <select
                value={manualForm.carrierId}
                onChange={(e) =>
                  setManualForm((prev) => ({ ...prev, carrierId: e.target.value }))
                }
                className="w-full p-1.5 border border-brand-border rounded bg-white text-xs font-mono focus:outline-none focus:border-brand-gold"
              >
                <option value="">-- Select Carrier --</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-brand-dark uppercase tracking-wider">
                Custom Fields (Optional — Add Any)
              </label>
              <button
                type="button"
                onClick={() =>
                  setManualCustomFields((prev) => [...prev, { key: '', value: '' }])
                }
                className="text-[11px] text-brand-gold hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Field
              </button>
            </div>
            {manualCustomFields.map((cf, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={cf.key}
                  onChange={(e) => {
                    const updated = [...manualCustomFields];
                    updated[idx].key = e.target.value;
                    setManualCustomFields(updated);
                  }}
                  placeholder="Field name (e.g. batch_id)"
                  className="flex-1 p-1.5 border border-brand-border rounded text-xs font-mono focus:outline-none focus:border-brand-gold"
                />
                <input
                  type="text"
                  value={cf.value}
                  onChange={(e) => {
                    const updated = [...manualCustomFields];
                    updated[idx].value = e.target.value;
                    setManualCustomFields(updated);
                  }}
                  placeholder="Value"
                  className="flex-1 p-1.5 border border-brand-border rounded text-xs font-mono focus:outline-none focus:border-brand-gold"
                />
                <button
                  type="button"
                  onClick={() =>
                    setManualCustomFields((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2 border-t border-brand-border">
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={
                manualSubmitting ||
                !manualForm.trackingNumber ||
                !manualForm.carrierId ||
                !manualForm.recipientName ||
                !manualForm.recipientAddress
              }
              className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {manualSubmitting ? 'Creating...' : 'Create Parcel'}
            </button>

            {manualResult && (
              <div
                className={`text-xs font-semibold flex items-center gap-1 ${manualResult.success ? 'text-emerald-700' : 'text-red-600'}`}
              >
                {manualResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {manualResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================== BULK IMPORT ====================== */}
      <div
        className={`p-6 rounded-lg bg-white border-2 border-dashed transition-colors shadow-xs space-y-4 ${
          isDragging ? 'border-brand-gold bg-brand-cream/50' : 'border-brand-border'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-brand-dark flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-brand-gold" />
            Drag &amp; Drop File or Paste Data
          </label>
          <div className="flex items-center gap-3">
            {fileName && (
              <span className="text-[11px] text-brand-muted font-mono bg-brand-cream px-2 py-0.5 rounded">
                <FileText className="w-3 h-3 inline mr-1" />
                {fileName}
              </span>
            )}
            <span className="text-[10px] text-brand-muted font-mono">CSV · TSV · TXT</span>
          </div>
        </div>

        {/* Drop Zone / Paste Area */}
        <div className="relative">
          {!csvText && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <Upload className="w-8 h-8 text-brand-gold/60 mb-2" />
              <p className="text-xs text-brand-muted">
                Drop a CSV/TSV file here, or paste spreadsheet data below
              </p>
              <p className="text-[10px] text-brand-muted/70 mt-1">
                All columns accepted — no specific format required
              </p>
            </div>
          )}
          <textarea
            rows={csvText ? 6 : 5}
            value={csvText}
            onChange={(e) => handlePasteChange(e.target.value)}
            placeholder=""
            className={`w-full p-3 border border-brand-border rounded font-mono text-xs focus:outline-none focus:border-brand-gold bg-brand-paper/50 ${!csvText ? 'text-transparent placeholder:text-transparent' : ''}`}
          />
        </div>

        {/* File Input & Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded bg-brand-cream border border-brand-border text-xs font-semibold text-brand-dark hover:border-brand-gold flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-brand-gold" /> Browse Files
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text) handlePasteChange(text);
                } catch {
                  // Fallback: user can paste manually
                }
              }}
              className="px-3 py-1.5 rounded bg-brand-cream border border-brand-border text-xs font-semibold text-brand-dark hover:border-brand-gold flex items-center gap-1.5"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-brand-gold" /> Paste from Clipboard
            </button>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            className="px-4 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-gold ${importing ? 'animate-spin' : ''}`} />
            {importing ? 'Importing Parcels...' : 'Import All Rows'}
          </button>
        </div>
      </div>

      {/* ====================== INFO BANNER ====================== */}
      <div className="p-4 rounded-lg bg-brand-cream/80 border border-brand-border flex items-start gap-3">
        <Table className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-brand-muted">
          <div className="font-semibold text-brand-dark">How the Universal Importer Works</div>
          <ul className="list-disc ml-4 space-y-0.5">
            <li>
              <strong>Any column is accepted.</strong> Tracking number, courier, address, dates — and any
              other column you include — are automatically preserved.
            </li>
            <li>
              Known fields (tracking_number, order_ref, city, country, etc.) are mapped automatically via
              fuzzy matching.
            </li>
            <li>
              <strong>Unknown columns</strong> are saved as <em>custom field attributes</em> on each
              parcel and registered in your workspace&apos;s custom field registry.
            </li>
            <li>
              Duplicate tracking numbers are upserted (updated) rather than creating duplicates.
            </li>
            <li>Supports comma, tab, and semicolon delimiters with automatic detection.</li>
          </ul>
        </div>
      </div>

      {/* ====================== PREVIEW TABLE ====================== */}
      {parsedHeaders.length > 0 && (
        <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                <Table className="w-4 h-4 text-brand-gold" />
                Data Preview
              </h2>
              <div className="text-[11px] text-brand-muted">
                Detected {parsedHeaders.length} column(s) · Showing first {parsedRows.length} row(s)
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-brand-muted">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold">
                All {parsedHeaders.length} columns will be imported
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-brand-border rounded">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-brand-paper border-b border-brand-border">
                <tr>
                  <th className="p-2 text-brand-muted w-8">#</th>
                  {parsedHeaders.map((h) => (
                    <th key={h} className="p-2 text-brand-dark whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-brand-muted">
                {parsedRows.map((row, i) => (
                  <tr key={i} className="hover:bg-brand-cream/30">
                    <td className="p-2 text-brand-muted/50">{i + 1}</td>
                    {parsedHeaders.map((h, ci) => (
                      <td key={`${h}-${ci}`} className="p-2 truncate max-w-xs">
                        {row[ci] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================== ERROR ====================== */}
      {importError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 shadow-xs flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-red-900">Import Failed</div>
            <div className="text-xs text-red-800 mt-0.5">{importError}</div>
          </div>
        </div>
      )}

      {/* ====================== RESULTS ====================== */}
      {importResult && (
        <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Batch Ingestion Completed Successfully
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs text-emerald-950">
            <div className="p-2 bg-white rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase">Total Rows</span>
              <span className="font-bold text-lg">{importResult.totalRows}</span>
            </div>
            <div className="p-2 bg-white rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase">Inserted New</span>
              <span className="font-bold text-lg">{importResult.insertedCount}</span>
            </div>
            <div className="p-2 bg-white rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase">Updated Existing</span>
              <span className="font-bold text-lg">{importResult.updatedCount}</span>
            </div>
            <div className="p-2 bg-white rounded border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block uppercase">New Custom Fields</span>
              <span className="font-bold text-lg">{importResult.newCustomFieldsCreated.length}</span>
            </div>
          </div>

          {/* New Custom Fields */}
          {importResult.newCustomFieldsCreated.length > 0 && (
            <div className="p-3 bg-white rounded border border-emerald-200">
              <div className="text-[11px] font-semibold text-emerald-800 mb-1">
                New Custom Fields Registered:
              </div>
              <div className="flex flex-wrap gap-1">
                {importResult.newCustomFieldsCreated.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-mono"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sample Processed */}
          {importResult.sampleProcessed.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-emerald-800 mb-2">
                Sample Processed Parcels:
              </div>
              <div className="overflow-x-auto border border-emerald-200 rounded">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-white/80 border-b border-emerald-200">
                    <tr>
                      <th className="p-2 text-emerald-800">Tracking Number</th>
                      <th className="p-2 text-emerald-800">Order</th>
                      <th className="p-2 text-emerald-800">Carrier</th>
                      <th className="p-2 text-emerald-800">Custom Fields</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 text-emerald-950">
                    {importResult.sampleProcessed.map((sp, i) => (
                      <tr key={i}>
                        <td className="p-2 font-semibold">{sp.trackingNumber}</td>
                        <td className="p-2">{sp.orderNumber}</td>
                        <td className="p-2">{sp.carrier}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 bg-emerald-100 rounded text-[10px]">
                            {sp.customFieldsCount} field(s)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
