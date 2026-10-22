import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { calculateSla } from '@/lib/sla-calculator';
import { ingestTrackingEvents } from '@/lib/tracking-engine';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const carrierId = searchParams.get('carrierId');
    const isBreached = searchParams.get('isBreached');
    const investigationStatus = searchParams.get('investigationStatus');
    const claimStatus = searchParams.get('claimStatus');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      organizationId: session.organizationId,
    };

    if (status && status !== 'ALL') {
      where.trackingStatus = status;
    }
    if (carrierId && carrierId !== 'ALL') {
      where.carrierId = carrierId;
    }
    if (isBreached === 'true') {
      where.isBreached = true;
    } else if (isBreached === 'false') {
      where.isBreached = false;
    }
    if (investigationStatus && investigationStatus !== 'ALL') {
      where.investigationStatus = investigationStatus;
    }
    if (claimStatus && claimStatus !== 'ALL') {
      where.claimStatus = claimStatus;
    }
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search } },
        { orderNumber: { contains: search } },
        { recipientName: { contains: search } },
        { recipientPostalCode: { contains: search } },
      ];
    }

    const [total, parcels] = await Promise.all([
      db.parcel.count({ where }),
      db.parcel.findMany({
        where,
        include: {
          carrier: true,
          warehouse: true,
          enquiries: { select: { id: true, status: true, referenceNumber: true } },
          claims: { select: { id: true, status: true, claimNumber: true, approvedAmount: true, recoveredAmount: true } },
        },
        orderBy: { dispatchDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Aggregate KPI summary for the workspace
    const [
      deliveredCount,
      inTransitCount,
      lateCount,
      exceptionCount,
      activeEnquiriesCount,
      pendingClaimsCount,
      claimSheetCount,
      allParcelsList
    ] = await Promise.all([
      db.parcel.count({ where: { organizationId: session.organizationId, trackingStatus: 'DELIVERED' } }),
      db.parcel.count({ where: { organizationId: session.organizationId, trackingStatus: 'IN_TRANSIT' } }),
      db.parcel.count({ where: { organizationId: session.organizationId, isBreached: true, trackingStatus: { not: 'DELIVERED' } } }),
      db.parcel.count({ where: { organizationId: session.organizationId, trackingStatus: 'EXCEPTION' } }),
      db.carrierEnquiry.count({ where: { organizationId: session.organizationId, status: { in: ['DRAFT', 'PENDING_APPROVAL', 'SENT'] } } }),
      db.claim.count({ where: { organizationId: session.organizationId, status: { in: ['READY_TO_SUBMIT', 'SUBMITTED', 'UNDER_REVIEW'] } } }),
      db.parcel.count({ where: { organizationId: session.organizationId, OR: [{ trackingStatus: 'LOST' }, { claimStatus: { in: ['READY_TO_SUBMIT', 'ELIGIBLE', 'DRAFT_PENDING_EVIDENCE'] } }] } }),
      db.parcel.findMany({
        where: { organizationId: session.organizationId },
        select: {
          carrier: { select: { code: true, name: true } },
          trackingStatus: true,
          isBreached: true,
          recipientCountry: true,
          declaredValue: true,
        },
      }),
    ]);

    // Carrier performance aggregation
    const carrierMap: Record<string, { code: string; name: string; total: number; delivered: number; inTransit: number; exception: number; late: number }> = {};
    const countryMap: Record<string, { country: string; total: number; delivered: number; exception: number }> = {};

    allParcelsList.forEach((p) => {
      const cCode = p.carrier.code;
      if (!carrierMap[cCode]) {
        carrierMap[cCode] = { code: cCode, name: p.carrier.name, total: 0, delivered: 0, inTransit: 0, exception: 0, late: 0 };
      }
      carrierMap[cCode].total++;
      if (p.trackingStatus === 'DELIVERED') carrierMap[cCode].delivered++;
      if (p.trackingStatus === 'IN_TRANSIT') carrierMap[cCode].inTransit++;
      if (p.trackingStatus === 'EXCEPTION' || p.trackingStatus === 'LOST' || p.trackingStatus === 'DAMAGED') carrierMap[cCode].exception++;
      if (p.isBreached) carrierMap[cCode].late++;

      const ctry = p.recipientCountry || 'GB';
      if (!countryMap[ctry]) {
        countryMap[ctry] = { country: ctry, total: 0, delivered: 0, exception: 0 };
      }
      countryMap[ctry].total++;
      if (p.trackingStatus === 'DELIVERED') countryMap[ctry].delivered++;
      if (p.trackingStatus === 'EXCEPTION' || p.trackingStatus === 'LOST') countryMap[ctry].exception++;
    });

    const carrierBreakdown = Object.values(carrierMap).map((c) => ({
      ...c,
      onTimeRate: c.delivered > 0 ? Math.round(((c.delivered - c.late) / c.delivered) * 100) : (c.total > 0 && c.late === 0 ? 100 : 0),
    }));

    const countryBreakdown = Object.values(countryMap).map((ct) => ({
      ...ct,
      deliveryRate: ct.total > 0 ? Math.round((ct.delivered / ct.total) * 100) : 0,
    }));

    return NextResponse.json({
      parcels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      kpiSummary: {
        totalParcels: total,
        delivered: deliveredCount,
        inTransit: inTransitCount,
        late: lateCount,
        exceptions: exceptionCount,
        activeEnquiries: activeEnquiriesCount,
        pendingClaims: pendingClaimsCount,
        claimSheet: claimSheetCount,
      },
      carrierBreakdown,
      countryBreakdown,
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

    const {
      orderNumber,
      trackingNumber,
      carrierId,
      warehouseId,
      recipientName,
      recipientAddress,
      recipientCity,
      recipientState,
      recipientPostalCode,
      recipientCountry = 'US',
      declaredValue = 0,
      currency = 'USD',
      shippingCost = 0,
      weightKg = 1.0,
      itemsSummary,
      dispatchDate = new Date().toISOString(),
      customFieldValues = {},
    } = body;

    if (!orderNumber || !trackingNumber || !carrierId) {
      return NextResponse.json(
        { error: 'Order Number, Tracking Number, and Carrier are required.' },
        { status: 400 }
      );
    }

    const carrier = await db.carrier.findFirst({
      where: { id: carrierId, organizationId: session.organizationId },
    });

    if (!carrier) {
      return NextResponse.json({ error: 'Carrier not found in workspace' }, { status: 404 });
    }

    const warehouse = warehouseId
      ? await db.warehouse.findFirst({ where: { id: warehouseId, organizationId: session.organizationId } })
      : await db.warehouse.findFirst({ where: { organizationId: session.organizationId, isDefault: true } });

    const dispatch = new Date(dispatchDate);
    const slaResult = calculateSla({
      dispatchDate: dispatch,
      cutoffTime: warehouse?.cutoffTime || '16:00',
      slaHours: 48,
    });

    const parcel = await db.parcel.create({
      data: {
        organizationId: session.organizationId,
        warehouseId: warehouse?.id || null,
        carrierId,
        orderNumber,
        trackingNumber,
        recipientName: recipientName || 'Customer',
        recipientAddress: recipientAddress || 'Direct Destination',
        recipientCity: recipientCity || 'City',
        recipientState: recipientState || '',
        recipientPostalCode: recipientPostalCode || '00000',
        recipientCountry,
        dispatchDate: dispatch,
        promisedDeliveryDate: slaResult.promisedDeliveryDate,
        calculatedSlaHours: 48,
        slaCutoffUsed: warehouse?.cutoffTime || '16:00',
        slaCalculationDetail: slaResult.calculationDetail,
        isBreached: slaResult.isBreached,
        breachHours: slaResult.breachHours,
        trackingStatus: 'MANIFEST_CREATED',
        declaredValue: Number(declaredValue),
        currency,
        shippingCost: Number(shippingCost),
        weightKg: Number(weightKg),
        itemsSummary,
        source: 'MANUAL',
        customFieldValues: JSON.stringify(customFieldValues),
      },
    });

    // Record initial manifest event
    await ingestTrackingEvents({
      organizationId: session.organizationId,
      parcelId: parcel.id,
      source: 'MANUAL_REFRESH',
      rawPayload: JSON.stringify({ manualCreated: true, createdBy: session.userId }),
      events: [
        {
          eventCode: 'MANIFEST_CREATED',
          rawStatus: 'MANIFEST_CREATED',
          normalizedStatus: 'MANIFEST_CREATED',
          statusDescription: 'Electronic shipping order created in workspace dispatch portal.',
          eventTimestamp: dispatch,
          locationCity: warehouse?.city || 'Dispatch Facility',
        },
      ],
    });

    return NextResponse.json({ success: true, parcel });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
