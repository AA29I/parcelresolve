import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { refreshParcelTracking } from '@/lib/tracking-engine';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const result = await refreshParcelTracking(session.organizationId, params.id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 429 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
