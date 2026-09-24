import db from './db';
import { PlatformTrackingStatus, IngestTrackingEventInput } from './tracking-engine';

export type CarrierConnectionType =
  | 'LIVE_API'
  | 'CONFIGURABLE_API'
  | 'NEEDS_CUSTOM_ADAPTER'
  | 'FILE_IMPORT';

export interface CarrierCatalogItem {
  code: string;
  name: string;
  category: 'DIRECT_COURIER' | 'AGGREGATOR' | '3PL';
  connectionType: CarrierConnectionType;
  capabilities: {
    lookup: boolean;
    webhook: boolean;
    pod: boolean;
    claim: boolean;
  };
  supportedAuth: string[];
  description: string;
  notes: string;
}

export const CARRIER_CATALOG: CarrierCatalogItem[] = [
  {
    code: 'UPS',
    name: 'UPS Worldwide',
    category: 'DIRECT_COURIER',
    connectionType: 'LIVE_API',
    capabilities: { lookup: true, webhook: true, pod: true, claim: true },
    supportedAuth: ['OAUTH2_CLIENT_CREDENTIALS', 'API_KEY'],
    description: 'Direct integration with UPS REST Tracking and Paperless Claims API.',
    notes: 'Requires UPS Developer Portal credentials (Client ID & Secret). Webhook requires SSL push endpoint.',
  },
  {
    code: 'USPS',
    name: 'US Postal Service (USPS Web Tools)',
    category: 'DIRECT_COURIER',
    connectionType: 'CONFIGURABLE_API',
    capabilities: { lookup: true, webhook: false, pod: true, claim: false },
    supportedAuth: ['API_KEY'],
    description: 'USPS Web Tools Tracking & Electronic Proof of Delivery API.',
    notes: 'Supports automated polling. Claims must be submitted via USPS Mail Online portal.',
  },
  {
    code: 'ESHIPPER',
    name: 'eShipper Multi-Carrier Aggregator',
    category: 'AGGREGATOR',
    connectionType: 'LIVE_API',
    capabilities: { lookup: true, webhook: true, pod: true, claim: true },
    supportedAuth: ['BEARER', 'API_KEY'],
    description: 'Canadian & Cross-Border shipping aggregator with unified tracking and claims.',
    notes: 'Handles sub-couriers (Canada Post, Purolator, FedEx, UPS) under one master contract.',
  },
  {
    code: 'GLS',
    name: 'GLS Logistics (Europe & US)',
    category: 'DIRECT_COURIER',
    connectionType: 'CONFIGURABLE_API',
    capabilities: { lookup: true, webhook: true, pod: true, claim: false },
    supportedAuth: ['API_KEY', 'BEARER'],
    description: 'European and West-Coast US parcel distribution network.',
    notes: 'Configurable REST connector for tracking and POD signature retrieval.',
  },
  {
    code: 'DPD',
    name: 'DPDgroup / Geopost',
    category: 'DIRECT_COURIER',
    connectionType: 'NEEDS_CUSTOM_ADAPTER',
    capabilities: { lookup: true, webhook: false, pod: true, claim: false },
    supportedAuth: ['SOAP_WS_SECURITY', 'API_KEY'],
    description: 'Major European parcel network with country-specific legacy gateways.',
    notes: 'Requires country-specific SOAP/REST adapter via Extension SDK.',
  },
  {
    code: 'PARCELFORCE',
    name: 'Parcelforce Worldwide',
    category: 'DIRECT_COURIER',
    connectionType: 'NEEDS_CUSTOM_ADAPTER',
    capabilities: { lookup: true, webhook: false, pod: true, claim: false },
    supportedAuth: ['SOAP_XML'],
    description: 'UK and international express courier service.',
    notes: 'Uses SOAP XML Web Services with complex WS-Security signing.',
  },
  {
    code: 'DHL',
    name: 'DHL Express & eCommerce',
    category: 'DIRECT_COURIER',
    connectionType: 'CONFIGURABLE_API',
    capabilities: { lookup: true, webhook: true, pod: true, claim: true },
    supportedAuth: ['API_KEY', 'BEARER'],
    description: 'Global express courier and fulfillment network.',
    notes: 'Supports REST Unified Tracking API and POD downloads.',
  },
  {
    code: 'AP2P',
    name: 'AP2P Freight & Parcel',
    category: '3PL',
    connectionType: 'FILE_IMPORT',
    capabilities: { lookup: false, webhook: false, pod: false, claim: false },
    supportedAuth: ['FILE_IMPORT'],
    description: 'Regional freight and parcel consolidator.',
    notes: 'No public REST API available; tracking updates provided via daily CSV/EDI dispatch reports.',
  },
];

/**
 * Extracts a value from a nested JSON object using dot notation (e.g., "shipment.status.code")
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export interface ConnectorTestResult {
  success: boolean;
  requestUrl: string;
  statusCode: number;
  rawResponse: unknown;
  normalizedStatus: PlatformTrackingStatus;
  normalizedEvents: IngestTrackingEventInput[];
  errorMessage?: string;
}

/**
 * Executes a simulated or real HTTP request for a custom carrier connector
 */
