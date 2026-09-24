import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireDeveloperOrAdmin } from '@/lib/auth';
import { createTenantApiKey } from '@/lib/api-key-manager';

export async function GET() {
  try {
    const session = await requireDeveloperOrAdmin();
    const keys = await db.apiKey.findMany({
      where: { organizationId: session.organizationId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ keys });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireDeveloperOrAdmin();
    const body = await req.json();
    const { name, scopes = ['parcels:read', 'tracking:read'], expiresInDays = 365 } = body;

    if (!name) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }

    const { apiKey, secretKey } = await createTenantApiKey({
      organizationId: session.organizationId,
      name,
      scopes,
      expiresInDays: Number(expiresInDays),
      userId: session.userId,
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: JSON.parse(apiKey.scopes),
        expiresAt: apiKey.expiresAt,
      },
      secretKey, // Generated only once for user copying!
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
