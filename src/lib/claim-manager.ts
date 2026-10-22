import db from './db';

export interface EvaluateClaimEligibilityResult {
  isEligible: boolean;
  reason: string;
  earliestFilingDate: Date;
  filingDeadline: Date;
  recommendedAmount: number;
}

/**
 * Checks whether a parcel is eligible for carrier claim filing
 */
export function evaluateClaimEligibility(parcel: {
  dispatchDate: Date;
  trackingStatus: string;
  declaredValue: number;
  shippingCost: number;
  breachHours: number;
  stalledHours: number;
}): EvaluateClaimEligibilityResult {
  const dispatch = new Date(parcel.dispatchDate);

  // Standard carrier rules: earliest filing is 7 days post-dispatch (or immediate if marked DAMAGED/LOST)
  const isImmediatelyEligible = ['LOST', 'DAMAGED'].includes(parcel.trackingStatus);
  const earliestFilingDate = isImmediatelyEligible
    ? new Date(dispatch)
    : new Date(dispatch.getTime() + 7 * 24 * 3600 * 1000);

  // Final filing deadline: typically 30 days post dispatch
  const filingDeadline = new Date(dispatch.getTime() + 30 * 24 * 3600 * 1000);

  const now = new Date();
  const recommendedAmount = Number(parcel.declaredValue || 0) + Number(parcel.shippingCost || 0);

  if (now > filingDeadline) {
    return {
      isEligible: false,
      reason: 'Filing window has lapsed (exceeded 30-day post-dispatch carrier deadline).',
      earliestFilingDate,
      filingDeadline,
      recommendedAmount,
    };
  }

  if (isImmediatelyEligible) {
    return {
      isEligible: true,
      reason: `Eligible for immediate filing due to verified carrier status (${parcel.trackingStatus}).`,
      earliestFilingDate,
      filingDeadline,
      recommendedAmount,
    };
  }

  if (now < earliestFilingDate) {
    const daysUntil = Math.ceil((earliestFilingDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return {
      isEligible: false,
      reason: `Carrier requires a minimum of 7 transit days before non-delivery claims. Eligible in ${daysUntil} day(s).`,
      earliestFilingDate,
      filingDeadline,
      recommendedAmount,
    };
  }

  if (parcel.breachHours > 48 || parcel.stalledHours > 72) {
    return {
      isEligible: true,
      reason: `Eligible: Parcel is stalled (${parcel.stalledHours}h without scan) and breached SLA (${parcel.breachHours}h overdue).`,
      earliestFilingDate,
      filingDeadline,
      recommendedAmount,
    };
  }

  return {
    isEligible: false,
    reason: 'Parcel is actively moving within standard carrier investigation tolerance.',
    earliestFilingDate,
    filingDeadline,
    recommendedAmount,
  };
}

/**
 * Generates the standardized legal Loss Declaration with explicit disclaimer
 */
export function generateClaimDeclarationText(params: {
  claimNumber: string;
  trackingNumber: string;
  orderNumber: string;
  carrierName: string;
  contractedParty: string;
  recipientName: string;
  recipientAddress: string;
  declaredValue: number;
  shippingCost: number;
  totalClaimed: number;
  currency: string;
  itemsSummary: string;
  reason: string;
  companyName: string;
}): string {
  const {
    claimNumber,
    trackingNumber,
    orderNumber,
    carrierName,
    contractedParty,
    recipientName,
    recipientAddress,
    declaredValue,
    shippingCost,
    totalClaimed,
    currency,
    itemsSummary,
    reason,
    companyName,
  } = params;

  const disclaimerBanner = `================================================================================
*** OFFICIAL CARRIER CLAIM DECLARATION / LOSS STATEMENT ***
*** LEGAL DISCLAIMER: THIS DOCUMENT IS A FORMAL LOSS SUBMISSION STATEMENT     ***
*** PREPARED EXCLUSIVELY FOR CARRIER FREIGHT REIMBURSEMENT. IT IS NOT AN     ***
*** ORIGINAL COMMERCIAL SALES INVOICE OR CONSUMER TAX INVOICE.                ***
================================================================================`;

  return `${disclaimerBanner}

Claim Reference: ${claimNumber}
Submission Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Carrier / Service Provider: ${carrierName}
Contracted Shipper Account: ${contractedParty}

1. CONSIGNMENT PARTICULARS
- Consignment Tracking Number: ${trackingNumber}
- Merchant Order Identifier: ${orderNumber}
- Intended Recipient: ${recipientName}
- Delivery Destination: ${recipientAddress}
- Primary Loss Reason: ${reason}

2. ITEMIZATION OF DIRECT MERCHANDISE LOSS
- Declared Consignment Items: ${itemsSummary || 'Commercial goods as per merchant manifest'}
- Cost Value of Lost/Damaged Merchandise: ${currency} ${declaredValue.toFixed(2)}
- Contracted Outbound Freight Cost: ${currency} ${shippingCost.toFixed(2)}
--------------------------------------------------------------------------------
TOTAL MONETARY CLAIM SUBMISSION: ${currency} ${totalClaimed.toFixed(2)}
--------------------------------------------------------------------------------

3. SHIPPERS STATUTORY LOSS DECLARATION
The undersigned claimant certifies that the aforementioned consignment was tendered
to the carrier in sound condition, that delivery was not completed in accordance with
the carriage terms, and that the monetary amount claimed represents genuine unrecovered
loss sustained by the claimant.

Claimant Organization: ${companyName}
Authorized Platform: ParcelResolve Enterprise Claims Network
Verification Key: SHA256-${claimNumber}-${Date.now().toString(16).toUpperCase()}
`;
}

/**
 * Creates a new Claim record with generated declaration document and auto-initializes status
 */
export async function createClaimRecord(params: {
  organizationId: string;
  parcelId: string;
  reason: 'LOST_IN_TRANSIT' | 'DAMAGE_IN_TRANSIT' | 'SLA_BREACH_PENALTY' | 'INCORRECT_DELIVERY';
  claimedAmount?: number;
  userId?: string;
  notes?: string;
}) {
  const { organizationId, parcelId, reason, userId } = params;

  const parcel = await db.parcel.findFirst({
    where: { id: parcelId, organizationId },
    include: { carrier: true, organization: true },
  });

  if (!parcel) {
    throw new Error(`Parcel not found: ${parcelId}`);
  }

  const eligibility = evaluateClaimEligibility({
    dispatchDate: parcel.dispatchDate,
    trackingStatus: parcel.trackingStatus,
    declaredValue: parcel.declaredValue,
    shippingCost: parcel.shippingCost,
    breachHours: parcel.breachHours,
    stalledHours: parcel.stalledHours,
  });

  const claimNumber = `CLM-${parcel.carrier.code}-${Date.now().toString().slice(-6)}`;
  const claimedAmount = params.claimedAmount || eligibility.recommendedAmount;

  const declarationText = generateClaimDeclarationText({
    claimNumber,
    trackingNumber: parcel.trackingNumber,
    orderNumber: parcel.orderNumber,
    carrierName: parcel.carrier.name,
    contractedParty: parcel.carrier.contractedParty,
    recipientName: parcel.recipientName,
    recipientAddress: `${parcel.recipientAddress}, ${parcel.recipientCity}, ${parcel.recipientCountry}`,
    declaredValue: parcel.declaredValue,
    shippingCost: parcel.shippingCost,
    totalClaimed: claimedAmount,
    currency: parcel.currency,
    itemsSummary: parcel.itemsSummary || 'Standard retail package contents',
    reason,
    companyName: parcel.organization.name,
  });

  const claim = await db.claim.create({
    data: {
      organizationId,
      parcelId,
      carrierId: parcel.carrierId,
      claimNumber,
      reason,
      status: 'READY_TO_SUBMIT',
      claimedAmount,
      currency: parcel.currency,
      earliestFilingDate: eligibility.earliestFilingDate,
      filingDeadline: eligibility.filingDeadline,
      declarationText,
      createdById: userId || null,
      assignedUserId: userId || null,
    },
  });

  // Attach the official generated declaration document
  await db.claimDocument.create({
    data: {
      organizationId,
      claimId: claim.id,
      parcelId,
      documentType: 'INVOICE_DECLARATION',
      fileName: `${claimNumber}_Carrier_Loss_Declaration.pdf`,
      fileUrl: `/api/claims/${claim.id}/declaration`,
      fileSize: declarationText.length,
      mimeType: 'text/plain',
      isGeneratedDeclaration: true,
      disclaimerText: 'Claim Declaration / Loss Statement for Carrier Reimbursement — Not an Original Commercial Sales Invoice',
    },
  });

  // Update parcel claim status
  await db.parcel.update({
    where: { id: parcelId },
    data: {
      claimStatus: 'READY_TO_SUBMIT',
      claimedAmount,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'CREATED',
      entityType: 'CLAIM',
      entityId: claim.id,
      details: JSON.stringify({ claimNumber, claimedAmount, currency: parcel.currency }),
    },
  });

  return claim;
}

/**
 * Updates a claim's decision (Approve / Reject / Settle) and updates recovery figures separately
 */
export async function recordClaimDecision(params: {
  organizationId: string;
  claimId: string;
  decision: 'APPROVED' | 'REJECTED' | 'APPEALED' | 'SETTLED';
  approvedAmount?: number;
  recoveredAmount?: number;
  creditNoteReference?: string;
  denialReason?: string;
  userId?: string;
}) {
  const {
    organizationId,
    claimId,
    decision,
    approvedAmount,
    recoveredAmount,
    creditNoteReference,
    denialReason,
    userId,
  } = params;

  const claim = await db.claim.findFirst({
    where: { id: claimId, organizationId },
    include: { parcel: true },
  });

  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }

  let newStatus = claim.status;
  let decidedAt = claim.decidedAt;
  let settledAt = claim.settledAt;
  let finalApproved = claim.approvedAmount;
  let finalRecovered = claim.recoveredAmount;
  let appealCount = claim.appealCount;

  if (decision === 'APPROVED') {
    newStatus = 'APPROVED';
    decidedAt = new Date();
    finalApproved = approvedAmount !== undefined ? approvedAmount : claim.claimedAmount;
  } else if (decision === 'REJECTED') {
    newStatus = 'REJECTED';
    decidedAt = new Date();
  } else if (decision === 'APPEALED') {
    newStatus = 'APPEALED';
    appealCount += 1;
  } else if (decision === 'SETTLED') {
    newStatus = 'CLOSED';
    settledAt = new Date();
    if (recoveredAmount !== undefined) finalRecovered = recoveredAmount;
  }

  // Determine recoveryStatus
  let recoveryStatus = claim.parcel.recoveryStatus;
  if (finalRecovered >= claim.claimedAmount && claim.claimedAmount > 0) {
    recoveryStatus = 'PAID_IN_FULL';
  } else if (finalRecovered > 0) {
    recoveryStatus = 'PARTIALLY_PAID';
  }

  const updatedClaim = await db.claim.update({
    where: { id: claimId },
    data: {
      status: newStatus,
      decidedAt,
      settledAt,
      approvedAmount: finalApproved,
      recoveredAmount: finalRecovered,
      creditNoteReference: creditNoteReference || claim.creditNoteReference,
      denialReason: denialReason || claim.denialReason,
      appealCount,
      updatedAt: new Date(),
    },
  });

  await db.parcel.update({
    where: { id: claim.parcelId },
    data: {
      claimStatus: newStatus,
      recoveryStatus,
      approvedAmount: finalApproved,
      recoveredAmount: finalRecovered,
      creditNoteNumber: creditNoteReference || claim.parcel.creditNoteNumber,
    },
  });

  await db.auditLog.create({
    data: {
      organizationId,
      userId: userId || null,
      action: 'UPDATED',
      entityType: 'CLAIM',
      entityId: claimId,
      details: JSON.stringify({ decision, finalApproved, finalRecovered, creditNoteReference }),
    },
  });

  return updatedClaim;
}
