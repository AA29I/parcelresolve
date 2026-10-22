import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../src/lib/db';
import { calculateSla, isWeekend } from '../src/lib/sla-calculator';
import { normalizeCarrierStatus } from '../src/lib/tracking-engine';
import { signWebhookPayload, verifyWebhookSignature } from '../src/lib/webhook-dispatcher';
import { getNestedValue, testCarrierConnector } from '../src/lib/carrier-connectors';
import { evaluateClaimEligibility, generateClaimDeclarationText } from '../src/lib/claim-manager';
import { parseCsvText, previewCsvData } from '../src/lib/csv-importer';
import { saveWorkflowRuleWithVersion, rollbackWorkflowRule } from '../src/lib/workflow-engine';

describe('ParcelResolve Core Engine Test Suite', () => {
  let orgA: any;
  let orgB: any;

  beforeAll(async () => {
    orgA = await db.organization.findUnique({ where: { slug: 'apex-global' } });
    orgB = await db.organization.findUnique({ where: { slug: 'nordic-craft' } });
  });

  // 1. Strict Multi-Tenant Isolation
  describe('Multi-Tenant Data Isolation', () => {
    it('should maintain strict database separation between Company A and Company B parcels', async () => {
      expect(orgA).toBeDefined();
      expect(orgB).toBeDefined();

      const parcelsOrgA = await db.parcel.findMany({ where: { organizationId: orgA.id } });
      const parcelsOrgB = await db.parcel.findMany({ where: { organizationId: orgB.id } });

      expect(parcelsOrgA.length).toBeGreaterThan(0);
      expect(parcelsOrgB.length).toBeGreaterThan(0);

      // Verify no cross-tenant contamination
      const orgATrackingNumbers = new Set(parcelsOrgA.map((p) => p.trackingNumber));
      const orgBTrackingNumbers = new Set(parcelsOrgB.map((p) => p.trackingNumber));

      for (const tn of orgATrackingNumbers) {
        expect(orgBTrackingNumbers.has(tn)).toBe(false);
      }
    });

    it('should isolate custom fields per tenant', async () => {
      const fieldsA = await db.customField.findMany({ where: { organizationId: orgA.id } });
      const fieldsB = await db.customField.findMany({ where: { organizationId: orgB.id } });

      const keysA = fieldsA.map((f) => f.fieldKey);
      const keysB = fieldsB.map((f) => f.fieldKey);

      expect(keysA).toContain('priority_tier');
      expect(keysA).toContain('hazard_class');

      expect(keysB).toContain('customs_declaration_no');
      expect(keysB).toContain('eco_packaging_cert');

      // Neither workspace has the other's fields
      expect(keysA).not.toContain('customs_declaration_no');
      expect(keysB).not.toContain('priority_tier');
    });

    it('should isolate claim records between companies', async () => {
      const claimsA = await db.claim.findMany({ where: { organizationId: orgA.id } });
      const claimsB = await db.claim.findMany({ where: { organizationId: orgB.id } });

      for (const clm of claimsA) {
        expect(clm.organizationId).toBe(orgA.id);
        expect(clm.organizationId).not.toBe(orgB.id);
      }
    });
  });

  // 2. SLA Engine Calculations
  describe('SLA Engine & Business Day Calculations', () => {
    it('should skip weekends when calculating business days deadline', () => {
      // Dispatch on Friday morning at 10:00 AM (well before 16:00 cutoff)
      // 48 business hours = 2 business days. Skips Saturday & Sunday. Deadline must be Tuesday.
      const fridayDispatch = new Date(2026, 8, 18, 10, 0);
      const slaResult = calculateSla({
        dispatchDate: fridayDispatch,
        cutoffTime: '16:00',
        slaHours: 48,
        calendarType: 'BUSINESS_DAYS',
        weekendHandling: 'SKIP_WEEKENDS',
        currentCheckTime: new Date(2026, 8, 23, 18, 0),
      });

      expect(slaResult.promisedDeliveryDate.getDay()).toBe(2); // Tuesday
      expect(slaResult.isBreached).toBe(true);
      expect(slaResult.calculationDetail).toContain('Skipped non-business day');
    });

    it('should detect when parcel is delivered on-time', () => {
      const dispatch = new Date('2026-09-21T10:00:00Z'); // Monday
      const delivery = new Date('2026-09-22T14:00:00Z'); // Tuesday (within 48h)

      const slaResult = calculateSla({
        dispatchDate: dispatch,
        cutoffTime: '16:00',
        slaHours: 48,
        deliveryDate: delivery,
      });

      expect(slaResult.isBreached).toBe(false);
      expect(slaResult.breachHours).toBe(0);
      expect(slaResult.calculationDetail).toContain('ON TIME');
    });
  });

  // 3. Webhook HMAC Signatures
  describe('Outbound Webhook Signatures', () => {
    it('should correctly sign and verify HMAC-SHA256 payload signatures', () => {
      const secretKey = 'test_webhook_shared_secret_key_8849';
      const payload = JSON.stringify({ event: 'parcel.delivered', trackingNumber: '1Z999TEST' });

      const signature = signWebhookPayload(payload, secretKey);
      expect(signature).toBeDefined();
      expect(signature.length).toBe(64); // SHA-256 hex string

      const isValid = verifyWebhookSignature(payload, signature, secretKey);
      expect(isValid).toBe(true);

      const isInvalidTampered = verifyWebhookSignature(payload + 'tampered', signature, secretKey);
      expect(isInvalidTampered).toBe(false);
    });
  });

  // 4. Dot-Notation JSONPath Extractor for Connector Builder
  describe('REST Connector Builder JSONPath Parser', () => {
    it('should extract deeply nested values using dot notation', () => {
      const sampleCarrierResponse = {
        shipment: {
          identification: {
            consignmentNumber: '1Z999XYZ',
          },
          status: {
            code: 'IT',
            description: 'Package in transit',
          },
        },
      };

      const extractedCode = getNestedValue(sampleCarrierResponse, 'shipment.status.code');
      const extractedDesc = getNestedValue(sampleCarrierResponse, 'shipment.status.description');
      const missing = getNestedValue(sampleCarrierResponse, 'shipment.nonexistent.field');

      expect(extractedCode).toBe('IT');
      expect(extractedDesc).toBe('Package in transit');
      expect(missing).toBeUndefined();
    });

    it('should correctly normalize carrier status codes', () => {
      expect(normalizeCarrierStatus('DL')).toBe('DELIVERED');
      expect(normalizeCarrierStatus('DELIVERED TO PORCH')).toBe('DELIVERED');
      expect(normalizeCarrierStatus('OFD')).toBe('OUT_FOR_DELIVERY');
      expect(normalizeCarrierStatus('WEATHER DELAY')).toBe('EXCEPTION');
      expect(normalizeCarrierStatus('LOST IN TRANSIT')).toBe('LOST');
    });
  });

  // 5. Claims Declaration Disclaimer
  describe('Claims Statutory Declaration Compliance', () => {
    it('should generate official declaration with mandatory non-invoice disclaimer', () => {
      const decl = generateClaimDeclarationText({
        claimNumber: 'CLM-TEST-001',
        trackingNumber: '1Z999TEST',
        orderNumber: 'ORD-101',
        carrierName: 'UPS Worldwide',
        contractedParty: 'Apex Logistics',
        recipientName: 'John Doe',
        recipientAddress: '100 Main St, New York, NY',
        declaredValue: 250,
        shippingCost: 20,
        totalClaimed: 270,
        currency: 'USD',
        itemsSummary: 'Industrial Valves',
        reason: 'LOST_IN_TRANSIT',
        companyName: 'Apex Global',
      });

      expect(decl).toContain('OFFICIAL CARRIER CLAIM DECLARATION / LOSS STATEMENT');
      expect(decl).toContain('ORIGINAL COMMERCIAL SALES INVOICE');
      expect(decl).toContain('USD 270.00');
    });
  });

  // 6. CSV Parser RFC-4180 Compliance
  describe('CSV Parser & Preview Engine', () => {
    it('should parse quoted fields with commas correctly', () => {
      const raw = `tracking,order,recipient,address\n"1Z99901","ORD-1","Smith, John","123 Main St, Apt 4"`;
      const parsed = parseCsvText(raw);

      expect(parsed.length).toBe(2);
      expect(parsed[1][0]).toBe('1Z99901');
      expect(parsed[1][2]).toBe('Smith, John');
      expect(parsed[1][3]).toBe('123 Main St, Apt 4');
    });

    it('should auto-detect standard shipping headers', () => {
      const raw = `tracking_number,order_reference,recipient_name,dispatch_date\n1Z01,ORD-1,Alice,2026-09-01`;
      const preview = previewCsvData(raw);

      expect(preview.detectedMappings.trackingNumber).toBe('tracking_number');
      expect(preview.detectedMappings.orderNumber).toBe('order_reference');
      expect(preview.detectedMappings.recipientName).toBe('recipient_name');
    });
  });

  // 7. Workflow Engine Versioning and Rollback
  describe('Workflow Engine Versioning & Rollback', () => {
    it('should create version snapshots and successfully rollback to earlier version', async () => {
      // Create initial rule (v1)
      const rule = await saveWorkflowRuleWithVersion({
        organizationId: orgA.id,
        name: 'Test Rollback Rule',
        triggerEvent: 'SLA_BREACHED',
        conditions: [{ field: 'breachHours', operator: 'GREATER_THAN', value: 10 }],
        actions: [{ type: 'CREATE_ENQUIRY_DRAFT', parameters: {} }],
        changeNotes: 'Initial v1 setup',
      });

      expect(rule.version).toBe(1);

      // Update rule (v2)
      const updatedRule = await saveWorkflowRuleWithVersion({
        organizationId: orgA.id,
        ruleId: rule.id,
        name: 'Updated Test Rule v2',
        triggerEvent: 'SLA_BREACHED',
        conditions: [{ field: 'breachHours', operator: 'GREATER_THAN', value: 24 }],
        actions: [{ type: 'AUTO_SEND_ENQUIRY', parameters: {} }],
        changeNotes: 'Changed to 24h auto send',
      });

      expect(updatedRule.version).toBe(2);

      // Rollback to v1
      const rolledBack = await rollbackWorkflowRule(orgA.id, rule.id, 1);

      expect(rolledBack.version).toBe(3); // New version capturing the rollback
      const conditions = JSON.parse(rolledBack.conditions);
      expect(conditions[0].value).toBe(10); // Restored v1 condition threshold!
    });
  });
});
