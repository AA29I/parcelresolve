import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const claim = await db.claim.findFirst({
      where: { id: params.id, organizationId: session.organizationId },
      include: {
        parcel: {
          include: {
            carrier: true,
            warehouse: true,
            trackingEvents: { orderBy: { eventTimestamp: 'desc' } },
          },
        },
        carrier: true,
        assignedUser: true,
        documents: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json({ claim });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
