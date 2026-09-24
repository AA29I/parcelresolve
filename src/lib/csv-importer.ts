import db from './db';
import { calculateSla } from './sla-calculator';
import { ingestTrackingEvents } from './tracking-engine';

export interface CsvPreviewResult {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalEstimatedRows: number;
  detectedMappings: Record<string, string>;
}

export interface CsvColumnMapping {
  trackingNumber: string;
  orderNumber: string;
  carrierCode: string;
  recipientName: string;
  recipientAddress: string;
  recipientCity?: string;
  recipientState?: string;
  recipientPostalCode?: string;
  recipientCountry?: string;
  dispatchDate: string;
  declaredValue?: string;
  currency?: string;
  shippingCost?: string;
  weightKg?: string;
  itemsSummary?: string;
  rawStatus?: string;
  customFields?: Record<string, string>; // mapping from CSV header to customField key
}

export interface RowError {
  rowNumber: number;
  field: string;
  message: string;
  raw: string;
}

export interface ImportExecutionResult {
  batchId: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: RowError[];
  insertedCount: number;
  updatedCount: number;
}

/**
 * Standard RFC-4180 compliant CSV parser
 */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Generates an interactive preview and automated field detection from CSV text
 */
export function previewCsvData(csvText: string): CsvPreviewResult {
  const parsed = parseCsvText(csvText);
  if (parsed.length === 0) {
    return { headers: [], sampleRows: [], totalEstimatedRows: 0, detectedMappings: {} };
  }

  const headers = parsed[0];
  const sampleRows: Record<string, string>[] = [];

  for (let i = 1; i < Math.min(parsed.length, 6); i++) {
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = parsed[i][idx] || '';
    });
    sampleRows.push(rowObj);
  }

  // Heuristic auto-mapping detection
  const detectedMappings: Record<string, string> = {};
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  headers.forEach((h) => {
    const norm = normalize(h);
    if (['trackingnumber', 'trackingno', 'tracking', 'consignmentno', 'waybill'].some((k) => norm.includes(k))) {
      detectedMappings.trackingNumber = h;
    } else if (['ordernumber', 'orderno', 'orderref', 'po', 'orderid'].some((k) => norm.includes(k))) {
      detectedMappings.orderNumber = h;
    } else if (['carrier', 'courier', 'carriername', 'shippingmethod'].some((k) => norm.includes(k))) {
      detectedMappings.carrierCode = h;
    } else if (['recipient', 'recipientname', 'customername', 'consignee', 'shipname'].some((k) => norm.includes(k))) {
      detectedMappings.recipientName = h;
    } else if (['address', 'shippingaddress', 'address1', 'street'].some((k) => norm.includes(k))) {
      detectedMappings.recipientAddress = h;
    } else if (['city', 'destinationcity'].some((k) => norm === k)) {
      detectedMappings.recipientCity = h;
    } else if (['state', 'province', 'region'].some((k) => norm === k)) {
      detectedMappings.recipientState = h;
    } else if (['postcode', 'postalcode', 'zip', 'zipcode'].some((k) => norm === k)) {
      detectedMappings.recipientPostalCode = h;
    } else if (['country', 'countrycode', 'destcountry'].some((k) => norm === k)) {
      detectedMappings.recipientCountry = h;
    } else if (['dispatchdate', 'shipdate', 'shippedat', 'orderdate'].some((k) => norm.includes(k))) {
      detectedMappings.dispatchDate = h;
    } else if (['declaredvalue', 'orderamount', 'total', 'value', 'price'].some((k) => norm.includes(k))) {
      detectedMappings.declaredValue = h;
    } else if (['currency', 'curr'].some((k) => norm === k)) {
      detectedMappings.currency = h;
    } else if (['weight', 'weightkg', 'itemweight'].some((k) => norm.includes(k))) {
      detectedMappings.weightKg = h;
    }
  });

  return {
    headers,
    sampleRows,
    totalEstimatedRows: Math.max(0, parsed.length - 1),
    detectedMappings,
  };
}

/**
 * Executes a full CSV import with validation, duplicate detection, upsert support, and row error reporting
 */
