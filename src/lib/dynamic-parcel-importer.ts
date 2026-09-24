import db from './db';
import { calculateSla } from './sla-calculator';

export interface DynamicImportRow {
  [columnName: string]: string | number | undefined | null;
}

export interface DynamicImportResult {
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

/**
 * Universal delimiter parser: parses CSV, TSV (Excel copy-paste), or semicolon-delimited text
 */
export function parseUniversalDelimitedText(rawText: string): string[][] {
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Detect delimiter from header line
  const firstLine = lines[0];
  let delimiter = ',';
  if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = '\t';
  } else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  const rows: string[][] = [];

  for (const line of lines) {
    if (delimiter === '\t') {
      rows.push(line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, '')));
      continue;
    }

    // CSV/Semicolon with quote handling
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
    rows.push(row);
  }

  return rows;
}

/**
 * Normalizes string keys for fuzzy column matching
 */
function norm(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Core dynamic importer: Accepts ANY columns, never drops user data,
 * and automatically preserves all unspecified attributes in customFieldValues and CustomField entities.
 */
export async function executeDynamicParcelImport(params: {
  organizationId: string;
  rows?: DynamicImportRow[];
  rawText?: string;
  defaultCarrierCode?: string;
  warehouseId?: string;
  userId?: string;
}): Promise<DynamicImportResult> {
  const { organizationId, defaultCarrierCode, warehouseId, userId } = params;

  let rowObjects: DynamicImportRow[] = [];

  if (params.rows && Array.isArray(params.rows)) {
    rowObjects = params.rows;
  } else if (params.rawText) {
    const grid = parseUniversalDelimitedText(params.rawText);
    if (grid.length < 2) {
      throw new Error('Import data contains insufficient rows. At least a header and 1 data row is required.');
    }
    const headers = grid[0];
    for (let r = 1; r < grid.length; r++) {
      const obj: DynamicImportRow = {};
      headers.forEach((h, idx) => {
        obj[h] = grid[r][idx] || '';
      });
      rowObjects.push(obj);
    }
  }

  if (rowObjects.length === 0) {
    throw new Error('No rows found to import.');
  }

  // Load existing workspace carriers
  const carriers = await db.carrier.findMany({ where: { organizationId } });
  const carrierMap = new Map(carriers.map((c) => [c.code.toUpperCase(), c]));
  const defaultCarrier =
    (defaultCarrierCode ? carrierMap.get(defaultCarrierCode.toUpperCase()) : null) ||
    carriers.find((c) => c.isLive) ||
    carriers[0];

  if (!defaultCarrier) {
    throw new Error('No active carrier found in workspace. Please configure a carrier before importing.');
  }

  // Load default warehouse
  const defaultWarehouse = warehouseId
    ? await db.warehouse.findUnique({ where: { id: warehouseId } })
    : await db.warehouse.findFirst({ where: { organizationId, isDefault: true } });

  // Load existing registered custom fields to avoid duplicate creations
  const existingCustomFields = await db.customField.findMany({
    where: { organizationId, entityType: 'PARCEL' },
  });
  const existingFieldKeys = new Set(existingCustomFields.map((f) => f.fieldKey.toLowerCase()));

  const newCustomFieldsCreated: string[] = [];
  let insertedCount = 0;
  let updatedCount = 0;
  const sampleProcessed: DynamicImportResult['sampleProcessed'] = [];

  // Process every single row without rejecting arbitrary columns
  for (let idx = 0; idx < rowObjects.length; idx++) {
    const raw = rowObjects[idx];
    const keys = Object.keys(raw);

    // Heuristically map standard columns
    let trackingNumber = '';
    let orderNumber = '';
    let carrierCode = '';
    let recipientName = 'Consignee Customer';
    let recipientAddress = 'Standard Delivery Address';
    let recipientCity = 'Logistics Hub';
    let recipientState = '';
    let recipientPostalCode = '00000';
    let recipientCountry = 'US';
    let declaredValue = 50.0;
    let shippingCost = 7.5;
    let weightKg = 1.0;
    let currency = 'USD';
    let itemsSummary = 'Imported Merchandise Cargo';
    let dispatchDate = new Date();

    const customFields: Record<string, string | number> = {};

    keys.forEach((key) => {
      const n = norm(key);
      const val = raw[key];
      const strVal = val !== undefined && val !== null ? String(val).trim() : '';

      if (!trackingNumber && ['trackingnumber', 'trackingno', 'tracking', 'waybill', 'consignmentno', 'pro', 'awb', 'hawb'].some((k) => n.includes(k))) {
        trackingNumber = strVal;
      } else if (!orderNumber && ['ordernumber', 'orderno', 'orderref', 'orderid', 'poref', 'purchaseorder', 'po'].some((k) => n.includes(k))) {
        orderNumber = strVal;
      } else if (!carrierCode && ['carriercode', 'carrier', 'courier', 'shippingprovider', 'method'].some((k) => n.includes(k))) {
        carrierCode = strVal.toUpperCase();
      } else if (['recipientname', 'recipient', 'customername', 'customer', 'shipto', 'consignee'].some((k) => n.includes(k))) {
        if (strVal) recipientName = strVal;
      } else if (['recipientaddress', 'address', 'shippingaddress', 'address1', 'street'].some((k) => n.includes(k))) {
        if (strVal) recipientAddress = strVal;
      } else if (['city', 'destinationcity'].some((k) => n === k)) {
        if (strVal) recipientCity = strVal;
      } else if (['state', 'province', 'region'].some((k) => n === k)) {
        if (strVal) recipientState = strVal;
      } else if (['postalcode', 'postcode', 'zip', 'zipcode'].some((k) => n === k)) {
        if (strVal) recipientPostalCode = strVal;
      } else if (['country', 'destcountry', 'countrycode'].some((k) => n === k)) {
        if (strVal) recipientCountry = strVal;
      } else if (['declaredvalue', 'orderamount', 'itemvalue', 'goodsvalue', 'price', 'total', 'amount'].some((k) => n.includes(k))) {
        const parsed = parseFloat(strVal);
        if (!isNaN(parsed)) declaredValue = parsed;
      } else if (['shippingcost', 'freight', 'postage', 'carriage'].some((k) => n.includes(k))) {
        const parsed = parseFloat(strVal);
        if (!isNaN(parsed)) shippingCost = parsed;
      } else if (['weight', 'weightkg', 'grossweight', 'parcelweight'].some((k) => n.includes(k))) {
        const parsed = parseFloat(strVal);
        if (!isNaN(parsed)) weightKg = parsed;
      } else if (['currency', 'curr'].some((k) => n === k)) {
        if (strVal) currency = strVal.toUpperCase();
      } else if (['items', 'itemssummary', 'description', 'product', 'sku', 'goods'].some((k) => n.includes(k))) {
        if (strVal) itemsSummary = strVal;
      } else if (['dispatchdate', 'shipdate', 'shippedat', 'orderdate'].some((k) => n.includes(k))) {
        const parsedDate = new Date(strVal);
        if (!isNaN(parsedDate.getTime())) dispatchDate = parsedDate;
      } else {
        // ANY other column is preserved as an organization-level custom field!
        if (strVal) {
          customFields[key] = strVal;

          // Register in CustomField entity if not already present
          const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          if (!existingFieldKeys.has(sanitizedKey) && !newCustomFieldsCreated.includes(sanitizedKey)) {
            newCustomFieldsCreated.push(sanitizedKey);
          }
        }
      }
    });

    // Auto-generate fallback tracking number if absent
    if (!trackingNumber) {
      trackingNumber = `PR-IMP-${Date.now().toString().slice(-6)}-${idx + 1}`;
    }
    // Auto-generate fallback order number if absent
    if (!orderNumber) {
      orderNumber = `ORD-IMP-${Date.now().toString().slice(-6)}-${idx + 1}`;
    }

    const carrier = carrierMap.get(carrierCode) || defaultCarrier;

    // SLA calculation
    const slaHours = 48;
    const slaResult = calculateSla({
      dispatchDate,
      cutoffTime: defaultWarehouse?.cutoffTime || '16:00',
      slaHours,
      currentCheckTime: new Date(),
    });

    // Upsert parcel record
    const existing = await db.parcel.findUnique({
      where: {
        organizationId_trackingNumber: {
          organizationId,
          trackingNumber,
        },
      },
    });

    if (existing) {
      let mergedCustom: Record<string, unknown> = {};
      try {
        mergedCustom = JSON.parse(existing.customFieldValues || '{}');
      } catch {
        mergedCustom = {};
      }
      Object.assign(mergedCustom, customFields);

      await db.parcel.update({
        where: { id: existing.id },
        data: {
          orderNumber,
          recipientName,
          recipientAddress,
          recipientCity,
          recipientState,
          recipientPostalCode,
          recipientCountry,
          declaredValue,
          shippingCost,
          weightKg,
          currency,
          itemsSummary,
          customFieldValues: JSON.stringify(mergedCustom),
          updatedAt: new Date(),
        },
      });
      updatedCount++;
    } else {
      await db.parcel.create({
        data: {
          organizationId,
          warehouseId: defaultWarehouse?.id || null,
          carrierId: carrier.id,
          orderNumber,
          trackingNumber,
          recipientName,
          recipientAddress,
          recipientCity,
          recipientState,
          recipientPostalCode,
          recipientCountry,
          declaredValue,
          currency,
          shippingCost,
          weightKg,
          itemsSummary,
          dispatchDate,
          promisedDeliveryDate: slaResult.promisedDeliveryDate,
          calculatedSlaHours: slaHours,
          slaCutoffUsed: defaultWarehouse?.cutoffTime || '16:00',
          slaCalculationDetail: slaResult.calculationDetail,
          isBreached: slaResult.isBreached,
          breachHours: slaResult.breachHours,
          stalledHours: 0,
          trackingStatus: 'IN_TRANSIT',
          investigationStatus: 'NONE',
          claimStatus: 'NOT_ELIGIBLE',
          recoveryStatus: 'UNPAID',
          customFieldValues: JSON.stringify(customFields),
          source: 'CSV_IMPORT',
        },
      });
      insertedCount++;
    }

    if (sampleProcessed.length < 5) {
      sampleProcessed.push({
        trackingNumber,
        orderNumber,
        carrier: carrier.name,
        customFieldsCount: Object.keys(customFields).length,
      });
    }
  }

  // Register newly discovered custom fields in CustomField schema table
  for (const fieldKey of newCustomFieldsCreated) {
    try {
      const label = fieldKey
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      await db.customField.create({
        data: {
          organizationId,
          entityType: 'PARCEL',
          fieldKey,
          fieldLabel: label,
          fieldType: 'TEXT',
          isRequired: false,
          isSearchable: true,
        },
      });
      existingFieldKeys.add(fieldKey);
    } catch {
      // Ignore if concurrent insert
    }
  }

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'IMPORTED',
      entityType: 'PARCEL',
      entityId: `BATCH-${Date.now()}`,
      details: JSON.stringify({
        totalRows: rowObjects.length,
        insertedCount,
        updatedCount,
        newCustomFieldsCreated,
      }),
    },
  });

  return {
    totalRows: rowObjects.length,
    insertedCount,
    updatedCount,
    newCustomFieldsCreated,
    sampleProcessed,
  };
}

