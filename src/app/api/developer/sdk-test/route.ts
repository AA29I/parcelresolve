import { NextResponse } from 'next/server';
import { requireDeveloperOrAdmin } from '@/lib/auth';
import { DpdAdapterSample, runAdapterTestHarness } from '@/lib/extension-sdk';

export async function POST(req: Request) {
  try {
    await requireDeveloperOrAdmin();
    const body = await req.json().catch(() => ({}));
    const sampleTrackingNumber = body.sampleTrackingNumber || '01509918204921';
    const testCredentials = body.credentials || { geoToken: 'sandbox_dpd_auth_token_99' };

    // Run safe test harness
    const harnessResult = await runAdapterTestHarness(
      DpdAdapterSample,
      sampleTrackingNumber,
      testCredentials
    );

    return NextResponse.json({
      success: true,
      adapter: {
        id: DpdAdapterSample.id,
        name: DpdAdapterSample.name,
        carrierCode: DpdAdapterSample.carrierCode,
        version: DpdAdapterSample.version,
      },
      harnessResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
