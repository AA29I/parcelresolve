import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateAutoClaimInvoice } from '@/lib/invoice-generator';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { parcelId, claimId, customCarrierFormat, lossReason, notes } = body;

    if (!parcelId) {
      return NextResponse.json({ error: 'parcelId is required' }, { status: 400 });
    }

    const invoice = await generateAutoClaimInvoice({
      organizationId: session.organizationId,
      parcelId,
      claimId,
      userId: session.userId,
      customCarrierFormat,
      lossReason,
      notes,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
