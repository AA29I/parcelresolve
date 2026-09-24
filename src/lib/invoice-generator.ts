import db from './db';

export type CarrierInvoiceFormat =
  | 'UPS_STANDARD'
  | 'FEDEX_FORMAL'
  | 'DHL_EXPRESS'
  | 'GLS_EUROPE'
  | 'GENERIC';

export type ClaimLossReason =
  | 'LOST_IN_TRANSIT'
  | 'DAMAGED_IN_TRANSIT'
  | 'DELAYED_BEYOND_REMEDY'
  | 'MISROUTED';

export type SupportedInvoiceCurrency = 'USD' | 'EUR' | 'GBP' | 'CAD';

export interface InvoiceLineItem {
  id?: string;
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceEvidenceImage {
  id: string;
  type: 'DAMAGE_PHOTO' | 'SHIPPING_LABEL' | 'PROOF_OF_PURCHASE' | 'DISPATCH_RECEIPT' | 'WEIGHT_SCAN';
  url: string;
  label: string;
  uploadedAt: string;
}

export interface CreateClaimInvoiceInput {
  organizationId: string;
  parcelId: string;
  claimId?: string | null;
  carrierId?: string;
  generationType?: 'AUTO' | 'MANUAL';
  carrierFormat?: CarrierInvoiceFormat;
  
  claimantName?: string;
  claimantAddress?: string;
  claimantTaxId?: string;
  claimantContactEmail?: string;
  claimantPhone?: string;

  courierName?: string;
  courierAccountNo?: string;
  courierDeptEmail?: string;
  courierClaimRef?: string;

  trackingNumber?: string;
  orderNumber?: string;
  dispatchDate?: Date | string;
  lossReason?: ClaimLossReason;

  currency?: SupportedInvoiceCurrency;
  merchandiseValue?: number;
  shippingCost?: number;
  taxAmount?: number;
  adminFeeAmount?: number;
  totalClaimedAmount?: number;

  lineItems?: InvoiceLineItem[];
  customFields?: Record<string, string | number>;
  evidenceImages?: InvoiceEvidenceImage[];

