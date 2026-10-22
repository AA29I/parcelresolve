'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
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
  Cpu,
  BookOpen,
  ArrowRight,
  SlidersHorizontal,
  Check,
  Server,
  Activity,
  Layers,
} from 'lucide-react';
import HelpTooltip from '@/components/HelpTooltip';
import OperationsGuideDrawer from '@/components/OperationsGuideDrawer';

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

interface LinnworksState {
  isConnected: boolean;
  syncStatus: string;
  serverUrl: string;
  ordersSyncedCount: number;
  lastSyncAt?: string;
  lastError?: string;
  syncProvenance: string;
}

// Core system destination fields for dynamic column mapping
const TARGET_SYSTEM_FIELDS = [
  { key: 'trackingNumber', label: 'Tracking / Waybill No *', required: true, tooltip: 'Unique courier waybill or barcode number used for live checkpoint tracking.' },
  { key: 'orderNumber', label: 'Order / Consignment Ref *', required: true, tooltip: 'WMS, Amazon, Shopify, or Linnworks order reference number.' },
  { key: 'courierName', label: 'Courier Name / Code', required: false, tooltip: 'Carrier service provider (e.g. Royal Mail, DPD, Evri, Yodel, UPS, FedEx).' },
  { key: 'postalServiceName', label: 'Postal Service / Tariff', required: false, tooltip: 'Service level description (e.g. Tracked 24, DPD Next Day, Evri Standard).' },
  { key: 'recipientName', label: 'Customer / Recipient Name', required: false, tooltip: 'Consignee recipient full name.' },
  { key: 'recipientAddress', label: 'Delivery Street Address', required: false, tooltip: 'Customer delivery address line.' },
  { key: 'recipientCity', label: 'Destination City', required: false, tooltip: 'Recipient destination town or city.' },
  { key: 'recipientPostalCode', label: 'Postal / ZIP Code', required: false, tooltip: 'Destination postal code (used for depot routing analysis).' },
  { key: 'recipientCountry', label: 'Destination Country', required: false, tooltip: 'Destination country code (e.g. GB, US, DE, CA).' },
  { key: 'declaredValue', label: 'Declared Retail Value', required: false, tooltip: 'Item retail price (ex-VAT) used for insurance & claim valuation.' },
  { key: 'wholesaleCost', label: 'Wholesale / Purchase Cost', required: false, tooltip: 'Manufacturing / wholesale cost (mandatory for Royal Mail P58 loss claims).' },
  { key: 'shippingCost', label: 'Postage Paid (Carriage)', required: false, tooltip: 'Postage fee paid to courier to be reclaimed upon non-delivery.' },
  { key: 'dispatchDate', label: 'Dispatch / Manifest Date', required: false, tooltip: 'Date order was manifested and handed over to carrier.' },
  { key: 'itemsSummary', label: 'Items & SKU Summary', required: false, tooltip: 'Item descriptions or SKUs included in the parcel.' },
];

