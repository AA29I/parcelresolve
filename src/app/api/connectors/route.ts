import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireDeveloperOrAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireDeveloperOrAdmin();
    const connectors = await db.carrierConnector.findMany({
      where: { organizationId: session.organizationId },
      include: { carrier: true },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ connectors });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireDeveloperOrAdmin();
    const body = await req.json();

    const {
      carrierId,
      name,
      authType = 'API_KEY',
      baseUrl,
      trackingEndpoint,
      headersTemplate = '{}',
      queryParamsTemplate = '{}',
      trackingNumberParam = 'trackingNumber',
      responseStatusPath = 'status',
      responseTimestampPath = 'timestamp',
      responseLocationPath = 'location',
      responseMessagePath = 'message',
      responseEventsArrayPath = 'events',
      statusCodeMap = { IT: 'IN_TRANSIT', DL: 'DELIVERED', EX: 'EXCEPTION' },
      minPollIntervalMinutes = 60,
      maxCallsPerMinute = 120,
      sampleTrackingNumber,
    } = body;

    if (!carrierId || !baseUrl || !trackingEndpoint) {
      return NextResponse.json(
        { error: 'carrierId, baseUrl, and trackingEndpoint are required' },
        { status: 400 }
      );
    }

    const connector = await db.carrierConnector.create({
      data: {
        organizationId: session.organizationId,
        carrierId,
        name: name || 'Custom Carrier REST Connector',
        version: 1,
        status: 'DRAFT',
        authType,
        baseUrl,
        trackingEndpoint,
        headersTemplate: typeof headersTemplate === 'string' ? headersTemplate : JSON.stringify(headersTemplate),
        queryParamsTemplate: typeof queryParamsTemplate === 'string' ? queryParamsTemplate : JSON.stringify(queryParamsTemplate),
        trackingNumberParam,
        responseStatusPath,
        responseTimestampPath,
        responseLocationPath,
        responseMessagePath,
        responseEventsArrayPath,
        statusCodeMap: typeof statusCodeMap === 'string' ? statusCodeMap : JSON.stringify(statusCodeMap),
        minPollIntervalMinutes: Number(minPollIntervalMinutes),
        maxCallsPerMinute: Number(maxCallsPerMinute),
        sampleTrackingNumber: sampleTrackingNumber || 'TEST123456789',
      },
    });

    return NextResponse.json({ success: true, connector });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
