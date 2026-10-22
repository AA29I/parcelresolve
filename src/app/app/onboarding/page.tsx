'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  Layers,
  Clock,
  FileSpreadsheet,
  Cpu,
  Key,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';

interface OnboardingData {
  currentStep: number;
  completed: boolean;
  steps: { id: number; title: string; description: string }[];
  checklist: Record<string, boolean>;
}

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOnboarding = async () => {
    try {
      const res = await fetch('/api/onboarding');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const markStepDone = async (stepNumber: number) => {
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepNumber: stepNumber + 1, markCompleted: stepNumber === 10 }),
    });
    await fetchOnboarding();
  };

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-xs text-brand-muted font-mono flex items-center justify-center">
        <RefreshCw className="w-4 h-4 animate-spin text-brand-gold mr-2" />
        Loading Universal Onboarding Checklist...
      </div>
    );
  }

  const completedCount = Object.values(data.checklist).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 10) * 100);

  const stepActions = [
    { id: 1, link: '/app/settings', text: 'Configure Warehouses & Staff' },
    { id: 2, link: '/app/settings', text: 'Manage Countries & Currencies' },
    { id: 3, link: '/app/carriers', text: 'Connect Direct Couriers' },
    { id: 4, link: '/app/carriers', text: 'Manage Courier Mappings' },
    { id: 5, link: '/app/settings', text: 'Edit SLA Policies & Cutoffs' },
    { id: 6, link: '/app/imports', text: 'Launch CSV/XLSX Import Tool' },
    { id: 7, link: '/app/linnworks', text: 'Authorize Linnworks Application' },
    { id: 8, link: '/app/carriers', text: 'Open REST Connector Builder' },
    { id: 9, link: '/app/dashboard', text: 'View Live Parcel Timeline' },
    { id: 10, link: '/app/developer', text: 'Set Enquiry & Workflow Rules' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-white border border-brand-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-1">
              Universal Workspace Onboarding
            </div>
            <h1 className="text-2xl font-serif font-bold text-brand-dark">10-Step Setup Checklist</h1>
            <p className="text-xs text-brand-muted mt-1">
              Every company configures its physical hubs, courier accounts, and SLA policies independently.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-brand-border/60 sm:pl-6 shrink-0">
            <div className="text-2xl font-bold font-serif text-brand-dark">{progressPercent}%</div>
            <div className="text-[11px] text-brand-muted">{completedCount} of 10 Steps Verified</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-brand-cream rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-gold h-2 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {data.steps.map((step, idx) => {
          const isDone = data.checklist[`step${step.id}`];
          const action = stepActions.find((a) => a.id === step.id);

          return (
            <div
              key={step.id}
              className={`p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDone
                  ? 'bg-white border-brand-border/80'
                  : 'bg-white border-brand-gold/50 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-brand-muted/40" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-brand-dark">
                      Step {step.id}: {step.title}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted mt-0.5">{step.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0 self-end sm:self-center">
                {action && (
                  <Link
                    href={action.link}
                    className="px-3 py-1.5 rounded bg-brand-cream hover:bg-brand-border text-brand-dark text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {action.text} <ArrowRight className="w-3 h-3 text-brand-gold" />
                  </Link>
                )}
                {!isDone && (
                  <button
                    onClick={() => markStepDone(step.id)}
                    className="px-2.5 py-1.5 rounded bg-brand-dark hover:bg-brand-ink text-brand-paper text-xs font-medium transition-colors"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