export default function ImportsPage() {
  const [activeTab, setActiveTab] = useState<'MANIFEST_IMPORTER' | 'LINNWORKS_SYNC' | 'MANUAL_ENTRY'>('MANIFEST_IMPORTER');
  const [opsDrawerOpen, setOpsDrawerOpen] = useState(false);

  // --- Bulk Import State ---
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [workbookSheets, setWorkbookSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentWorkbookRef = useRef<XLSX.WorkBook | null>(null);

  // --- Dynamic Column Mapping State ---
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMappingStudio, setShowMappingStudio] = useState(false);

  // --- Linnworks Direct API State ---
  const [lwState, setLwState] = useState<LinnworksState | null>(null);
  const [lwLoading, setLwLoading] = useState(true);
  const [lwSyncing, setLwSyncing] = useState(false);
  const [lwConnecting, setLwConnecting] = useState(false);
  const [lwMsg, setLwMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [lwForm, setLwForm] = useState({
    applicationId: 'app-parcelresolve-production-v1',
    applicationSecret: 'lw-sec-9a8b7c6d5e4f3a2b1c',
    authorizationToken: 'lw_tok_auth_sample_live_key_99',
  });

  // --- Manual Entry State ---
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

  // Load carriers & Linnworks status on mount
  useEffect(() => {
    fetch('/api/carriers')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCarriers(data);
        else if (data.connectedCarriers) setCarriers(data.connectedCarriers);
        else if (data.carriers) setCarriers(data.carriers);
      })
      .catch(() => {});

    fetchLinnworksStatus();
  }, []);

  const fetchLinnworksStatus = async () => {
    try {
      setLwLoading(true);
      const res = await fetch('/api/integrations/linnworks');
      const data = await res.json();
      setLwState(data.connection || null);
    } catch {
      // fallback
    } finally {
      setLwLoading(false);
    }
  };

  // --- Client-side CSV Parser & Auto-Detector ---
  const parseCSVForPreview = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setParsedHeaders([]);
      setParsedRows([]);
      setColumnMapping({});
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
    const rows = lines.slice(1, 8).map(splitLine);
    setParsedHeaders(headers);
    setParsedRows(rows);

    // Run auto-mapping detection
    autoDetectColumnMapping(headers);
    setShowMappingStudio(true);
  }, []);

  // Smart Fuzzy Column Matcher
  const autoDetectColumnMapping = (headers: string[]) => {
    const mapping: Record<string, string> = {};

    headers.forEach((h) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!mapping.trackingNumber && (lower.includes('tracking') || lower.includes('waybill') || lower.includes('barcode') || lower.includes('consignmentno'))) {
        mapping.trackingNumber = h;
      } else if (!mapping.orderNumber && (lower.includes('ordernumber') || lower.includes('orderid') || lower.includes('orderref') || lower.includes('reference') || lower.includes('invoiceno'))) {
        mapping.orderNumber = h;
      } else if (!mapping.courierName && (lower.includes('courier') || lower.includes('carrier') || lower.includes('shippingvendor') || lower.includes('vendor'))) {
        mapping.courierName = h;
      } else if (!mapping.postalServiceName && (lower.includes('service') || lower.includes('postalservice') || lower.includes('shippingmethod') || lower.includes('tariff'))) {
        mapping.postalServiceName = h;
      } else if (!mapping.recipientName && (lower.includes('recipient') || lower.includes('customer') || lower.includes('buyername') || lower.includes('shipto') || lower.includes('name'))) {
        mapping.recipientName = h;
      } else if (!mapping.recipientAddress && (lower.includes('address') || lower.includes('street') || lower.includes('deliveryline'))) {
        mapping.recipientAddress = h;
      } else if (!mapping.recipientCity && (lower.includes('city') || lower.includes('town') || lower.includes('destinationcity'))) {
        mapping.recipientCity = h;
      } else if (!mapping.recipientPostalCode && (lower.includes('postcode') || lower.includes('postalcode') || lower.includes('zip') || lower.includes('zipcode'))) {
        mapping.recipientPostalCode = h;
      } else if (!mapping.recipientCountry && (lower.includes('country') || lower.includes('countrycode') || lower.includes('destcountry'))) {
        mapping.recipientCountry = h;
      } else if (!mapping.declaredValue && (lower.includes('value') || lower.includes('price') || lower.includes('ordertotal') || lower.includes('retailvalue') || lower.includes('declared'))) {
        mapping.declaredValue = h;
      } else if (!mapping.wholesaleCost && (lower.includes('cost') || lower.includes('wholesale') || lower.includes('costprice') || lower.includes('unitcost'))) {
        mapping.wholesaleCost = h;
      } else if (!mapping.shippingCost && (lower.includes('shippingcost') || lower.includes('postage') || lower.includes('carriage') || lower.includes('freightcost'))) {
        mapping.shippingCost = h;
      } else if (!mapping.dispatchDate && (lower.includes('dispatch') || lower.includes('processed') || lower.includes('shipped') || lower.includes('manifestdate') || lower.includes('date'))) {
        mapping.dispatchDate = h;
      } else if (!mapping.itemsSummary && (lower.includes('items') || lower.includes('sku') || lower.includes('title') || lower.includes('description') || lower.includes('product'))) {
        mapping.itemsSummary = h;
      }
    });

    setColumnMapping(mapping);
  };

  // Apply Presets
  const applyPreset = (presetName: 'LINNWORKS' | 'COURIER_REPORT' | 'SHOPIFY') => {
    const mapping: Record<string, string> = {};

    if (presetName === 'LINNWORKS') {
      parsedHeaders.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('postal tracking') || lower.includes('tracking')) mapping.trackingNumber = h;
        else if (lower.includes('order id') || lower.includes('order number') || lower.includes('reference')) mapping.orderNumber = h;
        else if (lower.includes('postal service') || lower.includes('courier')) mapping.courierName = h;
        else if (lower.includes('buyer') || lower.includes('name')) mapping.recipientName = h;
        else if (lower.includes('address')) mapping.recipientAddress = h;
        else if (lower.includes('postcode') || lower.includes('postal')) mapping.recipientPostalCode = h;
        else if (lower.includes('total charge') || lower.includes('value')) mapping.declaredValue = h;
        else if (lower.includes('processed on') || lower.includes('dispatch')) mapping.dispatchDate = h;
      });
    } else if (presetName === 'COURIER_REPORT') {
      parsedHeaders.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('tracking') || lower.includes('consignment')) mapping.trackingNumber = h;
        else if (lower.includes('order') || lower.includes('ref')) mapping.orderNumber = h;
        else if (lower.includes('carrier') || lower.includes('courier')) mapping.courierName = h;
        else if (lower.includes('service')) mapping.postalServiceName = h;
        else if (lower.includes('date') || lower.includes('dispatch')) mapping.dispatchDate = h;
      });
    }

    setColumnMapping(mapping);
  };

  // --- File Handlers ---
  const handleSheetSelect = useCallback(
    (sheetName: string, wb?: XLSX.WorkBook) => {
      const targetWb = wb || currentWorkbookRef.current;
      if (!targetWb) return;
      const worksheet = targetWb.Sheets[sheetName];
      if (!worksheet) return;

      setSelectedSheet(sheetName);
      const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
      setCsvText(csv);
      parseCSVForPreview(csv);
    },
    [parseCSVForPreview]
  );

  const handleFileRead = useCallback(
    (file: File) => {
      setImportResult(null);
      setImportError('');
      setFileName(file.name);
      setWorkbookSheets([]);
      setSelectedSheet('');
      currentWorkbookRef.current = null;

      const isExcel =
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';

      if (isExcel) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            const workbook = XLSX.read(buffer, { type: 'array' });
            currentWorkbookRef.current = workbook;
            setWorkbookSheets(workbook.SheetNames);

            if (workbook.SheetNames.length > 0) {
              const firstSheet = workbook.SheetNames[0];
              handleSheetSelect(firstSheet, workbook);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setImportError(`Could not read Excel workbook: ${msg}`);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setCsvText(text);
          parseCSVForPreview(text);
        };
        reader.readAsText(file);
      }
    },
    [handleSheetSelect, parseCSVForPreview]
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

  // --- Bulk Import Execution ---
  const handleExecuteImport = async () => {
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
      setImportError('Network communication error during manifest import.');
    } finally {
      setImporting(false);
    }
  };

  // --- Linnworks Actions ---
  const handleLinnworksConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLwConnecting(true);
    setLwMsg(null);
    try {
      const res = await fetch('/api/integrations/linnworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CONNECT', ...lwForm }),
      });
      const data = await res.json();
      if (data.success) {
        setLwMsg({ text: data.message });
        await fetchLinnworksStatus();
      } else {
        setLwMsg({ text: data.message || 'Connection failed', error: true });
      }
    } finally {
      setLwConnecting(false);
    }
  };

  const handleLinnworksSync = async (isBackfill = false) => {
    setLwSyncing(true);
    setLwMsg(null);
    try {
      const res = await fetch('/api/integrations/linnworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC', isBackfill }),
      });
      const data = await res.json();
      if (data.success) {
        setLwMsg({ text: `Sync complete! Processed ${data.ordersProcessed} order(s), created ${data.parcelsCreated} new parcel(s).` });
        await fetchLinnworksStatus();
      } else {
        setLwMsg({ text: data.errors?.[0] || 'Sync encountered errors', error: true });
      }
    } finally {
      setLwSyncing(false);
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
          message: `Parcel ${data.parcel?.trackingNumber || manualForm.trackingNumber} registered successfully.`,
        });
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
      setManualResult({ success: false, message: 'Network error submitting parcel.' });
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
              Multi-Channel Ingestion &amp; Dispatch Sync
            </span>
            <HelpTooltip
              title="Linnworks & Manifest Ingestion"
              text="Ingest daily manifests from Linnworks, Amazon, Shopify, or Excel courier performance reports. All fields are dynamically mapped and preserved."
            />
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark">Linnworks &amp; Ingestion Hub</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Connect live Linnworks WMS API sync or upload universal .xlsx / .csv courier manifests with custom column mapping.
          </p>
        </div>

        <button
          onClick={() => setOpsDrawerOpen(true)}
          className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-cream/80 hover:bg-brand-paper text-brand-dark text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
          <span>Ingestion SOP Playbook</span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border pb-3">
        <button
          onClick={() => setActiveTab('MANIFEST_IMPORTER')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'MANIFEST_IMPORTER'
              ? 'bg-brand-dark text-brand-paper shadow-xs'
              : 'bg-white text-brand-dark border border-brand-border hover:bg-brand-cream'
          }`}
        >
          <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'MANIFEST_IMPORTER' ? 'text-brand-gold' : 'text-brand-muted'}`} />
          <span>Universal Manifest Importer &amp; Column Mapper</span>
        </button>

        <button
          onClick={() => setActiveTab('LINNWORKS_SYNC')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'LINNWORKS_SYNC'
              ? 'bg-brand-dark text-brand-paper shadow-xs'
              : 'bg-white text-brand-dark border border-brand-border hover:bg-brand-cream'
          }`}
        >
          <Cpu className={`w-3.5 h-3.5 ${activeTab === 'LINNWORKS_SYNC' ? 'text-brand-gold' : 'text-brand-muted'}`} />
          <span>Linnworks Direct API Cloud Sync</span>
          {lwState?.isConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('MANUAL_ENTRY')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'MANUAL_ENTRY'
              ? 'bg-brand-dark text-brand-paper shadow-xs'
              : 'bg-white text-brand-dark border border-brand-border hover:bg-brand-cream'
          }`}
        >
          <Plus className={`w-3.5 h-3.5 ${activeTab === 'MANUAL_ENTRY' ? 'text-brand-gold' : 'text-brand-muted'}`} />
          <span>Single Parcel Manual Record</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: UNIVERSAL MANIFEST IMPORTER & COLUMN MAPPER            */}
      {/* ============================================================ */}
      {activeTab === 'MANIFEST_IMPORTER' && (
        <div className="space-y-6">
          {/* Dropzone & Paste Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drag & Drop File Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-brand-gold bg-brand-cream'
                  : 'border-brand-border bg-white hover:bg-brand-cream/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center text-brand-gold mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-brand-dark">
                {fileName ? `File Selected: ${fileName}` : 'Drop Linnworks Manifest or Courier Excel Report'}
              </div>
              <div className="text-[11px] text-brand-muted mt-1">
                Supports Multi-Sheet <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>, or <code>.tsv</code> (up to 50,000 rows)
              </div>
            </div>

            {/* Direct Paste Area */}
            <div className="p-4 bg-white border border-brand-border rounded-lg flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-brand-dark flex items-center gap-1.5">
                  <ClipboardPaste className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Or Paste Spreadsheet Rows Directly:</span>
                </label>
                {csvText && (
                  <button
                    onClick={() => {
                      setCsvText('');
                      setFileName('');
                      setParsedHeaders([]);
                      setParsedRows([]);
                    }}
                    className="text-[11px] text-brand-muted hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={csvText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="Paste tab-delimited cells from Excel or raw CSV text here..."
                rows={4}
                className="w-full flex-1 p-2.5 border border-brand-border rounded font-mono text-[11px] focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          {/* Multi-Sheet Workbook Selector */}
          {workbookSheets.length > 1 && (
            <div className="p-3 bg-brand-cream rounded-lg border border-brand-border flex items-center gap-3">
              <span className="text-xs font-semibold text-brand-dark flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-gold" /> Excel Workbook Sheets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {workbookSheets.map((sheet) => (
                  <button
                    key={sheet}
                    type="button"
                    onClick={() => handleSheetSelect(sheet)}
                    className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                      selectedSheet === sheet
                        ? 'bg-brand-dark text-brand-paper shadow-2xs'
                        : 'bg-white text-brand-dark border border-brand-border hover:bg-brand-paper'
                    }`}
                  >
                    {sheet}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Column Mapping Studio */}
          {parsedHeaders.length > 0 && (
            <div className="bg-white border border-brand-border rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-brand-dark flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-brand-gold" />
                      <span>Interactive Column Mapping Studio</span>
                    </h3>
                    <HelpTooltip
                      title="Column Mapping Studio"
                      text="Review how columns in your file match our system fields. You can reassign any mapping. Columns not mapped will still be preserved as custom fields."
                    />
                  </div>
                  <div className="text-[11px] text-brand-muted mt-0.5">
                    Detected {parsedHeaders.length} columns in source manifest. Match them to our courier radar schema:
                  </div>
                </div>

                {/* Preset Switcher Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-brand-muted">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset('LINNWORKS')}
                    className="px-2.5 py-1 rounded bg-brand-cream hover:bg-brand-paper border border-brand-border text-[11px] font-semibold text-brand-dark"
                  >
                    Linnworks Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('COURIER_REPORT')}
                    className="px-2.5 py-1 rounded bg-brand-cream hover:bg-brand-paper border border-brand-border text-[11px] font-semibold text-brand-dark"
                  >
                    Courier Report
                  </button>
                </div>
              </div>

              {/* Mapping Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {TARGET_SYSTEM_FIELDS.map((target) => {
                  const mappedHeader = columnMapping[target.key] || '';
                  const isMapped = Boolean(mappedHeader);

                  return (
                    <div
                      key={target.key}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        isMapped
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : target.required
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-brand-border bg-brand-paper/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-brand-dark flex items-center gap-1 truncate text-[11px]">
                          <span>{target.label}</span>
                          <HelpTooltip title={target.label} text={target.tooltip} />
                        </span>
                        {isMapped && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>

                      <select
                        value={mappedHeader}
                        onChange={(e) => {
                          setColumnMapping({
                            ...columnMapping,
                            [target.key]: e.target.value,
                          });
                        }}
                        className="w-full p-1.5 border border-brand-border rounded bg-white text-[11px] font-mono focus:outline-none focus:border-brand-gold"
                      >
                        <option value="">[ Not Mapped / Skip ]</option>
                        {parsedHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2 pt-2">
                <div className="font-semibold text-xs text-brand-dark flex items-center justify-between">
                  <span>Sample Data Preview (First {parsedRows.length} rows):</span>
                  <span className="text-[11px] text-brand-muted font-normal">
                    Ready to ingest into Courier Radar &amp; Claims Engine
                  </span>
                </div>

                <div className="overflow-x-auto border border-brand-border rounded bg-white max-h-48 overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-brand-cream/80 text-brand-dark font-semibold border-b border-brand-border sticky top-0">
                      <tr>
                        {parsedHeaders.map((h) => {
                          const mappedTo = Object.keys(columnMapping).find((k) => columnMapping[k] === h);
                          return (
                            <th key={h} className="py-2 px-3 whitespace-nowrap">
                              <div>{h}</div>
                              {mappedTo && (
                                <div className="text-[9px] text-emerald-700 font-mono font-normal">
                                  → {mappedTo}
                                </div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60 text-brand-muted font-mono">
                      {parsedRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-brand-paper/50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap max-w-[200px] truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Run Import Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                <div className="text-xs text-brand-muted">
                  {columnMapping.trackingNumber ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready: Waybill Tracking Number mapped to{' '}
                      <code>{columnMapping.trackingNumber}</code>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Please map the Waybill Tracking Number to proceed.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || !columnMapping.trackingNumber}
                  className="px-6 py-2.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-brand-gold ${importing ? 'animate-spin' : ''}`} />
                  {importing ? 'Ingesting Manifest Data...' : 'Run Manifest Ingestion & Auto-Audit'}
                </button>
              </div>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Manifest Ingestion Completed Successfully!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="text-[10px] text-emerald-600 font-medium uppercase">Total Rows Read</div>
                  <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">{importResult.totalRows}</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="text-[10px] text-emerald-600 font-medium uppercase">New Parcels Registered</div>
                  <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">{importResult.insertedCount}</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="text-[10px] text-emerald-600 font-medium uppercase">Records Updated</div>
                  <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">{importResult.updatedCount}</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="text-[10px] text-emerald-600 font-medium uppercase">Custom Fields Preserved</div>
                  <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">{importResult.newCustomFieldsCreated.length}</div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <a
                  href="/app/dashboard"
                  className="px-4 py-1.5 rounded bg-brand-dark text-brand-paper font-semibold inline-flex items-center gap-1.5 hover:bg-brand-ink shadow-2xs"
                >
                  <span>View Live in Courier Performance Radar</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-gold" />
                </a>
              </div>
            </div>
          )}

          {importError && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: LINNWORKS DIRECT API CLOUD SYNC                        */}
      {/* ============================================================ */}
      {activeTab === 'LINNWORKS_SYNC' && (
        <div className="space-y-6">
          {/* Connection Status Card */}
          <div className="p-5 bg-white border border-brand-border rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-dark flex items-center justify-center text-brand-gold shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-brand-dark">Linnworks Cloud API Status</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      lwState?.isConnected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {lwState?.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                <div className="text-xs text-brand-muted mt-0.5 font-mono">
                  Endpoint: {lwState?.serverUrl || 'https://api.linnworks.net'} • Synced Parcels: {lwState?.ordersSyncedCount || 0}
                </div>
              </div>
            </div>

            {/* 1-Click Sync Trigger Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLinnworksSync(false)}
                disabled={lwSyncing}
                className="px-3.5 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-brand-gold ${lwSyncing ? 'animate-spin' : ''}`} />
                {lwSyncing ? 'Syncing...' : 'Sync Recent Orders (24h)'}
              </button>

              <button
                type="button"
                onClick={() => handleLinnworksSync(true)}
                disabled={lwSyncing}
                className="px-3.5 py-2 rounded border border-brand-border bg-white hover:bg-brand-paper text-brand-dark text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Historical 30-day audit backfill"
              >
                <span>Full Backfill (30 Days)</span>
              </button>
            </div>
          </div>

          {lwMsg && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 shadow-xs ${
                lwMsg.error
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              {lwMsg.error ? <AlertCircle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span>{lwMsg.text}</span>
            </div>
          )}

          {/* Credentials Setup Form */}
          <form
            onSubmit={handleLinnworksConnect}
            className="p-5 bg-white border border-brand-border rounded-lg shadow-xs space-y-4 text-xs"
          >
            <div className="border-b border-brand-border pb-3">
              <h4 className="font-semibold text-brand-dark text-sm flex items-center gap-1.5">
                <Server className="w-4 h-4 text-brand-gold" />
                <span>Linnworks API Application Credentials</span>
                <HelpTooltip
                  title="Linnworks API Credentials"
                  text="Found in your Linnworks account under Settings → General Settings → API Tokens. Allows automated fetching of daily processed orders."
                />
              </h4>
              <p className="text-[11px] text-brand-muted mt-0.5">
                Configure your Linnworks API Token to automatically poll processed orders, carrier tracking barcodes, and customer consignment values.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-brand-dark font-semibold mb-1">Application ID *</label>
                <input
                  type="text"
                  required
                  value={lwForm.applicationId}
                  onChange={(e) => setLwForm({ ...lwForm, applicationId: e.target.value })}
                  className="w-full p-2 border border-brand-border rounded font-mono text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-brand-dark font-semibold mb-1">Application Secret *</label>
                <input
                  type="password"
                  required
                  value={lwForm.applicationSecret}
                  onChange={(e) => setLwForm({ ...lwForm, applicationSecret: e.target.value })}
                  className="w-full p-2 border border-brand-border rounded font-mono text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-brand-dark font-semibold mb-1">Authorization Token *</label>
                <input
                  type="password"
                  required
                  value={lwForm.authorizationToken}
                  onChange={(e) => setLwForm({ ...lwForm, authorizationToken: e.target.value })}
                  className="w-full p-2 border border-brand-border rounded font-mono text-xs focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={lwConnecting}
                className="px-5 py-2 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper font-semibold shadow-xs flex items-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-brand-gold" />
                {lwConnecting ? 'Validating Connection...' : 'Save & Authorize Linnworks Connection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SINGLE PARCEL MANUAL RECORD                            */}
      {/* ============================================================ */}
      {activeTab === 'MANUAL_ENTRY' && (
        <div className="bg-white border border-brand-border rounded-lg p-5 shadow-xs space-y-4 text-xs">
          <div className="border-b border-brand-border pb-3">
            <h3 className="font-serif font-bold text-base text-brand-dark flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-gold" />
              <span>Record Single Parcel / Off-Manifest Consignment</span>
            </h3>
            <p className="text-[11px] text-brand-muted mt-0.5">
              Manually register an individual consignment directly into the tracking audit radar and claims workflow.
            </p>
          </div>

          {manualResult && (
            <div
              className={`p-3 rounded border text-xs flex items-center gap-2 ${
                manualResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              {manualResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{manualResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-brand-dark mb-1">Tracking Number *</label>
              <input
                type="text"
                required
                value={manualForm.trackingNumber}
                onChange={(e) => setManualForm({ ...manualForm, trackingNumber: e.target.value })}
                placeholder="e.g. 1Z9999999999999999"
                className="w-full p-2 border border-brand-border rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-dark mb-1">Order Number *</label>
              <input
                type="text"
                required
                value={manualForm.orderNumber}
                onChange={(e) => setManualForm({ ...manualForm, orderNumber: e.target.value })}
                placeholder="e.g. ORD-99201"
                className="w-full p-2 border border-brand-border rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-dark mb-1">Courier Carrier</label>
              <select
                value={manualForm.carrierId}
                onChange={(e) => setManualForm({ ...manualForm, carrierId: e.target.value })}
                className="w-full p-2 border border-brand-border rounded bg-white"
              >
                <option value="">Auto-Detect from Tracking</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-brand-dark mb-1">Recipient Name</label>
              <input
                type="text"
                value={manualForm.recipientName}
                onChange={(e) => setManualForm({ ...manualForm, recipientName: e.target.value })}
                placeholder="Consignee Full Name"
                className="w-full p-2 border border-brand-border rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-dark mb-1">Declared Value (Retail)</label>
              <input
                type="number"
                step="0.01"
                value={manualForm.declaredValue}
                onChange={(e) => setManualForm({ ...manualForm, declaredValue: e.target.value })}
                placeholder="e.g. 120.00"
                className="w-full p-2 border border-brand-border rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-brand-dark mb-1">Postage Paid (Shipping Cost)</label>
              <input
                type="number"
                step="0.01"
                value={manualForm.shippingCost}
                onChange={(e) => setManualForm({ ...manualForm, shippingCost: e.target.value })}
                placeholder="e.g. 15.00"
                className="w-full p-2 border border-brand-border rounded font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={manualSubmitting || !manualForm.trackingNumber || !manualForm.orderNumber}
              className="px-5 py-2.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper font-semibold shadow-xs"
            >
              {manualSubmitting ? 'Registering Parcel...' : 'Register Consignment in Radar'}
            </button>
          </div>
        </div>
      )}

      {/* Persistent Operations Playbook Drawer */}
      <OperationsGuideDrawer isOpen={opsDrawerOpen} onClose={() => setOpsDrawerOpen(false)} />
    </div>
  );
}
