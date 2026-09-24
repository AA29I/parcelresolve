import React from 'react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { Code2, Key, Send, Terminal, Check } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-paper">
      <PublicHeader />

      <div className="py-16 border-b border-brand-border/60 bg-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-2">
            Developer Documentation
          </div>
          <h1 className="text-4xl font-serif font-bold text-brand-dark mb-4">
            API Reference, Webhooks & Extension SDK
          </h1>
          <p className="text-brand-muted text-base leading-relaxed">
            Build custom integrations into your WMS, ERP, or store backends. Restrict access using tenant-scoped API keys and verify outbound event signatures.
          </p>
        </div>
      </div>

      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section 1: Authentication */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-brand-gold" />
            <h2 className="text-2xl font-serif font-bold text-brand-dark">Tenant Scoped API Authentication</h2>
          </div>
          <p className="text-sm text-brand-muted leading-relaxed mb-4">
            Include your tenant API key in the <code>x-api-key</code> or <code>Authorization: Bearer &lt;key&gt;</code> header on all requests. Keys are scoped to specific permissions (e.g. <code>parcels:read</code>, <code>parcels:write</code>, <code>claims:read</code>).
          </p>
          <div className="p-4 rounded-lg bg-brand-ink text-brand-paper font-mono text-xs overflow-x-auto">
            <pre>
{`curl -X GET "https://app.parcelresolve.com/api/parcels?status=IN_TRANSIT" \\
  -H "x-api-key: pr_live_apex_9a8b7c6d5e4f3a2b1c0d9e8f" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>
        </div>

        {/* Section 2: Outbound Webhooks & HMAC Signature */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-5 h-5 text-brand-gold" />
            <h2 className="text-2xl font-serif font-bold text-brand-dark">Outbound Signed Webhooks</h2>
          </div>
          <p className="text-sm text-brand-muted leading-relaxed mb-4">
            Every outbound event sent to your webhook endpoint includes an HMAC-SHA256 signature in the <code>X-ParcelResolve-Signature</code> header computed over the raw JSON payload with your shared secret key.
          </p>

          <div className="p-4 rounded-lg bg-brand-ink text-brand-paper font-mono text-xs overflow-x-auto space-y-2">
            <div className="text-brand-muted">// Node.js Verification Example</div>
            <pre>
{`const crypto = require('crypto');

function verifyWebhook(rawPayload, signatureHeader, secretKey) {
  const expected = crypto.createHmac('sha256', secretKey).update(rawPayload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}`}
            </pre>
          </div>
        </div>

        {/* Section 3: Extension SDK */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-5 h-5 text-brand-gold" />
            <h2 className="text-2xl font-serif font-bold text-brand-dark">Carrier Extension SDK Interface</h2>
          </div>
          <p className="text-sm text-brand-muted leading-relaxed mb-4">
            For carriers requiring SOAP/XML, custom binary signatures, or non-standard authentication, use the Extension SDK interface. Run and verify adapters through the Developer Portal test harness.
          </p>

          <div className="p-4 rounded-lg bg-brand-ink text-brand-paper font-mono text-xs overflow-x-auto">
            <pre>
{`export interface CarrierAdapterDefinition {
  id: string;
  name: string;
  carrierCode: string;
  version: string;
  track(trackingNumber: string, credentials: Record<string, string>): Promise<AdapterTrackingResult>;
  submitClaim?(params: AdapterClaimParams, credentials: Record<string, string>): Promise<AdapterClaimResult>;
}`}
            </pre>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
