import db from './db';

export type CarrierInvoiceFormat =
  | 'DPD_STANDARD'
  | 'ROYAL_MAIL_P58'
  | 'EVRI_INDEMNITY'
  | 'YODEL_LOSS'
  | 'UPS_STANDARD'
  | 'UPS_COMMERCIAL'
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
  if (code.includes('DPD')) return 'DPD_STANDARD';
  if (code.includes('ROYAL') || code.includes('RM_') || code.includes('POST')) return 'ROYAL_MAIL_P58';
  if (code.includes('EVRI') || code.includes('HERMES')) return 'EVRI_INDEMNITY';
  if (code.includes('YODEL')) return 'YODEL_LOSS';
  if (code.includes('UPS')) return 'UPS_COMMERCIAL';
  if (code.includes('FEDEX') || code.includes('ESHIPPER')) return 'FEDEX_FORMAL';
  if (code.includes('DHL')) return 'DHL_EXPRESS';
  if (code.includes('GLS') || code.includes('PARCELFORCE')) return 'GLS_EUROPE';
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

  const carrierFormat =
    customCarrierFormat ||
    (parcel.carrier.claimInvoiceFormat as CarrierInvoiceFormat) ||
    determineCarrierFormat(parcel.carrier.code);
  const invoiceNumber = `INV-CLM-${parcel.carrier.code.toUpperCase()}-${Date.now().toString().slice(-6)}`;

  // Parse structured items or fallback to itemsSummary
  const items: InvoiceLineItem[] = [];
  const pricingRule = parcel.carrier.claimPricingRule || 'RETAIL_EX_VAT';
  
  let parsedStructuredItems: any[] = [];
  try {
    if (parcel.itemsJson && parcel.itemsJson !== '[]') {
      parsedStructuredItems = JSON.parse(parcel.itemsJson);
    }
  } catch {
    parsedStructuredItems = [];
  }

  if (Array.isArray(parsedStructuredItems) && parsedStructuredItems.length > 0) {
    parsedStructuredItems.forEach((item, idx) => {
      let unitPrice = Number(item.unitRetailPrice || item.unitPrice || 0);
      if (pricingRule === 'WHOLESALE_COST') {
        unitPrice = Number(item.wholesaleCost || item.unitCostPrice || item.costPrice || (unitPrice * 0.5));
      }
      const qty = Number(item.quantity || 1);
      const lineTotal = Math.round(unitPrice * qty * 100) / 100;
      items.push({
        id: `item-${idx + 1}`,
        sku: item.sku || `SKU-${parcel.orderNumber}-${idx + 1}`,
        description: item.title || item.description || `Item #${idx + 1}`,
        quantity: qty,
        unitPrice,
        lineTotal,
      });
    });
  } else if (parcel.itemsSummary && parcel.itemsSummary.trim().length > 0) {
    const rawParts = parcel.itemsSummary.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    const count = Math.max(rawParts.length, 1);
    let rawTotal = Number(parcel.declaredValue || 0);
    if (pricingRule === 'WHOLESALE_COST') {
      rawTotal = Math.round(rawTotal * 0.45 * 100) / 100;
    }
    const splitPrice = Math.round((rawTotal / count) * 100) / 100;
    
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
    let rawTotal = Number(parcel.declaredValue || 0);
    if (pricingRule === 'WHOLESALE_COST') {
      rawTotal = Math.round(rawTotal * 0.45 * 100) / 100;
    }
    items.push({
      id: 'item-1',
      sku: `ORD-${parcel.orderNumber}-CONS`,
      description: `Contracted Consignment Cargo (Order #${parcel.orderNumber})`,
      quantity: 1,
      unitPrice: rawTotal,
      lineTotal: rawTotal,
    });
  }

  let merchandiseValue = items.reduce((sum, i) => sum + i.lineTotal, 0);
  if (pricingRule === 'CAPPED_INDEMNITY' && parcel.carrier.claimIndemnityCap && parcel.carrier.claimIndemnityCap > 0) {
    if (merchandiseValue > parcel.carrier.claimIndemnityCap) {
      merchandiseValue = parcel.carrier.claimIndemnityCap;
    }
  }

  const includePostage = parcel.carrier.claimIncludePostage !== false;
  const shippingCost = includePostage ? Number(parcel.shippingCost || 0) : 0;
  const taxAmount = 0;
  const adminFeeAmount = 0;
  let totalClaimedAmount = Math.round((merchandiseValue + shippingCost + taxAmount + adminFeeAmount) * 100) / 100;

  // Apply Carrier Indemnity Cap if overall claim exceeds ceiling
  if (parcel.carrier.claimIndemnityCap && parcel.carrier.claimIndemnityCap > 0) {
    if (!includePostage && totalClaimedAmount > parcel.carrier.claimIndemnityCap) {
      totalClaimedAmount = parcel.carrier.claimIndemnityCap;
    }
  }

  const claimantAddress = parcel.warehouse
    ? `${parcel.warehouse.name}, ${parcel.warehouse.addressLine1}, ${parcel.warehouse.city}, ${parcel.warehouse.state} ${parcel.warehouse.postalCode}, ${parcel.warehouse.country}`
    : `${parcel.organization.name} Global Fulfillment Hub, UK`;

  const customFields: Record<string, string | number> = {
    destination_recipient: parcel.recipientName,
    destination_city: `${parcel.recipientCity}, ${parcel.recipientCountry}`,
    contracted_party: parcel.carrier.contractedParty,
    dispatch_hub: parcel.warehouse?.name || 'Primary Depot',
    weight_kg: parcel.weightKg || 1.0,
    pricing_rule_applied: pricingRule,
  };

  if (carrierFormat === 'DPD_STANDARD') {
    customFields['dpd_account_no'] = parcel.carrier.contractedParty;
    customFields['service_code'] = parcel.postalServiceName || 'DPD Next Day';
    customFields['dor_declaration_status'] = 'CUSTOMER_SIGNED_ATTACHED';
  } else if (carrierFormat === 'ROYAL_MAIL_P58') {
    customFields['royal_mail_oba_no'] = parcel.carrier.contractedParty;
    customFields['claim_type'] = 'P58_LOST_MERCHANDISE';
    customFields['valuation_basis'] = 'Wholesale Manufacturing / Cost Price';
  } else if (carrierFormat === 'EVRI_INDEMNITY') {
    customFields['evri_client_ref'] = parcel.carrier.contractedParty;
    customFields['indemnity_tier'] = `Capped at £${parcel.carrier.claimIndemnityCap || 20}`;
  } else if (carrierFormat === 'YODEL_LOSS') {
    customFields['yodel_service'] = parcel.postalServiceName || 'Yodel Xpect';
    customFields['indemnity_tier'] = `Capped at £${parcel.carrier.claimIndemnityCap || 50}`;
  } else if (carrierFormat === 'UPS_STANDARD' || carrierFormat === 'UPS_COMMERCIAL') {
    customFields['ups_shipper_number'] = parcel.carrier.aggregatorId || 'UPS-ACC-PR901';
    customFields['service_level'] = 'UPS Express Commercial Cargo';
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
      disclaimerText: parcel.carrier.claimCustomDisclaimer || STATUTORY_DISCLAIMER_TEXT,
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
