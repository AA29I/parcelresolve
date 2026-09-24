import db from './db';
import { refreshParcelTracking } from './tracking-engine';
import { calculateSla } from './sla-calculator';
import { triggerWorkflowsForParcel } from './workflow-engine';
import { syncLinnworksOrders } from './linnworks';
import { dispatchOutboundWebhooks } from './webhook-dispatcher';

export interface EnqueueTaskParams {
  organizationId: string;
  taskType:
    | 'POLL_CARRIER'
    | 'EVALUATE_SLA'
    | 'GENERATE_ENQUIRY'
    | 'SEND_WEBHOOK'
    | 'LINNWORKS_SYNC'
    | 'PROCESS_IMPORT';
  payload: Record<string, unknown>;
  runAfter?: Date;
}

/**
 * Enqueues a persistent job into the database-backed task queue
 */
export async function enqueueJob(params: EnqueueTaskParams) {
  return db.jobQueue.create({
    data: {
      organizationId: params.organizationId,
      taskType: params.taskType,
      payload: JSON.stringify(params.payload),
      status: 'PENDING',
      runAfter: params.runAfter || new Date(),
    },
  });
}

/**
 * Executes a single job item safely
 */
export async function processJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  const job = await db.jobQueue.findUnique({ where: { id: jobId } });
  if (!job || job.status !== 'PENDING') return { success: false, error: 'Job not pending' };

  // Lock job
  await db.jobQueue.update({
    where: { id: jobId },
    data: { status: 'PROCESSING', lockedAt: new Date(), attempts: job.attempts + 1 },
  });

  const payload = JSON.parse(job.payload || '{}');

  try {
    switch (job.taskType) {
      case 'POLL_CARRIER': {
        const parcelId = String(payload.parcelId);
        await refreshParcelTracking(job.organizationId, parcelId);
        break;
      }

      case 'EVALUATE_SLA': {
        // Evaluate active parcels in workspace
        const activeParcels = await db.parcel.findMany({
          where: {
            organizationId: job.organizationId,
            trackingStatus: { in: ['MANIFEST_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'EXCEPTION'] },
          },
          include: { carrier: true, warehouse: true },
        });

        for (const parcel of activeParcels) {
          const slaRes = calculateSla({
            dispatchDate: parcel.dispatchDate,
            cutoffTime: parcel.slaCutoffUsed || '16:00',
            slaHours: parcel.calculatedSlaHours || 48,
          });

          if (slaRes.isBreached !== parcel.isBreached || Math.abs(slaRes.breachHours - parcel.breachHours) > 0.5) {
            await db.parcel.update({
              where: { id: parcel.id },
              data: {
                isBreached: slaRes.isBreached,
                breachHours: slaRes.breachHours,
                slaCalculationDetail: slaRes.calculationDetail,
              },
            });

            if (slaRes.isBreached) {
              await triggerWorkflowsForParcel('SLA_BREACHED', {
                organizationId: parcel.organizationId,
                parcelId: parcel.id,
                trackingNumber: parcel.trackingNumber,
                carrierCode: parcel.carrier.code,
                trackingStatus: parcel.trackingStatus,
                isBreached: true,
                breachHours: slaRes.breachHours,
                stalledHours: parcel.stalledHours,
                declaredValue: parcel.declaredValue,
                destinationCountry: parcel.recipientCountry,
              });
            }
          }
        }
        break;
      }

      case 'LINNWORKS_SYNC': {
        await syncLinnworksOrders(job.organizationId);
        break;
      }

      case 'SEND_WEBHOOK': {
        await dispatchOutboundWebhooks({
          organizationId: job.organizationId,
          eventType: String(payload.eventType || 'parcel.status_changed'),
          payload: payload.data as Record<string, unknown>,
        });
        break;
      }

      default:
        break;
    }

    await db.jobQueue.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const hasMoreAttempts = job.attempts + 1 < job.maxAttempts;

    await db.jobQueue.update({
      where: { id: jobId },
      data: {
        status: hasMoreAttempts ? 'PENDING' : 'FAILED',
        lastError: errorMsg,
        runAfter: new Date(Date.now() + 60 * 1000 * Math.pow(2, job.attempts)), // exponential backoff
      },
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Runs a cycle of the background worker pulling pending jobs
 */
export async function runQueueWorkerCycle(limit: number = 10): Promise<{ processed: number; errors: number }> {
  const pendingJobs = await db.jobQueue.findMany({
    where: {
      status: 'PENDING',
      runAfter: { lte: new Date() },
    },
    take: limit,
    orderBy: { runAfter: 'asc' },
  });

  let processed = 0;
  let errors = 0;

  for (const job of pendingJobs) {
    const res = await processJob(job.id);
    if (res.success) processed++;
    else errors++;
  }

  return { processed, errors };
}
