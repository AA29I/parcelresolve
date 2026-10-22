import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { previewCsvData } from '@/lib/csv-importer';

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { csvText } = body;

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'Valid csvText string is required' }, { status: 400 });
    }

    const preview = previewCsvData(csvText);
    return NextResponse.json({ success: true, ...preview });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
