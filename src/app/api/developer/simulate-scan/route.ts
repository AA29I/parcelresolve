import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { calculateSla } from '@/lib/sla-calculator';
import { createOrGetCarrierEnquiry } from '@/lib/enquiry-manager';
import { triggerWorkflowsForParcel } from '@/lib/workflow-engine';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const {
      trackingNumber,
      normalizedStatus = 'EXCEPTION',
      eventCode = 'DEV_MOCK_SCAN',
      statusDescription = 'Simulated operational event via Dev Mode',
      locationCity = 'Chicago',
      locationState = 'IL',
      locationCountry = 'US',
      eventTimestamp = new Date().toISOString(),
    } = body;

    if (!trackingNumber) {
      return NextResponse.json({ error: 'trackingNumber is required' }, { status: 400 });
    }

    const parcel = await db.parcel.findFirst({
      where: {
        trackingNumber,
        organizationId: session.organizationId,
      },
      include: {
        carrier: true,
        warehouse: true,
      },
    });

    if (!parcel) {
      return NextResponse.json(
        { error: `Parcel with tracking number ${trackingNumber} not found in this organization` },
        { status: 404 }
      );
    }

    const timestamp = new Date(eventTimestamp);

    // 1. Create tracking scan event
    const scanEvent = await db.trackingEvent.create({
      data: {
        organizationId: session.organizationId,
        parcelId: parcel.id,
        eventCode,
        normalizedStatus,
        statusDescription,
        eventTimestamp: timestamp,
        locationCity,
        locationState,
        locationCountry,
        isPhysicalScan: true,
      },
    });

    // 2. Determine updated investigation/claim statuses
    let updatedInvestigationStatus = parcel.investigationStatus;
    let updatedClaimStatus = parcel.claimStatus;
    let updatedRecoveryStatus = parcel.recoveryStatus;

    if (normalizedStatus === 'EXCEPTION' && parcel.investigationStatus === 'NONE') {
      updatedInvestigationStatus = 'OPEN';
    } else if (normalizedStatus === 'LOST') {
      updatedInvestigationStatus = 'RESOLVED_LOST';
      updatedClaimStatus = 'READY_TO_SUBMIT';
    } else if (normalizedStatus === 'DELIVERED') {
      if (parcel.investigationStatus === 'OPEN') {
        updatedInvestigationStatus = 'RESOLVED_LOCATED';
      }
    }

    // 3. Re-calculate SLA breach
    const slaResult = calculateSla({
      dispatchDate: parcel.dispatchDate,
      deliveryDate: normalizedStatus === 'DELIVERED' ? timestamp : null,
      slaHours: parcel.calculatedSlaHours || 48,
      cutoffTime: parcel.warehouse?.cutoffTime || '16:00',
      currentCheckTime: timestamp,
    });

    // 4. Update Parcel Record
    const updatedParcel = await db.parcel.update({
      where: { id: parcel.id },
      data: {
        trackingStatus: normalizedStatus,
        investigationStatus: updatedInvestigationStatus,
        claimStatus: updatedClaimStatus,
        recoveryStatus: updatedRecoveryStatus,
        isBreached: slaResult.isBreached,
        breachHours: slaResult.breachHours,
        slaCalculationDetail: slaResult.calculationDetail,
        lastPhysicalScanAt: timestamp,
      },
      include: { carrier: true },
    });

    // 5. If SLA breached or Exception triggered, auto-draft enquiry if none exists
    let enquiryCreated = false;
    if ((slaResult.isBreached || normalizedStatus === 'EXCEPTION') && parcel.carrier) {
      try {
        const enqResult = await createOrGetCarrierEnquiry({
          organizationId: session.organizationId,
          parcelId: parcel.id,
          enquiryType: slaResult.isBreached ? 'SLA_BREACH' : 'NO_MOVEMENT',
          sendingMode: 'STAFF_APPROVAL',
          userId: session.userId,
        });
        enquiryCreated = !enqResult.deduplicated;
      } catch (e) {
        console.error('Enquiry draft creation notice:', e);
      }
    }

    // 6. Execute Workflows
    const workflowResults = await triggerWorkflowsForParcel('TRACKING_STATUS_CHANGED', {
      organizationId: session.organizationId,
      parcelId: parcel.id,
      trackingNumber: parcel.trackingNumber,
      carrierCode: parcel.carrier?.code || 'GENERIC',
      trackingStatus: normalizedStatus,
      isBreached: slaResult.isBreached,
      breachHours: slaResult.breachHours,
      stalledHours: 26,
      declaredValue: parcel.declaredValue || 0,
      destinationCountry: parcel.recipientCountry || 'US',
    });

    // 7. Audit Log
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'UPDATED',
        entityType: 'PARCEL',
        entityId: parcel.id,
        details: JSON.stringify({
          devModeSimulatedScan: true,
          normalizedStatus,
          isBreached: slaResult.isBreached,
          enquiryCreated,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Simulated scan '${normalizedStatus}' applied successfully to parcel ${trackingNumber}`,
      parcel: updatedParcel,
      event: scanEvent,
      slaResult,
      enquiryCreated,
      workflowActionsTriggered: workflowResults.executedRulesCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
