import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createOrGetCarrierEnquiry } from '@/lib/enquiry-manager';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      organizationId: session.organizationId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const enquiries = await db.carrierEnquiry.findMany({
      where,
      include: {
        parcel: { select: { trackingNumber: true, orderNumber: true, recipientName: true, destinationZone: true, breachHours: true } },
        carrier: { select: { name: true, code: true } },
        assignedUser: { select: { name: true, email: true } },
        messages: { orderBy: { messageTimestamp: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ enquiries });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { parcelId, enquiryType, sendingMode, notes } = body;

    if (!parcelId) {
      return NextResponse.json({ error: 'parcelId is required' }, { status: 400 });
    }

    const result = await createOrGetCarrierEnquiry({
      organizationId: session.organizationId,
      parcelId,
      enquiryType,
      sendingMode,
      notes,
      userId: session.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
