import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireDeveloperOrAdmin } from '@/lib/auth';
import { testCarrierConnector } from '@/lib/carrier-connectors';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireDeveloperOrAdmin();
    const body = await req.json().catch(() => ({}));
    const connector = await db.carrierConnector.findFirst({
      where: { id: params.id, organizationId: session.organizationId },
    });

    if (!connector) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const sampleTrackingNumber = body.sampleTrackingNumber || connector.sampleTrackingNumber || '1Z999TEST001';
    const statusCodeMap = JSON.parse(connector.statusCodeMap || '{}');

    const testResult = await testCarrierConnector({
      baseUrl: connector.baseUrl,
      trackingEndpoint: connector.trackingEndpoint,
      authType: connector.authType,
      authSecret: body.authSecret,
      headersTemplate: connector.headersTemplate,
      trackingNumberParam: connector.trackingNumberParam,
      sampleTrackingNumber,
      responseStatusPath: connector.responseStatusPath,
      responseTimestampPath: connector.responseTimestampPath,
      responseLocationPath: connector.responseLocationPath,
      responseMessagePath: connector.responseMessagePath,
      responseEventsArrayPath: connector.responseEventsArrayPath,
      statusCodeMap,
    });

    await db.carrierConnector.update({
      where: { id: connector.id },
      data: {
        testSuccess: testResult.success,
        lastTestedAt: new Date(),
        testResultPayload: JSON.stringify(testResult),
        sampleTrackingNumber,
      },
    });

    return NextResponse.json({ success: true, testResult });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
