import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { CARRIER_CATALOG } from '@/lib/carrier-connectors';

export async function GET() {
  try {
    const session = await requireAuth();
    const connectedCarriers = await db.carrier.findMany({
      where: { organizationId: session.organizationId },
      include: {
        connectors: { orderBy: { version: 'desc' }, take: 1 },
        mappings: true,
        slaPolicies: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      connectedCarriers,
      catalog: CARRIER_CATALOG,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const {
      code,
      name,
      category = 'DIRECT_COURIER',
      connectionType = 'CONFIGURABLE_API',
      capabilities = 'LOOKUP,WEBHOOK,POD',
      contractedParty,
      physicalCarrier,
      finalMileCarrier,
      enquiryRecipientEmail,
      claimRecipientEmail,
      accountCredentials,
    } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Carrier code and name are required' }, { status: 400 });
    }

    const carrier = await db.carrier.create({
      data: {
        organizationId: session.organizationId,
        code: code.toUpperCase().trim(),
        name,
        category,
        connectionType,
        capabilities,
        contractedParty: contractedParty || `${session.orgSlug} Master Account`,
        physicalCarrier: physicalCarrier || code,
        finalMileCarrier: finalMileCarrier || code,
        enquiryRecipientEmail: enquiryRecipientEmail || null,
        claimRecipientEmail: claimRecipientEmail || null,
        accountCredentials: accountCredentials ? JSON.stringify(accountCredentials) : null,
        isLive: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, carrier });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
