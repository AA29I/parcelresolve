import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { testLinnworksConnection, syncLinnworksOrders } from '@/lib/linnworks';

export async function GET() {
  try {
    const session = await requireAuth();
    const connection = await db.linnworksConnection.findUnique({
      where: { organizationId: session.organizationId },
    });

    const linnworksParcelsCount = await db.parcel.count({
      where: { organizationId: session.organizationId, source: 'LINNWORKS' },
    });

    return NextResponse.json({
      connection: connection || {
        isConnected: false,
        syncStatus: 'IDLE',
        serverUrl: 'https://api.linnworks.net',
        ordersSyncedCount: 0,
        syncProvenance: 'LINNWORKS',
      },
      provenanceStats: {
        totalParcelsFromLinnworks: linnworksParcelsCount,
      },
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
    const { action, applicationId, applicationSecret, authorizationToken, isBackfill } = body;

    if (action === 'CONNECT') {
      if (!applicationId || !authorizationToken) {
        return NextResponse.json(
          { error: 'ApplicationId and AuthorizationToken are required.' },
          { status: 400 }
        );
      }

      const res = await testLinnworksConnection(session.organizationId, {
        applicationId,
        applicationSecret: applicationSecret || 'lw-secret-client',
        authorizationToken,
      });

      return NextResponse.json(res);
    }

    if (action === 'SYNC') {
      const syncResult = await syncLinnworksOrders(session.organizationId, { isBackfill });
      return NextResponse.json(syncResult);
    }

    return NextResponse.json({ error: 'Invalid action. Must be CONNECT or SYNC' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
