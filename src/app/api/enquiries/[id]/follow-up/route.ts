import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import {
  dispatchFollowUpNotice,
  buildFollowUpContent,
  getNextEscalationTier,
  EscalationTier,
} from '@/lib/follow-up-engine';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: enquiryId } = await params;

    const enquiry = await db.carrierEnquiry.findFirst({
      where: { id: enquiryId, organizationId: session.organizationId },
      include: {
        parcel: true,
        carrier: true,
      },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    const nextTier = getNextEscalationTier(enquiry.escalationTier);

    // Look up any claim invoice
    const existingInvoice = await db.claimInvoice.findFirst({
      where: { organizationId: session.organizationId, parcelId: enquiry.parcelId },
      orderBy: { createdAt: 'desc' },
    });

    const preview = buildFollowUpContent({
      enquiry,
      tier: nextTier,
      invoiceNumber: existingInvoice?.invoiceNumber,
    });

    return NextResponse.json({
      currentTier: enquiry.escalationTier,
      nextTier,
      sequenceCount: enquiry.followUpSequenceCount,
      recipientEmail: enquiry.recipientEmail,
      followUpDueDate: enquiry.followUpDueDate,
      preview,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: enquiryId } = await params;
    const body = await req.json().catch(() => ({}));
    const { forceTier, customSubject, customBody } = body;

    const result = await dispatchFollowUpNotice({
      organizationId: session.organizationId,
      enquiryId,
      forceTier: forceTier as EscalationTier,
      customSubject,
      customBody,
      userId: session.userId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
