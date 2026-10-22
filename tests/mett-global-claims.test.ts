import { describe, it, expect, beforeAll } from 'vitest';
import db from '../src/lib/db';
import { executeDynamicParcelImport } from '../src/lib/dynamic-parcel-importer';
import { generateAutoClaimInvoice } from '../src/lib/invoice-generator';
import { sendCarrierEmail } from '../src/lib/email-service';

describe('Mett Global Logistics Claims & Ingestion Engine Suite', () => {
  let mettOrg: any;
  let royalMailCarrier: any;
  let dpdCarrier: any;
  let evriCarrier: any;

  beforeAll(async () => {
    mettOrg = await db.organization.findUnique({ where: { slug: 'mett-global' } });
    if (!mettOrg) {
      // Fallback to any existing organization
      mettOrg = await db.organization.findFirst();
    }

    royalMailCarrier = await db.carrier.findFirst({
      where: { organizationId: mettOrg.id, code: 'ROYAL_MAIL' },
    });
    dpdCarrier = await db.carrier.findFirst({
      where: { organizationId: mettOrg.id, code: 'DPD' },
    });
    evriCarrier = await db.carrier.findFirst({
      where: { organizationId: mettOrg.id, code: 'EVRI' },
    });
  });

  describe('Linnworks & Courier Performance Report Ingestion', () => {
    it('should ingest and map 20 standard courier performance columns without dropping data', async () => {
      const syntheticReportRow = {
        'OrderId': '8789001',
        'Order Date': '2026-10-15',
        'Processed': '2026-10-15',
        'Day': 'Thursday',
        'Country': 'United Kingdom',
        'Source': 'SHOPIFY',
        'ReferenceNum': 'PO-METT-9901',
        'Postal Service': 'Royal Mail Tracked 24',
        'Tracking Number': 'MG-RM-2026-001',
        'Latest Update': 'National Hub Sorting Dormant',
        'Status': 'More Than 3 Days Late',
        'Date': '2026-10-17',
        'SLA': 1,
        'Estimated Delivery Date': '2026-10-16',
        'Formula Days Count': -5,
        'SLA For Claims': 12,
        'Courier Name': 'Royal Mail',
      };

      const result = await executeDynamicParcelImport({
        organizationId: mettOrg.id,
        rows: [syntheticReportRow],
      });

      expect(result.totalRows).toBe(1);

      // Verify the parcel was stored with correct fields
      const parcel = await db.parcel.findUnique({
        where: {
          organizationId_trackingNumber: {
            organizationId: mettOrg.id,
            trackingNumber: 'MG-RM-2026-001',
          },
        },
        include: { carrier: true },
      });

      expect(parcel).toBeDefined();
      expect(parcel?.orderNumber).toBe('8789001');
      expect(parcel?.sourceChannel).toBe('SHOPIFY');
      expect(parcel?.channelReference).toBe('PO-METT-9901');
      expect(parcel?.postalServiceName).toBe('Royal Mail Tracked 24');
      expect(parcel?.recipientCountry).toBe('United Kingdom');
      expect(parcel?.isBreached).toBe(true);
      expect(parcel?.claimStatus).toBe('ELIGIBLE'); // 12 days > Royal Mail 10 days statutory threshold
      expect(parcel?.carrier.code).toBe('ROYAL_MAIL');
    });
  });

  describe('Carrier Claim Commercial Invoice Pricing Rules', () => {
    it('should calculate Royal Mail claims at Wholesale Cost of Goods', async () => {
      // Create test parcel for Royal Mail with £120 declared retail value
      const testParcel = await db.parcel.create({
        data: {
          organizationId: mettOrg.id,
          carrierId: royalMailCarrier.id,
          orderNumber: 'ORD-RM-TEST',
          trackingNumber: `RM-TEST-${Date.now()}`,
          recipientName: 'UK Wholesale Customer',
          recipientAddress: '10 High St, London',
          recipientCity: 'London',
          recipientState: 'Greater London',
          recipientPostalCode: 'EC1A 1BB',
          recipientCountry: 'GB',
          declaredValue: 120.0,
          shippingCost: 8.5,
          dispatchDate: new Date('2026-10-01'),
          promisedDeliveryDate: new Date('2026-10-03'),
          trackingStatus: 'LOST',
          claimStatus: 'ELIGIBLE',
          itemsJson: JSON.stringify([
            {
              sku: 'SKU-001',
              name: 'Wholesale Leather Gear',
              quantity: 1,
              unitPrice: 120.0,
              wholesaleCost: 60.0, // 50% cost of goods
              vatRate: 20.0,
            },
          ]),
        },
      });

      const invoice = await generateAutoClaimInvoice({
        organizationId: mettOrg.id,
        parcelId: testParcel.id,
      });

      expect(invoice).toBeDefined();
      expect(invoice.carrierFormat).toBe('ROYAL_MAIL_P58');
      // Merchandise value should be calculated based on wholesale cost (£60.00)
      expect(invoice.merchandiseValue).toBe(60.0);
      expect(invoice.shippingCost).toBe(8.5);
      expect(invoice.totalClaimedAmount).toBe(68.5);
    });

    it('should enforce capped indemnity on Evri claims', async () => {
      // Create test parcel for Evri with £80 declared value, capped at £20
      const testParcel = await db.parcel.create({
        data: {
          organizationId: mettOrg.id,
          carrierId: evriCarrier.id,
          orderNumber: 'ORD-EVRI-TEST',
          trackingNumber: `EVRI-TEST-${Date.now()}`,
          recipientName: 'Evri Consignee',
          recipientAddress: '42 Manchester Rd, Leeds',
          recipientCity: 'Leeds',
          recipientState: 'West Yorkshire',
          recipientPostalCode: 'LS1 1AA',
          recipientCountry: 'GB',
          declaredValue: 80.0,
          shippingCost: 4.5,
          dispatchDate: new Date('2026-10-01'),
          promisedDeliveryDate: new Date('2026-10-05'),
          trackingStatus: 'LOST',
          claimStatus: 'ELIGIBLE',
          itemsJson: JSON.stringify([
            {
              sku: 'SKU-EVRI-01',
              name: 'Sporting Gloves',
              quantity: 1,
              unitPrice: 80.0,
              wholesaleCost: 40.0,
              vatRate: 20.0,
            },
          ]),
        },
      });

      const invoice = await generateAutoClaimInvoice({
        organizationId: mettOrg.id,
        parcelId: testParcel.id,
      });

      expect(invoice).toBeDefined();
      expect(invoice.carrierFormat).toBe('EVRI_INDEMNITY');
      // Merchandise value must be capped at Evri's cap (£20.00)
      expect(invoice.merchandiseValue).toBe(20.0);
      // Evri workspace policy has claimIncludePostage = false (carrier terms exclude carriage)
      expect(invoice.shippingCost).toBe(0);
      expect(invoice.totalClaimedAmount).toBe(20.0);
    });
  });

  describe('Email Dispatch Service', () => {
    it('should gracefully simulate email dispatch in development mode', async () => {
      const result = await sendCarrierEmail({
        to: 'claims-test@carrier.example.com',
        subject: '[TEST CLAIM DISPATCH] Trk #1Z999TEST',
        text: 'Mett Global claims escalation notice',
      });

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });
});