export async function executeCsvImport(params: {
  organizationId: string;
  fileName: string;
  csvText: string;
  mapping: CsvColumnMapping;
  mappingTemplateName?: string;
  defaultCarrierCode?: string;
  warehouseId?: string;
  userId?: string;
}): Promise<ImportExecutionResult> {
  const {
    organizationId,
    fileName,
    csvText,
    mapping,
    mappingTemplateName,
    defaultCarrierCode,
    warehouseId,
    userId,
  } = params;

  const parsed = parseCsvText(csvText);
  if (parsed.length <= 1) {
    throw new Error('CSV file contains no data rows.');
  }

  const headers = parsed[0];
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerIndexMap[h] = idx;
  });

  const getCol = (row: string[], colName?: string): string => {
    if (!colName || headerIndexMap[colName] === undefined) return '';
    return row[headerIndexMap[colName]] || '';
  };

  const carriers = await db.carrier.findMany({ where: { organizationId } });
  const carrierMapByCode = new Map(carriers.map((c) => [c.code.toUpperCase(), c]));
  const defaultCarrier = carriers.find((c) => c.isLive) || carriers[0];

  const defaultWarehouse = warehouseId
    ? await db.warehouse.findUnique({ where: { id: warehouseId } })
    : await db.warehouse.findFirst({ where: { organizationId, isDefault: true } });

  const errors: RowError[] = [];
  let insertedCount = 0;
  let updatedCount = 0;

  // Process rows
  for (let r = 1; r < parsed.length; r++) {
    const row = parsed[r];
    const rowNum = r + 1;

    const trackingNumber = getCol(row, mapping.trackingNumber).trim();
    if (!trackingNumber) {
      errors.push({
        rowNumber: rowNum,
        field: 'trackingNumber',
        message: 'Missing tracking number',
        raw: row.join(','),
      });
      continue;
    }

    const orderNumber = getCol(row, mapping.orderNumber).trim() || `ORD-${Date.now()}-${r}`;
    const rawCarrier = getCol(row, mapping.carrierCode).trim().toUpperCase();
    const carrier =
      carrierMapByCode.get(rawCarrier) ||
      (defaultCarrierCode ? carrierMapByCode.get(defaultCarrierCode.toUpperCase()) : null) ||
      defaultCarrier;

    if (!carrier) {
      errors.push({
        rowNumber: rowNum,
        field: 'carrierCode',
        message: `Carrier "${rawCarrier || defaultCarrierCode}" not recognized in workspace`,
        raw: row.join(','),
      });
      continue;
    }

    const recipientName = getCol(row, mapping.recipientName).trim() || 'Valued Customer';
    const recipientAddress = getCol(row, mapping.recipientAddress).trim() || 'Direct Dispatch';
    const recipientCity = getCol(row, mapping.recipientCity).trim() || 'Logistics Destination';
    const recipientState = getCol(row, mapping.recipientState).trim() || '';
    const recipientPostalCode = getCol(row, mapping.recipientPostalCode).trim() || '00000';
    const recipientCountry = getCol(row, mapping.recipientCountry).trim() || 'US';

    const rawDispatch = getCol(row, mapping.dispatchDate).trim();
    let dispatchDate = new Date();
    if (rawDispatch) {
      const parsedDate = new Date(rawDispatch);
      if (!isNaN(parsedDate.getTime())) {
        dispatchDate = parsedDate;
      }
    }

    const declaredValue = parseFloat(getCol(row, mapping.declaredValue)) || 50.0;
    const shippingCost = parseFloat(getCol(row, mapping.shippingCost)) || 8.5;
    const weightKg = parseFloat(getCol(row, mapping.weightKg)) || 1.2;
    const currency = getCol(row, mapping.currency).trim().toUpperCase() || 'USD';
    const itemsSummary = getCol(row, mapping.itemsSummary).trim() || 'Manifest Goods';

    // Parse custom fields mapped
    const customValues: Record<string, string> = {};
    if (mapping.customFields) {
      for (const [key, col] of Object.entries(mapping.customFields)) {
        customValues[key] = getCol(row, col).trim();
      }
    }

    // SLA calculation
    const slaHours = 48;
    const slaResult = calculateSla({
      dispatchDate,
      cutoffTime: defaultWarehouse?.cutoffTime || '16:00',
      slaHours,
      currentCheckTime: new Date(),
    });

    // Check if parcel already exists (Upsert)
    const existing = await db.parcel.findUnique({
      where: {
        organizationId_trackingNumber: {
          organizationId,
          trackingNumber,
        },
      },
    });

    if (existing) {
      // Update existing parcel
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
          itemsSummary,
          customFieldValues: JSON.stringify({
            ...JSON.parse(existing.customFieldValues || '{}'),
            ...customValues,
          }),
          updatedAt: new Date(),
        },
      });
      updatedCount++;

      // If row specifies a tracking update
      const rawStatus = getCol(row, mapping.rawStatus).trim();
      if (rawStatus) {
        await ingestTrackingEvents({
          organizationId,
          parcelId: existing.id,
          source: 'IMPORT',
          rawPayload: JSON.stringify({ sourceRow: rowNum, status: rawStatus }),
          events: [
            {
              eventCode: 'IMPORT_SCAN',
              rawStatus,
              statusDescription: `Status updated via import (${rawStatus})`,
              eventTimestamp: new Date(),
            },
          ],
        });
      }
    } else {
      // Create new parcel
      const newParcel = await db.parcel.create({
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
          dispatchDate,
          promisedDeliveryDate: slaResult.promisedDeliveryDate,
          calculatedSlaHours: slaHours,
          slaCutoffUsed: defaultWarehouse?.cutoffTime || '16:00',
          slaCalculationDetail: slaResult.calculationDetail,
          isBreached: slaResult.isBreached,
          breachHours: slaResult.breachHours,
          trackingStatus: 'MANIFEST_CREATED',
          investigationStatus: 'NONE',
          claimStatus: 'NOT_ELIGIBLE',
          recoveryStatus: 'UNPAID',
          declaredValue,
          currency,
          shippingCost,
          weightKg,
          itemsSummary,
          source: 'CSV_IMPORT',
          customFieldValues: JSON.stringify(customValues),
        },
      });

      // Insert initial manifest tracking event
      await ingestTrackingEvents({
        organizationId,
        parcelId: newParcel.id,
        source: 'IMPORT',
        rawPayload: JSON.stringify({ file: fileName, row: rowNum }),
        events: [
          {
            eventCode: 'MANIFEST',
            rawStatus: 'MANIFEST_CREATED',
            normalizedStatus: 'MANIFEST_CREATED',
            statusDescription: 'Electronic shipping info received and recorded from manifest import.',
            eventTimestamp: dispatchDate,
            locationCity: defaultWarehouse?.city || 'Warehouse Hub',
          },
        ],
      });

      insertedCount++;
    }
  }

  const totalRows = parsed.length - 1;
  const successRows = insertedCount + updatedCount;
  const errorRows = errors.length;

  // Record batch record in db
  const batch = await db.importBatch.create({
    data: {
      organizationId,
      fileName,
      fileFormat: 'CSV',
      totalRows,
      processedRows: totalRows,
      successRows,
      errorRows,
      errorLog: JSON.stringify(errors),
      mappingTemplateName: mappingTemplateName || null,
      fieldMapping: JSON.stringify(mapping),
      status: errorRows === 0 ? 'COMPLETED' : successRows > 0 ? 'COMPLETED' : 'FAILED',
      createdById: userId || null,
    },
  });

  return {
    batchId: batch.id,
    totalRows,
    successRows,
    errorRows,
    errors,
    insertedCount,
    updatedCount,
  };
}

