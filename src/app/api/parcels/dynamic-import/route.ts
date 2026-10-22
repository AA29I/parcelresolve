import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { executeDynamicParcelImport } from '@/lib/dynamic-parcel-importer';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const { rawText, rows, defaultCarrierCode, warehouseId } = body;

    if (!rawText && (!rows || !rows.length)) {
      return NextResponse.json(
        { error: 'Please provide either rawText (CSV/TSV spreadsheet data) or rows array.' },
        { status: 400 }
      );
    }

    const result = await executeDynamicParcelImport({
      organizationId: session.organizationId,
      rawText,
      rows,
      defaultCarrierCode,
      warehouseId,
      userId: session.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
