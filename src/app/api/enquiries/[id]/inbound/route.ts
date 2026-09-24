import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ingestCarrierResponse } from '@/lib/follow-up-engine';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: enquiryId } = await params;
    const body = await req.json();

    const {
      senderEmail,
      senderName,
      messageBody,
      outcome = 'GENERAL_UPDATE',
    } = body;

    if (!messageBody || !messageBody.trim()) {
      return NextResponse.json({ error: 'messageBody is required' }, { status: 400 });
    }

    const result = await ingestCarrierResponse({
      organizationId: session.organizationId,
      enquiryId,
      senderEmail,
      senderName,
      messageBody,
      outcome,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
