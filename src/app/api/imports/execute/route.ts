import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { executeCsvImport } from '@/lib/csv-importer';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const {
      fileName = 'parcel_import.csv',
      csvText,
      mapping,
      mappingTemplateName,
      defaultCarrierCode,
      warehouseId,
    } = body;

    if (!csvText || !mapping) {
      return NextResponse.json(
        { error: 'csvText and column mapping definition are required' },
        { status: 400 }
      );
    }

    const result = await executeCsvImport({
      organizationId: session.organizationId,
      fileName,
      csvText,
      mapping,
      mappingTemplateName,
      defaultCarrierCode,
      warehouseId,
      userId: session.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
