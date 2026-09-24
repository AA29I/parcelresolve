import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { trackingNumber: string } }
) {
  const { trackingNumber } = params;
  const now = new Date();

  return NextResponse.json({
    shipment: {
      trackingNumber,
      carrier: 'Carrier Mock Network',
      serviceType: 'Priority Freight Express',
      status: {
        code: 'IT',
        label: 'In Transit',
      },
      lastScan: {
        timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
        depot: 'Central Gateway Sorting Hub',
        activity: 'Scanned through high-speed sorting conveyor',
      },
      activities: [
        {
          code: 'PU',
          timestamp: new Date(now.getTime() - 28 * 3600 * 1000).toISOString(),
          location: 'Origin Terminal',
          description: 'Package accepted from shipper dock',
        },
        {
          code: 'IT',
          timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
          location: 'Central Gateway Sorting Hub',
          description: 'Scanned through high-speed sorting conveyor',
        },
      ],
    },
  });
}
