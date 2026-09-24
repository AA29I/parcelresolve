import db from './db';
import { generateAutoClaimInvoice } from './invoice-generator';

export type EscalationTier = 'INITIAL' | 'REMINDER_1' | 'REMINDER_2' | 'FINAL_DEMAND';

export interface FollowUpNoticeResult {
  success: boolean;
  enquiryId: string;
  referenceNumber: string;
  escalationTier: EscalationTier;
  followUpSequenceCount: number;
  subject: string;
  recipientEmail: string;
  sentAt: Date;
  nextFollowUpDueDate: Date;
}

export interface InboundResponseInput {
  organizationId: string;
  enquiryId?: string;
  referenceNumber?: string;
  trackingNumber?: string;
  senderEmail?: string;
  senderName?: string;
  messageBody: string;
  outcome?: 'PACKAGE_FOUND' | 'PACKAGE_LOST' | 'NEED_MORE_INFO' | 'GENERAL_UPDATE';
}

/**
 * Determine next escalation tier in cadence
 */
export function getNextEscalationTier(current: string): EscalationTier {
  switch (current) {
    case 'INITIAL':
      return 'REMINDER_1';
    case 'REMINDER_1':
      return 'REMINDER_2';
    case 'REMINDER_2':
    case 'FINAL_DEMAND':
    default:
      return 'FINAL_DEMAND';
  }
}

/**
 * Generates tailored email copy based on escalation tier and carrier metadata
 */
