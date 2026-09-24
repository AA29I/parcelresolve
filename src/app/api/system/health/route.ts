import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const start = Date.now();
  try {
    const [orgCount, parcelCount, pendingJobs] = await Promise.all([
      db.organization.count(),
      db.parcel.count(),
      db.jobQueue.count({ where: { status: 'PENDING' } }),
    ]);

    const dbLatencyMs = Date.now() - start;

    return NextResponse.json({
      status: 'HEALTHY',
      service: 'ParcelResolve Production Core',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs: dbLatencyMs,
      },
      metrics: {
        activeOrganizations: orgCount,
        indexedParcels: parcelCount,
        pendingQueueJobs: pendingJobs,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        status: 'DEGRADED',
        error: msg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
