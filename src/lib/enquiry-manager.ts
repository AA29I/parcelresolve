import db from './db';

export interface CreateEnquiryDraftParams {
  organizationId: string;
  parcelId: string;
  enquiryType?: 'NO_MOVEMENT' | 'SLA_BREACH' | 'DAMAGED' | 'MISROUTED';
  sendingMode?: 'DRAFT_ONLY' | 'STAFF_APPROVAL' | 'AUTO_SEND';
  notes?: string;
  userId?: string;
}

export interface EnquiryDraftResult {
  enquiryId: string;
  referenceNumber: string;
  status: string;
  subject: string;
  body: string;
  recipientEmail: string;
  deduplicated: boolean;
}

/**
 * Creates or retrieves a deduplicated carrier enquiry draft for a parcel
 */
export async function createOrGetCarrierEnquiry(
  params: CreateEnquiryDraftParams
): Promise<EnquiryDraftResult> {
  const {
    organizationId,
    parcelId,
    enquiryType = 'SLA_BREACH',
    sendingMode = 'STAFF_APPROVAL',
    notes,
    userId,
  } = params;

  // 1. Fetch parcel and carrier details
  const parcel = await db.parcel.findFirst({
    where: { id: parcelId, organizationId },
    include: {
      carrier: true,
      warehouse: true,
      organization: true,
    },
  });

  if (!parcel) {
    throw new Error(`Parcel not found: ${parcelId}`);
  }

  // 2. Email / enquiry deduplication: check if an active enquiry already exists
  const existingEnquiry = await db.carrierEnquiry.findFirst({
    where: {
      organizationId,
      parcelId,
      status: { in: ['DRAFT', 'PENDING_APPROVAL', 'SENT', 'CARRIER_REPLIED'] },
    },
  });

  if (existingEnquiry) {
    return {
      enquiryId: existingEnquiry.id,
      referenceNumber: existingEnquiry.referenceNumber,
      status: existingEnquiry.status,
      subject: existingEnquiry.subject,
      body: existingEnquiry.body,
      recipientEmail: existingEnquiry.recipientEmail,
      deduplicated: true,
    };
  }

  // 3. Compose professional enquiry body using template tags
  const recipientEmail =
    parcel.carrier.enquiryRecipientEmail ||
    `investigations@${parcel.carrier.code.toLowerCase()}-support.example.com`;

  const referenceNumber = `ENQ-${parcel.carrier.code}-${Date.now().toString().slice(-6)}`;
  const dispatchStr = new Date(parcel.dispatchDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const promisedStr = new Date(parcel.promisedDeliveryDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const subject = `[URGENT INVESTIGATION] Trk #${parcel.trackingNumber} - SLA Breach (${parcel.breachHours}h Overdue) - Ref ${referenceNumber}`;

  const body = `Dear ${parcel.carrier.name} Support Team,

RE: Shipment Tracking Investigation & Delivery Escalation
Tracking Number: ${parcel.trackingNumber}
Order Reference: ${parcel.orderNumber}
Shipper Account / Contracted Party: ${parcel.carrier.contractedParty}
Origin Facility: ${parcel.warehouse?.name || 'Central Distribution Center'}, ${parcel.warehouse?.city || 'US'}
Destination Address: ${parcel.recipientAddress}, ${parcel.recipientCity}, ${parcel.recipientState} ${parcel.recipientPostalCode}, ${parcel.recipientCountry}
Recipient Name: ${parcel.recipientName}

Shipment Timeline:
- Dispatched: ${dispatchStr}
- Agreed SLA Delivery Deadline: ${promisedStr}
- Current Status: ${parcel.trackingStatus} (${parcel.latestStatusDescription || 'In Transit'})
- Last Physical Scan Location: ${parcel.lastScanLocation || 'Distribution Hub'}
- Last Scan Timestamp: ${parcel.lastPhysicalScanAt ? new Date(parcel.lastPhysicalScanAt).toLocaleString() : 'N/A'}
- Elapsed Overdue Hours: ${parcel.breachHours} hours past contractual SLA

Please open an urgent carrier inquiry into this consignment and provide:
1. Current physical custody and geolocated depot scan.
2. Verified expected delivery date and route hindrance explanation.
3. Official loss confirmation if the package cannot be located within 48 business hours.

Internal Reference: ${referenceNumber}
Merchant Workspace: ${parcel.organization.name}

Sincerely,
Operations Escalations Desk
ParcelResolve Platform`;

  const initialStatus = sendingMode === 'AUTO_SEND' ? 'SENT' : sendingMode === 'STAFF_APPROVAL' ? 'PENDING_APPROVAL' : 'DRAFT';

  const enquiry = await db.carrierEnquiry.create({
    data: {
      organizationId,
      parcelId,
      carrierId: parcel.carrierId,
      referenceNumber,
      enquiryType,
      status: initialStatus,
      sendingMode,
      recipientEmail,
      subject,
      body,
      internalNotes: notes || null,
      sentAt: sendingMode === 'AUTO_SEND' ? new Date() : null,
      createdById: userId || null,
      followUpDueDate: new Date(Date.now() + 48 * 3600 * 1000), // 48h follow up
    },
  });

  // Create initial audit / message entry
  await db.enquiryMessage.create({
    data: {
      organizationId,
      enquiryId: enquiry.id,
      senderType: 'SYSTEM',
      senderEmail: 'system@parcelresolve.internal',
      senderName: 'SLA Engine',
      messageBody: `Carrier enquiry generated via ${sendingMode} policy. Subject: "${subject}".`,
    },
  });

  // Update parcel investigation status
  await db.parcel.update({
    where: { id: parcelId },
    data: {
      investigationStatus: initialStatus === 'SENT' ? 'AWAITING_CARRIER_REPLY' : 'OPEN',
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'CREATED',
      entityType: 'ENQUIRY',
      entityId: enquiry.id,
      details: JSON.stringify({ referenceNumber, sendingMode, initialStatus }),
    },
  });

  return {
    enquiryId: enquiry.id,
    referenceNumber,
    status: initialStatus,
    subject,
    body,
    recipientEmail,
    deduplicated: false,
  };
}

/**
 * Approve and dispatch a pending carrier enquiry
 */
export async function approveAndSendEnquiry(
  organizationId: string,
  enquiryId: string,
  userId?: string
): Promise<{ success: boolean; message: string }> {
  const enquiry = await db.carrierEnquiry.findFirst({
    where: { id: enquiryId, organizationId },
    include: { parcel: true },
  });

  if (!enquiry) {
    return { success: false, message: 'Enquiry not found' };
  }

  await db.carrierEnquiry.update({
    where: { id: enquiryId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      followUpDueDate: new Date(Date.now() + 48 * 3600 * 1000),
    },
  });

  await db.enquiryMessage.create({
    data: {
      organizationId,
      enquiryId,
      senderType: 'STAFF',
      senderEmail: 'ops@parcelresolve.internal',
      senderName: 'Staff Approver',
      messageBody: `Enquiry approved and officially dispatched to carrier contact (${enquiry.recipientEmail}).`,
    },
  });

  await db.parcel.update({
    where: { id: enquiry.parcelId },
    data: {
      investigationStatus: 'AWAITING_CARRIER_REPLY',
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'UPDATED',
      entityType: 'ENQUIRY',
      entityId: enquiryId,
      details: JSON.stringify({ action: 'APPROVED_AND_SENT', sentAt: new Date().toISOString() }),
    },
  });

  return { success: true, message: `Enquiry ${enquiry.referenceNumber} dispatched successfully.` };
}
