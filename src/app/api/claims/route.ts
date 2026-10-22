import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createClaimRecord } from '@/lib/claim-manager';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const carrierId = searchParams.get('carrierId');

    const where: Record<string, unknown> = {
      organizationId: session.organizationId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (carrierId && carrierId !== 'ALL') {
      where.carrierId = carrierId;
    }

    const claims = await db.claim.findMany({
      where,
      include: {
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            orderNumber: true,
            recipientName: true,
            dispatchDate: true,
            trackingStatus: true,
            recoveryStatus: true,
          },
        },
        carrier: { select: { id: true, name: true, code: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Financial totals
    const financialSummary = claims.reduce(
      (acc, c) => {
        acc.totalClaimed += c.claimedAmount;
        acc.totalApproved += c.approvedAmount;
        acc.totalRecovered += c.recoveredAmount;
        return acc;
      },
      { totalClaimed: 0, totalApproved: 0, totalRecovered: 0 }
    );

    return NextResponse.json({ claims, financialSummary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { parcelId, reason, claimedAmount, notes } = body;

    if (!parcelId || !reason) {
      return NextResponse.json({ error: 'parcelId and reason are required' }, { status: 400 });
    }

    const claim = await createClaimRecord({
      organizationId: session.organizationId,
      parcelId,
      reason,
      claimedAmount: claimedAmount ? Number(claimedAmount) : undefined,
      userId: session.userId,
      notes,
    });

    return NextResponse.json({ success: true, claim });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
