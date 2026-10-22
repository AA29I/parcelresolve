import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'ParcelResolve — Multi-Carrier Parcel Tracking, SLA Exception & Claims Platform',
  description:
    'Enterprise multi-carrier tracking, automated SLA breach detection, carrier investigations, and claims recovery engine. Supporting 300,000–500,000 parcels annually.',
  keywords: [
    'parcel tracking',
    'carrier SLA monitoring',
    'freight claims recovery',
    'carrier enquiries',
    'multi-carrier tracking API',
    'Linnworks shipping connector',
    'parcel logistics',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-paper text-brand-ink antialiased">
        {children}
      </body>
    </html>
  );
}
