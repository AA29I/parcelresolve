'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Shield, Layers, FileSpreadsheet, KeyRound, ArrowRight } from 'lucide-react';

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-brand-paper/90 backdrop-blur-md border-b border-brand-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-brand-dark flex items-center justify-center text-brand-gold">
            <Package className="w-4 h-4" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-brand-dark font-sans">
            Parcel<span className="text-brand-gold">Resolve</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-brand-muted">
          <Link href="/features" className="hover:text-brand-dark transition-colors">
            Features
          </Link>
          <Link href="/integrations" className="hover:text-brand-dark transition-colors">
            Carriers & Linnworks
          </Link>
          <Link href="/pricing" className="hover:text-brand-dark transition-colors">
            Pricing
          </Link>
          <Link href="/security" className="hover:text-brand-dark transition-colors">
            Security & RLS
          </Link>
          <Link href="/docs" className="hover:text-brand-dark transition-colors">
            Documentation
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-brand-dark hover:text-brand-gold transition-colors px-3 py-1.5"
          >
            Sign In / Demo
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 bg-brand-dark hover:bg-brand-ink text-brand-paper px-4 py-2 rounded text-xs sm:text-sm font-medium transition-colors shadow-sm"
          >
            Start Free Trial
            <ArrowRight className="w-3.5 h-3.5 text-brand-gold" />
          </Link>
        </div>
      </div>
    </header>
  );
}