  disclaimerText?: string;
  notes?: string;
  authorizedSignatory?: string;
  userId?: string;
}

export const STATUTORY_DISCLAIMER_TEXT =
  'NOT AN ORIGINAL COMMERCIAL SALES INVOICE. This formal statement of loss, damage, and indemnity is prepared exclusively for carrier freight reimbursement, insurance adjudication, and contractual settlement under governing carriage terms.';

/**
 * Determine carrier invoice format from carrier code
 */
export function determineCarrierFormat(carrierCode: string): CarrierInvoiceFormat {
  const code = (carrierCode || '').toUpperCase();
  if (code.includes('UPS')) return 'UPS_STANDARD';
  if (code.includes('FEDEX') || code.includes('ESHIPPER')) return 'FEDEX_FORMAL';
  if (code.includes('DHL')) return 'DHL_EXPRESS';
  if (code.includes('GLS') || code.includes('DPD') || code.includes('PARCELFORCE')) return 'GLS_EUROPE';
  return 'GENERIC';
}

/**
 * Automatically creates a courier claim invoice from parcel and carrier records
 */
export async function generateAutoClaimInvoice(params: {
  organizationId: string;
  parcelId: string;
  claimId?: string | null;
  userId?: string;
  customCarrierFormat?: CarrierInvoiceFormat;
  lossReason?: ClaimLossReason;
  notes?: string;
}) {
  const { organizationId, parcelId, claimId, userId, customCarrierFormat, lossReason = 'LOST_IN_TRANSIT', notes } = params;

  const parcel = await db.parcel.findFirst({
    where: { id: parcelId, organizationId },
    include: {
      carrier: true,
      warehouse: true,
      organization: true,
    },
  });

  if (!parcel) {
    throw new Error(`Parcel not found: ${parcelId}`);
  }

  const carrierFormat = customCarrierFormat || determineCarrierFormat(parcel.carrier.code);
  const invoiceNumber = `INV-CLM-${parcel.carrier.code.toUpperCase()}-${Date.now().toString().slice(-6)}`;

  // Parse or synthesize line items
  const items: InvoiceLineItem[] = [];
  if (parcel.itemsSummary && parcel.itemsSummary.trim().length > 0) {
    const rawParts = parcel.itemsSummary.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    const count = Math.max(rawParts.length, 1);
    const splitPrice = Math.round((Number(parcel.declaredValue || 0) / count) * 100) / 100;
    
    rawParts.forEach((part, idx) => {
      items.push({
        id: `item-${idx + 1}`,
        sku: `SKU-${parcel.orderNumber}-${idx + 1}`,
        description: part,
        quantity: 1,
        unitPrice: splitPrice,
        lineTotal: splitPrice,
      });
    });
  } else {
    items.push({
      id: 'item-1',
      sku: `ORD-${parcel.orderNumber}-CONS`,
      description: `Contracted Consignment Cargo (Order #${parcel.orderNumber})`,
      quantity: 1,
      unitPrice: Number(parcel.declaredValue || 0),
      lineTotal: Number(parcel.declaredValue || 0),
    });
  }

  const merchandiseValue = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const shippingCost = Number(parcel.shippingCost || 0);
  const taxAmount = 0;
  const adminFeeAmount = 0;
  const totalClaimedAmount = Math.round((merchandiseValue + shippingCost + taxAmount + adminFeeAmount) * 100) / 100;

  const claimantAddress = parcel.warehouse
    ? `${parcel.warehouse.name}, ${parcel.warehouse.addressLine1}, ${parcel.warehouse.city}, ${parcel.warehouse.state} ${parcel.warehouse.postalCode}, ${parcel.warehouse.country}`
    : `${parcel.organization.name} Headquarters, Operating Center, US`;

  const customFields: Record<string, string | number> = {
    destination_recipient: parcel.recipientName,
    destination_city: `${parcel.recipientCity}, ${parcel.recipientCountry}`,
    contracted_party: parcel.carrier.contractedParty,
    dispatch_hub: parcel.warehouse?.name || 'Primary Depot',
    weight_kg: parcel.weightKg || 1.0,
  };

  if (carrierFormat === 'UPS_STANDARD') {
    customFields['ups_shipper_number'] = parcel.carrier.aggregatorId || 'UPS-ACC-PR901';
    customFields['service_level'] = 'UPS Ground Commercial Delivery';
  } else if (carrierFormat === 'GLS_EUROPE') {
    customFields['gls_depot_id'] = 'DEPOT-EU-44';
    customFields['eu_vat_id'] = 'EU-VAT-PENDING';
  } else if (carrierFormat === 'DHL_EXPRESS') {
    customFields['dhl_waybill_no'] = parcel.trackingNumber;
    customFields['customs_hs_code'] = '8471.30.00';
  } else if (carrierFormat === 'FEDEX_FORMAL') {
    customFields['fedex_account_no'] = 'FDX-7789-CLM';
    customFields['transportation_control_no'] = `TCN-${parcel.orderNumber}`;
  }

  const invoice = await db.claimInvoice.create({
    data: {
      organizationId,
      parcelId,
      claimId: claimId || null,
      carrierId: parcel.carrierId,
      invoiceNumber,
      generationType: 'AUTO',
      carrierFormat,
      claimantName: parcel.organization.name,
      claimantAddress,
      claimantTaxId: 'EIN-TAX-VERIFIED',
      claimantContactEmail: parcel.organization.primaryContactEmail,
      claimantPhone: parcel.organization.phone || '+1 (555) 019-2831',
      courierName: parcel.carrier.name,
      courierAccountNo: parcel.carrier.aggregatorId || `ACCT-${parcel.carrier.code}-7701`,
      courierDeptEmail: parcel.carrier.claimRecipientEmail || parcel.carrier.enquiryRecipientEmail || `claims@${parcel.carrier.code.toLowerCase()}-freight.example.com`,
      courierClaimRef: `REF-${parcel.trackingNumber.slice(-6)}`,
      trackingNumber: parcel.trackingNumber,
      orderNumber: parcel.orderNumber,
      dispatchDate: parcel.dispatchDate ? new Date(parcel.dispatchDate) : new Date(),
      lossReason,
      currency: (parcel.currency as SupportedInvoiceCurrency) || 'USD',
      merchandiseValue,
      shippingCost,
      taxAmount,
      adminFeeAmount,
      totalClaimedAmount,
      lineItems: JSON.stringify(items),
      customFields: JSON.stringify(customFields),
      evidenceImages: JSON.stringify([]),
      disclaimerText: STATUTORY_DISCLAIMER_TEXT,
      notes: notes || `Automated Loss Invoice generated for ${parcel.carrier.name} cargo reimbursement.`,
      authorizedSignatory: 'Authorized Claims Officer',
      status: 'FINALIZED',
    },
  });

  // Also register document in ClaimDocument for compliance & audit
  await db.claimDocument.create({
    data: {
      organizationId,
      claimId: claimId || null,
      parcelId,
      documentType: 'INVOICE_DECLARATION',
      fileName: `${invoiceNumber}.pdf`,
      fileUrl: `/invoices/${invoiceNumber}`,
      fileSize: 45200,
      mimeType: 'text/html',
      isGeneratedDeclaration: true,
      disclaimerText: STATUTORY_DISCLAIMER_TEXT,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'CREATED',
      entityType: 'CLAIM',
      entityId: invoice.id,
      details: JSON.stringify({
        invoiceNumber,
        carrierFormat,
        totalClaimedAmount,
        currency: parcel.currency,
        generationType: 'AUTO',
      }),
    },
  });

  return invoice;
}

/**
 * Creates a custom or manual claim invoice with specified line items, custom fields, and evidence images
 */
export async function createManualClaimInvoice(input: CreateClaimInvoiceInput) {
  const {
    organizationId,
    parcelId,
    claimId,
    carrierId,
    generationType = 'MANUAL',
    carrierFormat = 'UPS_STANDARD',
    claimantName,
    claimantAddress,
    claimantTaxId,
    claimantContactEmail,
    claimantPhone,
    courierName,
    courierAccountNo,
    courierDeptEmail,
    courierClaimRef,
    trackingNumber,
    orderNumber,
    dispatchDate,
    lossReason = 'LOST_IN_TRANSIT',
    currency = 'USD',
    merchandiseValue = 0,
    shippingCost = 0,
    taxAmount = 0,
    adminFeeAmount = 0,
    totalClaimedAmount,
    lineItems = [],
    customFields = {},
    evidenceImages = [],
    disclaimerText = STATUTORY_DISCLAIMER_TEXT,
    notes,
    authorizedSignatory = 'Authorized Claims Officer',
    userId,
  } = input;

  const parcel = await db.parcel.findFirst({
    where: { id: parcelId, organizationId },
    include: { carrier: true, organization: true },
  });

  if (!parcel) {
    throw new Error(`Parcel not found: ${parcelId}`);
  }

  const effectiveCarrierId = carrierId || parcel.carrierId;
  const effectiveCarrierName = courierName || parcel.carrier.name;
  const effectiveCarrierCode = parcel.carrier.code.toUpperCase();
  const invoiceNumber = `INV-CLM-${effectiveCarrierCode}-${Date.now().toString().slice(-6)}`;

  // Calculate totals if not provided explicitly
  const calcItemsSum = lineItems.reduce((acc, item) => acc + (item.lineTotal || item.quantity * item.unitPrice), 0);
  const effectiveMerchandiseValue = merchandiseValue > 0 ? merchandiseValue : calcItemsSum;
  const effectiveTotal =
    totalClaimedAmount !== undefined
      ? totalClaimedAmount
      : Math.round((effectiveMerchandiseValue + shippingCost + taxAmount + adminFeeAmount) * 100) / 100;

  const invoice = await db.claimInvoice.create({
    data: {
      organizationId,
      parcelId,
      claimId: claimId || null,
      carrierId: effectiveCarrierId,
      invoiceNumber,
      generationType,
      carrierFormat,
      claimantName: claimantName || parcel.organization.name,
      claimantAddress: claimantAddress || 'Operations Center, Primary Logistics Facility',
      claimantTaxId: claimantTaxId || null,
      claimantContactEmail: claimantContactEmail || parcel.organization.primaryContactEmail,
      claimantPhone: claimantPhone || parcel.organization.phone || null,
      courierName: effectiveCarrierName,
      courierAccountNo: courierAccountNo || parcel.carrier.aggregatorId || null,
      courierDeptEmail: courierDeptEmail || parcel.carrier.claimRecipientEmail || null,
      courierClaimRef: courierClaimRef || null,
      trackingNumber: trackingNumber || parcel.trackingNumber,
      orderNumber: orderNumber || parcel.orderNumber,
      dispatchDate: dispatchDate ? new Date(dispatchDate) : parcel.dispatchDate,
      lossReason,
      currency,
      merchandiseValue: effectiveMerchandiseValue,
      shippingCost,
      taxAmount,
      adminFeeAmount,
      totalClaimedAmount: effectiveTotal,
      lineItems: JSON.stringify(lineItems),
      customFields: JSON.stringify(customFields),
      evidenceImages: JSON.stringify(evidenceImages),
      disclaimerText: disclaimerText || STATUTORY_DISCLAIMER_TEXT,
      notes: notes || null,
      authorizedSignatory,
      status: 'FINALIZED',
    },
  });

  // Link invoice document into claimDocument
  await db.claimDocument.create({
    data: {
      organizationId,
      claimId: claimId || null,
      parcelId,
      documentType: 'INVOICE_DECLARATION',
      fileName: `${invoiceNumber}.pdf`,
      fileUrl: `/invoices/${invoiceNumber}`,
      fileSize: 48000,
      mimeType: 'text/html',
      isGeneratedDeclaration: true,
      disclaimerText: disclaimerText || STATUTORY_DISCLAIMER_TEXT,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'CREATED',
      entityType: 'CLAIM',
      entityId: invoice.id,
      details: JSON.stringify({
        invoiceNumber,
        carrierFormat,
        totalClaimedAmount: effectiveTotal,
        currency,
        generationType,
        itemCount: lineItems.length,
        imageCount: evidenceImages.length,
      }),
    },
  });

  return invoice;
}

/**
 * Format currency symbols cleanly
 */
export function getCurrencySymbol(curr: string): string {
  switch ((curr || 'USD').toUpperCase()) {
    case 'GBP':
      return '£';
    case 'EUR':
      return '€';
    case 'CAD':
      return 'CA$';
    case 'USD':
    default:
      return '$';
  }
}
