import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ invoiceNumber: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { invoiceNumber } = await params;

    const invoice = await db.claimInvoice.findFirst({
      where: {
        invoiceNumber,
        organizationId: session.organizationId,
      },
      include: {
        carrier: true,
        parcel: true,
        claim: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { invoiceNumber } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['DRAFT', 'FINALIZED', 'SUBMITTED_TO_CARRIER', 'SETTLED', 'VOID'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const updated = await db.claimInvoice.updateMany({
      where: {
        invoiceNumber,
        organizationId: session.organizationId,
      },
      data: {
        status,
        submittedAt: status === 'SUBMITTED_TO_CARRIER' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, updatedCount: updated.count });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
