import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const claim = await db.claim.findFirst({
      where: { id: params.id, organizationId: session.organizationId },
      include: { parcel: true, carrier: true },
    });

    if (!claim) {
      return new Response('Claim not found', { status: 404 });
    }

    const content = claim.declarationText || 'No declaration text generated';

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${claim.claimNumber}_Declaration.txt"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(msg, { status: 500 });
  }
}
