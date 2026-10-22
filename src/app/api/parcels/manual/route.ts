import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createManualParcelWithCustomFields } from '@/lib/dynamic-parcel-importer';

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const {
      trackingNumber,
      orderNumber,
      carrierId,
      recipientName,
      recipientAddress,
      recipientCity,
      recipientState,
      recipientPostalCode,
      recipientCountry,
      declaredValue,
      currency,
      shippingCost,
      weightKg,
      itemsSummary,
      dispatchDate,
      customFields,
      warehouseId,
    } = body;

    if (!trackingNumber || !carrierId || !recipientName || !recipientAddress) {
      return NextResponse.json(
        { error: 'Tracking number, carrier, recipient name, and address are required.' },
        { status: 400 }
      );
    }

    const parcel = await createManualParcelWithCustomFields({
      organizationId: session.organizationId,
      trackingNumber,
      orderNumber: orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
      carrierId,
      recipientName,
      recipientAddress,
      recipientCity,
      recipientState,
      recipientPostalCode,
      recipientCountry,
      declaredValue,
      currency,
      shippingCost,
      weightKg,
      itemsSummary,
      dispatchDate,
      customFields: customFields || {},
      warehouseId,
      userId: session.userId,
    });

    return NextResponse.json({ success: true, parcel });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
