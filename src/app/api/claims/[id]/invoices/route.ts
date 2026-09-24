import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import {
  generateAutoClaimInvoice,
  createManualClaimInvoice,
  CarrierInvoiceFormat,
  SupportedInvoiceCurrency,
  ClaimLossReason,
  InvoiceLineItem,
  InvoiceEvidenceImage,
} from '@/lib/invoice-generator';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: claimId } = await params;

    const claim = await db.claim.findFirst({
      where: { id: claimId, organizationId: session.organizationId },
      include: { parcel: true },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const invoices = await db.claimInvoice.findMany({
      where: {
        organizationId: session.organizationId,
        OR: [{ claimId }, { parcelId: claim.parcelId }],
      },
      include: {
        carrier: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invoices });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: claimId } = await params;
    const body = await req.json();

    const claim = await db.claim.findFirst({
      where: { id: claimId, organizationId: session.organizationId },
      include: { parcel: true, carrier: true },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const {
      generationType = 'MANUAL',
      carrierFormat = 'UPS_STANDARD',
      claimantName,
      claimantAddress,
      claimantTaxId,
      claimantContactEmail,
      claimantPhone,
      courierName,
      courierAccountNo,
      courierDeptEmail,
      courierClaimRef,
      currency = 'USD',
      merchandiseValue,
      shippingCost,
      taxAmount,
      adminFeeAmount,
      totalClaimedAmount,
      lineItems = [],
      customFields = {},
      evidenceImages = [],
      lossReason = 'LOST_IN_TRANSIT',
      notes,
      authorizedSignatory,
    } = body;

    let invoice;

    if (generationType === 'AUTO') {
      invoice = await generateAutoClaimInvoice({
        organizationId: session.organizationId,
        parcelId: claim.parcelId,
        claimId: claim.id,
        userId: session.userId,
        customCarrierFormat: carrierFormat as CarrierInvoiceFormat,
        lossReason: lossReason as ClaimLossReason,
        notes,
      });
    } else {
      invoice = await createManualClaimInvoice({
        organizationId: session.organizationId,
        parcelId: claim.parcelId,
        claimId: claim.id,
        carrierId: claim.carrierId,
        generationType: 'MANUAL',
        carrierFormat: carrierFormat as CarrierInvoiceFormat,
        claimantName,
        claimantAddress,
        claimantTaxId,
        claimantContactEmail,
        claimantPhone,
        courierName: courierName || claim.carrier.name,
        courierAccountNo,
        courierDeptEmail,
        courierClaimRef: courierClaimRef || claim.carrierClaimReference,
        trackingNumber: claim.parcel.trackingNumber,
        orderNumber: claim.parcel.orderNumber,
        dispatchDate: claim.parcel.dispatchDate,
        lossReason: lossReason as ClaimLossReason,
        currency: currency as SupportedInvoiceCurrency,
        merchandiseValue: Number(merchandiseValue || 0),
        shippingCost: Number(shippingCost || 0),
        taxAmount: Number(taxAmount || 0),
        adminFeeAmount: Number(adminFeeAmount || 0),
        totalClaimedAmount: totalClaimedAmount ? Number(totalClaimedAmount) : undefined,
        lineItems: lineItems as InvoiceLineItem[],
        customFields: customFields as Record<string, string | number>,
        evidenceImages: evidenceImages as InvoiceEvidenceImage[],
        notes,
        authorizedSignatory,
        userId: session.userId,
      });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
