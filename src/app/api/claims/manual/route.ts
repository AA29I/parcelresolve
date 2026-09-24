import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createManualClaimInvoice, CarrierInvoiceFormat, ClaimLossReason } from '@/lib/invoice-generator';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const {
      parcelId,
      trackingNumber,
      carrierId,
      reason = 'LOST_IN_TRANSIT',
      claimedAmount,
      currency = 'USD',
      carrierFormat = 'UPS_STANDARD',
      lineItems = [],
      customFields = {},
      evidenceImages = [],
      notes,
      sendImmediately = false,
    } = body;

    // Resolve parcel
    let parcel = null;
    if (parcelId) {
      parcel = await db.parcel.findFirst({
        where: { id: parcelId, organizationId: session.organizationId },
        include: { carrier: true },
      });
    } else if (trackingNumber) {
      parcel = await db.parcel.findFirst({
        where: { trackingNumber, organizationId: session.organizationId },
        include: { carrier: true },
      });
    }

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found in workspace' }, { status: 404 });
    }

    const effectiveCarrierId = carrierId || parcel.carrierId;
    const carrier = await db.carrier.findFirst({
      where: { id: effectiveCarrierId, organizationId: session.organizationId },
    });

    if (!carrier) {
      return NextResponse.json({ error: 'Carrier not found' }, { status: 404 });
    }

    const effectiveClaimedAmount =
      claimedAmount !== undefined
        ? Number(claimedAmount)
        : Number(parcel.declaredValue || 0) + Number(parcel.shippingCost || 0);

    const claimNumber = `CLM-${carrier.code.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const initialStatus = sendImmediately ? 'SUBMITTED' : 'READY_TO_SUBMIT';

    // Create Claim record
    const claim = await db.claim.create({
      data: {
        organizationId: session.organizationId,
        parcelId: parcel.id,
        carrierId: carrier.id,
        claimNumber,
        carrierClaimReference: `CR-${parcel.trackingNumber.slice(-6)}`,
        reason,
        status: initialStatus,
        claimedAmount: effectiveClaimedAmount,
        currency,
        filingDeadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        earliestFilingDate: new Date(),
        submittedAt: sendImmediately ? new Date() : null,
        createdById: session.userId,
      },
    });

    // Create Custom Claim Invoice
    const invoice = await createManualClaimInvoice({
      organizationId: session.organizationId,
      parcelId: parcel.id,
      claimId: claim.id,
      carrierId: carrier.id,
      generationType: 'MANUAL',
      carrierFormat: carrierFormat as CarrierInvoiceFormat,
      lossReason: reason as ClaimLossReason,
      currency,
      totalClaimedAmount: effectiveClaimedAmount,
      lineItems,
      customFields,
      evidenceImages,
      notes,
      userId: session.userId,
    });

    // Update parcel status
    await db.parcel.update({
      where: { id: parcel.id },
      data: {
        claimStatus: initialStatus,
        claimedAmount: effectiveClaimedAmount,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'CREATED',
        entityType: 'CLAIM',
        entityId: claim.id,
        details: JSON.stringify({
          claimNumber,
          invoiceNumber: invoice.invoiceNumber,
          status: initialStatus,
          claimedAmount: effectiveClaimedAmount,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      claim,
      invoice,
      message: sendImmediately
        ? `Claim ${claimNumber} created and formally dispatched to ${carrier.name}.`
        : `Claim ${claimNumber} prepared and ready for carrier submission.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
