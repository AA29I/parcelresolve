'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Package,
  Clock,
  AlertCircle,
  FileCheck2,
  Layers,
  FileSpreadsheet,
  Cpu,
  Code2,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Search,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import DevModeCustomizer from '@/components/DevModeCustomizer';

interface SessionData {
  authenticated: boolean;
  user: { id: string; name: string; email: string; role: string } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    defaultCurrency: string;
    operatingCountries: string[];
    operatingCurrencies: string[];
    subscriptionTier: string;
    onboardingStep: number;
    onboardingCompleted: boolean;
    warehouses: { id: string; name: string; cutoffTime: string }[];
    carriers: { id: string; name: string; code: string }[];
  } | null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const [switching, setSwitching] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.authenticated) {
        router.push('/login');
        return;
      }
      setSession(data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleQuickSwitch = async (targetSlug: string) => {
    setSwitching(true);
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoOrgSlug: targetSlug }),
      });
      await fetchSession();
      router.refresh();
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-paper flex items-center justify-center font-mono text-xs text-brand-muted">
        <RefreshCw className="w-4 h-4 animate-spin text-brand-gold mr-2" />
        Loading secure workspace...
      </div>
    );
  }

  const navItems = [
    { label: 'Onboarding Checklist', href: '/app/onboarding', icon: CheckCircle2, badge: session?.organization?.onboardingCompleted ? null : 'Pending' },
    { label: 'Operations Dashboard', href: '/app/dashboard', icon: Package },
    { label: 'Carrier Enquiries', href: '/app/enquiries', icon: Clock },
    { label: 'Claims Recovery', href: '/app/claims', icon: FileCheck2 },
    { label: 'Carrier Integration Center', href: '/app/carriers', icon: Layers },
    { label: 'CSV / XLSX Ingestion', href: '/app/imports', icon: FileSpreadsheet },
    { label: 'Linnworks Connector', href: '/app/linnworks', icon: Cpu },
    { label: 'Developer Portal', href: '/app/developer', icon: Code2 },
    { label: 'Workspace Settings', href: '/app/settings', icon: Settings },
  ];

  const currentOrgSlug = session?.organization?.slug || '';

  return (
    <div className="min-h-screen flex bg-brand-paper text-brand-ink">
      {/* Sidebar */}
      <aside className="w-64 border-r border-brand-border bg-white flex flex-col shrink-0">
        {/* Workspace Identifier & Quick Switcher */}
        <div className="p-4 border-b border-brand-border">
          <Link href="/app/dashboard" className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded bg-brand-dark flex items-center justify-center text-brand-gold">
              <Package className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base tracking-tight text-brand-dark">
              Parcel<span className="text-brand-gold">Resolve</span>
            </span>
          </Link>

          {/* Tenant Switcher Card */}
          <div className="p-2.5 rounded-lg bg-brand-cream border border-brand-border text-xs">
            <div className="flex items-center justify-between text-[10px] text-brand-muted uppercase tracking-wider font-semibold mb-1">
              <span>Active Tenant</span>
              <span className="text-emerald-700 font-mono">Isolated</span>
            </div>
            <div className="font-bold text-brand-dark truncate">{session?.organization?.name}</div>
            <div className="text-[11px] text-brand-muted font-mono">{session?.organization?.defaultCurrency} • {session?.organization?.subscriptionTier} Tier</div>

            {/* Quick Demo Switcher Dropdown */}
            <div className="mt-2 pt-2 border-t border-brand-border/60 flex items-center justify-between">
              <span className="text-[10px] text-brand-muted">Switch:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={switching || currentOrgSlug === 'apex-global'}
                  onClick={() => handleQuickSwitch('apex-global')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    currentOrgSlug === 'apex-global'
                      ? 'bg-brand-dark text-brand-paper'
                      : 'bg-white hover:bg-brand-paper text-brand-muted border border-brand-border'
                  }`}
                >
                  Apex (A)
                </button>
                <button
                  type="button"
                  disabled={switching || currentOrgSlug === 'nordic-craft'}
                  onClick={() => handleQuickSwitch('nordic-craft')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    currentOrgSlug === 'nordic-craft'
                      ? 'bg-brand-dark text-brand-paper'
                      : 'bg-white hover:bg-brand-paper text-brand-muted border border-brand-border'
                  }`}
                >
                  Nordic (B)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-cream text-brand-dark font-semibold border border-brand-border'
                    : 'text-brand-muted hover:text-brand-dark hover:bg-brand-paper'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-gold' : 'text-brand-muted'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-brand-border bg-brand-cream/40">
          <div className="flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="text-xs font-semibold text-brand-dark truncate">{session?.user?.name}</div>
              <div className="text-[10px] text-brand-muted font-mono truncate">{session?.user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded hover:bg-brand-border/60 text-brand-muted hover:text-brand-dark transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-brand-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-muted">Workspace:</span>
            <span className="text-xs font-bold text-brand-dark">{session?.organization?.name}</span>
            <span className="text-[10px] font-mono bg-brand-cream text-brand-dark px-2 py-0.5 rounded border border-brand-border">
              {session?.organization?.defaultCurrency}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Sandbox Mode Toggle */}
            <div className="flex items-center gap-2 bg-brand-paper border border-brand-border rounded-full px-3 py-1">
              <span className={`w-2 h-2 rounded-full ${isSandbox ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <span className="text-[11px] font-medium text-brand-dark">
                {isSandbox ? 'Sandbox Mode' : 'Live Production'}
              </span>
              <button
                type="button"
                onClick={() => setIsSandbox(!isSandbox)}
                className="text-[10px] font-semibold text-brand-gold hover:underline ml-1"
              >
                Switch
              </button>
            </div>

            <div className="text-brand-muted text-[11px]">
              Role: <span className="font-semibold text-brand-dark">{session?.user?.role}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>

        {/* Global Dev Mode & Customization Center */}
        <DevModeCustomizer
          currentOrgName={session?.organization?.name || 'Workspace'}
          currentOrgSlug={session?.organization?.slug || 'workspace'}
          onRefreshNeeded={() => router.refresh()}
        />
      </div>
    </div>
  );
}
