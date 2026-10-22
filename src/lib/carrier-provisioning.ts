import db from '@/lib/db';

export const DEFAULT_CARRIERS_BLUEPRINT = [
  {
    code: 'ROYAL_MAIL',
    name: 'Royal Mail Tracked & P58 Claims',
    category: 'DIRECT_COURIER',
    connectionType: 'LIVE_API',
    capabilities: 'LOOKUP,WEBHOOK,POD',
    contractedParty: 'Direct Commercial Account',
    physicalCarrier: 'ROYAL_MAIL',
    finalMileCarrier: 'ROYAL_MAIL',
    enquiryRecipientEmail: 'customer.service@royalmail.com',
    claimRecipientEmail: 'claims.commercial@royalmail.com',
    isLive: true,
    isActive: true,
    claimPricingRule: 'WHOLESALE_COST',
    claimIndemnityCap: 150.0,
    claimIncludePostage: true,
    claimIncludeVat: false,
    claimStatutoryLossDays: 10,
    claimFilingDeadlineDays: 80,
    claimInvoiceFormat: 'ROYAL_MAIL_P58',
    claimCustomFieldsTemplate: JSON.stringify([
      { label: 'Royal Mail OBA Account No.', key: 'oba_account', defaultValue: 'OBA-7749201-GB' },
      { label: 'Posting Location / Mail Centre', key: 'mail_centre', defaultValue: 'National Distribution Centre (NDC)' },
      { label: 'P58 Loss Declaration Category', key: 'p58_category', defaultValue: 'Commercial Tracked 24/48 Loss' },
    ]),
    claimCustomDisclaimer:
      'I hereby declare that the goods listed on this commercial claim schedule were dispatched via Royal Mail Tracked service, have exceeded the statutory 10 working day loss threshold, and are claimed strictly at net wholesale manufacturing/acquisition cost excluding VAT in accordance with Royal Mail P58 Commercial Terms.',
  },
  {
    code: 'DPD',
    name: 'DPD UK & Local Express',
    category: 'DIRECT_COURIER',
    connectionType: 'LIVE_API',
    capabilities: 'LOOKUP,WEBHOOK,POD',
    contractedParty: 'Direct Commercial Account',
    physicalCarrier: 'DPD',
    finalMileCarrier: 'DPD',
    enquiryRecipientEmail: 'customer.services@dpd.co.uk',
    claimRecipientEmail: 'uk.claims.investigation@dpd.co.uk',
    isLive: true,
    isActive: true,
    claimPricingRule: 'RETAIL_EX_VAT',
    claimIndemnityCap: 100.0,
    claimIncludePostage: true,
    claimIncludeVat: false,
    claimStatutoryLossDays: 5,
    claimFilingDeadlineDays: 14,
    claimInvoiceFormat: 'DPD_STANDARD',
    claimCustomFieldsTemplate: JSON.stringify([
      { label: 'DPD Consignor Account Number', key: 'dpd_account', defaultValue: 'DPD-UK-883920' },
      { label: 'Depot Search Reference', key: 'depot_search_ref', defaultValue: 'HUB4-HINCKLEY-SEARCH' },
    ]),
    claimCustomDisclaimer:
      'Formal Consignment Loss & Indemnity Demand submitted within the 14-day statutory notification window. Depot sweep search has elapsed without physical POD recovery.',
  },
  {
    code: 'EVRI',
    name: 'Evri (Hermes UK Commercial)',
    category: 'DIRECT_COURIER',
    connectionType: 'LIVE_API',
    capabilities: 'LOOKUP,WEBHOOK,POD',
    contractedParty: 'Direct Commercial Account',
    physicalCarrier: 'EVRI',
    finalMileCarrier: 'EVRI',
    enquiryRecipientEmail: 'client.support@evri.com',
    claimRecipientEmail: 'corporate.claims@evri.com',
    isLive: true,
    isActive: true,
    claimPricingRule: 'CAPPED_INDEMNITY',
    claimIndemnityCap: 20.0,
    claimIncludePostage: true,
    claimIncludeVat: false,
    claimStatutoryLossDays: 7,
    claimFilingDeadlineDays: 28,
    claimInvoiceFormat: 'EVRI_INDEMNITY',
    claimCustomFieldsTemplate: JSON.stringify([
      { label: 'Evri Client Account ID', key: 'evri_client_id', defaultValue: 'EVRI-CORP-4410' },
      { label: 'Service Level Tier', key: 'service_tier', defaultValue: 'Standard Next Day / 48Hr' },
    ]),
    claimCustomDisclaimer:
      'Submitted under Evri Corporate Distribution Agreement. Liability capped at standard £20.00 tariff limit plus original carriage refund unless Enhanced Cover was pre-advised.',
  },
  {
    code: 'YODEL',
    name: 'Yodel Direct & Xpect',
    category: 'DIRECT_COURIER',
    connectionType: 'LIVE_API',
    capabilities: 'LOOKUP,WEBHOOK,POD',
    contractedParty: 'Direct Commercial Account',
    physicalCarrier: 'YODEL',
    finalMileCarrier: 'YODEL',
    enquiryRecipientEmail: 'account.queries@yodel.co.uk',
    claimRecipientEmail: 'client.claims@yodel.co.uk',
    isLive: true,
    isActive: true,
    claimPricingRule: 'CAPPED_INDEMNITY',
    claimIndemnityCap: 50.0,
    claimIncludePostage: true,
    claimIncludeVat: false,
    claimStatutoryLossDays: 7,
    claimFilingDeadlineDays: 21,
    claimInvoiceFormat: 'YODEL_LOSS',
    claimCustomFieldsTemplate: JSON.stringify([
      { label: 'Yodel Cost Centre Code', key: 'yodel_cost_centre', defaultValue: 'YDL-NORTH-09' },
    ]),
    claimCustomDisclaimer:
      'Certified Commercial Loss Invoice for Yodel Xpect / Direct consignment. Tracking telemetry confirms no terminal delivery scan within 7 business days.',
  },
  {
    code: 'DHL',
    name: 'DHL Express & eCommerce UK',
    category: 'DIRECT_COURIER',
    connectionType: 'LIVE_API',
    capabilities: 'LOOKUP,WEBHOOK,POD',
    contractedParty: 'Direct Commercial Account',
    physicalCarrier: 'DHL',
    finalMileCarrier: 'DHL',
    enquiryRecipientEmail: 'uk.tracers@dhl.com',
    claimRecipientEmail: 'uk.claims@dhl.com',
    isLive: true,
    isActive: true,
    claimPricingRule: 'RETAIL_EX_VAT',
    claimIndemnityCap: 250.0,
    claimIncludePostage: true,
    claimIncludeVat: false,
    claimStatutoryLossDays: 7,
    claimFilingDeadlineDays: 30,
    claimInvoiceFormat: 'DHL_EXPRESS',
    claimCustomFieldsTemplate: JSON.stringify([
      { label: 'DHL Express Shipper Account', key: 'dhl_account', defaultValue: '429910482' },
      { label: 'Customs Commodity HS Code', key: 'hs_code', defaultValue: '9506.91.90' },
    ]),
    claimCustomDisclaimer:
      'International Air Waybill Claim Invoice issued under Warsaw / Montreal Convention and DHL Express Terms & Conditions of Carriage.',
  },
  {
    code: 'UPS',
    name: 'UPS Global & UK Domestic',
    category: 'DIRECT_COURIER',
    connectionType: 'LIVE_API',
    capabilities: 'LOOKUP,WEBHOOK,POD',
    contractedParty: 'Direct Commercial Account',
    physicalCarrier: 'UPS',
    finalMileCarrier: 'UPS',
    enquiryRecipientEmail: 'upstracer@ups.com',
    claimRecipientEmail: 'upsclaims@ups.com',
    isLive: true,
    isActive: true,
    claimPricingRule: 'RETAIL_EX_VAT',
    claimIndemnityCap: 100.0,
    claimIncludePostage: true,
    claimIncludeVat: false,
    claimStatutoryLossDays: 5,
    claimFilingDeadlineDays: 60,
    claimInvoiceFormat: 'UPS_COMMERCIAL',
    claimCustomFieldsTemplate: JSON.stringify([
      { label: 'UPS 6-Character Shipper Number', key: 'ups_shipper_no', defaultValue: '8X942A' },
      { label: 'Tracer Investigation Reference', key: 'tracer_ref', defaultValue: 'TRC-UPS-AUTO' },
    ]),
    claimCustomDisclaimer:
      'Submitted pursuant to the UPS Tariff/Terms and Conditions of Service. Tracer investigation initiated after 5 days of physical scan inactivity.',
  },
  {
    code: 'FEDEX',
    name: 'FedEx Priority & Ground',
    category: 'DIRECT_COURIER',
    connectionType: 'LIVE_API',
    capabilities: 'LOOKUP,WEBHOOK,POD',
    contractedParty: 'Direct Commercial Account',
    physicalCarrier: 'FEDEX',
    finalMileCarrier: 'FEDEX',
    enquiryRecipientEmail: 'trace@fedex.com',
    claimRecipientEmail: 'file.claim@fedex.com',
    isLive: true,
    isActive: true,
    claimPricingRule: 'RETAIL_EX_VAT',
    claimIndemnityCap: 100.0,
    claimIncludePostage: true,
    claimIncludeVat: false,
    claimStatutoryLossDays: 5,
    claimFilingDeadlineDays: 60,
    claimInvoiceFormat: 'FEDEX_FORMAL',
    claimCustomFieldsTemplate: JSON.stringify([
      { label: 'FedEx 9-Digit Account Number', key: 'fedex_account', defaultValue: '510087921' },
    ]),
    claimCustomDisclaimer:
      'Certified FedEx Commercial Claim Invoice. We certify that the declared invoice valuation accurately reflects the commercial transaction value of the lost or damaged shipment.',
  },
];

export async function ensureOrganizationCarriers(organizationId: string) {
  const existing = await db.carrier.findMany({
    where: { organizationId },
  });

  if (existing.length > 0) {
    return existing;
  }

  for (const item of DEFAULT_CARRIERS_BLUEPRINT) {
    try {
      await db.carrier.create({
        data: {
          organizationId,
          ...item,
        },
      });
    } catch {
      // Ignore if concurrent creation occurred
    }
  }

  // Also ensure a default warehouse exists
  const existingWh = await db.warehouse.findFirst({
    where: { organizationId },
  });
  if (!existingWh) {
    try {
      await db.warehouse.create({
        data: {
          organizationId,
          code: 'HUB-1',
          name: 'Primary Fulfillment Hub',
          addressLine1: 'Unit 4 Distribution Park',
          city: 'Manchester',
          state: 'Lancashire',
          postalCode: 'M17 1PA',
          country: 'GB',
          cutoffTime: '16:00',
          isDefault: true,
        },
      });
    } catch {
      // Ignore
    }
  }

  return db.carrier.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  });
}
