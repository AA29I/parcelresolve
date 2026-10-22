import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireDeveloperOrAdmin } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireDeveloperOrAdmin();
    const connector = await db.carrierConnector.findFirst({
      where: { id: params.id, organizationId: session.organizationId },
    });

    if (!connector) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    if (!connector.testSuccess) {
      return NextResponse.json(
        { error: 'Connector must pass test harness against a sample tracking number before publishing.' },
        { status: 400 }
      );
    }

    // Save previous snapshot as rollback baseline
    const snapshot = await db.carrierConnector.create({
      data: {
        organizationId: session.organizationId,
        carrierId: connector.carrierId,
        name: `${connector.name} (Snapshot v${connector.version})`,
        version: connector.version,
        status: 'PUBLISHED',
        authType: connector.authType,
        baseUrl: connector.baseUrl,
        trackingEndpoint: connector.trackingEndpoint,
        headersTemplate: connector.headersTemplate,
        queryParamsTemplate: connector.queryParamsTemplate,
        trackingNumberParam: connector.trackingNumberParam,
        responseStatusPath: connector.responseStatusPath,
        responseTimestampPath: connector.responseTimestampPath,
        responseLocationPath: connector.responseLocationPath,
        responseMessagePath: connector.responseMessagePath,
        responseEventsArrayPath: connector.responseEventsArrayPath,
        statusCodeMap: connector.statusCodeMap,
        minPollIntervalMinutes: connector.minPollIntervalMinutes,
        maxCallsPerMinute: connector.maxCallsPerMinute,
        backoffStrategy: connector.backoffStrategy,
        sampleTrackingNumber: connector.sampleTrackingNumber,
        testSuccess: true,
        publishedAt: new Date(),
      },
    });

    // Update connector version
    const updated = await db.carrierConnector.update({
      where: { id: connector.id },
      data: {
        status: 'PUBLISHED',
        version: connector.version + 1,
        publishedAt: new Date(),
        rollbackVersionId: snapshot.id,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'CREATED',
        entityType: 'CONNECTOR',
        entityId: connector.id,
        details: JSON.stringify({ publishedVersion: updated.version, rollbackSnapshotId: snapshot.id }),
      },
    });

    return NextResponse.json({ success: true, connector: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
