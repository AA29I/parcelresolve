import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const ONBOARDING_STEPS = [
  { id: 1, title: 'Workspace, Warehouses & Users', description: 'Configure physical hubs, cutoff times, and invite operations staff.' },
  { id: 2, title: 'Operating Countries & Currencies', description: 'Select base currencies and regional transit jurisdictions.' },
  { id: 3, title: 'Connect Direct Couriers & Aggregators', description: 'Add your own contracted carrier accounts or 3PL aggregators.' },
  { id: 4, title: 'Courier & Service Code Mapping', description: 'Map your internal courier names to platform carrier codes.' },
  { id: 5, title: 'SLA Policies & Claim Rules', description: 'Define transit hours, cutoff thresholds, and claim filing deadlines.' },
  { id: 6, title: 'Sample CSV/XLSX Import & Preview', description: 'Map file columns, preview sample records, and test duplicate detection.' },
  { id: 7, title: 'Connect Linnworks (Optional)', description: 'Authorize via official Application flow for automated order & package sync.' },
  { id: 8, title: 'Carrier API Credentials & Connectors', description: 'Add API credentials and configure endpoint response mapping.' },
  { id: 9, title: 'Test Tracking & Scan Chronology', description: 'Run a sample tracking query and verify normalized event ordering.' },
  { id: 10, title: 'Enquiry, Claim & Notification Preferences', description: 'Set enquiry drafting thresholds, claim declaration templates, and webhooks.' },
];

export async function GET() {
  try {
    const session = await requireAuth();
    const org = await db.organization.findUnique({
      where: { id: session.organizationId },
      include: {
        warehouses: true,
        carriers: true,
        carrierMappings: true,
        slaPolicies: true,
        linnworksConnection: true,
        parcels: { take: 5 },
      },
    });

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    // Derive automated checklist status
    const checklist = {
      step1: org.warehouses.length > 0,
      step2: JSON.parse(org.operatingCountries || '[]').length > 0,
      step3: org.carriers.length > 0,
      step4: org.carrierMappings.length > 0,
      step5: org.slaPolicies.length > 0,
      step6: org.parcels.length > 0,
      step7: org.linnworksConnection ? org.linnworksConnection.isConnected : false,
      step8: org.carriers.some((c) => c.connectionType === 'LIVE_API' || c.connectionType === 'CONFIGURABLE_API'),
      step9: org.parcels.some((p) => p.trackingStatus !== 'MANIFEST_CREATED'),
      step10: org.onboardingCompleted,
    };

    return NextResponse.json({
      currentStep: org.onboardingStep,
      completed: org.onboardingCompleted,
      steps: ONBOARDING_STEPS,
      checklist,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { stepNumber, markCompleted } = body;

    const updated = await db.organization.update({
      where: { id: session.organizationId },
      data: {
        onboardingStep: stepNumber ? Number(stepNumber) : undefined,
        onboardingCompleted: markCompleted !== undefined ? Boolean(markCompleted) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      currentStep: updated.onboardingStep,
      completed: updated.onboardingCompleted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
