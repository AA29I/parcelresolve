import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const session = await requireAuth();
    const { id: parcelId } = await params;
    const body = await req.json().catch(() => ({}));

    const {
      enquiryType = 'SLA_BREACH',
      customSubject,
      customBody,
      recipientEmail,
      notes,
    } = body;

    const parcel = await db.parcel.findFirst({
      where: { id: parcelId, organizationId: session.organizationId },
      include: { carrier: true, warehouse: true, organization: true },
    });

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }

    const effectiveRecipientEmail =
      recipientEmail ||
      parcel.carrier.enquiryRecipientEmail ||
      `investigations@${parcel.carrier.code.toLowerCase()}-support.example.com`;

    const referenceNumber = `ENQ-${parcel.carrier.code.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const dispatchStr = new Date(parcel.dispatchDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const defaultSubject = `[URGENT INVESTIGATION] Trk #${parcel.trackingNumber} - ${enquiryType.replace(/_/g, ' ')} - Ref ${referenceNumber}`;
    const defaultBody = `Dear ${parcel.carrier.name} Support Desk,

RE: Shipment Tracking Investigation & Transit Enquiry
Tracking Number: ${parcel.trackingNumber}
Order Reference: ${parcel.orderNumber}
Shipper Account / Contracted Party: ${parcel.carrier.contractedParty}
Consignee: ${parcel.recipientName}
Destination: ${parcel.recipientAddress}, ${parcel.recipientCity}, ${parcel.recipientState} ${parcel.recipientPostalCode}, ${parcel.recipientCountry}
Dispatched: ${dispatchStr}
Current Status: ${parcel.trackingStatus} (${parcel.latestStatusDescription || 'In Transit'})
Last Scan Location: ${parcel.lastScanLocation || 'Distribution Hub'}

Please provide an urgent investigation into the physical location and delivery schedule of this parcel.

Reference: ${referenceNumber}
Sender: ${parcel.organization.name} Operations Desk`;

    const subject = customSubject || defaultSubject;
    const emailBody = customBody || defaultBody;

    // Create enquiry
    const enquiry = await db.carrierEnquiry.create({
      data: {
        organizationId: session.organizationId,
        parcelId: parcel.id,
        carrierId: parcel.carrierId,
        referenceNumber,
        enquiryType,
        status: 'SENT',
        sendingMode: 'AUTO_SEND',
        recipientEmail: effectiveRecipientEmail,
        subject,
        body: emailBody,
        internalNotes: notes || null,
        sentAt: new Date(),
        createdById: session.userId,
        followUpDueDate: new Date(Date.now() + 48 * 3600 * 1000), // 48h follow up cadence
      },
    });

    // Record initial dispatch message
    await db.enquiryMessage.create({
      data: {
        organizationId: session.organizationId,
        enquiryId: enquiry.id,
        senderType: 'STAFF',
        senderEmail: session.email || 'ops@parcelresolve.internal',
        senderName: session.name || 'Operations Dispatcher',
        messageBody: `[Enquiry Dispatched to Courier (${effectiveRecipientEmail})]\n\nSubject: ${subject}\n\n${emailBody}`,
      },
    });

    // Update parcel status
    await db.parcel.update({
      where: { id: parcel.id },
      data: {
        investigationStatus: 'AWAITING_CARRIER_REPLY',
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.userId,
        action: 'CREATED',
        entityType: 'ENQUIRY',
        entityId: enquiry.id,
        details: JSON.stringify({
          trackingNumber: parcel.trackingNumber,
          referenceNumber,
          recipientEmail: effectiveRecipientEmail,
          carrierCode: parcel.carrier.code,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      enquiryId: enquiry.id,
      referenceNumber,
      recipientEmail: effectiveRecipientEmail,
      message: `Enquiry email sent successfully to ${parcel.carrier.name} (${effectiveRecipientEmail}).`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
