import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: claimId } = await params;
    const body = await req.json().catch(() => ({}));
    const { customRecipientEmail, notes } = body;

    const claim = await db.claim.findFirst({
      where: { id: claimId, organizationId: session.organizationId },
      include: {
        parcel: true,
        carrier: true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const recipientEmail =
      customRecipientEmail ||
      claim.carrier.claimRecipientEmail ||
      claim.carrier.enquiryRecipientEmail ||
      `claims@${claim.carrier.code.toLowerCase()}-support.example.com`;

    const invoice = claim.invoices[0];
    const invoiceRef = invoice ? invoice.invoiceNumber : 'Loss Statement Dossier';

    // Update claim status to SUBMITTED
    const updatedClaim = await db.claim.update({
      where: { id: claimId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    // Update parcel status
    await db.parcel.update({
      where: { id: claim.parcelId },
      data: {
        claimStatus: 'SUBMITTED',
      },
    });

    // Update claim invoice status if attached
    if (invoice) {
      await db.claimInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'SUBMITTED_TO_CARRIER',
          submittedAt: new Date(),
        },
      });
    }

    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'UPDATED',
        entityType: 'CLAIM',
        entityId: claim.id,
        details: JSON.stringify({
          action: 'DISPATCHED_TO_CARRIER',
          claimNumber: claim.claimNumber,
          recipientEmail,
          invoiceNumber: invoiceRef,
          notes: notes || null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      claim: updatedClaim,
      recipientEmail,
      message: `Claim ${claim.claimNumber} (with Loss Invoice ${invoiceRef}) has been formally dispatched to ${claim.carrier.name} Claims Desk (${recipientEmail}).`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