/**
 * Generates formatted CSV text for parcel exports with filtering
 */
export async function exportParcelsToCsv(params: {
  organizationId: string;
  statusFilter?: string;
  carrierId?: string;
  isBreached?: boolean;
}): Promise<string> {
  const { organizationId, statusFilter, carrierId, isBreached } = params;

  const where: Record<string, unknown> = { organizationId };
  if (statusFilter && statusFilter !== 'ALL') where.trackingStatus = statusFilter;
  if (carrierId && carrierId !== 'ALL') where.carrierId = carrierId;
  if (isBreached !== undefined) where.isBreached = isBreached;

  const parcels = await db.parcel.findMany({
    where,
    include: { carrier: true, warehouse: true },
    orderBy: { dispatchDate: 'desc' },
  });

  const headers = [
    'Tracking Number',
    'Order Number',
    'Carrier',
    'Tracking Status',
    'Investigation Status',
    'Claim Status',
    'Recovery Status',
    'Dispatched At',
    'Promised Delivery Date',
    'SLA Breached',
    'Breach Hours',
    'Recipient Name',
    'Destination City',
    'Destination Country',
    'Declared Value',
    'Currency',
    'Last Physical Scan',
    'Last Scan Location',
  ];

  const escapeCol = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = parcels.map((p) => [
    escapeCol(p.trackingNumber),
    escapeCol(p.orderNumber),
    escapeCol(p.carrier.name),
    escapeCol(p.trackingStatus),
    escapeCol(p.investigationStatus),
    escapeCol(p.claimStatus),
    escapeCol(p.recoveryStatus),
    escapeCol(p.dispatchDate.toISOString()),
    escapeCol(p.promisedDeliveryDate.toISOString()),
    escapeCol(p.isBreached ? 'YES' : 'NO'),
    escapeCol(p.breachHours),
    escapeCol(p.recipientName),
    escapeCol(p.recipientCity),
    escapeCol(p.recipientCountry),
    escapeCol(p.declaredValue),
    escapeCol(p.currency),
    escapeCol(p.lastPhysicalScanAt ? p.lastPhysicalScanAt.toISOString() : ''),
    escapeCol(p.lastScanLocation || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
