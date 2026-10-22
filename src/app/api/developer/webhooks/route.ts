import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { requireDeveloperOrAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireDeveloperOrAdmin();
    const webhooks = await db.outboundWebhook.findMany({
      where: { organizationId: session.organizationId },
      include: {
        deliveries: {
          orderBy: { deliveredAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ webhooks });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireDeveloperOrAdmin();
    const body = await req.json();
    const { name, targetUrl, events = ['parcel.status_changed', 'sla.breached', 'claim.approved'] } = body;

    if (!name || !targetUrl) {
      return NextResponse.json({ error: 'name and targetUrl are required' }, { status: 400 });
    }

    const secretKey = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const webhook = await db.outboundWebhook.create({
      data: {
        organizationId: session.organizationId,
        name,
        targetUrl,
        secretKey,
        events: JSON.stringify(events),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, webhook });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
