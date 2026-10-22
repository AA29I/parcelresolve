import React from 'react';
import Link from 'next/link';
import { Package, ShieldCheck } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-brand-cream border-t border-brand-border/80 text-brand-muted text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-brand-dark flex items-center justify-center text-brand-gold">
                <Package className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-base text-brand-dark font-sans">
                Parcel<span className="text-brand-gold">Resolve</span>
              </span>
            </div>
            <p className="text-xs text-brand-muted leading-relaxed max-w-sm mb-4">
              Enterprise multi-carrier tracking, SLA exception calculation, automated carrier enquiries, and claims recovery engine. Purpose-built for high-volume merchants and logistics operations.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>SOC2 Type II Ready • Strict Multi-Tenant Isolation</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-brand-dark mb-3 text-xs tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/features" className="hover:text-brand-dark">Tracking Engine</Link></li>
              <li><Link href="/features" className="hover:text-brand-dark">SLA Exception Matrix</Link></li>
              <li><Link href="/features" className="hover:text-brand-dark">Carrier Enquiries Desk</Link></li>
              <li><Link href="/features" className="hover:text-brand-dark">Claims Recovery Portal</Link></li>
              <li><Link href="/features" className="hover:text-brand-dark">Developer Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-brand-dark mb-3 text-xs tracking-wider uppercase">Integrations</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/integrations" className="hover:text-brand-dark">UPS & USPS Direct</Link></li>
              <li><Link href="/integrations" className="hover:text-brand-dark">eShipper & Aggregators</Link></li>
              <li><Link href="/integrations" className="hover:text-brand-dark">GLS & European Networks</Link></li>
              <li><Link href="/integrations" className="hover:text-brand-dark">Linnworks Official Flow</Link></li>
              <li><Link href="/integrations" className="hover:text-brand-dark">CSV/XLSX Bulk Ingest</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-brand-dark mb-3 text-xs tracking-wider uppercase">Trust & Docs</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/security" className="hover:text-brand-dark">Data Security & RLS</Link></li>
              <li><Link href="/docs" className="hover:text-brand-dark">REST API & Webhooks</Link></li>
              <li><Link href="/docs" className="hover:text-brand-dark">Carrier Adapter SDK</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-dark">Pricing Tiers</Link></li>
              <li><Link href="/contact" className="hover:text-brand-dark">Enterprise Demo</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-muted gap-4">
          <p>© {new Date().getFullYear()} ParcelResolve. Designed with Mett Global enterprise aesthetics.</p>
          <div className="flex items-center gap-6">
            <span>ISO 27001 Aligned</span>
            <span>GDPR Compliant</span>
            <span>Independent Tenant Sandboxes</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
