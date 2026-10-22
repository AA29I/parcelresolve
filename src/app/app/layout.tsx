'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Package,
  Clock,
  FileCheck2,
  Layers,
  FileSpreadsheet,
  Settings,
  LogOut,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import OperationsGuideDrawer from '@/components/OperationsGuideDrawer';

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
  const [guideOpen, setGuideOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-paper flex items-center justify-center font-mono text-xs text-brand-muted">
        <RefreshCw className="w-4 h-4 animate-spin text-brand-gold mr-2" />
        Loading workspace...
      </div>
    );
  }

  interface NavItem {
    label: string;
    href: string;
    icon: any;
    badge?: string;
  }

  const navItems: NavItem[] = [
    { label: 'Courier Performance Radar', href: '/app/dashboard', icon: Package },
    { label: 'Linnworks & Manifest Import', href: '/app/imports', icon: FileSpreadsheet },
    { label: 'Courier Inquiries & Tracers', href: '/app/enquiries', icon: Clock },
    { label: 'Claims & Invoice Studio', href: '/app/claims', icon: FileCheck2 },
    { label: 'Couriers & Claim Rules', href: '/app/carriers', icon: Layers },
    { label: 'Workspace Settings', href: '/app/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-brand-paper text-brand-ink">
      {/* Sidebar */}
      <aside className="w-64 border-r border-brand-border bg-white flex flex-col shrink-0">
        {/* Brand & Active Company Workspace Card */}
        <div className="p-4 border-b border-brand-border">
          <Link href="/app/dashboard" className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-dark flex items-center justify-center text-brand-gold shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base tracking-tight text-brand-dark">
              Parcel<span className="text-brand-gold font-serif">Resolve</span>
            </span>
          </Link>

          <div className="p-2.5 rounded-lg bg-brand-cream border border-brand-border text-xs">
            <div className="flex items-center justify-between text-[10px] text-brand-muted uppercase tracking-wider font-semibold mb-1">
              <span>Organization</span>
              <span className="text-emerald-700 font-mono">Active</span>
            </div>
            <div className="font-bold text-brand-dark truncate">{session?.organization?.name}</div>
            <div className="text-[11px] text-brand-muted font-mono mt-0.5">
              {session?.organization?.defaultCurrency} • {session?.user?.email}
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
              <div className="text-[10px] text-brand-muted font-mono truncate">{session?.user?.email}</div>
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

          <div className="flex items-center gap-3 text-xs">
            {/* Operations Documentation & SOP Button */}
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-brand-cream border border-brand-border text-brand-dark text-xs font-semibold flex items-center gap-1.5 hover:border-brand-gold transition-colors shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-brand-gold" />
              <span>Platform Guide &amp; SOP</span>
            </button>

            <div className="flex items-center gap-2 bg-brand-paper border border-brand-border rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-medium text-brand-dark">Live Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>

        {/* Built-in Operations Playbook Drawer */}
        <OperationsGuideDrawer isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      </div>
    </div>
  );
}
