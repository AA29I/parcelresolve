const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  console.log('--- Starting ParcelResolve Production Database Seed ---');

  // Clean existing records
  await db.jobQueue.deleteMany({});
  await db.auditLog.deleteMany({});
  await db.webhookDelivery.deleteMany({});
  await db.outboundWebhook.deleteMany({});
  await db.apiKey.deleteMany({});
  await db.workflowVersion.deleteMany({});
  await db.workflowRule.deleteMany({});
  await db.customStatusMapping.deleteMany({});
  await db.customField.deleteMany({});
  await db.claimDocument.deleteMany({});
  await db.claim.deleteMany({});
  await db.enquiryMessage.deleteMany({});
  await db.carrierEnquiry.deleteMany({});
  await db.trackingEvent.deleteMany({});
  await db.rawTrackingEvent.deleteMany({});
  await db.parcel.deleteMany({});
  await db.linnworksConnection.deleteMany({});
  await db.carrierConnector.deleteMany({});
  await db.carrierMapping.deleteMany({});
  await db.slaPolicy.deleteMany({});
  await db.carrier.deleteMany({});
  await db.warehouse.deleteMany({});
  await db.user.deleteMany({});
  await db.organization.deleteMany({});

  const hashApexPass = await bcrypt.hash('ApexPass123!', 10);
  const hashNordicPass = await bcrypt.hash('NordicPass123!', 10);

  // =========================================================================
  // 1. COMPANY A: Apex Global Logistics
  // =========================================================================
  console.log('Seeding Company A: Apex Global Logistics...');
  const orgA = await db.organization.create({
    data: {
      name: 'Apex Global Logistics',
      slug: 'apex-global',
      primaryContactEmail: 'ops-desk@apexglobal.example.com',
      phone: '+1 (201) 555-0199',
      operatingCountries: JSON.stringify(['US', 'GB', 'CA']),
      operatingCurrencies: JSON.stringify(['USD', 'GBP']),
      defaultCurrency: 'USD',
      timezone: 'America/New_York',
      subscriptionTier: 'SCALE',
      subscriptionStatus: 'ACTIVE',
      parcelMonthlyLimit: 100000,
      claimMonthlyLimit: 2500,
      onboardingStep: 10,
      onboardingCompleted: true,
    },
  });

  // Users for Company A
  const userAOwner = await db.user.create({
    data: {
      organizationId: orgA.id,
      name: 'Eleanor Vance',
      email: 'admin@apexglobal.example.com',
      passwordHash: hashApexPass,
      role: 'OWNER',
    },
  });

  const userAClaims = await db.user.create({
    data: {
      organizationId: orgA.id,
      name: 'Marcus Brody',
      email: 'claims@apexglobal.example.com',
      passwordHash: hashApexPass,
      role: 'CLAIMS_SPECIALIST',
    },
  });

  const userADev = await db.user.create({
    data: {
      organizationId: orgA.id,
      name: 'Sophia Chen',
      email: 'dev@apexglobal.example.com',
      passwordHash: hashApexPass,
      role: 'DEVELOPER',
    },
  });

  // Warehouse for Company A
  const whA = await db.warehouse.create({
    data: {
      organizationId: orgA.id,
      code: 'EWR-1',
      name: 'Apex East Hub (EWR-1)',
      addressLine1: '450 Terminal Way, Bay 12',
      city: 'Newark',
      state: 'NJ',
      postalCode: '07114',
      country: 'US',
      cutoffTime: '16:00',
      timezone: 'America/New_York',
      isDefault: true,
    },
  });

  // Carriers for Company A
  const carrierAUPS = await db.carrier.create({
    data: {
      organizationId: orgA.id,
      code: 'UPS',
      name: 'UPS Worldwide Supply Chain',
      category: 'DIRECT_COURIER',
      connectionType: 'LIVE_API',
      capabilities: 'LOOKUP,WEBHOOK,POD,CLAIM',
      contractedParty: 'Apex Global Logistics LLC (Acct #884901)',
      physicalCarrier: 'UPS',
      finalMileCarrier: 'UPS Ground Commercial',
      enquiryRecipientEmail: 'investigations@ups.example.com',
      claimRecipientEmail: 'claims-filing@ups.example.com',
      isLive: true,
      isActive: true,
    },
  });

  const carrierAUSPS = await db.carrier.create({
    data: {
      organizationId: orgA.id,
      code: 'USPS',
      name: 'US Postal Service Priority',
      category: 'DIRECT_COURIER',
      connectionType: 'CONFIGURABLE_API',
      capabilities: 'LOOKUP,POD',
      contractedParty: 'Apex Global Logistics Commercial e-VS',
      physicalCarrier: 'USPS',
      finalMileCarrier: 'USPS Postal Carrier',
      isLive: true,
      isActive: true,
    },
  });

  // Carrier Mappings
  await db.carrierMapping.createMany({
    data: [
      {
        organizationId: orgA.id,
        carrierId: carrierAUPS.id,
        inputCourierName: 'UPS-GRND',
        inputServiceName: 'Ground Residential',
        mappedCourierCode: 'UPS',
        mappedServiceCode: 'UPS_GROUND',
      },
      {
        organizationId: orgA.id,
        carrierId: carrierAUPS.id,
        inputCourierName: 'UPS-NDA',
        inputServiceName: 'Next Day Air Early AM',
        mappedCourierCode: 'UPS',
        mappedServiceCode: 'UPS_NEXT_DAY',
      },
    ],
  });

  // SLA Policies for Company A
  const slaANextDay = await db.slaPolicy.create({
    data: {
      organizationId: orgA.id,
      name: 'Apex Next-Day Guaranteed (24h)',
      carrierId: carrierAUPS.id,
      serviceCode: 'UPS_NEXT_DAY',
      originCountry: 'US',
      destinationCountry: 'US',
      slaHours: 24,
      cutoffTime: '16:00',
      calendarType: 'BUSINESS_DAYS',
      weekendHandling: 'SKIP_WEEKENDS',
      version: 1,
      isActive: true,
    },
  });

  const slaAGround = await db.slaPolicy.create({
    data: {
      organizationId: orgA.id,
      name: 'Apex Standard Ground (48h)',
      carrierId: carrierAUPS.id,
      serviceCode: 'UPS_GROUND',
      originCountry: 'US',
      destinationCountry: 'US',
      slaHours: 48,
      cutoffTime: '16:00',
      calendarType: 'BUSINESS_DAYS',
      weekendHandling: 'SKIP_WEEKENDS',
      version: 1,
      isActive: true,
    },
  });

  // Carrier Connector (REST/JSON Builder) for Company A
  const connectorA = await db.carrierConnector.create({
    data: {
      organizationId: orgA.id,
      carrierId: carrierAUPS.id,
      name: 'UPS REST Automated Tracking v2',
      version: 2,
      status: 'PUBLISHED',
      authType: 'BEARER',
      baseUrl: 'https://api.ups.example.com/track',
      trackingEndpoint: '/v1/shipments/{trackingNumber}',
      responseStatusPath: 'shipment.status.code',
      responseTimestampPath: 'shipment.lastScan.timestamp',
      responseLocationPath: 'shipment.lastScan.depot',
      responseMessagePath: 'shipment.lastScan.activity',
      responseEventsArrayPath: 'shipment.activities',
      statusCodeMap: JSON.stringify({
        IT: 'IN_TRANSIT',
        PU: 'PICKED_UP',
        OFD: 'OUT_FOR_DELIVERY',
        DL: 'DELIVERED',
        EX: 'EXCEPTION',
        LOST: 'LOST',
      }),
      minPollIntervalMinutes: 60,
      maxCallsPerMinute: 200,
      sampleTrackingNumber: '1Z999AA10123456784',
      testSuccess: true,
      lastTestedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  // Custom Fields for Company A
  await db.customField.createMany({
    data: [
      {
        organizationId: orgA.id,
        entityType: 'PARCEL',
        fieldKey: 'priority_tier',
        fieldLabel: 'Priority Tier',
        fieldType: 'SELECT',
        options: JSON.stringify(['Tier 1 - Critical Expedited', 'Tier 2 - Standard', 'Tier 3 - Economy Bulk']),
        isRequired: true,
        isSearchable: true,
      },
      {
        organizationId: orgA.id,
        entityType: 'PARCEL',
        fieldKey: 'hazard_class',
        fieldLabel: 'Hazardous Materials Code',
        fieldType: 'SELECT',
        options: JSON.stringify(['None', 'UN3481 Lithium Battery', 'UN1845 Carbon Dioxide Solid (Dry Ice)']),
        isRequired: false,
        isSearchable: true,
      },
      {
        organizationId: orgA.id,
        entityType: 'PARCEL',
        fieldKey: 'client_po_ref',
        fieldLabel: 'Client Purchase Order Ref',
        fieldType: 'TEXT',
        isRequired: false,
        isSearchable: true,
      },
    ],
  });

  // Custom Status Mappings for Company A
  await db.customStatusMapping.createMany({
    data: [
      {
        organizationId: orgA.id,
        entityType: 'PARCEL',
        customLabel: 'In Flight / Hub Crossdock',
        coreStatus: 'IN_TRANSIT',
        colorCode: '#B8892D',
      },
      {
        organizationId: orgA.id,
        entityType: 'PARCEL',
        customLabel: 'Carrier Transit Hindrance',
        coreStatus: 'EXCEPTION',
        colorCode: '#D97706',
      },
    ],
  });

  // Workflow Rules for Company A
  const ruleA = await db.workflowRule.create({
    data: {
      organizationId: orgA.id,
      name: 'Severe SLA Breach Auto-Enquiry Draft',
      description: 'Automatically drafts a carrier enquiry when delay exceeds 12 business hours',
      triggerEvent: 'SLA_BREACHED',
      conditions: JSON.stringify([
        { field: 'breachHours', operator: 'GREATER_THAN', value: 12 },
        { field: 'carrierCode', operator: 'EQUALS', value: 'UPS' },
      ]),
      actions: JSON.stringify([
        { type: 'CREATE_ENQUIRY_DRAFT', parameters: { sendingMode: 'STAFF_APPROVAL' } },
        { type: 'APPLY_TAG', parameters: { tag: 'HIGH_PRIORITY_BREACH' } },
      ]),
      requiresApproval: true,
      version: 1,
      createdById: userAOwner.id,
    },
  });

  await db.workflowVersion.create({
    data: {
      organizationId: orgA.id,
      workflowRuleId: ruleA.id,
      versionNumber: 1,
      snapshot: JSON.stringify({
        name: ruleA.name,
        triggerEvent: ruleA.triggerEvent,
        conditions: JSON.parse(ruleA.conditions),
        actions: JSON.parse(ruleA.actions),
      }),
      changeNotes: 'Initial production rule setup',
      createdById: userAOwner.id,
    },
  });

  // API Key for Company A
  const crypto = require('crypto');
  const apiKeyA = 'pr_live_apex_9a8b7c6d5e4f3a2b1c0d9e8f';
  await db.apiKey.create({
    data: {
      organizationId: orgA.id,
      name: 'WMS Dispatch Production Key',
      keyPrefix: 'pr_live_apex',
      keyHash: crypto.createHash('sha256').update(apiKeyA).digest('hex'),
      scopes: JSON.stringify(['parcels:read', 'parcels:write', 'tracking:read', 'claims:read']),
      createdById: userADev.id,
    },
  });

  // Outbound Webhook for Company A
  await db.outboundWebhook.create({
    data: {
      organizationId: orgA.id,
      name: 'Apex ERP Inbound Webhook',
      targetUrl: 'https://api.apexglobal.example.com/webhooks/parcelresolve',
      secretKey: 'sec_apex_hmac_9918273645',
      events: JSON.stringify(['parcel.status_changed', 'sla.breached', 'claim.approved']),
      isActive: true,
    },
  });

  // Realistic Parcels for Company A
  const now = new Date();
  const d3DaysAgo = new Date(now.getTime() - 72 * 3600 * 1000);
  const d5DaysAgo = new Date(now.getTime() - 120 * 3600 * 1000);
  const d7DaysAgo = new Date(now.getTime() - 168 * 3600 * 1000);
  const d1DayAgo = new Date(now.getTime() - 24 * 3600 * 1000);

  // Parcel 1: Breached SLA (Delayed at Louisville Hub, 32h overdue, enquiry draft created)
  const p1 = await db.parcel.create({
    data: {
      organizationId: orgA.id,
      warehouseId: whA.id,
      carrierId: carrierAUPS.id,
      orderNumber: 'AGL-88201',
      trackingNumber: '1Z999AA10123456784',
      recipientName: 'Sarah Jenkins',
      recipientEmail: 's.jenkins@example.com',
      recipientAddress: '1204 Congress Ave, Suite 300',
      recipientCity: 'Austin',
      recipientState: 'TX',
      recipientPostalCode: '78701',
      recipientCountry: 'US',
      dispatchDate: d5DaysAgo,
      promisedDeliveryDate: new Date(d5DaysAgo.getTime() + 48 * 3600 * 1000),
      calculatedSlaHours: 48,
      slaCutoffUsed: '16:00',
      slaCalculationDetail: 'Dispatched 5 days ago; 48 business hours SLA elapsed. Currently 32.0 hours past promised delivery deadline.',
      isBreached: true,
      breachHours: 32.0,
      stalledHours: 28.5,
      trackingStatus: 'EXCEPTION',
      investigationStatus: 'OPEN',
      claimStatus: 'READY_TO_SUBMIT',
      recoveryStatus: 'UNPAID',
      declaredValue: 640.0,
      shippingCost: 28.5,
      claimedAmount: 668.5,
      weightKg: 3.2,
      currency: 'USD',
      itemsSummary: '1x Precision Optic Diagnostic Sensor',
      latestStatusDescription: 'Exception: Mechanical breakdown during sorting transfer.',
      lastPhysicalScanAt: new Date(now.getTime() - 28.5 * 3600 * 1000),
      lastScanLocation: 'Louisville Air Hub, KY, US',
      lastEventTime: new Date(now.getTime() - 28.5 * 3600 * 1000),
      lastApiCheckAt: new Date(now.getTime() - 15 * 60 * 1000),
      source: 'CSV_IMPORT',
      customFieldValues: JSON.stringify({ priority_tier: 'Tier 1 - Critical Expedited', hazard_class: 'UN3481 Lithium Battery' }),
    },
  });

  // Events for Parcel 1
  await db.trackingEvent.createMany({
    data: [
      {
        organizationId: orgA.id,
        parcelId: p1.id,
        eventCode: 'MANIFEST',
        normalizedStatus: 'MANIFEST_CREATED',
        statusDescription: 'Electronic shipping data received',
        eventTimestamp: d5DaysAgo,
        locationCity: 'Newark',
        locationState: 'NJ',
        isPhysicalScan: false,
      },
      {
        organizationId: orgA.id,
        parcelId: p1.id,
        eventCode: 'ORIGIN_SCAN',
        normalizedStatus: 'PICKED_UP',
        statusDescription: 'Origin scan completed at Newark Freight Center',
        eventTimestamp: new Date(d5DaysAgo.getTime() + 3 * 3600 * 1000),
        locationCity: 'Newark',
        locationState: 'NJ',
        isPhysicalScan: true,
      },
      {
        organizationId: orgA.id,
        parcelId: p1.id,
        eventCode: 'HUB_EXCEPTION',
        normalizedStatus: 'EXCEPTION',
        statusDescription: 'Exception: Mechanical breakdown during sorting transfer.',
        eventTimestamp: new Date(now.getTime() - 28.5 * 3600 * 1000),
        locationCity: 'Louisville',
        locationState: 'KY',
        isPhysicalScan: true,
      },
    ],
  });

  // Carrier Enquiry for Parcel 1
  const enq1 = await db.carrierEnquiry.create({
    data: {
      organizationId: orgA.id,
      parcelId: p1.id,
      carrierId: carrierAUPS.id,
      referenceNumber: 'ENQ-UPS-884102',
      enquiryType: 'SLA_BREACH',
      status: 'PENDING_APPROVAL',
      sendingMode: 'STAFF_APPROVAL',
      recipientEmail: 'investigations@ups.example.com',
      subject: `[URGENT INVESTIGATION] Trk #1Z999AA10123456784 - SLA Breach (32h Overdue) - Ref ENQ-UPS-884102`,
      body: `Dear UPS Support Team,\n\nShipment 1Z999AA10123456784 for consignee Sarah Jenkins in Austin TX has been stalled at Louisville Hub for over 28 hours with an operational exception.\nPlease locate the package and provide an expedited delivery commitment.`,
      followUpDueDate: new Date(now.getTime() + 24 * 3600 * 1000),
      createdById: userAClaims.id,
    },
  });

  await db.enquiryMessage.create({
    data: {
      organizationId: orgA.id,
      enquiryId: enq1.id,
      senderType: 'SYSTEM',
      senderEmail: 'system@parcelresolve.internal',
      senderName: 'SLA Exception Worker',
      messageBody: 'Enquiry generated automatically based on 32h SLA breach policy.',
    },
  });

  // Parcel 2: Confirmed Lost in Transit with Approved Claim and Full Recovery
  const p2 = await db.parcel.create({
    data: {
      organizationId: orgA.id,
      warehouseId: whA.id,
      carrierId: carrierAUPS.id,
      orderNumber: 'AGL-88203',
      trackingNumber: '1Z999AA10123456786',
      recipientName: 'Michael Chang',
      recipientEmail: 'm.chang@example.com',
      recipientAddress: '55 East Monroe St',
      recipientCity: 'Chicago',
      recipientState: 'IL',
      recipientPostalCode: '60603',
      recipientCountry: 'US',
      dispatchDate: d7DaysAgo,
      promisedDeliveryDate: new Date(d7DaysAgo.getTime() + 48 * 3600 * 1000),
      calculatedSlaHours: 48,
      isBreached: true,
      breachHours: 96.0,
      stalledHours: 96.0,
      trackingStatus: 'LOST',
      investigationStatus: 'RESOLVED_LOST',
      claimStatus: 'APPROVED',
      recoveryStatus: 'PAID_IN_FULL',
      declaredValue: 450.0,
      shippingCost: 22.0,
      claimedAmount: 472.0,
      approvedAmount: 472.0,
      recoveredAmount: 472.0,
      creditNoteNumber: 'UPS-CRN-991823',
      weightKg: 2.1,
      currency: 'USD',
      itemsSummary: '2x High-Grade Fiber Transceivers',
      latestStatusDescription: 'Declared Lost: Carrier investigation concluded consignment unrecoverable.',
      lastPhysicalScanAt: new Date(d7DaysAgo.getTime() + 18 * 3600 * 1000),
      lastScanLocation: 'Philadelphia Gateway Hub, PA, US',
      lastEventTime: new Date(now.getTime() - 24 * 3600 * 1000),
      lastApiCheckAt: new Date(now.getTime() - 10 * 60 * 1000),
      source: 'CSV_IMPORT',
      customFieldValues: JSON.stringify({ priority_tier: 'Tier 1 - Critical Expedited' }),
    },
  });

  // Claim for Parcel 2
  const clm2 = await db.claim.create({
    data: {
      organizationId: orgA.id,
      parcelId: p2.id,
      carrierId: carrierAUPS.id,
      claimNumber: 'CLM-UPS-449102',
      carrierClaimReference: 'UPS-CLAIMS-US-99120',
      reason: 'LOST_IN_TRANSIT',
      status: 'APPROVED',
      claimedAmount: 472.0,
      approvedAmount: 472.0,
      recoveredAmount: 472.0,
      currency: 'USD',
      filingDeadline: new Date(d7DaysAgo.getTime() + 30 * 24 * 3600 * 1000),
      earliestFilingDate: new Date(d7DaysAgo.getTime() + 7 * 24 * 3600 * 1000),
      submittedAt: new Date(now.getTime() - 48 * 3600 * 1000),
      decidedAt: new Date(now.getTime() - 12 * 3600 * 1000),
      settledAt: new Date(now.getTime() - 6 * 3600 * 1000),
      creditNoteReference: 'UPS-CRN-991823',
      assignedUserId: userAClaims.id,
      declarationText: `================================================================================
*** OFFICIAL CARRIER CLAIM DECLARATION / LOSS STATEMENT ***
*** LEGAL DISCLAIMER: THIS DOCUMENT IS A FORMAL LOSS SUBMISSION STATEMENT     ***
*** PREPARED EXCLUSIVELY FOR CARRIER FREIGHT REIMBURSEMENT. IT IS NOT AN     ***
*** ORIGINAL COMMERCIAL SALES INVOICE OR CONSUMER TAX INVOICE.                ***
================================================================================

Claim Reference: CLM-UPS-449102
Submission Date: September 20, 2026
Carrier / Service Provider: UPS Worldwide Supply Chain
Contracted Shipper Account: Apex Global Logistics (ACT-UPS-9901)

1. CONSIGNMENT PARTICULARS
- Consignment Tracking Number: 1Z999AA10123456786
- Merchant Order Identifier: AGL-88199
- Intended Recipient: Michael Chang
- Delivery Destination: 450 Serra Mall, Stanford, CA 94305, US
- Primary Loss Reason: LOST_IN_TRANSIT

2. ITEMIZATION OF DIRECT MERCHANDISE LOSS
- Declared Consignment Items: Precision Laboratory Micro-Sensors (2 units)
- Cost Value of Lost/Damaged Merchandise: USD 450.00
- Contracted Outbound Freight Cost: USD 22.00
--------------------------------------------------------------------------------
TOTAL MONETARY CLAIM SUBMISSION: USD 472.00
--------------------------------------------------------------------------------

3. SHIPPERS STATUTORY LOSS DECLARATION
The undersigned claimant certifies that the aforementioned consignment was tendered
to the carrier in sound condition, that delivery was not completed in accordance with
the carriage terms, and that the monetary amount claimed represents genuine unrecovered
loss sustained by the claimant.

Claimant Organization: Apex Global Logistics
Authorized Platform: ParcelResolve Enterprise Claims Network
Verification Key: SHA256-CLM-UPS-449102-SETTLED`,
      createdById: userAClaims.id,
    },
  });

  await db.claimDocument.create({
    data: {
      organizationId: orgA.id,
      claimId: clm2.id,
      parcelId: p2.id,
      documentType: 'INVOICE_DECLARATION',
      fileName: 'CLM-UPS-449102_Loss_Declaration.pdf',
      fileUrl: `/api/claims/${clm2.id}/declaration`,
      fileSize: 2048,
      isGeneratedDeclaration: true,
      disclaimerText: 'Claim Declaration / Loss Statement for Carrier Reimbursement — Not an Original Commercial Sales Invoice',
    },
  });

  // Parcel 3: Delivered On Schedule
  const p3 = await db.parcel.create({
    data: {
      organizationId: orgA.id,
      warehouseId: whA.id,
      carrierId: carrierAUPS.id,
      orderNumber: 'AGL-88202',
      trackingNumber: '1Z999AA10123456785',
      recipientName: 'David Sterling',
      recipientAddress: '77 Franklin Street',
      recipientCity: 'Boston',
      recipientState: 'MA',
      recipientPostalCode: '02110',
      recipientCountry: 'US',
      dispatchDate: d3DaysAgo,
      promisedDeliveryDate: new Date(d3DaysAgo.getTime() + 48 * 3600 * 1000),
      calculatedSlaHours: 48,
      isBreached: false,
      breachHours: 0,
      trackingStatus: 'DELIVERED',
      investigationStatus: 'NONE',
      claimStatus: 'NOT_ELIGIBLE',
      recoveryStatus: 'UNPAID',
      declaredValue: 210.0,
      shippingCost: 14.0,
      weightKg: 1.5,
      currency: 'USD',
      itemsSummary: 'Laboratory Test Reagents Kit',
      latestStatusDescription: 'Delivered: Left at front door. Signature on file.',
      lastPhysicalScanAt: new Date(d3DaysAgo.getTime() + 38 * 3600 * 1000),
      lastScanLocation: 'Boston, MA, US',
      lastEventTime: new Date(d3DaysAgo.getTime() + 38 * 3600 * 1000),
      source: 'CSV_IMPORT',
    },
  });

  // Parcel 4: In Transit (On Schedule)
  await db.parcel.create({
    data: {
      organizationId: orgA.id,
      warehouseId: whA.id,
      carrierId: carrierAUPS.id,
      orderNumber: 'AGL-88205',
      trackingNumber: '1Z999AA10123456788',
      recipientName: 'Rachel Adams',
      recipientAddress: '3344 Peachtree Rd NE',
      recipientCity: 'Atlanta',
      recipientState: 'GA',
      recipientPostalCode: '30326',
      recipientCountry: 'US',
      dispatchDate: d1DayAgo,
      promisedDeliveryDate: new Date(d1DayAgo.getTime() + 48 * 3600 * 1000),
      calculatedSlaHours: 48,
      isBreached: false,
      trackingStatus: 'IN_TRANSIT',
      declaredValue: 340.0,
      shippingCost: 19.5,
      weightKg: 2.4,
      currency: 'USD',
      itemsSummary: 'Automated Pneumatic Valves',
      latestStatusDescription: 'In Transit: Departed Charlotte sorting facility.',
      lastPhysicalScanAt: new Date(now.getTime() - 4 * 3600 * 1000),
      lastScanLocation: 'Charlotte, NC, US',
      lastEventTime: new Date(now.getTime() - 4 * 3600 * 1000),
      source: 'CSV_IMPORT',
    },
  });

  // =========================================================================
  // 2. COMPANY B: Nordic Craft Goods
  // =========================================================================
  console.log('Seeding Company B: Nordic Craft Goods...');
  const orgB = await db.organization.create({
    data: {
      name: 'Nordic Craft Goods',
      slug: 'nordic-craft',
      primaryContactEmail: 'logistik@nordiccraft.example.com',
      phone: '+46 8 555 01234',
      operatingCountries: JSON.stringify(['SE', 'DE', 'FR', 'NL', 'NO']),
      operatingCurrencies: JSON.stringify(['EUR', 'SEK']),
      defaultCurrency: 'EUR',
      timezone: 'Europe/Stockholm',
      subscriptionTier: 'GROWTH',
      subscriptionStatus: 'ACTIVE',
      parcelMonthlyLimit: 30000,
      claimMonthlyLimit: 500,
      onboardingStep: 10,
      onboardingCompleted: true,
    },
  });

  // Users for Company B
  const userBOwner = await db.user.create({
    data: {
      organizationId: orgB.id,
      name: 'Astrid Lindqvist',
      email: 'admin@nordiccraft.example.com',
      passwordHash: hashNordicPass,
      role: 'OWNER',
    },
  });

  const userBOps = await db.user.create({
    data: {
      organizationId: orgB.id,
      name: 'Frederik Holm',
      email: 'ops@nordiccraft.example.com',
      passwordHash: hashNordicPass,
      role: 'OPS_DISPATCHER',
    },
  });

  // Warehouse for Company B
  const whB = await db.warehouse.create({
    data: {
      organizationId: orgB.id,
      code: 'CPH-02',
      name: 'Nordic Central Fulfillment (CPH-02)',
      addressLine1: 'Hamngatan 14',
      city: 'Malmö',
      state: 'Skåne',
      postalCode: '211 22',
      country: 'SE',
      cutoffTime: '15:00',
      timezone: 'Europe/Stockholm',
      isDefault: true,
    },
  });

  // Carrier for Company B: GLS Europe
  const carrierBGLS = await db.carrier.create({
    data: {
      organizationId: orgB.id,
      code: 'GLS',
      name: 'GLS Europe Logistics',
      category: 'DIRECT_COURIER',
      connectionType: 'CONFIGURABLE_API',
      capabilities: 'LOOKUP,WEBHOOK,POD',
      contractedParty: 'Nordic Craft Goods AB (Konto 992014)',
      physicalCarrier: 'GLS',
      finalMileCarrier: 'GLS EuroBusiness',
      enquiryRecipientEmail: 'kundservice@gls-nordic.example.com',
      claimRecipientEmail: 'claims-eu@gls-nordic.example.com',
      isLive: true,
      isActive: true,
    },
  });

  // Carrier Mapping for Company B
  await db.carrierMapping.create({
    data: {
      organizationId: orgB.id,
      carrierId: carrierBGLS.id,
      inputCourierName: 'GLS-EuroBusiness',
      inputServiceName: 'Cross-Border Standard',
      mappedCourierCode: 'GLS',
      mappedServiceCode: 'GLS_EURO_EXPRESS',
    },
  });

  // SLA Policy for Company B
  await db.slaPolicy.create({
    data: {
      organizationId: orgB.id,
      name: 'Nordic Cross-Border Fast Track (72h)',
      carrierId: carrierBGLS.id,
      serviceCode: 'GLS_EURO_EXPRESS',
      originCountry: 'SE',
      destinationCountry: 'DE',
      slaHours: 72,
      cutoffTime: '15:00',
      calendarType: 'BUSINESS_DAYS',
      weekendHandling: 'SKIP_WEEKENDS',
      version: 1,
      isActive: true,
    },
  });

  // Custom Fields for Company B (completely distinct from Company A!)
  await db.customField.createMany({
    data: [
      {
        organizationId: orgB.id,
        entityType: 'PARCEL',
        fieldKey: 'customs_declaration_no',
        fieldLabel: 'EU Customs EORI Ref',
        fieldType: 'TEXT',
        isRequired: true,
        isSearchable: true,
      },
      {
        organizationId: orgB.id,
        entityType: 'PARCEL',
        fieldKey: 'eco_packaging_cert',
        fieldLabel: 'FSC Eco-Packaging Certified',
        fieldType: 'BOOLEAN',
        isRequired: false,
        isSearchable: false,
      },
    ],
  });

  // Custom Status Mappings for Company B
  await db.customStatusMapping.createMany({
    data: [
      {
        organizationId: orgB.id,
        entityType: 'PARCEL',
        customLabel: 'Tullfördröjning / Transit Hindrance',
        coreStatus: 'EXCEPTION',
        colorCode: '#D97706',
      },
      {
        organizationId: orgB.id,
        entityType: 'PARCEL',
        customLabel: 'Levererad och Kvitterad',
        coreStatus: 'DELIVERED',
        colorCode: '#10B981',
      },
    ],
  });

  // Parcels for Company B
  // Parcel B1: Delayed at Hamburg Depot (Breached by 14h, Enquiry sent awaiting reply)
  const pB1 = await db.parcel.create({
    data: {
      organizationId: orgB.id,
      warehouseId: whB.id,
      carrierId: carrierBGLS.id,
      orderNumber: 'NCG-44101',
      trackingNumber: 'GLS98765432101',
      recipientName: 'Klaus Schmidt',
      recipientEmail: 'k.schmidt@berlin-design.de',
      recipientAddress: 'Friedrichstraße 176',
      recipientCity: 'Berlin',
      recipientState: 'Berlin',
      recipientPostalCode: '10117',
      recipientCountry: 'DE',
      dispatchDate: d5DaysAgo,
      promisedDeliveryDate: new Date(d5DaysAgo.getTime() + 72 * 3600 * 1000),
      calculatedSlaHours: 72,
      slaCutoffUsed: '15:00',
      slaCalculationDetail: 'Dispatched 5 days ago from Malmö. SLA 72 business hours. Breached by 14.2 hours.',
      isBreached: true,
      breachHours: 14.2,
      stalledHours: 26.0,
      trackingStatus: 'EXCEPTION',
      investigationStatus: 'AWAITING_CARRIER_REPLY',
      claimStatus: 'NOT_ELIGIBLE',
      recoveryStatus: 'UNPAID',
      declaredValue: 390.0,
      shippingCost: 32.0,
      weightKg: 4.8,
      currency: 'EUR',
      itemsSummary: 'Hand-blown Scandinavian Glassware Set',
      latestStatusDescription: 'Tullfördröjning / Transit Hindrance: Stalled at Hamburg distribution center.',
      lastPhysicalScanAt: new Date(now.getTime() - 26 * 3600 * 1000),
      lastScanLocation: 'Hamburg Depot 20, DE',
      lastEventTime: new Date(now.getTime() - 26 * 3600 * 1000),
      source: 'CSV_IMPORT',
      customFieldValues: JSON.stringify({ customs_declaration_no: 'EORI-SE556012', eco_packaging_cert: 'true' }),
    },
  });

  // Carrier Enquiry for Parcel B1 (already sent)
  await db.carrierEnquiry.create({
    data: {
      organizationId: orgB.id,
      parcelId: pB1.id,
      carrierId: carrierBGLS.id,
      referenceNumber: 'ENQ-GLS-992014',
      enquiryType: 'SLA_BREACH',
      status: 'SENT',
      sendingMode: 'AUTO_SEND',
      recipientEmail: 'kundservice@gls-nordic.example.com',
      subject: `[STATUS REQUEST] GLS98765432101 - Consignment Stalled at Depot 20 (Hamburg)`,
      body: `Hej GLS Kundservice,\n\nPaket GLS98765432101 till Berlin har fastnat på Hamburg Depot sedan över 24 timmar.\nVänligen ge oss en beräknad leveranstid så vi kan uppdatera mottagaren Klaus Schmidt.`,
      sentAt: new Date(now.getTime() - 12 * 3600 * 1000),
      followUpDueDate: new Date(now.getTime() + 36 * 3600 * 1000),
      createdById: userBOps.id,
    },
  });

  // Parcel B2: Delivered with POD
  await db.parcel.create({
    data: {
      organizationId: orgB.id,
      warehouseId: whB.id,
      carrierId: carrierBGLS.id,
      orderNumber: 'NCG-44102',
      trackingNumber: 'GLS98765432102',
      recipientName: 'Greta Bauer',
      recipientAddress: 'Maximilianstraße 35',
      recipientCity: 'Munich',
      recipientState: 'Bavaria',
      recipientPostalCode: '80539',
      recipientCountry: 'DE',
      dispatchDate: d3DaysAgo,
      promisedDeliveryDate: new Date(d3DaysAgo.getTime() + 72 * 3600 * 1000),
      calculatedSlaHours: 72,
      isBreached: false,
      trackingStatus: 'DELIVERED',
      investigationStatus: 'NONE',
      claimStatus: 'NOT_ELIGIBLE',
      recoveryStatus: 'UNPAID',
      declaredValue: 280.0,
      shippingCost: 26.0,
      weightKg: 3.1,
      currency: 'EUR',
      itemsSummary: 'Organic Merino Wool Blanket',
      latestStatusDescription: 'Levererad och Kvitterad: Delivered to recipient with signature POD.',
      lastPhysicalScanAt: new Date(d3DaysAgo.getTime() + 44 * 3600 * 1000),
      lastScanLocation: 'Munich, DE',
      lastEventTime: new Date(d3DaysAgo.getTime() + 44 * 3600 * 1000),
      source: 'CSV_IMPORT',
      customFieldValues: JSON.stringify({ customs_declaration_no: 'EORI-SE556012', eco_packaging_cert: 'true' }),
    },
  });

  console.log('--- Database Seed Completed Successfully ---');
  console.log(`Created Company A (${orgA.name}) with user: admin@apexglobal.example.com (pass: ApexPass123!)`);
  console.log(`Created Company B (${orgB.name}) with user: admin@nordiccraft.example.com (pass: NordicPass123!)`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
