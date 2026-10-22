import { requireAuth } from '@/lib/auth';
import { exportParcelsToCsv } from '@/lib/csv-importer';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const statusFilter = searchParams.get('status') || undefined;
    const carrierId = searchParams.get('carrierId') || undefined;
    const isBreachedParam = searchParams.get('isBreached');
    const isBreached = isBreachedParam === 'true' ? true : isBreachedParam === 'false' ? false : undefined;

    const csvData = await exportParcelsToCsv({
      organizationId: session.organizationId,
      statusFilter,
      carrierId,
      isBreached,
    });

    const filename = `ParcelResolve_Export_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(msg, { status: 500 });
  }
}
