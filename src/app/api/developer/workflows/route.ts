import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireDeveloperOrAdmin } from '@/lib/auth';
import { saveWorkflowRuleWithVersion } from '@/lib/workflow-engine';

export async function GET() {
  try {
    const session = await requireDeveloperOrAdmin();
    const rules = await db.workflowRule.findMany({
      where: { organizationId: session.organizationId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rules });
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
      ruleId,
      name,
      description,
      triggerEvent = 'SLA_BREACHED',
      conditions = [],
      actions = [],
      requiresApproval = false,
      changeNotes,
    } = body;

    if (!name || actions.length === 0) {
      return NextResponse.json(
        { error: 'Workflow name and at least one safe action are required' },
        { status: 400 }
      );
    }

    const rule = await saveWorkflowRuleWithVersion({
      organizationId: session.organizationId,
      ruleId,
      name,
      description,
      triggerEvent,
      conditions,
      actions,
      requiresApproval,
      userId: session.userId,
      changeNotes,
    });

    return NextResponse.json({ success: true, rule });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
