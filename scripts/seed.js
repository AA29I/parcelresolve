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
  const hashMettPass = await bcrypt.hash('Password123!', 10);

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

  // =========================================================================
  // 3. COMPANY C: Mett Global Logistics (PRIMARY FLAGSHIP)
  // =========================================================================
  console.log('Seeding Primary Flagship: Mett Global Logistics...');
  const dYesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const d4DaysAgo = new Date(now.getTime() - 96 * 3600 * 1000);
  const d9DaysAgo = new Date(now.getTime() - 216 * 3600 * 1000);
  const d14DaysAgo = new Date(now.getTime() - 336 * 3600 * 1000);
  const orgMett = await db.organization.create({
    data: {
      name: 'Mett Global Logistics',
      slug: 'mett-global',
      primaryContactEmail: 'ahmedaamirctn@gmail.com',
      phone: '+44 (161) 555-0182',
      operatingCountries: JSON.stringify(['GB', 'US', 'CA', 'DE', 'AE']),
      operatingCurrencies: JSON.stringify(['GBP', 'USD', 'EUR', 'CAD', 'AED']),
      defaultCurrency: 'GBP',
      timezone: 'Europe/London',
      subscriptionTier: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      parcelMonthlyLimit: 250000,
      claimMonthlyLimit: 5000,
      onboardingStep: 10,
      onboardingCompleted: true,
    },
  });

  // Users for Mett Global
  const userMettOwner = await db.user.create({
    data: {
      organizationId: orgMett.id,
      name: 'Ahmed Aamir',
      email: 'ahmedaamirctn@gmail.com',
      passwordHash: hashMettPass,
      role: 'OWNER',
    },
  });

  const userMettClaims = await db.user.create({
    data: {
      organizationId: orgMett.id,
      name: 'Sarah Jenkins',
      email: 'claims@mettglobal.example.com',
      passwordHash: hashMettPass,
      role: 'CLAIMS_SPECIALIST',
    },
  });

  // Warehouses for Mett Global
  const whMettUK = await db.warehouse.create({
    data: {
      organizationId: orgMett.id,
      code: 'MAN-1',
      name: 'Mett Global Manchester Fulfillment Hub',
      addressLine1: 'Unit 4, Trafford Park Industrial Estate',
      city: 'Manchester',
      state: 'Greater Manchester',
      postalCode: 'M17 1EH',
      country: 'GB',
      cutoffTime: '16:00',
      timezone: 'Europe/London',
      isDefault: true,
    },
  });

  const whMettUS = await db.warehouse.create({
    data: {
      organizationId: orgMett.id,
      code: 'EWR-1',
      name: 'Mett Global Newark Distribution Center',
      addressLine1: '800 Port Street, Bay 4',
      city: 'Newark',
      state: 'NJ',
      postalCode: '07114',
      country: 'US',
      cutoffTime: '17:00',
      timezone: 'America/New_York',
      isDefault: false,
    },
  });

  // Carriers for Mett Global with Configurable Claim Profiles
  const carrierMettDPD = await db.carrier.create({
    data: {
      organizationId: orgMett.id,
      code: 'DPD',
      name: 'DPD UK Logistics',
      category: 'DIRECT_COURIER',
      connectionType: 'LIVE_API',
      capabilities: 'LOOKUP,WEBHOOK,POD,CLAIM',
      contractedParty: 'Mett Global Logistics UK (Acct #DPD-88902)',
      physicalCarrier: 'DPD',
      finalMileCarrier: 'DPD Local',
      enquiryRecipientEmail: 'customer.care@dpdgroup.co.uk',
      claimRecipientEmail: 'claims.department@dpdgroup.co.uk',
      isLive: true,
      isActive: true,
      claimPricingRule: 'RETAIL_EX_VAT',
      claimIndemnityCap: 100.0,
      claimIncludePostage: true,
      claimIncludeVat: false,
      claimStatutoryLossDays: 7,
      claimFilingDeadlineDays: 14,
      claimInvoiceFormat: 'DPD_STANDARD',
      claimCustomDisclaimer: 'Formal Notice of Claim under DPD Carrier Terms of Carriage. Requires Customer DOR and Dispatch Manifest.',
    },
  });

  const carrierMettRM = await db.carrier.create({
    data: {
      organizationId: orgMett.id,
      code: 'ROYAL_MAIL',
      name: 'Royal Mail Group',
      category: 'DIRECT_COURIER',
      connectionType: 'LIVE_API',
      capabilities: 'LOOKUP,WEBHOOK,POD,CLAIM',
      contractedParty: 'Mett Global Logistics (OBA #RM-7721)',
      physicalCarrier: 'Royal Mail',
      finalMileCarrier: 'Royal Mail Delivery Office',
      enquiryRecipientEmail: 'customer.escalations@royalmail.com',
      claimRecipientEmail: 'business.claims@royalmail.com',
      isLive: true,
      isActive: true,
      claimPricingRule: 'WHOLESALE_COST',
      claimIndemnityCap: 150.0,
      claimIncludePostage: true,
      claimIncludeVat: false,
      claimStatutoryLossDays: 10,
      claimFilingDeadlineDays: 28,
      claimInvoiceFormat: 'ROYAL_MAIL_P58',
      claimCustomDisclaimer: 'Official P58 Lost Item Declaration. Compensation based on wholesale cost of manufacture/purchase.',
    },
  });

  const carrierMettEvri = await db.carrier.create({
    data: {
      organizationId: orgMett.id,
      code: 'EVRI',
      name: 'Evri Enterprise (Hermes)',
      category: 'DIRECT_COURIER',
      connectionType: 'CONFIGURABLE_API',
      capabilities: 'LOOKUP,WEBHOOK,POD',
      contractedParty: 'Mett Global Hermes Corp',
      physicalCarrier: 'Evri',
      finalMileCarrier: 'Evri Courier Network',
      enquiryRecipientEmail: 'corporate.enquiries@evri.com',
      claimRecipientEmail: 'claims.processing@evri.com',
      isLive: true,
      isActive: true,
      claimPricingRule: 'CAPPED_INDEMNITY',
      claimIndemnityCap: 20.0,
      claimIncludePostage: false,
      claimIncludeVat: false,
      claimStatutoryLossDays: 14,
      claimFilingDeadlineDays: 28,
      claimInvoiceFormat: 'EVRI_INDEMNITY',
      claimCustomDisclaimer: 'Standard Courier Indemnity Claim under Hermes / Evri corporate terms. Subject to £20 cap.',
    },
  });

  const carrierMettYodel = await db.carrier.create({
    data: {
      organizationId: orgMett.id,
      code: 'YODEL',
      name: 'Yodel Delivery Network',
      category: 'DIRECT_COURIER',
      connectionType: 'CONFIGURABLE_API',
      capabilities: 'LOOKUP,WEBHOOK,POD',
      contractedParty: 'Mett Global Yodel Corp',
      physicalCarrier: 'Yodel',
      finalMileCarrier: 'Yodel Local Driver',
      enquiryRecipientEmail: 'operations@yodel.co.uk',
      claimRecipientEmail: 'claims@yodel.co.uk',
      isLive: true,
      isActive: true,
      claimPricingRule: 'CAPPED_INDEMNITY',
      claimIndemnityCap: 50.0,
      claimIncludePostage: true,
      claimIncludeVat: false,
      claimStatutoryLossDays: 14,
      claimFilingDeadlineDays: 28,
      claimInvoiceFormat: 'YODEL_LOSS',
    },
  });

  const carrierMettUPS = await db.carrier.create({
    data: {
      organizationId: orgMett.id,
      code: 'UPS',
      name: 'UPS Worldwide Express',
      category: 'DIRECT_COURIER',
      connectionType: 'LIVE_API',
      capabilities: 'LOOKUP,WEBHOOK,POD,CLAIM',
      contractedParty: 'Mett Global Worldwide (Acct #UPS-5591)',
      physicalCarrier: 'UPS',
      finalMileCarrier: 'UPS Express Driver',
      enquiryRecipientEmail: 'ukcustomercare@ups.com',
      claimRecipientEmail: 'ukclaims@ups.com',
      isLive: true,
      isActive: true,
      claimPricingRule: 'RETAIL_EX_VAT',
      claimIndemnityCap: 500.0,
      claimIncludePostage: true,
      claimIncludeVat: false,
      claimStatutoryLossDays: 7,
      claimFilingDeadlineDays: 30,
      claimInvoiceFormat: 'UPS_COMMERCIAL',
    },
  });

  // SLA Policies for Mett Global
  await db.slaPolicy.create({
    data: {
      organizationId: orgMett.id,
      carrierId: carrierMettDPD.id,
      name: 'DPD Next Day Guaranteed (16:00 Cutoff)',
      serviceCode: 'DPD_NEXT_DAY',
      slaHours: 24,
      cutoffTime: '16:00',
      originCountry: 'GB',
      destinationCountry: 'GB',
      calendarType: 'BUSINESS_DAYS',
      weekendHandling: 'SKIP_WEEKENDS',
    },
  });

  await db.slaPolicy.create({
    data: {
      organizationId: orgMett.id,
      carrierId: carrierMettRM.id,
      name: 'Royal Mail Tracked 48 (48h Standard)',
      serviceCode: 'RM_TRACKED_48',
      slaHours: 48,
      cutoffTime: '15:30',
      originCountry: 'GB',
      destinationCountry: 'GB',
      calendarType: 'BUSINESS_DAYS',
      weekendHandling: 'SKIP_WEEKENDS',
    },
  });

  // Synthetic Test Parcels representing each core operational view
  // 1. Delivered on time
  await db.parcel.create({
    data: {
      organizationId: orgMett.id,
      warehouseId: whMettUK.id,
      carrierId: carrierMettDPD.id,
      orderNumber: 'MG-88101',
      trackingNumber: '15502948102938',
      recipientName: 'James Wilson',
      recipientAddress: '14 Oxford Road',
      recipientCity: 'Manchester',
      recipientState: 'Greater Manchester',
      recipientPostalCode: 'M1 5QA',
      recipientCountry: 'GB',
      sourceChannel: 'SHOPIFY',
      channelReference: 'SP-10492',
      postalServiceName: 'DPD Next Day',
      dispatchDate: d3DaysAgo,
      promisedDeliveryDate: new Date(d3DaysAgo.getTime() + 24 * 3600 * 1000),
      calculatedSlaHours: 24,
      isBreached: false,
      trackingStatus: 'DELIVERED',
      investigationStatus: 'NONE',
      claimStatus: 'NOT_ELIGIBLE',
      recoveryStatus: 'UNPAID',
      declaredValue: 85.0,
      shippingCost: 6.5,
      weightKg: 1.8,
      currency: 'GBP',
      itemsSummary: 'Ergonomic Mechanical Keyboard (1x)',
      itemsJson: JSON.stringify([
        { sku: 'TECH-KB-01', title: 'Ergonomic Mechanical Keyboard', quantity: 1, unitRetailPrice: 85.0, unitCostPrice: 38.0, lineTotal: 85.0 }
      ]),
      latestStatusDescription: 'Delivered: Left with resident and signed by J. Wilson.',
      lastPhysicalScanAt: new Date(d3DaysAgo.getTime() + 22 * 3600 * 1000),
      lastScanLocation: 'Manchester Depot',
      lastEventTime: new Date(d3DaysAgo.getTime() + 22 * 3600 * 1000),
      source: 'CSV_IMPORT',
    },
  });

  // 2. In Transit (Within Transit Time)
  await db.parcel.create({
    data: {
      organizationId: orgMett.id,
      warehouseId: whMettUK.id,
      carrierId: carrierMettRM.id,
      orderNumber: 'MG-88102',
      trackingNumber: 'GB4410294819RM',
      recipientName: 'Sophie Taylor',
      recipientAddress: '27 High Street',
      recipientCity: 'Birmingham',
      recipientState: 'West Midlands',
      recipientPostalCode: 'B2 4XQ',
      recipientCountry: 'GB',
      sourceChannel: 'AMAZON',
      channelReference: 'AMZ-99214',
      postalServiceName: 'Royal Mail Tracked 48',
      dispatchDate: dYesterday,
      promisedDeliveryDate: new Date(dYesterday.getTime() + 48 * 3600 * 1000),
      calculatedSlaHours: 48,
      isBreached: false,
      trackingStatus: 'IN_TRANSIT',
      investigationStatus: 'NONE',
      claimStatus: 'NOT_ELIGIBLE',
      recoveryStatus: 'UNPAID',
      declaredValue: 64.0,
      shippingCost: 4.8,
      weightKg: 1.2,
      currency: 'GBP',
      itemsSummary: 'Pro Training Resistance Bands Set (2x)',
      itemsJson: JSON.stringify([
        { sku: 'FIT-RB-02', title: 'Pro Training Resistance Bands Set', quantity: 2, unitRetailPrice: 32.0, unitCostPrice: 12.0, lineTotal: 64.0 }
      ]),
      latestStatusDescription: 'In Transit: Processed through Royal Mail Birmingham Mail Centre.',
      lastPhysicalScanAt: new Date(now.getTime() - 8 * 3600 * 1000),
      lastScanLocation: 'Birmingham Mail Centre',
      lastEventTime: new Date(now.getTime() - 8 * 3600 * 1000),
      source: 'CSV_IMPORT',
    },
  });

  // 3. Stalled >48h (Exception Center - needs enquiry query)
  const pMettStalled = await db.parcel.create({
    data: {
      organizationId: orgMett.id,
      warehouseId: whMettUK.id,
      carrierId: carrierMettEvri.id,
      orderNumber: 'MG-88103',
      trackingNumber: 'EVR88291049281',
      recipientName: 'Liam Davies',
      recipientAddress: '88 Park Road',
      recipientCity: 'Leeds',
      recipientState: 'West Yorkshire',
      recipientPostalCode: 'LS1 2AB',
      recipientCountry: 'GB',
      sourceChannel: 'EBAY',
      channelReference: 'EB-77401',
      postalServiceName: 'Evri Standard 48h',
      dispatchDate: d4DaysAgo,
      promisedDeliveryDate: new Date(d4DaysAgo.getTime() + 48 * 3600 * 1000),
      calculatedSlaHours: 48,
      isBreached: true,
      breachHours: 48.0,
      stalledHours: 62.0,
      trackingStatus: 'EXCEPTION',
      investigationStatus: 'AWAITING_CARRIER_REPLY',
      claimStatus: 'NOT_ELIGIBLE',
      recoveryStatus: 'UNPAID',
      declaredValue: 42.0,
      shippingCost: 3.5,
      weightKg: 0.9,
      currency: 'GBP',
      itemsSummary: 'Premium Leather Jump Rope',
      itemsJson: JSON.stringify([
        { sku: 'FIT-JR-01', title: 'Premium Leather Jump Rope', quantity: 1, unitRetailPrice: 42.0, unitCostPrice: 16.0, lineTotal: 42.0 }
      ]),
      latestStatusDescription: 'Exception: Stalled at National Hub. No physical scan for 62 hours.',
      lastPhysicalScanAt: new Date(d4DaysAgo.getTime() + 18 * 3600 * 1000),
      lastScanLocation: 'Rugby National Hub',
      lastEventTime: new Date(d4DaysAgo.getTime() + 18 * 3600 * 1000),
      source: 'CSV_IMPORT',
    },
  });

  // Enquiry for the stalled Evri parcel
  await db.carrierEnquiry.create({
    data: {
      organizationId: orgMett.id,
      parcelId: pMettStalled.id,
      carrierId: carrierMettEvri.id,
      referenceNumber: 'ENQ-EVR-10928',
      enquiryType: 'STALLED_IN_TRANSIT',
      status: 'SENT',
      sendingMode: 'AUTO_SEND',
      recipientEmail: 'corporate.enquiries@evri.com',
      subject: `[URGENT INVESTIGATION] EVR88291049281 - No Scan Movement for 62 Hours at Rugby Hub`,
      body: `Dear Evri Corporate Support Team,\n\nConsignment EVR88291049281 (Order Ref: MG-88103) dispatched on ${d4DaysAgo.toISOString().split('T')[0]} has had zero physical movement scans since departing Rugby National Hub over 62 hours ago.\n\nPlease initiate an immediate depot depot search and confirm estimated delivery date.\n\nDestination: Liam Davies, Leeds LS1 2AB.`,
      sentAt: new Date(now.getTime() - 14 * 3600 * 1000),
      followUpDueDate: new Date(now.getTime() + 34 * 3600 * 1000),
      createdById: userMettOwner.id,
    },
  });

  // 4. Confirmed Lost (In Claim Sheet - ready for 1-click Claim Invoice!)
  const pMettLost = await db.parcel.create({
    data: {
      organizationId: orgMett.id,
      warehouseId: whMettUK.id,
      carrierId: carrierMettDPD.id,
      orderNumber: 'MG-88104',
      trackingNumber: '15509928172635',
      recipientName: 'Oliver Brown',
      recipientAddress: '55 Victoria Road',
      recipientCity: 'Bristol',
      recipientState: 'Avon',
      recipientPostalCode: 'BS1 3TN',
      recipientCountry: 'GB',
      sourceChannel: 'SHOPIFY',
      channelReference: 'SP-10518',
      postalServiceName: 'DPD Next Day',
      dispatchDate: d9DaysAgo,
      promisedDeliveryDate: new Date(d9DaysAgo.getTime() + 24 * 3600 * 1000),
      calculatedSlaHours: 24,
      isBreached: true,
      breachHours: 192.0,
      stalledHours: 200.0,
      trackingStatus: 'LOST',
      investigationStatus: 'RESOLVED_LOST',
      claimStatus: 'READY_TO_SUBMIT',
      recoveryStatus: 'UNPAID',
      declaredValue: 125.0,
      shippingCost: 8.5,
      weightKg: 2.5,
      currency: 'GBP',
      itemsSummary: 'Heavy-Duty Boxing Gloves (12oz) + Hand Wraps (Pair)',
      itemsJson: JSON.stringify([
        { sku: 'BOX-GLV-12', title: 'Heavy-Duty Boxing Gloves (12oz)', quantity: 1, unitRetailPrice: 105.0, unitCostPrice: 42.0, lineTotal: 105.0 },
        { sku: 'BOX-WRP-01', title: 'Hand Wraps (Pair)', quantity: 1, unitRetailPrice: 20.0, unitCostPrice: 6.0, lineTotal: 20.0 }
      ]),
      latestStatusDescription: 'Lost in Transit: DPD Investigation closed. Carrier confirmed package lost at Hub 4.',
      lastPhysicalScanAt: new Date(d9DaysAgo.getTime() + 16 * 3600 * 1000),
      lastScanLocation: 'Oldbury Hub 4',
      lastEventTime: new Date(d9DaysAgo.getTime() + 16 * 3600 * 1000),
      source: 'CSV_IMPORT',
    },
  });

  // Claim record for the lost parcel
  const claimMettLost = await db.claim.create({
    data: {
      organizationId: orgMett.id,
      parcelId: pMettLost.id,
      carrierId: carrierMettDPD.id,
      claimNumber: 'CLM-DPD-2026-001',
      carrierClaimReference: 'DPD-IND-99182',
      reason: 'LOST_IN_TRANSIT',
      status: 'READY_TO_SUBMIT',
      claimedAmount: 112.5, // 104.0 (ex VAT) + 8.5 (postage)
      approvedAmount: 0,
      recoveredAmount: 0,
      currency: 'GBP',
      filingDeadline: new Date(d9DaysAgo.getTime() + 14 * 24 * 3600 * 1000),
      earliestFilingDate: d9DaysAgo,
      declarationText: 'Commercial claim statement for package lost in transit under DPD contract indemnity rules.',
      createdById: userMettOwner.id,
    },
  });

  // Pre-generated Claim Invoice for the lost parcel
  await db.claimInvoice.create({
    data: {
      organizationId: orgMett.id,
      claimId: claimMettLost.id,
      parcelId: pMettLost.id,
      carrierId: carrierMettDPD.id,
      invoiceNumber: 'INV-CLM-2026-081',
      generationType: 'AUTO',
      carrierFormat: 'DPD_STANDARD',
      claimantName: 'Mett Global Logistics Ltd',
      claimantAddress: 'Unit 4, Trafford Park Industrial Estate, Manchester, M17 1EH, UK',
      claimantTaxId: 'GB992817261',
      claimantContactEmail: 'ahmedaamirctn@gmail.com',
      claimantPhone: '+44 (161) 555-0182',
      courierName: 'DPDgroup UK Claims Department',
      courierAccountNo: 'DPD-88902',
      courierDeptEmail: 'claims.department@dpdgroup.co.uk',
      courierClaimRef: 'DPD-IND-99182',
      trackingNumber: '15509928172635',
      orderNumber: 'MG-88104',
      dispatchDate: d9DaysAgo,
      lossReason: 'LOST_IN_TRANSIT',
      currency: 'GBP',
      merchandiseValue: 104.0, // Ex VAT
      shippingCost: 8.5,
      taxAmount: 0,
      adminFeeAmount: 0,
      totalClaimedAmount: 112.5,
      lineItems: JSON.stringify([
        { sku: 'BOX-GLV-12', description: 'Heavy-Duty Boxing Gloves (12oz)', quantity: 1, unitPrice: 87.5, lineTotal: 87.5 },
        { sku: 'BOX-WRP-01', description: 'Hand Wraps (Pair)', quantity: 1, unitPrice: 16.5, lineTotal: 16.5 }
      ]),
      disclaimerText: 'FORMAL NOTICE OF LOSS AND INDEMNITY. Prepared exclusively for DPD carrier indemnity reimbursement under contract carrier terms.',
      status: 'FINALIZED',
    },
  });

  // 5. Settled Claim (Credit Note Paid)
  const pMettSettled = await db.parcel.create({
    data: {
      organizationId: orgMett.id,
      warehouseId: whMettUK.id,
      carrierId: carrierMettUPS.id,
      orderNumber: 'MG-88099',
      trackingNumber: '1Z9928104928109',
      recipientName: 'Claire Martin',
      recipientAddress: '72 Avenue des Champs',
      recipientCity: 'Paris',
      recipientState: 'Ile-de-France',
      recipientPostalCode: '75008',
      recipientCountry: 'FR',
      sourceChannel: 'WEBSITE',
      channelReference: 'WB-44019',
      postalServiceName: 'UPS Express Saver International',
      dispatchDate: d14DaysAgo,
      promisedDeliveryDate: new Date(d14DaysAgo.getTime() + 48 * 3600 * 1000),
      calculatedSlaHours: 48,
      isBreached: true,
      breachHours: 72.0,
      trackingStatus: 'LOST',
      investigationStatus: 'RESOLVED_LOST',
      claimStatus: 'SETTLED',
      recoveryStatus: 'PAID_IN_FULL',
      declaredValue: 145.0,
      shippingCost: 18.0,
      weightKg: 2.1,
      currency: 'GBP',
      itemsSummary: 'Combat Sports Shin Guards (Pair)',
      itemsJson: JSON.stringify([
        { sku: 'CS-SG-01', title: 'Combat Sports Shin Guards (Pair)', quantity: 1, unitRetailPrice: 145.0, unitCostPrice: 55.0, lineTotal: 145.0 }
      ]),
      latestStatusDescription: 'Claim Settled: UPS Remittance Advice credit issued.',
      lastPhysicalScanAt: new Date(d14DaysAgo.getTime() + 24 * 3600 * 1000),
      lastScanLocation: 'Roissy Hub, France',
      lastEventTime: new Date(d14DaysAgo.getTime() + 24 * 3600 * 1000),
      source: 'CSV_IMPORT',
    },
  });

  await db.claim.create({
    data: {
      organizationId: orgMett.id,
      parcelId: pMettSettled.id,
      carrierId: carrierMettUPS.id,
      claimNumber: 'CLM-UPS-2026-088',
      carrierClaimReference: 'UPS-PAY-77102',
      reason: 'LOST_IN_TRANSIT',
      status: 'APPROVED',
      claimedAmount: 138.83,
      approvedAmount: 138.83,
      recoveredAmount: 138.83,
      currency: 'GBP',
      filingDeadline: new Date(d14DaysAgo.getTime() + 30 * 24 * 3600 * 1000),
      earliestFilingDate: d14DaysAgo,
      submittedAt: new Date(d9DaysAgo.getTime()),
      decidedAt: new Date(d4DaysAgo.getTime()),
      settledAt: new Date(dYesterday.getTime()),
      creditNoteReference: 'CN-UPS-99214-GB',
      declarationText: 'Settled loss declaration under UPS Air & Ground terms.',
      createdById: userMettOwner.id,
    },
  });

  console.log('--- Database Seed Completed Successfully ---');
  console.log(`Created Company A (${orgA.name}) with user: admin@apexglobal.example.com (pass: ApexPass123!)`);
  console.log(`Created Company B (${orgB.name}) with user: admin@nordiccraft.example.com (pass: NordicPass123!)`);
  console.log(`Created Primary Flagship: ${orgMett.name} with user: ${userMettOwner.email} (pass: Password123!)`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
