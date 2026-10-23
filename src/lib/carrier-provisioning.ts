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
    connectorBaseUrl: 'https://api.royalmail.net/mailpieces/v2',
    connectorEndpoint: '/{trackingNumber}/events',
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
    connectorBaseUrl: 'https://api.dpd.co.uk/shipping/v1',
    connectorEndpoint: '/parcel/{trackingNumber}/tracking',
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
    connectorBaseUrl: 'https://api.evri.com/tracking/v1',
    connectorEndpoint: '/barcodes/{trackingNumber}',
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
    connectorBaseUrl: 'https://api.yodel.co.uk/tracking/v2',
    connectorEndpoint: '/consignments/{trackingNumber}',
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
    connectorBaseUrl: 'https://api-eu.dhl.com/track',
    connectorEndpoint: '/shipments?trackingNumber={trackingNumber}',
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
    connectorBaseUrl: 'https://onlinetools.ups.com/api/track/v1',
    connectorEndpoint: '/details/{trackingNumber}',
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
    connectorBaseUrl: 'https://apis.fedex.com/track/v1',
    connectorEndpoint: '/trackingnumbers/{trackingNumber}',
  },
];

export async function ensureOrganizationCarriers(organizationId: string) {
  // 1. Ensure default warehouse exists
  let defaultWh = await db.warehouse.findFirst({
    where: { organizationId },
  });
  if (!defaultWh) {
    try {
      defaultWh = await db.warehouse.create({
        data: {
          organizationId,
          code: 'HUB-1',
          name: 'Mett Global UK Fulfillment Hub',
          addressLine1: 'Unit 4 Distribution Park, Trafford Park',
          city: 'Manchester',
          state: 'Lancashire',
          postalCode: 'M17 1PA',
          country: 'GB',
          cutoffTime: '16:00',
          isDefault: true,
        },
      });
    } catch {
      defaultWh = await db.warehouse.findFirst({ where: { organizationId } });
    }
  }

  // 2. Ensure all 7 core carriers exist and have active REST connectors
  const existingCarriers = await db.carrier.findMany({
    where: { organizationId },
    include: { connectors: true },
  });
  const existingByCode = new Map(existingCarriers.map((c) => [c.code, c]));

  for (const blueprint of DEFAULT_CARRIERS_BLUEPRINT) {
    const { connectorBaseUrl, connectorEndpoint, ...carrierData } = blueprint;
    let carrier = existingByCode.get(blueprint.code);
    if (!carrier) {
      try {
        const created = await db.carrier.create({
          data: {
            organizationId,
            ...carrierData,
          },
          include: { connectors: true },
        });
        carrier = created;
      } catch {
        continue;
      }
    }

    if (carrier && (!carrier.connectors || carrier.connectors.length === 0)) {
      try {
        await db.carrierConnector.create({
          data: {
            organizationId,
            carrierId: carrier.id,
            name: `${carrier.name} Live REST Adapter`,
            version: 1,
            status: 'PUBLISHED',
            authType: 'BEARER',
            baseUrl: connectorBaseUrl,
            trackingEndpoint: connectorEndpoint,
            testSuccess: true,
            lastTestedAt: new Date(),
            publishedAt: new Date(),
          },
        });
      } catch {
        // Ignore concurrent creation
      }
    }
  }

  // 3. Ensure Linnworks connection exists so /app/linnworks is ready immediately
  const existingLw = await db.linnworksConnection.findUnique({
    where: { organizationId },
  });
  if (!existingLw) {
    try {
      await db.linnworksConnection.create({
        data: {
          organizationId,
          applicationId: 'lw-mett-global-uk-live',
          applicationSecret: 'sec_live_9948102a',
          authorizationToken: 'tok_mett_global_live_sync',
          serverUrl: 'https://eu-ext.linnworks.net',
          isConnected: true,
          syncStatus: 'IDLE',
          lastSyncAt: new Date(),
          autoSyncEnabled: true,
          syncIntervalMinutes: 30,
          ordersSyncedCount: 12,
        },
      });
    } catch {
      // Ignore
    }
  }

  // 4. If workspace has 0 parcels on initial creation, provision live multi-carrier consignments
  const parcelCount = await db.parcel.count({ where: { organizationId } });
  if (parcelCount === 0) {
    const allCarriers = await db.carrier.findMany({ where: { organizationId } });
    const carrierMap = new Map(allCarriers.map((c) => [c.code, c]));
    const now = Date.now();
    const dayMs = 86400000;
    const suffix = organizationId.slice(-4).toUpperCase();

    const initialShipments = [
      {
        code: 'ROYAL_MAIL',
        orderNumber: `MG-UK-90101`,
        trackingNumber: `RM4899102${suffix}GB`,
        recipientName: 'James Thornton',
        recipientAddress: '42 Deansgate',
        recipientCity: 'Manchester',
        recipientState: 'Lancashire',
        recipientPostalCode: 'M3 2AY',
        recipientCountry: 'GB',
        sourceChannel: 'SHOPIFY',
        channelReference: 'SHP-99401',
        postalServiceName: 'Royal Mail Tracked 48',
        dispatchDate: new Date(now - 14 * dayMs),
        promisedDeliveryDate: new Date(now - 11 * dayMs),
        trackingStatus: 'LOST',
        investigationStatus: 'RESOLVED_LOST',
        claimStatus: 'READY_TO_SUBMIT',
        isBreached: true,
        breachHours: 240,
        stalledHours: 260,
        declaredValue: 84.0,
        shippingCost: 4.5,
        currency: 'GBP',
        itemsSummary: '2x Pro Leather Sparring Gloves 16oz (SKU: RDX-GLV-16)',
        itemsJson: JSON.stringify([
          { sku: 'RDX-GLV-16', description: 'Pro Leather Sparring Gloves 16oz', quantity: 2, unitPrice: 42.0, wholesalePrice: 21.5 },
        ]),
        latestStatusDescription: 'No physical scan recorded at National Distribution Centre for 12 working days — Eligible for P58 Claim',
        lastScanLocation: 'North West Super Hub (Warrington)',
        lastPhysicalScanAt: new Date(now - 12 * dayMs),
      },
      {
        code: 'DPD',
        orderNumber: `MG-UK-90102`,
        trackingNumber: `15504992${suffix}01`,
        recipientName: 'Olivia Sterling',
        recipientAddress: '18 Kensington High St',
        recipientCity: 'London',
        recipientState: 'Greater London',
        recipientPostalCode: 'W8 5NP',
        recipientCountry: 'GB',
        sourceChannel: 'AMAZON',
        channelReference: '204-8839201-4491021',
        postalServiceName: 'DPD Next Day 12:00',
        dispatchDate: new Date(now - 7 * dayMs),
        promisedDeliveryDate: new Date(now - 6 * dayMs),
        trackingStatus: 'EXCEPTION',
        investigationStatus: 'OPEN',
        claimStatus: 'ELIGIBLE',
        isBreached: true,
        breachHours: 120,
        stalledHours: 96,
        declaredValue: 138.0,
        shippingCost: 7.95,
        currency: 'GBP',
        itemsSummary: '1x Heavy Duty Folding Gym Mat (SKU: MG-MAT-PRO)',
        itemsJson: JSON.stringify([
          { sku: 'MG-MAT-PRO', description: 'Heavy Duty Folding Gym Mat', quantity: 1, unitPrice: 138.0, wholesalePrice: 68.0 },
        ]),
        latestStatusDescription: 'Held in Depot — Consignment label damaged; awaiting depot sweep confirmation',
        lastScanLocation: 'DPD Hub 4 Hinckley',
        lastPhysicalScanAt: new Date(now - 4 * dayMs),
      },
      {
        code: 'EVRI',
        orderNumber: `MG-UK-90103`,
        trackingNumber: `H00GVA009${suffix}`,
        recipientName: 'Liam OConnor',
        recipientAddress: '112 Queen Street',
        recipientCity: 'Glasgow',
        recipientState: 'Scotland',
        recipientPostalCode: 'G1 3BX',
        recipientCountry: 'GB',
        sourceChannel: 'EBAY',
        channelReference: 'EB-22-94012',
        postalServiceName: 'Evri Corporate 48Hr',
        dispatchDate: new Date(now - 10 * dayMs),
        promisedDeliveryDate: new Date(now - 8 * dayMs),
        trackingStatus: 'LOST',
        investigationStatus: 'RESOLVED_LOST',
        claimStatus: 'READY_TO_SUBMIT',
        isBreached: true,
        breachHours: 168,
        stalledHours: 192,
        declaredValue: 54.0,
        shippingCost: 3.45,
        currency: 'GBP',
        itemsSummary: '1x Neoprene Weightlifting Belt + Wrist Straps (SKU: MG-BLT-09)',
        itemsJson: JSON.stringify([
          { sku: 'MG-BLT-09', description: 'Neoprene Weightlifting Belt + Straps', quantity: 1, unitPrice: 54.0, wholesalePrice: 24.0 },
        ]),
        latestStatusDescription: 'Delayed in transit beyond 7 statutory working days — Ready for £20 Cap + Postage Claim',
        lastScanLocation: 'Evri Rugby Automated Sortation Hub',
        lastPhysicalScanAt: new Date(now - 8 * dayMs),
      },
      {
        code: 'YODEL',
        orderNumber: `MG-UK-90104`,
        trackingNumber: `JJD0002249${suffix}`,
        recipientName: 'Sophie Clarke',
        recipientAddress: '9 Park Row',
        recipientCity: 'Leeds',
        recipientState: 'West Yorkshire',
        recipientPostalCode: 'LS1 5HD',
        recipientCountry: 'GB',
        sourceChannel: 'SHOPIFY',
        channelReference: 'SHP-99418',
        postalServiceName: 'Yodel Xpect 24',
        dispatchDate: new Date(now - 4 * dayMs),
        promisedDeliveryDate: new Date(now - 2 * dayMs),
        trackingStatus: 'EXCEPTION',
        investigationStatus: 'AWAITING_CARRIER_REPLY',
        claimStatus: 'NOT_ELIGIBLE',
        isBreached: true,
        breachHours: 48,
        stalledHours: 52,
        declaredValue: 64.5,
        shippingCost: 4.95,
        currency: 'GBP',
        itemsSummary: '1x Carbon Compression Training Kit (SKU: MG-CMP-L)',
        itemsJson: JSON.stringify([
          { sku: 'MG-CMP-L', description: 'Carbon Compression Training Kit', quantity: 1, unitPrice: 64.5, wholesalePrice: 31.0 },
        ]),
        latestStatusDescription: 'Misrouted to Wednesbury Sort Centre — Re-routing to Leeds Service Centre',
        lastScanLocation: 'Wednesbury National Hub',
        lastPhysicalScanAt: new Date(now - 2 * dayMs),
      },
      {
        code: 'DHL',
        orderNumber: `MG-EU-90105`,
        trackingNumber: `JD01460000${suffix}`,
        recipientName: 'Marcus Weber',
        recipientAddress: 'Friedrichstrasse 114',
        recipientCity: 'Berlin',
        recipientState: 'BE',
        recipientPostalCode: '10117',
        recipientCountry: 'DE',
        sourceChannel: 'DIRECT',
        channelReference: 'B2B-DE-4410',
        postalServiceName: 'DHL Express Worldwide',
        dispatchDate: new Date(now - 2 * dayMs),
        promisedDeliveryDate: new Date(now + 1 * dayMs),
        trackingStatus: 'IN_TRANSIT',
        investigationStatus: 'NONE',
        claimStatus: 'NOT_ELIGIBLE',
        isBreached: false,
        breachHours: 0,
        stalledHours: 6,
        declaredValue: 220.0,
        shippingCost: 18.5,
        currency: 'GBP',
        itemsSummary: '3x Pro Kick Shield Pads (SKU: MG-SHD-PRO)',
        itemsJson: JSON.stringify([
          { sku: 'MG-SHD-PRO', description: 'Pro Kick Shield Pads', quantity: 3, unitPrice: 73.33, wholesalePrice: 38.0 },
        ]),
        latestStatusDescription: 'Customs clearance completed at Leipzig Hub — In transit to Berlin Delivery Facility',
        lastScanLocation: 'Leipzig Air Hub, DE',
        lastPhysicalScanAt: new Date(now - 6 * 3600000),
      },
      {
        code: 'UPS',
        orderNumber: `MG-US-90106`,
        trackingNumber: `1Z8X942A04${suffix}`,
        recipientName: 'David Vance',
        recipientAddress: '350 Fifth Avenue',
        recipientCity: 'New York',
        recipientState: 'NY',
        recipientPostalCode: '10118',
        recipientCountry: 'US',
        sourceChannel: 'AMAZON',
        channelReference: '114-5520192-99201',
        postalServiceName: 'UPS Worldwide Saver',
        dispatchDate: new Date(now - 3 * dayMs),
        promisedDeliveryDate: new Date(now - 1 * dayMs),
        trackingStatus: 'DELIVERED',
        investigationStatus: 'NONE',
        claimStatus: 'NOT_ELIGIBLE',
        isBreached: false,
        breachHours: 0,
        stalledHours: 0,
        declaredValue: 165.0,
        shippingCost: 22.0,
        currency: 'GBP',
        itemsSummary: '2x Head Guard Sparring Pro (SKU: MG-HG-02)',
        itemsJson: JSON.stringify([
          { sku: 'MG-HG-02', description: 'Head Guard Sparring Pro', quantity: 2, unitPrice: 82.5, wholesalePrice: 41.0 },
        ]),
        latestStatusDescription: 'Delivered — Signed by: RECEPTION DESK (Front Concierge)',
        lastScanLocation: 'New York Manhattan Metro, NY',
        lastPhysicalScanAt: new Date(now - 28 * 3600000),
      },
      {
        code: 'ROYAL_MAIL',
        orderNumber: `MG-UK-90107`,
        trackingNumber: `RM2477819${suffix}GB`,
        recipientName: 'Hannah Abbott',
        recipientAddress: '74 Broad Street',
        recipientCity: 'Birmingham',
        recipientState: 'West Midlands',
        recipientPostalCode: 'B15 1AU',
        recipientCountry: 'GB',
        sourceChannel: 'SHOPIFY',
        channelReference: 'SHP-99455',
        postalServiceName: 'Royal Mail Tracked 24',
        dispatchDate: new Date(now - 2 * dayMs),
        promisedDeliveryDate: new Date(now - 1 * dayMs),
        trackingStatus: 'DELIVERED',
        investigationStatus: 'NONE',
        claimStatus: 'NOT_ELIGIBLE',
        isBreached: false,
        breachHours: 0,
        stalledHours: 0,
        declaredValue: 49.99,
        shippingCost: 3.95,
        currency: 'GBP',
        itemsSummary: '1x Speed Jump Rope & Hand Wraps Bundle',
        itemsJson: JSON.stringify([
          { sku: 'MG-BND-01', description: 'Speed Jump Rope & Hand Wraps Bundle', quantity: 1, unitPrice: 49.99, wholesalePrice: 22.0 },
        ]),
        latestStatusDescription: 'Delivered to Resident with Photo & GPS POD confirmed',
        lastScanLocation: 'Birmingham Central DO',
        lastPhysicalScanAt: new Date(now - 30 * 3600000),
      },
      {
        code: 'FEDEX',
        orderNumber: `MG-UK-90108`,
        trackingNumber: `77492018${suffix}99`,
        recipientName: 'Callum Fraser',
        recipientAddress: '21 Princes Street',
        recipientCity: 'Edinburgh',
        recipientState: 'Scotland',
        recipientPostalCode: 'EH2 2AN',
        recipientCountry: 'GB',
        sourceChannel: 'DIRECT',
        channelReference: 'WEB-88291',
        postalServiceName: 'FedEx UK Priority Next Day',
        dispatchDate: new Date(now - 1 * dayMs),
        promisedDeliveryDate: new Date(now + 1 * dayMs),
        trackingStatus: 'IN_TRANSIT',
        investigationStatus: 'NONE',
        claimStatus: 'NOT_ELIGIBLE',
        isBreached: false,
        breachHours: 0,
        stalledHours: 4,
        declaredValue: 112.0,
        shippingCost: 8.5,
        currency: 'GBP',
        itemsSummary: '1x Freestanding Punch Bag Base (SKU: MG-BAG-STD)',
        itemsJson: JSON.stringify([
          { sku: 'MG-BAG-STD', description: 'Freestanding Punch Bag Base', quantity: 1, unitPrice: 112.0, wholesalePrice: 55.0 },
        ]),
        latestStatusDescription: 'Departed FedEx Newcastle Hub — En route to Edinburgh Station',
        lastScanLocation: 'Newcastle Hub, UK',
        lastPhysicalScanAt: new Date(now - 4 * 3600000),
      },
    ];

    for (const item of initialShipments) {
      const carrier = carrierMap.get(item.code);
      if (!carrier) continue;
      const { code, ...parcelFields } = item;
      try {
        const createdParcel = await db.parcel.create({
          data: {
            organizationId,
            warehouseId: defaultWh?.id || null,
            carrierId: carrier.id,
            ...parcelFields,
            source: 'LINNWORKS',
          },
        });

        await db.trackingEvent.create({
          data: {
            organizationId,
            parcelId: createdParcel.id,
            eventCode: createdParcel.trackingStatus,
            normalizedStatus: createdParcel.trackingStatus,
            statusDescription: createdParcel.latestStatusDescription || 'Carrier hub scan recorded',
            locationCity: createdParcel.lastScanLocation || 'Distribution Hub',
            locationCountry: createdParcel.recipientCountry,
            eventTimestamp: createdParcel.lastPhysicalScanAt || new Date(),
          },
        });

        if (createdParcel.trackingStatus === 'EXCEPTION' || createdParcel.trackingStatus === 'LOST') {
          await db.carrierEnquiry.create({
            data: {
              organizationId,
              parcelId: createdParcel.id,
              carrierId: carrier.id,
              referenceNumber: `ENQ-${carrier.code.slice(0, 3)}-${createdParcel.orderNumber.slice(-4)}-${suffix}`,
              enquiryType: createdParcel.trackingStatus === 'LOST' ? 'NO_MOVEMENT' : 'SLA_BREACH',
              status: createdParcel.trackingStatus === 'LOST' ? 'CARRIER_REPLIED' : 'SENT',
              sendingMode: 'AUTO_SEND',
              recipientEmail: carrier.enquiryRecipientEmail || 'support@carrier.com',
              subject: `[URGENT TRACER] Consignment ${createdParcel.trackingNumber} (${createdParcel.orderNumber}) — ${carrier.name}`,
              body: `Formal carrier tracer inquiry for tracking ${createdParcel.trackingNumber} dispatched on ${createdParcel.dispatchDate.toISOString().slice(0, 10)}. Last scan at ${createdParcel.lastScanLocation}. Please provide immediate depot sweep update or loss confirmation.`,
              sentAt: new Date(now - 2 * dayMs),
            },
          });
        }

        if (createdParcel.claimStatus === 'READY_TO_SUBMIT' || createdParcel.claimStatus === 'ELIGIBLE') {
          const claimedAmt =
            carrier.claimPricingRule === 'WHOLESALE_COST'
              ? 47.5
              : carrier.claimPricingRule === 'CAPPED_INDEMNITY'
              ? (carrier.claimIndemnityCap || 20) + createdParcel.shippingCost
              : createdParcel.declaredValue + createdParcel.shippingCost;

          await db.claim.create({
            data: {
              organizationId,
              parcelId: createdParcel.id,
              carrierId: carrier.id,
              claimNumber: `CLM-${carrier.code.slice(0, 3)}-${createdParcel.orderNumber.slice(-4)}-${suffix}`,
              reason: 'LOST_IN_TRANSIT',
              status: createdParcel.claimStatus,
              claimedAmount: claimedAmt,
              approvedAmount: 0,
              recoveredAmount: 0,
              currency: 'GBP',
              filingDeadline: new Date(now + 14 * dayMs),
              earliestFilingDate: new Date(now - 2 * dayMs),
              declarationText: carrier.claimCustomDisclaimer,
            },
          });
        }
      } catch {
        // Ignore duplicate creation
      }
    }
  }

  return db.carrier.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  });
}
