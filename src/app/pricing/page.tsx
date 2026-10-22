'use client';

import React from 'react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Starter',
      price: '$299',
      cadence: '/month',
      description: 'Ideal for growing brands handling up to 10,000 parcels monthly.',
      limits: '10,000 Parcels / mo • 250 Claims / mo',
      features: [
        'Multi-carrier tracking engine',
        'Business-day SLA calculation',
        'CSV/XLSX imports & column mapping',
        'Carrier enquiry drafts',
        'Loss declaration PDF generator',
        'Standard email support',
      ],
      ctaText: 'Start 14-Day Trial',
      ctaHref: '/signup',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: '$899',
      cadence: '/month',
      description: 'For mid-market e-commerce merchants shipping 50,000 parcels monthly.',
      limits: '50,000 Parcels / mo • 1,000 Claims / mo',
      features: [
        'All Starter features included',
        'Official Linnworks WMS connector',
        'Self-service REST connector builder',
        'Automated enquiry auto-sending',
        'Scoped API keys & signed webhooks',
        'Custom fields & status mappings',
        'Priority Slack & email support',
      ],
      ctaText: 'Start 14-Day Trial',
      ctaHref: '/signup',
      highlighted: true,
    },
    {
      name: 'Scale / Enterprise',
      price: '$2,499',
      cadence: '/month',
      description: 'High-volume operations handling 300,000–500,000 parcels and 7,000 claims annually.',
      limits: '500,000 Parcels / yr • 7,000 Claims / yr',
      features: [
        'All Growth features included',
        'Custom Carrier Extension SDK harness',
        'No-code workflow engine with version rollback',
        'Dedicated PgBouncer connection pooling',
        'Dedicated onboarding & carrier mapping engineer',
        '99.95% uptime SLA & SOC2 report access',
      ],
      ctaText: 'Contact Sales / Demo',
      ctaHref: '/contact',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-paper">
      <PublicHeader />

      <div className="py-16 border-b border-brand-border/60 bg-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-2">Transparent SaaS Pricing</div>
          <h1 className="text-4xl font-serif font-bold text-brand-dark mb-4">
            Predictable Plans for Every Shipping Scale
          </h1>
          <p className="text-brand-muted text-base leading-relaxed">
            All plans include isolated tenant databases, full claim packet generators, and immutable event tracking. Test-mode billing enabled.
          </p>
        </div>
      </div>

      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-8 rounded-lg border bg-white flex flex-col justify-between transition-all ${
                tier.highlighted
                  ? 'border-brand-gold shadow-md ring-1 ring-brand-gold/40 relative'
                  : 'border-brand-border shadow-xs'
              }`}
            >
              <div>
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-dark text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-brand-dark mb-1">{tier.name}</h3>
                <p className="text-xs text-brand-muted mb-4">{tier.description}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold font-serif text-brand-dark">{tier.price}</span>
                  <span className="text-xs text-brand-muted">{tier.cadence}</span>
                </div>
                <div className="text-xs font-medium text-brand-gold bg-brand-cream/80 px-2.5 py-1 rounded w-fit mb-6">
                  {tier.limits}
                </div>

                <div className="border-t border-brand-border/60 pt-4 mb-6">
                  <div className="text-xs font-semibold text-brand-dark mb-3 uppercase tracking-wider">Features included:</div>
                  <ul className="space-y-2.5 text-xs text-brand-muted">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                href={tier.ctaHref}
                className={`w-full py-2.5 rounded text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${
                  tier.highlighted
                    ? 'bg-brand-dark text-brand-paper hover:bg-brand-ink'
                    : 'bg-brand-cream text-brand-dark hover:bg-brand-border'
                }`}
              >
                {tier.ctaText} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
