import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { messageBody, senderType = 'CARRIER', senderName, senderEmail } = body;

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    const enquiry = await db.carrierEnquiry.findFirst({
      where: { id: params.id, organizationId: session.organizationId },
      include: { parcel: true },
    });

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    const message = await db.enquiryMessage.create({
      data: {
        organizationId: session.organizationId,
        enquiryId: enquiry.id,
        senderType,
        senderName: senderName || (senderType === 'CARRIER' ? 'Carrier Representative' : session.name),
        senderEmail: senderEmail || (senderType === 'CARRIER' ? enquiry.recipientEmail : session.email),
        messageBody,
      },
    });

    // Update enquiry status
    const newStatus = senderType === 'CARRIER' ? 'CARRIER_REPLIED' : enquiry.status;
    await db.carrierEnquiry.update({
      where: { id: enquiry.id },
      data: {
        status: newStatus,
        lastReplyAt: new Date(),
        replyCount: enquiry.replyCount + 1,
      },
    });

    if (senderType === 'CARRIER') {
      await db.parcel.update({
        where: { id: enquiry.parcelId },
        data: { investigationStatus: 'AWAITING_CARRIER_REPLY' },
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
