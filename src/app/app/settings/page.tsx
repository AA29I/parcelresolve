'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  MapPin,
  Users,
  Shield,
  CreditCard,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading || !data?.organization) {
    return (
      <div className="py-12 text-center text-xs text-brand-muted font-mono flex items-center justify-center">
        <RefreshCw className="w-4 h-4 animate-spin text-brand-gold mr-2" />
        Loading settings...
      </div>
    );
  }

  const org = data.organization;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
          Workspace Configuration
        </div>
        <h1 className="text-2xl font-serif font-bold text-brand-dark">Workspace Settings</h1>
        <p className="text-xs text-brand-muted mt-0.5">
          Tenant operating details, warehouses, cutoff times, staff roles, and subscription tier.
        </p>
      </div>

      {/* Organization Details Card */}
      <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
          <Building className="w-4 h-4 text-brand-gold" /> Organization Particulars
        </h2>

        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-brand-paper rounded border border-brand-border">
            <span className="text-[10px] text-brand-muted uppercase font-sans block">Workspace Name:</span>
            <span className="font-bold text-brand-dark font-sans">{org.name}</span>
          </div>

          <div className="p-3 bg-brand-paper rounded border border-brand-border">
            <span className="text-[10px] text-brand-muted uppercase font-sans block">Workspace Slug:</span>
            <span className="font-bold text-brand-dark">{org.slug}</span>
          </div>

          <div className="p-3 bg-brand-paper rounded border border-brand-border">
            <span className="text-[10px] text-brand-muted uppercase font-sans block">Default Currency:</span>
            <span className="font-bold text-brand-dark">{org.defaultCurrency}</span>
          </div>

          <div className="p-3 bg-brand-paper rounded border border-brand-border">
            <span className="text-[10px] text-brand-muted uppercase font-sans block">Subscription Tier:</span>
            <span className="font-bold text-emerald-700">{org.subscriptionTier} (Active)</span>
          </div>
        </div>
      </div>

      {/* Warehouses Card */}
      <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-gold" /> Physical Warehouses & Dispatch Cutoffs
        </h2>

        <div className="space-y-3">
          {org.warehouses?.map((wh: any) => (
            <div key={wh.id} className="p-4 rounded-lg bg-brand-paper border border-brand-border flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-brand-dark">{wh.name}</div>
                <div className="text-[11px] text-brand-muted font-mono">Code: {wh.code} • {wh.city}, {wh.country}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-brand-muted uppercase block">Dispatch Cutoff:</span>
                <span className="font-mono font-bold text-brand-dark bg-white px-2 py-0.5 rounded border border-brand-border">
                  {wh.cutoffTime} EST
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff & RBAC Card */}
      <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-gold" /> Active User Session & Role
        </h2>

        <div className="p-4 rounded-lg bg-brand-paper border border-brand-border flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-brand-dark">{data.user.name}</div>
            <div className="text-[11px] text-brand-muted font-mono">{data.user.email}</div>
          </div>
          <div>
            <span className="px-2.5 py-1 rounded bg-brand-dark text-brand-paper text-[10px] font-mono font-bold">
              {data.user.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