export async function testCarrierConnector(config: {
  baseUrl: string;
  trackingEndpoint: string;
  authType: string;
  authSecret?: string;
  headersTemplate?: string;
  trackingNumberParam: string;
  sampleTrackingNumber: string;
  responseStatusPath: string;
  responseTimestampPath: string;
  responseLocationPath: string;
  responseMessagePath: string;
  responseEventsArrayPath?: string;
  statusCodeMap: Record<string, string>;
}): Promise<ConnectorTestResult> {
  const {
    baseUrl,
    trackingEndpoint,
    sampleTrackingNumber,
    responseStatusPath,
    responseTimestampPath,
    responseLocationPath,
    responseMessagePath,
    statusCodeMap,
  } = config;

  const endpoint = trackingEndpoint.replace('{trackingNumber}', encodeURIComponent(sampleTrackingNumber));
  const fullUrl = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  // If the target is our built-in mock endpoint or local test harness, simulate carrier response
  if (baseUrl.includes('courier-mock') || baseUrl.includes('localhost') || !baseUrl.startsWith('http')) {
    const mockRawResponse = {
      shipment: {
        trackingNumber: sampleTrackingNumber,
        status: {
          code: 'IT',
          label: 'In Transit',
        },
        currentLocation: 'East Coast Distribution Center, Newark, NJ',
        lastUpdated: new Date().toISOString(),
        events: [
          {
            code: 'PU',
            timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
            location: 'Warehouse Dock A',
            description: 'Package picked up from merchant facility',
          },
          {
            code: 'IT',
            timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
            location: 'East Coast Distribution Center, Newark, NJ',
            description: 'Scanned into automated transit hub',
          },
        ],
      },
    };

    const rawStatus = String(getNestedValue(mockRawResponse, responseStatusPath) || 'IT');
    const normalizedStatus: PlatformTrackingStatus =
      (statusCodeMap[rawStatus] as PlatformTrackingStatus) || 'IN_TRANSIT';

    const rawEvents = (getNestedValue(mockRawResponse, config.responseEventsArrayPath || 'shipment.events') as Record<string, unknown>[]) || [];
    const normalizedEvents: IngestTrackingEventInput[] = rawEvents.map((e) => ({
      eventCode: String(e.code || 'SCAN'),
      rawStatus: String(e.code || 'SCAN'),
      normalizedStatus: (statusCodeMap[String(e.code)] as PlatformTrackingStatus) || 'IN_TRANSIT',
      statusDescription: String(e.description || 'Scan event'),
      locationCity: String(e.location || 'Hub Location'),
      eventTimestamp: String(e.timestamp || new Date().toISOString()),
      isPhysicalScan: true,
    }));

    return {
      success: true,
      requestUrl: fullUrl,
      statusCode: 200,
      rawResponse: mockRawResponse,
      normalizedStatus,
      normalizedEvents,
    };
  }

  // Live fetch implementation with timeouts
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'ParcelResolve-Connector-Engine/1.0',
    };

    if (config.authType === 'BEARER' && config.authSecret) {
      headers['Authorization'] = `Bearer ${config.authSecret}`;
    } else if (config.authType === 'API_KEY' && config.authSecret) {
      headers['x-api-key'] = config.authSecret;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(fullUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();
    const rawStatus = String(getNestedValue(data, responseStatusPath) || '');
    const normalizedStatus: PlatformTrackingStatus =
      (statusCodeMap[rawStatus] as PlatformTrackingStatus) || 'IN_TRANSIT';

    const timestamp = String(getNestedValue(data, responseTimestampPath) || new Date().toISOString());
    const location = String(getNestedValue(data, responseLocationPath) || '');
    const message = String(getNestedValue(data, responseMessagePath) || 'Tracking update received');

    return {
      success: res.ok,
      requestUrl: fullUrl,
      statusCode: res.status,
      rawResponse: data,
      normalizedStatus,
      normalizedEvents: [
        {
          eventCode: rawStatus || 'SCAN',
          rawStatus,
          normalizedStatus,
          statusDescription: message,
          locationCity: location,
          eventTimestamp: timestamp,
          isPhysicalScan: true,
        },
      ],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      requestUrl: fullUrl,
      statusCode: 500,
      rawResponse: null,
      normalizedStatus: 'EXCEPTION',
      normalizedEvents: [],
      errorMessage: message,
    };
  }
}

/**
 * Rolls back a connector to a previously published version snapshot
 */
export async function rollbackConnector(
  organizationId: string,
  connectorId: string
): Promise<{ success: boolean; message: string; connector?: unknown }> {
  const connector = await db.carrierConnector.findFirst({
    where: { id: connectorId, organizationId },
  });

  if (!connector) {
    return { success: false, message: 'Connector not found' };
  }

  if (!connector.rollbackVersionId) {
    return { success: false, message: 'No rollback snapshot available for this connector' };
  }

  // Restore snapshot
  const previous = await db.carrierConnector.findUnique({
    where: { id: connector.rollbackVersionId },
  });

  if (!previous) {
    return { success: false, message: 'Historical version record could not be located' };
  }

  const updated = await db.carrierConnector.update({
    where: { id: connectorId },
    data: {
      status: 'ROLLED_BACK',
      baseUrl: previous.baseUrl,
      trackingEndpoint: previous.trackingEndpoint,
      headersTemplate: previous.headersTemplate,
      queryParamsTemplate: previous.queryParamsTemplate,
      responseStatusPath: previous.responseStatusPath,
      responseTimestampPath: previous.responseTimestampPath,
      responseLocationPath: previous.responseLocationPath,
      responseMessagePath: previous.responseMessagePath,
      statusCodeMap: previous.statusCodeMap,
      minPollIntervalMinutes: previous.minPollIntervalMinutes,
      version: connector.version + 1,
      updatedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      action: 'WORKFLOW_ROLLEDBACK',
      entityType: 'CONNECTOR',
      entityId: connectorId,
      details: JSON.stringify({
        restoredFromVersion: previous.version,
        newVersion: updated.version,
      }),
    },
  });

  return {
    success: true,
    message: `Connector successfully rolled back to version ${previous.version} state.`,
    connector: updated,
  };
}
