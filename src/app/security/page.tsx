import React from 'react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { ShieldCheck, Lock, Database, FileText, CheckCircle2 } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-paper">
      <PublicHeader />

      <div className="py-16 border-b border-brand-border/60 bg-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-2">
            Data Architecture & Governance
          </div>
          <h1 className="text-4xl font-serif font-bold text-brand-dark mb-4">
            Enterprise Security & Tenant Isolation
          </h1>
          <p className="text-brand-muted text-base leading-relaxed">
            Unrelated companies operate in strictly separated cryptographic and relational boundaries. No company ever accesses another tenant&apos;s parcels, carrier accounts, or claims.
          </p>
        </div>
      </div>

      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs">
            <div className="w-10 h-10 rounded bg-brand-cream flex items-center justify-center text-brand-gold mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-2">PostgreSQL Row-Level Security (RLS)</h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Every database entity is permanently tagged with an <code>organizationId</code>. PostgreSQL Row-Level Security policies enforce tenant boundaries directly at the database engine layer, preventing cross-tenant leakage even if an application query lacks an explicit filter.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs">
            <div className="w-10 h-10 rounded bg-brand-cream flex items-center justify-center text-brand-gold mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-2">Encryption at Rest & In Transit</h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              All communications utilize TLS 1.3 encryption. Carrier credentials and API secrets are encrypted using AES-256 before storage in PostgreSQL. Passwords use salted bcrypt hashing.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs">
            <div className="w-10 h-10 rounded bg-brand-cream flex items-center justify-center text-brand-gold mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-2">Developer Mode Guardrails</h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              The Tenant Developer Portal prohibits arbitrary SQL execution, unrestricted JavaScript eval(), server environment variable inspection, or modification of shared platform code. All custom workflows execute through declarative, verified safe actions.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs">
            <div className="w-10 h-10 rounded bg-brand-cream flex items-center justify-center text-brand-gold mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-2">Audit Logging & Provenance</h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Every creation, status modification, manual tracking refresh, claim approval, and workflow rollback is recorded in an immutable <code>AuditLog</code> table with actor ID, IP address, and payload diff.
            </p>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
