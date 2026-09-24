import { NextResponse } from 'next/server';
import { requireDeveloperOrAdmin } from '@/lib/auth';
import { rollbackWorkflowRule } from '@/lib/workflow-engine';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireDeveloperOrAdmin();
    const body = await req.json();
    const { targetVersionNumber } = body;

    if (!targetVersionNumber) {
      return NextResponse.json({ error: 'targetVersionNumber is required' }, { status: 400 });
    }

    const updated = await rollbackWorkflowRule(
      session.organizationId,
      params.id,
      Number(targetVersionNumber),
      session.userId
    );

    return NextResponse.json({ success: true, rule: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
