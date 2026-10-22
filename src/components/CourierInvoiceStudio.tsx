'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Building2,
  Mail,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Sparkles,
} from 'lucide-react';
import HelpTooltip from '@/components/HelpTooltip';

interface CarrierRecord {
  id: string;
  name: string;
  code: string;
  contractedParty?: string;
  claimRecipientEmail?: string;
  enquiryRecipientEmail?: string;
  claimPricingRule?: string;
  claimIndemnityCap?: number | null;
  claimIncludePostage?: boolean;
  claimIncludeVat?: boolean;
  claimStatutoryLossDays?: number;
  claimFilingDeadlineDays?: number;
  claimInvoiceFormat?: string;
  claimCustomDisclaimer?: string | null;
  claimCustomFieldsTemplate?: string | null;
}

const DEFAULT_DISCLAIMER =
  'NOT AN ORIGINAL COMMERCIAL SALES INVOICE. This formal statement of loss, damage, and indemnity is prepared exclusively for carrier freight reimbursement, insurance adjudication, and contractual settlement under governing carriage terms.';

export default function CourierInvoiceStudio() {
  const [carriers, setCarriers] = useState<CarrierRecord[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form states for the selected carrier's invoice format
  const [invoiceFormat, setInvoiceFormat] = useState('ROYAL_MAIL_P58');
  const [pricingRule, setPricingRule] = useState('WHOLESALE_COST');
  const [indemnityCap, setIndemnityCap] = useState<number | ''>('');
  const [includePostage, setIncludePostage] = useState(true);
  const [includeVat, setIncludeVat] = useState(false);
  const [statutoryLossDays, setStatutoryLossDays] = useState(7);
  const [filingDeadlineDays, setFilingDeadlineDays] = useState(28);
  const [claimRecipientEmail, setClaimRecipientEmail] = useState('');
  const [shipperAccountNo, setShipperAccountNo] = useState('');
  const [claimantName, setClaimantName] = useState('Mett Global Logistics UK Ltd');
  const [claimantAddress, setClaimantAddress] = useState('Operations Hub, Unit 4 Logistics Park\nManchester, M17 1TN, United Kingdom');
  const [claimantTaxId, setClaimantTaxId] = useState('GB 921 445 012');
  const [signatoryName, setSignatoryName] = useState('Head of Carrier Claims & Freight Audit');
  const [disclaimerText, setDisclaimerText] = useState(DEFAULT_DISCLAIMER);
  const [customFields, setCustomFields] = useState<{ key: string; label: string; defaultValue: string }[]>([]);

  // Load carriers on mount
  useEffect(() => {
    async function fetchCarriers() {
      try {
        setLoading(true);
        const res = await fetch('/api/carriers');
        const data = await res.json();
        const list: CarrierRecord[] = data.connectedCarriers || [];
        setCarriers(list);
        if (list.length > 0) {
          selectCarrier(list[0]);
        }
      } catch (err) {
        console.error('Failed to load carriers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCarriers();
  }, []);

  const selectCarrier = (carrier: CarrierRecord) => {
    setSelectedCarrierId(carrier.id);
    setInvoiceFormat(carrier.claimInvoiceFormat || getDefaultFormatForCarrier(carrier.code));
    setPricingRule(carrier.claimPricingRule || getDefaultPricingRuleForCarrier(carrier.code));
    setIndemnityCap(carrier.claimIndemnityCap ?? getDefaultCapForCarrier(carrier.code));
    setIncludePostage(carrier.claimIncludePostage ?? true);
    setIncludeVat(carrier.claimIncludeVat ?? false);
    setStatutoryLossDays(carrier.claimStatutoryLossDays ?? 7);
    setFilingDeadlineDays(carrier.claimFilingDeadlineDays ?? 28);
    setClaimRecipientEmail(carrier.claimRecipientEmail || `claims@${carrier.code.toLowerCase()}-support.example.com`);
    setShipperAccountNo(carrier.contractedParty || `ACCT-${carrier.code}-7701`);
    setDisclaimerText(carrier.claimCustomDisclaimer || DEFAULT_DISCLAIMER);

    // Parse custom fields if present
    try {
      if (carrier.claimCustomFieldsTemplate) {
        const parsed = JSON.parse(carrier.claimCustomFieldsTemplate);
        if (Array.isArray(parsed)) {
          setCustomFields(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }
    setCustomFields(getDefaultCustomFieldsForCarrier(carrier.code));
  };

  const getDefaultFormatForCarrier = (code: string) => {
    const c = code.toUpperCase();
    if (c.includes('ROYAL') || c.includes('RM')) return 'ROYAL_MAIL_P58';
    if (c.includes('EVRI') || c.includes('HERMES')) return 'EVRI_INDEMNITY';
    if (c.includes('DPD')) return 'DPD_STANDARD';
    if (c.includes('YODEL')) return 'YODEL_LOSS';
    if (c.includes('UPS')) return 'UPS_COMMERCIAL';
    if (c.includes('FEDEX')) return 'FEDEX_FORMAL';
    if (c.includes('DHL')) return 'DHL_EXPRESS';
    if (c.includes('GLS') || c.includes('PARCELFORCE')) return 'GLS_EUROPE';
    return 'GENERIC';
  };

  const getDefaultPricingRuleForCarrier = (code: string) => {
    const c = code.toUpperCase();
    if (c.includes('ROYAL') || c.includes('RM')) return 'WHOLESALE_COST';
    if (c.includes('EVRI') || c.includes('YODEL')) return 'CAPPED_INDEMNITY';
    return 'RETAIL_EX_VAT';
  };

  const getDefaultCapForCarrier = (code: string): number | '' => {
    const c = code.toUpperCase();
    if (c.includes('EVRI')) return 20;
    if (c.includes('YODEL')) return 50;
    if (c.includes('DPD')) return 100;
    return '';
  };

  const getDefaultCustomFieldsForCarrier = (code: string) => {
    const c = code.toUpperCase();
    if (c.includes('ROYAL') || c.includes('RM')) {
      return [
        { key: 'royal_mail_oba_no', label: 'Online Business Account (OBA) No', defaultValue: 'OBA-992104' },
        { key: 'claim_statutory_form', label: 'Statutory Claim Docket Form', defaultValue: 'P58 Loss of Inward Item' },
        { key: 'valuation_basis', label: 'Mandatory Valuation Basis', defaultValue: 'Wholesale Manufacturing / Purchase Cost' },
      ];
    }
    if (c.includes('EVRI')) {
      return [
        { key: 'evri_client_ref', label: 'Evri Client Contract Code', defaultValue: 'EVR-METT-UK' },
        { key: 'indemnity_tier', label: 'Contract Indemnity Ceiling', defaultValue: '£20.00 Standard Loss Cap' },
      ];
    }
    if (c.includes('DPD')) {
      return [
        { key: 'dpd_account_no', label: 'DPD Franchise Account No', defaultValue: 'DPD-ACC-7811' },
        { key: 'dor_declaration_status', label: 'Denial of Receipt (DOR) Status', defaultValue: 'Customer Signature Form Attached' },
      ];
    }
    return [
      { key: 'shipper_reference', label: 'Consignment Master Ref', defaultValue: 'REF-METT-99' },
      { key: 'investigation_notes', label: 'Carrier Depot Investigation Ref', defaultValue: 'Depot Non-Scan Confirmed' },
    ];
  };

  const handleCarrierChange = (carrierId: string) => {
    const c = carriers.find((item) => item.id === carrierId);
    if (c) selectCarrier(c);
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      { key: `custom_field_${customFields.length + 1}`, label: 'New Field Label', defaultValue: '' },
    ]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleUpdateCustomField = (index: number, keyOrLabel: 'key' | 'label' | 'defaultValue', val: string) => {
    const updated = [...customFields];
    updated[index][keyOrLabel] = val;
    setCustomFields(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarrierId) return;

    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch('/api/carriers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCarrierId,
          claimInvoiceFormat: invoiceFormat,
          claimPricingRule: pricingRule,
          claimIndemnityCap: indemnityCap === '' ? null : Number(indemnityCap),
          claimIncludePostage: includePostage,
          claimIncludeVat: includeVat,
          claimStatutoryLossDays: Number(statutoryLossDays),
          claimFilingDeadlineDays: Number(filingDeadlineDays),
          claimRecipientEmail: claimRecipientEmail.trim(),
          contractedParty: shipperAccountNo.trim(),
          claimCustomDisclaimer: disclaimerText.trim(),
          claimCustomFieldsTemplate: JSON.stringify(customFields),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save courier invoice format');
      }

      setSaveSuccess(`Successfully updated claim invoice format for ${selectedCarrier?.name || 'carrier'}. All new claims will use this template.`);
      // Update local carrier list
      setCarriers(
        carriers.map((c) => (c.id === selectedCarrierId ? { ...c, ...data.carrier } : c))
      );
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedCarrier = carriers.find((c) => c.id === selectedCarrierId);

  // Sample calculated values for Live Document Preview
  const sampleGrossRetail = 58.0;
  const sampleWholesaleCost = 24.5;
  const samplePostagePaid = 5.5;

  let sampleMerchandiseVal = sampleGrossRetail;
  if (pricingRule === 'WHOLESALE_COST') {
    sampleMerchandiseVal = sampleWholesaleCost;
  } else if (pricingRule === 'RETAIL_EX_VAT') {
    sampleMerchandiseVal = Math.round((sampleGrossRetail / 1.2) * 100) / 100;
  } else if (pricingRule === 'CAPPED_INDEMNITY') {
    const capNum = typeof indemnityCap === 'number' ? indemnityCap : 20;
    sampleMerchandiseVal = Math.min(sampleGrossRetail, capNum);
  }

  const sampleTotalClaimed =
    sampleMerchandiseVal + (includePostage ? samplePostagePaid : 0);

  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case 'ROYAL_MAIL_P58':
        return { label: 'ROYAL MAIL P58 STATUTORY LOSS CLAIM', bg: 'bg-rose-900 text-rose-100', border: 'border-rose-900' };
      case 'EVRI_INDEMNITY':
        return { label: 'EVRI CONTRACTUAL CAPPED INDEMNITY', bg: 'bg-sky-800 text-sky-100', border: 'border-sky-800' };
      case 'DPD_STANDARD':
        return { label: 'DPD NET RETAIL EX-VAT LOSS DECLARATION', bg: 'bg-red-800 text-red-100', border: 'border-red-800' };
      case 'YODEL_LOSS':
        return { label: 'YODEL LOSS INVESTIGATION & INDEMNITY', bg: 'bg-emerald-800 text-emerald-100', border: 'border-emerald-800' };
      case 'UPS_COMMERCIAL':
        return { label: 'UPS COMMERCIAL CARGO CLAIM FORM', bg: 'bg-amber-900 text-amber-100', border: 'border-amber-900' };
      case 'FEDEX_FORMAL':
        return { label: 'FEDEX FORMAL CARGO LOSS STATEMENT', bg: 'bg-purple-900 text-purple-100', border: 'border-purple-900' };
      case 'DHL_EXPRESS':
        return { label: 'DHL EXPRESS CARGO CLAIM DOSSIER', bg: 'bg-yellow-700 text-yellow-100', border: 'border-yellow-700' };
      default:
        return { label: 'UNIVERSAL CARRIER FREIGHT LOSS INVOICE', bg: 'bg-neutral-800 text-neutral-100', border: 'border-neutral-800' };
    }
  };

  const badge = getFormatBadge(invoiceFormat);

  return (
    <div className="space-y-6">
      {/* Top Banner with Carrier Selector & Quick Actions */}
      <div className="bg-white rounded-lg border border-brand-border p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
              Interactive Document Template Studio
            </span>
            <HelpTooltip
              title="Courier Invoice Format Studio"
              text="Every courier requires their own specific loss invoice layout, valuation rules (e.g. Royal Mail requires wholesale cost; Evri enforces a £20 cap), and legal disclaimers. Customize and test them here."
            />
          </div>
          <h2 className="text-xl font-serif font-bold text-brand-dark mt-0.5">
            Courier Claim Invoice Designer
          </h2>
          <p className="text-xs text-brand-muted">
            Configure per-carrier layout structures, valuation pricing schedules, legal indemnity disclaimers, and verify with live side-by-side previews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-brand-dark whitespace-nowrap">
            Select Courier:
          </label>
          <select
            value={selectedCarrierId}
            onChange={(e) => handleCarrierChange(e.target.value)}
            disabled={loading}
            className="p-2 border border-brand-border rounded bg-white text-xs font-semibold text-brand-dark focus:outline-none focus:border-brand-gold min-w-[200px]"
          >
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs font-medium flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Two-Column Responsive Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Controls (5 cols) */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-5 bg-white border border-brand-border rounded-lg p-5 shadow-xs space-y-5 text-xs"
        >
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="font-serif font-bold text-sm text-brand-dark flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-gold" />
              <span>Format Settings: {selectedCarrier?.name}</span>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-1.5 bg-brand-dark hover:bg-brand-ink text-brand-paper rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-brand-gold" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>

          {/* Section 1: Template Layout Preset */}
          <div className="space-y-3">
            <div className="font-semibold text-brand-dark flex items-center gap-1">
              <span>1. Layout Standard & Header Badge</span>
              <HelpTooltip
                title="Carrier Standard Format"
                text="Controls the statutory title and legal docket header printed on top of the document. Royal Mail requires P58; Evri uses Contractual Indemnity; DPD uses Loss Declaration."
              />
            </div>
            <select
              value={invoiceFormat}
              onChange={(e) => setInvoiceFormat(e.target.value)}
              className="w-full p-2 border border-brand-border rounded bg-white text-xs font-medium"
            >
              <option value="ROYAL_MAIL_P58">Royal Mail P58 Statutory Loss Claim</option>
              <option value="EVRI_INDEMNITY">Evri Corporate Capped Indemnity</option>
              <option value="DPD_STANDARD">DPD Net Retail Ex-VAT Declaration</option>
              <option value="YODEL_LOSS">Yodel Loss Investigation & Indemnity</option>
              <option value="UPS_COMMERCIAL">UPS Commercial Cargo Claim Form</option>
              <option value="FEDEX_FORMAL">FedEx Formal Cargo Loss Statement</option>
              <option value="DHL_EXPRESS">DHL Express Cargo Reimbursement AWB</option>
              <option value="GLS_EUROPE">GLS European Schadensanzeige</option>
              <option value="GENERIC">Universal Freight Claim Statement</option>
            </select>
          </div>

          {/* Section 2: Valuation Pricing & Indemnity Rules */}
          <div className="space-y-3 pt-2 border-t border-brand-border/60">
            <div className="font-semibold text-brand-dark flex items-center gap-1">
              <span>2. Valuation & Indemnity Math</span>
              <HelpTooltip
                title="Valuation Pricing Rule"
                text="Critical: Royal Mail P58 will REJECT claims filed with retail prices or VAT included; RM strictly requires wholesale cost price. Evri enforces a £20 contractual cap. DPD accepts retail ex-VAT."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                  Valuation Basis:
                </label>
                <select
                  value={pricingRule}
                  onChange={(e) => setPricingRule(e.target.value)}
                  className="w-full p-2 border border-brand-border rounded bg-white font-medium"
                >
                  <option value="WHOLESALE_COST">Wholesale Cost (Royal Mail P58)</option>
                  <option value="RETAIL_EX_VAT">Retail Net Ex-VAT (DPD / Standard)</option>
                  <option value="CAPPED_INDEMNITY">Capped Contract Ceiling (Evri/Yodel)</option>
                  <option value="RETAIL_INC_VAT">Retail Gross Inc-VAT</option>
                </select>
              </div>

              <div>
                <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                  Indemnity Cap (£/$/€):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 20.00"
                  value={indemnityCap}
                  onChange={(e) => setIndemnityCap(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full p-2 border border-brand-border rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-brand-paper/50 border border-brand-border">
                <input
                  type="checkbox"
                  checked={includePostage}
                  onChange={(e) => setIncludePostage(e.target.checked)}
                  className="rounded text-brand-gold focus:ring-brand-gold"
                />
                <span className="text-[11px] font-medium text-brand-dark">Include Postage Refund</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-brand-paper/50 border border-brand-border">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="rounded text-brand-gold focus:ring-brand-gold"
                />
                <span className="text-[11px] font-medium text-brand-dark">Include Sales Tax / VAT</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                  Statutory Loss (Days):
                </label>
                <input
                  type="number"
                  min="1"
                  value={statutoryLossDays}
                  onChange={(e) => setStatutoryLossDays(parseInt(e.target.value) || 7)}
                  className="w-full p-2 border border-brand-border rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                  Filing Deadline (Days):
                </label>
                <input
                  type="number"
                  min="1"
                  value={filingDeadlineDays}
                  onChange={(e) => setFilingDeadlineDays(parseInt(e.target.value) || 28)}
                  className="w-full p-2 border border-brand-border rounded font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Claimant & Shipper Profile */}
          <div className="space-y-3 pt-2 border-t border-brand-border/60">
            <div className="font-semibold text-brand-dark flex items-center gap-1">
              <span>3. Claimant (Shipper) Identification</span>
              <HelpTooltip
                title="Claimant Shipper Information"
                text="The company name, hub address, and tax registration number printed on the claim invoice as the payee."
              />
            </div>

            <div>
              <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                Shipper Legal Entity Name:
              </label>
              <input
                type="text"
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                className="w-full p-2 border border-brand-border rounded font-medium"
              />
            </div>

            <div>
              <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                Fulfillment Hub / Dispatch Depot Address:
              </label>
              <textarea
                rows={2}
                value={claimantAddress}
                onChange={(e) => setClaimantAddress(e.target.value)}
                className="w-full p-2 border border-brand-border rounded text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                  Tax / VAT Registration:
                </label>
                <input
                  type="text"
                  value={claimantTaxId}
                  onChange={(e) => setClaimantTaxId(e.target.value)}
                  className="w-full p-2 border border-brand-border rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                  Authorized Signatory Title:
                </label>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full p-2 border border-brand-border rounded"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Courier Department Remittance */}
          <div className="space-y-3 pt-2 border-t border-brand-border/60">
            <div className="font-semibold text-brand-dark flex items-center gap-1">
              <span>4. Courier Claims Department Routing</span>
              <HelpTooltip
                title="Courier Claims Routing"
                text="Where automated claims dossiers are dispatched and the corporate master account under which claims are paid."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                  Courier Claims Email:
                </label>
                <input
                  type="email"
                  value={claimRecipientEmail}
                  onChange={(e) => setClaimRecipientEmail(e.target.value)}
                  className="w-full p-2 border border-brand-border rounded font-mono"
                />
              </div>

              <div>
                <label className="block text-brand-muted text-[11px] mb-1 font-medium">
                  Shipper / OBA Account No:
                </label>
                <input
                  type="text"
                  value={shipperAccountNo}
                  onChange={(e) => setShipperAccountNo(e.target.value)}
                  className="w-full p-2 border border-brand-border rounded font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Custom Courier Fields */}
          <div className="space-y-3 pt-2 border-t border-brand-border/60">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-brand-dark flex items-center gap-1">
                <span>5. Courier-Specific Custom Fields</span>
                <HelpTooltip
                  title="Carrier Custom Fields"
                  text="Special parameters required by particular couriers (e.g. Royal Mail OBA reference, DPD denial of receipt confirmation, customs commodity codes)."
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="text-[11px] font-semibold text-brand-gold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Field
              </button>
            </div>

            <div className="space-y-2">
              {customFields.map((cf, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Field Key"
                    value={cf.key}
                    onChange={(e) => handleUpdateCustomField(idx, 'key', e.target.value)}
                    className="w-1/3 p-1.5 border border-brand-border rounded font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Label / Value"
                    value={cf.defaultValue}
                    onChange={(e) => handleUpdateCustomField(idx, 'defaultValue', e.target.value)}
                    className="w-2/3 p-1.5 border border-brand-border rounded text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Statutory Legal Notice & Disclaimer */}
          <div className="space-y-2 pt-2 border-t border-brand-border/60">
            <div className="font-semibold text-brand-dark flex items-center gap-1">
              <span>6. Statutory Loss & Legal Disclaimer</span>
              <HelpTooltip
                title="Statutory Legal Notice"
                text="This text protects your business from being accused of fraudulent double billing by couriers or tax authorities by certifying that this is a formal loss indemnity statement, not a commercial sales invoice."
              />
            </div>
            <textarea
              rows={3}
              value={disclaimerText}
              onChange={(e) => setDisclaimerText(e.target.value)}
              className="w-full p-2 border border-brand-border rounded text-[11px] leading-relaxed font-sans"
            />
          </div>

          <div className="pt-3 border-t border-brand-border flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand-dark hover:bg-brand-ink text-brand-paper rounded font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 text-brand-gold" />
              {saving ? 'Saving Changes...' : `Save Format for ${selectedCarrier?.name || 'Courier'}`}
            </button>
          </div>
        </form>

        {/* Right Column: Live Interactive Document Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3 sticky top-4">
          <div className="flex items-center justify-between bg-brand-cream/80 border border-brand-border px-4 py-2.5 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-dark">
              <Eye className="w-4 h-4 text-brand-gold" />
              <span>Real-Time Printable A4 Document Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-brand-muted">Updates as you edit</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1 rounded bg-white border border-brand-border text-brand-dark text-[11px] font-semibold flex items-center gap-1 hover:bg-brand-paper shadow-2xs"
              >
                <Printer className="w-3 h-3 text-brand-gold" /> Print Test
              </button>
            </div>
          </div>

          {/* Rendered Live Invoice Canvas */}
          <div className="bg-white border-2 border-neutral-300 rounded-lg shadow-md p-6 sm:p-8 font-sans text-neutral-900 text-xs">
            {/* Disclaimer Banner */}
            <div className="mb-4 p-3 bg-neutral-900 text-white rounded border-l-4 border-amber-500 text-[10px] leading-relaxed">
              <div className="font-bold tracking-wide uppercase text-amber-400 mb-0.5 flex items-center gap-1">
                <span>⚠ Statutory Legal Notice &amp; Loss Disclaimer</span>
              </div>
              <div className="text-neutral-300">{disclaimerText}</div>
            </div>

            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-neutral-900 pb-4 mb-4 gap-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase mb-1.5 ${badge.bg}`}>
                  {badge.label}
                </span>
                <h3 className="text-xl font-serif font-black tracking-tight text-neutral-900">
                  CARRIER CLAIM LOSS INVOICE
                </h3>
                <div className="text-[11px] text-neutral-600 mt-0.5">
                  Document No: <strong className="font-mono text-neutral-900">INV-CLM-{selectedCarrier?.code || 'RM'}-992014</strong>
                </div>
                <div className="text-[10px] text-neutral-500">
                  Issue Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div className="text-left sm:text-right font-mono">
                <div className="inline-block bg-neutral-900 text-white px-3 py-1.5 rounded text-center mb-1">
                  <div className="text-[8px] tracking-widest text-neutral-400">WAYBILL TRACKING BARCODE</div>
                  <div className="text-xs font-black tracking-widest">|| | | ||| || ||| | ||| ||</div>
                  <div className="text-[9px] text-amber-400 font-bold">GB992018821RM</div>
                </div>
                <div className="text-[10px] text-neutral-500">
                  Carrier Code: <strong className="text-neutral-900">{selectedCarrier?.code || 'RM'}</strong>
                </div>
              </div>
            </div>

            {/* Addresses Box */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] p-3 bg-neutral-50 rounded border border-neutral-200">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Claimant / Indemnity Beneficiary:
                </div>
                <div className="font-bold text-neutral-900">{claimantName}</div>
                <div className="text-neutral-600 whitespace-pre-line text-[10px] leading-relaxed">
                  {claimantAddress}
                </div>
                {claimantTaxId && (
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                    VAT / Tax ID: <strong>{claimantTaxId}</strong>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Courier Claims Department:
                </div>
                <div className="font-bold text-neutral-900">{selectedCarrier?.name || 'Carrier'} Cargo Claims</div>
                <div className="text-[10px] text-neutral-600">
                  Routing: <span className="font-mono">{claimRecipientEmail || 'claims@courier.com'}</span>
                </div>
                <div className="text-[10px] text-neutral-600">
                  Contract Account: <strong className="font-mono">{shipperAccountNo || 'MASTER-ACC'}</strong>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  Statutory Rule: <strong>{pricingRule.replace(/_/g, ' ')}</strong>
                </div>
              </div>
            </div>

            {/* Consignment Schedule Table */}
            <div className="border border-neutral-300 rounded mb-4 overflow-hidden">
              <div className="bg-neutral-100 px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-neutral-700 border-b border-neutral-300">
                Itemized Freight Loss Schedule &amp; Valuation
              </div>
              <table className="w-full text-[11px] text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                  <tr>
                    <th className="py-2 px-3">Item / SKU</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Valuation Basis</th>
                    <th className="py-2 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-neutral-900">Contracted Consignment Merchandise</div>
                      <div className="text-[9px] text-neutral-500 font-mono">SKU-PRD-8821 • Lost in Transit</div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono">1</td>
                    <td className="py-2 px-2 text-right font-mono text-[10px]">
                      {pricingRule === 'WHOLESALE_COST' && 'Wholesale £24.50'}
                      {pricingRule === 'RETAIL_EX_VAT' && 'Net Ex-VAT £48.33'}
                      {pricingRule === 'CAPPED_INDEMNITY' && `Capped £${indemnityCap || 20}.00`}
                      {pricingRule === 'RETAIL_INC_VAT' && 'Gross Retail £58.00'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900">
                      £{sampleMerchandiseVal.toFixed(2)}
                    </td>
                  </tr>

                  {includePostage && (
                    <tr className="bg-neutral-50/50">
                      <td className="py-2 px-3">
                        <div className="font-medium text-neutral-800">Contracted Carriage / Freight Postage</div>
                        <div className="text-[9px] text-neutral-500">Service: Standard Tracked 48</div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono">1</td>
                      <td className="py-2 px-2 text-right font-mono text-[10px]">Carriage Fee</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900">
                        £{samplePostagePaid.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="p-3 bg-neutral-100 border-t border-neutral-300 flex justify-between items-center">
                <span className="font-bold text-neutral-800 uppercase text-[10px] tracking-wider">
                  Total Reimbursement Demanded:
                </span>
                <span className="text-base font-black font-mono text-neutral-900">
                  £{sampleTotalClaimed.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Custom Carrier Attributes */}
            {customFields.length > 0 && (
              <div className="mb-4 p-3 bg-neutral-50 rounded border border-neutral-200">
                <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Courier Statutory Verification Docket Data:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {customFields.map((cf, i) => (
                    <div key={i} className="flex justify-between border-b border-neutral-200/60 pb-0.5">
                      <span className="text-neutral-500">{cf.label || cf.key}:</span>
                      <strong className="font-mono text-neutral-800">{cf.defaultValue || 'VERIFIED'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Block */}
            <div className="pt-4 border-t border-neutral-300 flex justify-between items-end text-[10px]">
              <div>
                <div className="text-neutral-500">Authorized Officer:</div>
                <div className="font-serif italic font-bold text-neutral-800 text-xs mt-0.5">
                  {signatoryName}
                </div>
                <div className="text-neutral-400 text-[9px]">Digitally Certified Document • Mett Global Claims Engine</div>
              </div>

              <div className="text-right">
                <div className="inline-block border-b border-neutral-400 w-36 mb-1"></div>
                <div className="text-neutral-500 text-[9px]">Official Signature &amp; Corporate Seal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
