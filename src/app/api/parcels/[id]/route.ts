import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const parcel = await db.parcel.findFirst({
      where: {
        id: params.id,
        organizationId: session.organizationId,
      },
      include: {
        carrier: true,
        warehouse: true,
        trackingEvents: {
          orderBy: { eventTimestamp: 'desc' },
        },
        rawTrackingEvents: {
          orderBy: { receivedAt: 'desc' },
          take: 5,
        },
        enquiries: {
          include: { messages: true, assignedUser: true },
          orderBy: { createdAt: 'desc' },
        },
        claims: {
          include: { documents: true, assignedUser: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }

    return NextResponse.json({ parcel });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
