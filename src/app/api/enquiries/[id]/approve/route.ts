import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { approveAndSendEnquiry } from '@/lib/enquiry-manager';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const result = await approveAndSendEnquiry(session.organizationId, params.id, session.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