export function buildFollowUpContent(params: {
  enquiry: {
    referenceNumber: string;
    subject: string;
    body: string;
    recipientEmail: string;
    parcel: {
      trackingNumber: string;
      orderNumber: string;
      recipientName: string;
      recipientCity: string;
      recipientCountry: string;
      breachHours: number;
      stalledHours: number;
      declaredValue: number;
      currency: string;
      dispatchDate: Date;
    };
    carrier: {
      name: string;
      code: string;
      contractedParty: string;
    };
  };
  tier: EscalationTier;
  invoiceNumber?: string;
}) {
  const { enquiry, tier, invoiceNumber } = params;
  const { parcel, carrier } = enquiry;

  const dispatchStr = new Date(parcel.dispatchDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (tier === 'REMINDER_1') {
    const subject = `[SECOND NOTICE - DEPOT TRACER REQUIRED] Trk #${parcel.trackingNumber} - Consignment Stalled - Ref ${enquiry.referenceNumber}`;
    const body = `Dear ${carrier.name} Claims & Escalations Desk,

SECOND NOTICE / STATUS TRACER:
We are writing to follow up on our previous enquiry (Ref: ${enquiry.referenceNumber}) regarding shipment ${parcel.trackingNumber}, dispatched on ${dispatchStr}.

To date, our tracking telemetry indicates no physical checkpoint scan for over ${parcel.stalledHours || 48} hours, representing a serious breach of agreed delivery commitments.

Consignment Details:
- Tracking Number: ${parcel.trackingNumber}
- Order Reference: ${parcel.orderNumber}
- Consignee: ${parcel.recipientName} (${parcel.recipientCity}, ${parcel.recipientCountry})
- Shipper / Contract Party: ${carrier.contractedParty}
- Elapsed Overdue Hours: ${parcel.breachHours} hours overdue

Immediate Action Required:
1. Initiate a physical dock search at the last scanned carrier hub.
2. Provide a verified carrier update or transit remediation within 24 business hours.
3. If the package cannot be located, confirm loss status so formal reimbursement may be filed.

Reference: ${enquiry.referenceNumber}
Desk: Operations Escalations Unit - ParcelResolve`;

    return { subject, body };
  }

  if (tier === 'REMINDER_2') {
    const subject = `[FORMAL SLA DEFAULT NOTICE] Trk #${parcel.trackingNumber} - Non-Delivery Breach - Ref ${enquiry.referenceNumber}`;
    const body = `ATTN: ${carrier.name} Senior Operations & Carrier Support,

FORMAL NOTICE OF CONTRACTUAL SLA DEFAULT:
This is our third communication regarding consignment ${parcel.trackingNumber} (Order #${parcel.orderNumber}). 

Despite previous notices, this consignment remains unlocated after ${parcel.breachHours} hours past contractual SLA delivery. Under standard carrier terms of carriage, consignments exhibiting prolonged transit dormancy without dock scan are presumed lost.

Consignment Valuation & Shipper Standing:
- Declared Cargo Value: ${parcel.currency} ${parcel.declaredValue.toFixed(2)}
- Contract Holder: ${carrier.contractedParty}
- Primary Waybill: ${parcel.trackingNumber}

Please be advised that unless verified physical delivery is completed or proof of delivery (POD) is provided within 48 hours, a formal Cargo Reimbursement Claim and Loss Statement will be submitted for full invoice indemnity.

Reference: ${enquiry.referenceNumber}
ParcelResolve Freight Protection`;

    return { subject, body };
  }

  // FINAL_DEMAND
  const invRef = invoiceNumber ? `Claim Invoice Reference: ${invoiceNumber}` : `Formal Loss Statement Attached`;
  const subject = `[FINAL DEMAND & REIMBURSEMENT CLAIM] Trk #${parcel.trackingNumber} - Ref ${enquiry.referenceNumber}`;
  const body = `ATTN: ${carrier.name} Formal Claims & Recovery Adjudication Unit,

FINAL DEMAND FOR FREIGHT LOSS INDEMNITY:
Consignment ${parcel.trackingNumber} is hereby officially declared Lost in Transit following complete exhaustion of delivery tolerances and non-response to prior notices (Enquiry Ref: ${enquiry.referenceNumber}).

Demand Details:
- Consignment Waybill: ${parcel.trackingNumber}
- Merchant Order: ${parcel.orderNumber}
- Total Indemnity Claimed: ${parcel.currency} ${parcel.declaredValue.toFixed(2)}
- ${invRef}

Legal Carriage Terms:
Pursuant to carrier cargo liability and freight carriage covenants, demand is hereby made for immediate payment or credit note authorization in the full claimed amount. Please issue carrier credit approval or payment remittance within five (5) business days.

Statutory Notice:
This loss statement and attached reimbursement claim is filed exclusively for carrier indemnity under governing transit agreements.

Certified by:
Operations Legal & Freight Recovery Desk
ParcelResolve Platform`;

  return { subject, body };
}

/**
 * Dispatches an automated follow-up email notice to the carrier
 */
export async function dispatchFollowUpNotice(params: {
  organizationId: string;
  enquiryId: string;
  forceTier?: EscalationTier;
  customSubject?: string;
  customBody?: string;
  userId?: string;
}): Promise<FollowUpNoticeResult> {
  const { organizationId, enquiryId, forceTier, customSubject, customBody, userId } = params;

  const enquiry = await db.carrierEnquiry.findFirst({
    where: { id: enquiryId, organizationId },
    include: {
      parcel: true,
      carrier: true,
      organization: true,
    },
  });

  if (!enquiry) {
    throw new Error(`Carrier enquiry not found: ${enquiryId}`);
  }

  const nextTier = forceTier || getNextEscalationTier(enquiry.escalationTier);

  // Check if a claim invoice exists for this parcel
  const existingInvoice = await db.claimInvoice.findFirst({
    where: { organizationId, parcelId: enquiry.parcelId },
    orderBy: { createdAt: 'desc' },
  });

  const generated = buildFollowUpContent({
    enquiry,
    tier: nextTier,
    invoiceNumber: existingInvoice?.invoiceNumber,
  });

  const subject = customSubject || generated.subject;
  const body = customBody || generated.body;

  const nextFollowUpDueDate = new Date(
    Date.now() + (nextTier === 'FINAL_DEMAND' ? 5 * 24 * 3600 * 1000 : 48 * 3600 * 1000)
  );

  const updatedEnquiry = await db.carrierEnquiry.update({
    where: { id: enquiryId },
    data: {
      status: 'SENT',
      escalationTier: nextTier,
      followUpSequenceCount: { increment: 1 },
      lastFollowUpSentAt: new Date(),
      followUpDueDate: nextFollowUpDueDate,
    },
  });

  // Record outgoing message in audit thread
  await db.enquiryMessage.create({
    data: {
      organizationId,
      enquiryId,
      senderType: 'STAFF',
      senderEmail: 'escalations@parcelresolve.internal',
      senderName: `Automated Follow-Up Engine (${nextTier})`,
      messageBody: `[Follow-Up Notice Dispatched to ${enquiry.recipientEmail}]\n\nSubject: ${subject}\n\n${body}`,
    },
  });

  // If this was a final demand and no invoice existed yet, auto-generate one!
  if (nextTier === 'FINAL_DEMAND' && !existingInvoice) {
    try {
      await generateAutoClaimInvoice({
        organizationId,
        parcelId: enquiry.parcelId,
        userId,
        notes: `Auto-generated upon Final Demand notice dispatch for Enquiry ${enquiry.referenceNumber}`,
      });
    } catch (e) {
      console.warn('Could not auto-generate claim invoice during final demand:', e);
    }
  }

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'UPDATED',
      entityType: 'ENQUIRY',
      entityId: enquiryId,
      details: JSON.stringify({
        action: 'FOLLOW_UP_DISPATCHED',
        escalationTier: nextTier,
        sequenceCount: updatedEnquiry.followUpSequenceCount,
      }),
    },
  });

  return {
    success: true,
    enquiryId: enquiry.id,
    referenceNumber: enquiry.referenceNumber,
    escalationTier: nextTier,
    followUpSequenceCount: updatedEnquiry.followUpSequenceCount,
    subject,
    recipientEmail: enquiry.recipientEmail,
    sentAt: new Date(),
    nextFollowUpDueDate,
  };
}

