import { NextResponse } from 'next/server';
import { requireClaimsOrAdmin } from '@/lib/auth';
import { recordClaimDecision } from '@/lib/claim-manager';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireClaimsOrAdmin();
    const body = await req.json();

    const {
      decision,
      approvedAmount,
      recoveredAmount,
      creditNoteReference,
      denialReason,
    } = body;

    if (!decision) {
      return NextResponse.json({ error: 'Decision is required' }, { status: 400 });
    }

    const updated = await recordClaimDecision({
      organizationId: session.organizationId,
      claimId: params.id,
      decision,
      approvedAmount: approvedAmount !== undefined ? Number(approvedAmount) : undefined,
      recoveredAmount: recoveredAmount !== undefined ? Number(recoveredAmount) : undefined,
      creditNoteReference,
      denialReason,
      userId: session.userId,
    });

    return NextResponse.json({ success: true, claim: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