/**
 * Creates a single parcel manually with any custom fields provided by the user
 */
export async function createManualParcelWithCustomFields(params: {
  organizationId: string;
  trackingNumber: string;
  orderNumber: string;
  carrierId: string;
  recipientName: string;
  recipientAddress: string;
  recipientCity?: string;
  recipientState?: string;
  recipientPostalCode?: string;
  recipientCountry?: string;
  declaredValue?: number;
  currency?: string;
  shippingCost?: number;
  weightKg?: number;
  itemsSummary?: string;
  dispatchDate?: Date | string;
  customFields?: Record<string, string | number>;
  warehouseId?: string;
  userId?: string;
}) {
  const {
    organizationId,
    trackingNumber,
    orderNumber,
    carrierId,
    recipientName,
    recipientAddress,
    recipientCity = 'Central Hub',
    recipientState = '',
    recipientPostalCode = '00000',
    recipientCountry = 'US',
    declaredValue = 0,
    currency = 'USD',
    shippingCost = 0,
    weightKg = 1.0,
    itemsSummary,
    dispatchDate = new Date(),
    customFields = {},
    warehouseId,
    userId,
  } = params;

  const carrier = await db.carrier.findFirst({
    where: { id: carrierId, organizationId },
  });

  if (!carrier) {
    throw new Error('Carrier not found');
  }

  const defaultWarehouse = warehouseId
    ? await db.warehouse.findUnique({ where: { id: warehouseId } })
    : await db.warehouse.findFirst({ where: { organizationId, isDefault: true } });

  const effectiveDispatchDate = new Date(dispatchDate);
  const slaResult = calculateSla({
    dispatchDate: effectiveDispatchDate,
    cutoffTime: defaultWarehouse?.cutoffTime || '16:00',
    slaHours: 48,
    currentCheckTime: new Date(),
  });

  const parcel = await db.parcel.create({
    data: {
      organizationId,
      warehouseId: defaultWarehouse?.id || null,
      carrierId,
      trackingNumber,
      orderNumber,
      recipientName,
      recipientAddress,
      recipientCity,
      recipientState,
      recipientPostalCode,
      recipientCountry,
      declaredValue: Number(declaredValue),
      currency,
      shippingCost: Number(shippingCost),
      weightKg: Number(weightKg),
      itemsSummary: itemsSummary || 'Direct Manual Entry Consignment',
      dispatchDate: effectiveDispatchDate,
      promisedDeliveryDate: slaResult.promisedDeliveryDate,
      calculatedSlaHours: 48,
      slaCutoffUsed: defaultWarehouse?.cutoffTime || '16:00',
      slaCalculationDetail: slaResult.calculationDetail,
      isBreached: slaResult.isBreached,
      breachHours: slaResult.breachHours,
      stalledHours: 0,
      trackingStatus: 'IN_TRANSIT',
      investigationStatus: 'NONE',
      claimStatus: 'NOT_ELIGIBLE',
      recoveryStatus: 'UNPAID',
      customFieldValues: JSON.stringify(customFields),
      source: 'MANUAL',
    },
  });

  // Automatically register any new custom fields
  for (const [key, val] of Object.entries(customFields)) {
    const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const existing = await db.customField.findFirst({
      where: { organizationId, entityType: 'PARCEL', fieldKey: sanitizedKey },
    });
    if (!existing) {
      const label = key
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      await db.customField.create({
        data: {
          organizationId,
          entityType: 'PARCEL',
          fieldKey: sanitizedKey,
          fieldLabel: label,
          fieldType: typeof val === 'number' ? 'NUMBER' : 'TEXT',
          isRequired: false,
          isSearchable: true,
        },
      });
    }
  }

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'CREATED',
      entityType: 'PARCEL',
      entityId: parcel.id,
      details: JSON.stringify({
        trackingNumber,
        orderNumber,
        carrierCode: carrier.code,
        customFieldsCount: Object.keys(customFields).length,
      }),
    },
  });

  return parcel;
}