/**
 * Ingests inbound carrier response (either simulated in demo or from actual webhook/email ingestion)
 */
export async function ingestCarrierResponse(params: InboundResponseInput) {
  const {
    organizationId,
    enquiryId,
    referenceNumber,
    trackingNumber,
    senderEmail,
    senderName,
    messageBody,
    outcome = 'GENERAL_UPDATE',
  } = params;

  // Locate enquiry
  let enquiry = null;
  if (enquiryId) {
    enquiry = await db.carrierEnquiry.findFirst({
      where: { id: enquiryId, organizationId },
      include: { parcel: true, carrier: true },
    });
  } else if (referenceNumber) {
    enquiry = await db.carrierEnquiry.findFirst({
      where: { referenceNumber, organizationId },
      include: { parcel: true, carrier: true },
    });
  } else if (trackingNumber) {
    const parcel = await db.parcel.findFirst({
      where: { trackingNumber, organizationId },
    });
    if (parcel) {
      enquiry = await db.carrierEnquiry.findFirst({
        where: { parcelId: parcel.id, organizationId },
        include: { parcel: true, carrier: true },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  if (!enquiry) {
    throw new Error('Carrier enquiry could not be found matching provided identifiers');
  }

  const effectiveSenderEmail = senderEmail || enquiry.recipientEmail;
  const effectiveSenderName = senderName || `${enquiry.carrier.name} Claims Representative`;

  // 1. Record inbound message in thread
  const inboundMessage = await db.enquiryMessage.create({
    data: {
      organizationId,
      enquiryId: enquiry.id,
      senderType: 'CARRIER',
      senderEmail: effectiveSenderEmail,
      senderName: effectiveSenderName,
      messageBody,
    },
  });

  // 2. Determine semantic outcome and update statuses
  let parcelInvestigationStatus = 'AWAITING_CARRIER_REPLY';
  let enquiryStatus = 'CARRIER_REPLIED';
  let autoCreatedInvoice = null;

  const lowerBody = messageBody.toLowerCase();
  const isLossConfirmed =
    outcome === 'PACKAGE_LOST' ||
    lowerBody.includes('declared lost') ||
    lowerBody.includes('deemed lost') ||
    lowerBody.includes('unable to locate') ||
    lowerBody.includes('submit formal claim') ||
    lowerBody.includes('submit claim invoice');

  const isFoundConfirmed =
    outcome === 'PACKAGE_FOUND' ||
    lowerBody.includes('package located') ||
    lowerBody.includes('scanned at depot') ||
    lowerBody.includes('scheduled for delivery') ||
    lowerBody.includes('delivered successfully');

  if (isLossConfirmed) {
    parcelInvestigationStatus = 'RESOLVED_LOST';
    enquiryStatus = 'RESOLVED';

    // Update parcel tracking and claim statuses
    await db.parcel.update({
      where: { id: enquiry.parcelId },
      data: {
        trackingStatus: 'LOST',
        investigationStatus: 'RESOLVED_LOST',
        claimStatus: 'ELIGIBLE',
      },
    });

    // Check if a claim already exists; if not, create one
    let claim = await db.claim.findFirst({
      where: { parcelId: enquiry.parcelId, organizationId },
    });

    if (!claim) {
      claim = await db.claim.create({
        data: {
          organizationId,
          parcelId: enquiry.parcelId,
          carrierId: enquiry.carrierId,
          claimNumber: `CLM-${enquiry.carrier.code.toUpperCase()}-${Date.now().toString().slice(-6)}`,
          carrierClaimReference: `CR-${enquiry.referenceNumber}`,
          reason: 'LOST_IN_TRANSIT',
          status: 'READY_TO_SUBMIT',
          claimedAmount: Number(enquiry.parcel.declaredValue || 0) + Number(enquiry.parcel.shippingCost || 0),
          currency: enquiry.parcel.currency || 'USD',
          filingDeadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          earliestFilingDate: new Date(),
        },
      });
    }

    // Check if an invoice exists; if not, auto-create one
    const existingInv = await db.claimInvoice.findFirst({
      where: { parcelId: enquiry.parcelId, organizationId },
    });

    if (!existingInv) {
      autoCreatedInvoice = await generateAutoClaimInvoice({
        organizationId,
        parcelId: enquiry.parcelId,
        claimId: claim.id,
        notes: `Automatically generated upon carrier confirming parcel loss in Enquiry ${enquiry.referenceNumber}`,
      });
    }
  } else if (isFoundConfirmed) {
    parcelInvestigationStatus = 'RESOLVED_FOUND';
    enquiryStatus = 'RESOLVED';

    await db.parcel.update({
      where: { id: enquiry.parcelId },
      data: {
        investigationStatus: 'RESOLVED_FOUND',
      },
    });
  }

  // Update enquiry
  const updatedEnquiry = await db.carrierEnquiry.update({
    where: { id: enquiry.id },
    data: {
      status: enquiryStatus,
      lastReplyAt: new Date(),
      replyCount: { increment: 1 },
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      action: 'UPDATED',
      entityType: 'ENQUIRY',
      entityId: enquiry.id,
      details: JSON.stringify({
        action: 'CARRIER_REPLY_INGESTED',
        sender: effectiveSenderEmail,
        isLossConfirmed,
        isFoundConfirmed,
        newStatus: enquiryStatus,
      }),
    },
  });

  return {
    success: true,
    enquiry: updatedEnquiry,
    message: inboundMessage,
    outcome: isLossConfirmed ? 'PACKAGE_LOST' : isFoundConfirmed ? 'PACKAGE_FOUND' : 'IN_PROGRESS',
    autoCreatedInvoiceNumber: autoCreatedInvoice?.invoiceNumber,
  };
}
