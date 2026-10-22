import { PlatformTrackingStatus, IngestTrackingEventInput } from './tracking-engine';

export interface AdapterTrackingResult {
  carrierCode: string;
  trackingNumber: string;
  normalizedStatus: PlatformTrackingStatus;
  statusDescription: string;
  events: IngestTrackingEventInput[];
  rawResponsePayload: unknown;
}

export interface AdapterClaimParams {
  claimNumber: string;
  trackingNumber: string;
  reason: string;
  claimedAmount: number;
  currency: string;
  lossDeclarationText: string;
}

export interface AdapterClaimResult {
  success: boolean;
  carrierClaimReference: string;
  filingStatus: string;
  acknowledgmentMessage: string;
}

/**
 * Standard Carrier Adapter interface for custom code extensions (SOAP, custom crypto, legacy EDI)
 */
export interface CarrierAdapterDefinition {
  id: string;
  name: string;
  carrierCode: string;
  version: string;
  track(trackingNumber: string, credentials: Record<string, string>): Promise<AdapterTrackingResult>;
  submitClaim?(params: AdapterClaimParams, credentials: Record<string, string>): Promise<AdapterClaimResult>;
}

/**
 * Sample Built-in DPD Custom Code Adapter (Demonstrates Extension SDK)
 */
export const DpdAdapterSample: CarrierAdapterDefinition = {
  id: 'adapter-dpd-geopost-v1',
  name: 'DPD Geopost European Adapter',
  carrierCode: 'DPD',
  version: '1.2.0',
  async track(trackingNumber: string, credentials: Record<string, string>): Promise<AdapterTrackingResult> {
    const geoToken = credentials.geoToken || 'sample_token';
    const now = new Date();

    return {
      carrierCode: 'DPD',
      trackingNumber,
      normalizedStatus: 'IN_TRANSIT',
      statusDescription: 'In transit at DPD Hub 0150 (Aschaffenburg)',
      events: [
        {
          eventCode: 'COLLECTED',
          rawStatus: 'COLLECTED',
          normalizedStatus: 'PICKED_UP',
          statusDescription: 'Consignment collected from sender',
          locationCity: 'Stuttgart',
          locationCountry: 'DE',
          eventTimestamp: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
          carrierEventId: `DPD-COL-${trackingNumber.slice(-4)}`,
        },
        {
          eventCode: 'IN_TRANSIT',
          rawStatus: 'HUB_SORT',
          normalizedStatus: 'IN_TRANSIT',
          statusDescription: 'Consignment sorted at DPD Hub 0150',
          locationCity: 'Aschaffenburg',
          locationCountry: 'DE',
          eventTimestamp: new Date(now.getTime() - 8 * 3600 * 1000).toISOString(),
          carrierEventId: `DPD-HUB-${trackingNumber.slice(-4)}`,
        },
      ],
      rawResponsePayload: {
        dpdHeader: { token: geoToken ? '***VALID***' : 'EMPTY' },
        trackingResult: {
          consignmentNo: trackingNumber,
          depot: '0150',
          statusCode: 'HUB_SORT',
        },
      },
    };
  },
};

/**
 * Safe test harness for executing and asserting custom carrier adapters
 */
export async function runAdapterTestHarness(
  adapter: CarrierAdapterDefinition,
  sampleTrackingNumber: string,
  testCredentials: Record<string, string>
): Promise<{
  passed: boolean;
  durationMs: number;
  result?: AdapterTrackingResult;
  assertionErrors: string[];
}> {
  const start = Date.now();
  const assertionErrors: string[] = [];

  try {
    const result = await adapter.track(sampleTrackingNumber, testCredentials);
    const durationMs = Date.now() - start;

    if (!result.trackingNumber || result.trackingNumber !== sampleTrackingNumber) {
      assertionErrors.push(`Tracking number mismatch: expected ${sampleTrackingNumber}, got ${result.trackingNumber}`);
    }
    if (!result.normalizedStatus) {
      assertionErrors.push('Missing normalizedStatus');
    }
    if (!Array.isArray(result.events) || result.events.length === 0) {
      assertionErrors.push('Adapter returned empty events array');
    }

    return {
      passed: assertionErrors.length === 0,
      durationMs,
      result,
      assertionErrors,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    assertionErrors.push(`Adapter threw unhandled exception: ${msg}`);
    return {
      passed: false,
      durationMs,
      assertionErrors,
    };
  }
}
