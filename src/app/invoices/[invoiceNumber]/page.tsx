import React from 'react';
import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { InvoiceLineItem, InvoiceEvidenceImage, getCurrencySymbol } from '@/lib/invoice-generator';
import PrintButton from './PrintButton';

interface PageProps {
  params: Promise<{ invoiceNumber: string }>;
}

export default async function InvoicePrintPage({ params }: PageProps) {
  const { invoiceNumber } = await params;

  const invoice = await db.claimInvoice.findUnique({
    where: { invoiceNumber },
    include: {
      organization: true,
      carrier: true,
      parcel: true,
      claim: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  let lineItems: InvoiceLineItem[] = [];
  try {
    lineItems = JSON.parse(invoice.lineItems || '[]');
  } catch {
    lineItems = [];
  }

  let customFields: Record<string, string | number> = {};
  try {
    customFields = JSON.parse(invoice.customFields || '{}');
  } catch {
    customFields = {};
  }

  let evidenceImages: InvoiceEvidenceImage[] = [];
  try {
    evidenceImages = JSON.parse(invoice.evidenceImages || '[]');
  } catch {
    evidenceImages = [];
  }

  const currSymbol = getCurrencySymbol(invoice.currency);

  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'UPS_STANDARD':
        return { label: 'UPS CARGO INDEMNITY FORM', color: 'bg-amber-900 text-amber-100' };
      case 'FEDEX_FORMAL':
        return { label: 'FEDEX FORMAL LOSS STATEMENT', color: 'bg-purple-900 text-purple-100' };
      case 'DHL_EXPRESS':
        return { label: 'DHL CARGO REIMBURSEMENT AWB', color: 'bg-yellow-700 text-yellow-100' };
      case 'GLS_EUROPE':
        return { label: 'GLS EUROPE SCHADENSANZEIGE', color: 'bg-blue-900 text-blue-100' };
      default:
        return { label: 'UNIVERSAL CARRIER CLAIM STATEMENT', color: 'bg-neutral-800 text-neutral-100' };
    }
  };

  const badge = getFormatBadge(invoice.carrierFormat);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 p-4 md:p-8 print:p-0 print:bg-white font-sans">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white border border-neutral-300 rounded-lg p-4 shadow-sm print:hidden">
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
            Official Courier Claim Document
          </div>
          <div className="text-lg font-bold font-mono text-neutral-900">
            {invoice.invoiceNumber}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/app/claims"
            className="px-3 py-1.5 rounded border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            ← Back to Claims
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Main Printable Document Canvas */}
      <div className="max-w-4xl mx-auto bg-white border border-neutral-300 rounded-lg shadow-md p-8 md:p-12 print:border-none print:shadow-none print:p-0">
        
        {/* Statutory Legal Disclaimer Banner (Mandatory for Courier Loss Invoices) */}
        <div className="mb-6 p-3.5 bg-neutral-900 text-white rounded border-l-4 border-amber-500 text-xs">
          <div className="font-bold tracking-wide flex items-center gap-2 text-amber-400 uppercase text-[11px] mb-1">
            <span>⚠ Statutory Legal Notice & Loss Disclaimer</span>
          </div>
          <div className="text-[11px] leading-relaxed text-neutral-200">
            {invoice.disclaimerText}
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6 gap-6">
          <div>
            <div className="inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase mb-2 font-mono ${badge.color}">
              {badge.label}
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-neutral-900">
              CARRIER CLAIM INVOICE
            </h1>
            <div className="text-xs text-neutral-600 mt-1">
              Document No: <span className="font-mono font-bold text-neutral-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="text-xs text-neutral-600">
              Issue Date: {new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {invoice.claim && (
              <div className="text-xs text-neutral-600">
                Claim Dossier Ref: <span className="font-mono font-semibold text-neutral-800">{invoice.claim.claimNumber}</span>
              </div>
            )}
          </div>

          <div className="text-left md:text-right font-mono">
            {/* Visual Barcode Simulation */}
            <div className="inline-block bg-neutral-900 text-white px-4 py-2 rounded text-center mb-1">
              <div className="text-[9px] tracking-widest text-neutral-400">CARRIER BARCODE REF</div>
              <div className="text-sm font-black tracking-wider">|| | | ||| || ||| | ||| ||</div>
              <div className="text-[10px] text-amber-400 font-bold">{invoice.trackingNumber}</div>
            </div>
            <div className="text-xs text-neutral-500">
              Carrier Code: <strong className="text-neutral-800">{invoice.carrier.code}</strong>
            </div>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-xs">
          {/* Claimant / Shipper Box */}
          <div className="p-4 bg-neutral-50 rounded border border-neutral-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Claimant & Indemnity Beneficiary (Shipper)
            </div>
            <div className="font-bold text-sm text-neutral-900 mb-1">{invoice.claimantName}</div>
            <div className="text-neutral-700 whitespace-pre-line leading-relaxed mb-2">
              {invoice.claimantAddress}
            </div>
            {invoice.claimantTaxId && (
              <div className="text-neutral-600">
                Tax ID / VAT: <span className="font-mono font-medium">{invoice.claimantTaxId}</span>
              </div>
            )}
            {invoice.claimantContactEmail && (
              <div className="text-neutral-600">
                Email: <span className="font-mono">{invoice.claimantContactEmail}</span>
              </div>
            )}
            {invoice.claimantPhone && (
              <div className="text-neutral-600">
                Phone: <span>{invoice.claimantPhone}</span>
              </div>
            )}
          </div>

          {/* Courier Target Department Box */}
          <div className="p-4 bg-neutral-50 rounded border border-neutral-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Contracted Courier & Claims Department
            </div>
            <div className="font-bold text-sm text-neutral-900 mb-1">{invoice.courierName}</div>
            <div className="text-neutral-700 mb-1">
              Courier Account No: <span className="font-mono font-bold text-neutral-900">{invoice.courierAccountNo || 'ON_FILE'}</span>
            </div>
            {invoice.courierDeptEmail && (
              <div className="text-neutral-600 mb-1">
                Claims Department Email: <span className="font-mono">{invoice.courierDeptEmail}</span>
              </div>
            )}
            {invoice.courierClaimRef && (
              <div className="text-neutral-600 mb-1">
                Courier Incident Ref: <span className="font-mono font-semibold">{invoice.courierClaimRef}</span>
              </div>
            )}
            <div className="text-neutral-600">
              Loss Nature: <span className="font-bold text-red-700">{invoice.lossReason.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* Consignment & Transport Metadata */}
        <div className="mb-8 border border-neutral-200 rounded overflow-hidden">
          <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 font-bold text-xs uppercase tracking-wider text-neutral-700">
            Consignment & Transit Particulars
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 text-xs">
            <div>
              <div className="text-neutral-500 text-[10px] uppercase">Primary Tracking #</div>
              <div className="font-mono font-bold text-neutral-900">{invoice.trackingNumber}</div>
            </div>
            <div>
              <div className="text-neutral-500 text-[10px] uppercase">Merchant Order #</div>
              <div className="font-mono font-bold text-neutral-900">{invoice.orderNumber}</div>
            </div>
            <div>
              <div className="text-neutral-500 text-[10px] uppercase">Dispatch Date</div>
              <div className="text-neutral-900">
                {invoice.dispatchDate ? new Date(invoice.dispatchDate).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 text-[10px] uppercase">Consignee (Recipient)</div>
              <div className="font-semibold text-neutral-900">{invoice.parcel.recipientName}</div>
            </div>
          </div>
        </div>

        {/* Custom Courier Fields (e.g. PO Ref, Hazard Code, Customs Taric, Depot) */}
        {Object.keys(customFields).length > 0 && (
          <div className="mb-8 border border-neutral-200 rounded overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 font-bold text-xs uppercase tracking-wider text-neutral-700">
              Courier-Specific Custom Fields & Transport Specifications
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 text-xs">
              {Object.entries(customFields).map(([key, val]) => (
                <div key={key}>
                  <div className="text-neutral-500 text-[10px] uppercase font-medium">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="font-mono text-neutral-900 font-semibold">{String(val)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itemized Consignment Table */}
        <div className="mb-8">
          <div className="font-bold text-xs uppercase tracking-wider text-neutral-700 mb-2">
            Itemized Loss / Cargo Claim Schedule
          </div>
          <table className="w-full text-xs text-left border border-neutral-200">
            <thead className="bg-neutral-100 text-neutral-700 font-bold uppercase text-[10px] border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3">Item # / Description</th>
                <th className="py-2.5 px-3">SKU / Item Ref</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Declared Unit Value ({invoice.currency})</th>
                <th className="py-2.5 px-3 text-right">Total Claimed ({invoice.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {lineItems.length > 0 ? (
                lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="py-2 px-3 font-medium text-neutral-900">{item.description}</td>
                    <td className="py-2 px-3 font-mono text-neutral-600">{item.sku || `SKU-${idx + 1}`}</td>
                    <td className="py-2 px-3 text-center">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono">
                      {currSymbol}{Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      {currSymbol}{Number(item.lineTotal || item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 px-3 font-medium text-neutral-900" colSpan={2}>
                    Consignment Cargo for Order #{invoice.orderNumber}
                  </td>
                  <td className="py-3 px-3 text-center">1</td>
                  <td className="py-3 px-3 text-right font-mono">{currSymbol}{invoice.merchandiseValue.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">{currSymbol}{invoice.merchandiseValue.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Totals Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-72 border border-neutral-200 rounded p-4 bg-neutral-50 text-xs space-y-2">
            <div className="flex justify-between text-neutral-600">
              <span>Cargo Merchandise Value:</span>
              <span className="font-mono font-medium">{currSymbol}{invoice.merchandiseValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Contracted Freight / Postage:</span>
              <span className="font-mono font-medium">{currSymbol}{invoice.shippingCost.toFixed(2)}</span>
            </div>
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>Applicable Sales Tax / Duty:</span>
                <span className="font-mono font-medium">{currSymbol}{invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {invoice.adminFeeAmount > 0 && (
              <div className="flex justify-between text-neutral-600">
                <span>Administrative Handling Fee:</span>
                <span className="font-mono font-medium">{currSymbol}{invoice.adminFeeAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t-2 border-neutral-900 flex justify-between font-bold text-sm text-neutral-900">
              <span>Total Indemnity Claimed:</span>
              <span className="font-mono text-base text-amber-700">
                {currSymbol}{invoice.totalClaimedAmount.toFixed(2)} {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Attached Evidence & Photos Gallery (if any) */}
        {evidenceImages.length > 0 && (
          <div className="mb-8 border border-neutral-200 rounded p-4">
            <div className="font-bold text-xs uppercase tracking-wider text-neutral-700 mb-3">
              Certified Photographic Evidence & Document Attachments ({evidenceImages.length})
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {evidenceImages.map((img) => (
                <div key={img.id} className="border border-neutral-300 rounded p-2 bg-neutral-50 text-center">
                  <div className="h-32 bg-neutral-200 rounded overflow-hidden flex items-center justify-center mb-1.5">
                    <img
                      src={img.url}
                      alt={img.label}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-800 truncate">{img.label}</div>
                  <div className="text-[9px] text-neutral-500 font-mono uppercase">{img.type.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes / Special Instructions */}
        {invoice.notes && (
          <div className="mb-8 p-3 bg-neutral-50 rounded border border-neutral-200 text-xs text-neutral-700">
            <strong className="text-neutral-900">Special Carrier Instructions / Context:</strong> {invoice.notes}
          </div>
        )}

        {/* Formal Attestation & Signature Block */}
        <div className="border-t-2 border-neutral-900 pt-6 mt-8">
          <div className="text-[11px] text-neutral-600 leading-relaxed mb-6">
            <strong>Legal Attestation:</strong> I hereby certify under penalty of contract default that the above itemized loss details, cargo valuations, and transit records are true and accurate. Reimbursement is demanded under applicable carrier service conditions and carriage liability regulations.
          </div>
          
          <div className="flex justify-between items-end text-xs">
            <div>
              <div className="font-serif italic text-lg text-neutral-800 mb-1 border-b border-neutral-400 pb-1 w-48">
                {invoice.authorizedSignatory || 'Authorized Officer'}
              </div>
              <div className="font-bold text-neutral-900">{invoice.authorizedSignatory || 'Authorized Claims Officer'}</div>
              <div className="text-neutral-500 text-[10px]">Claims & Logistics Escalations Unit</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-neutral-700 border-b border-neutral-400 pb-1 w-36 text-center">
                {new Date(invoice.createdAt).toISOString().slice(0, 10)}
              </div>
              <div className="text-neutral-500 text-[10px] mt-1">Certified Dispatch Date</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
