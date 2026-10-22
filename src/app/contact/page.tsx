'use client';

import React, { useState } from 'react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { Send, CheckCircle2, Package } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    annualVolume: '300000-500000',
    primaryCarriers: 'UPS, USPS',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-paper">
      <PublicHeader />

      <div className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-2">
            Enterprise Solutions
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-dark mb-3">
            Request an Enterprise Walkthrough
          </h1>
          <p className="text-sm text-brand-muted">
            Speak with an enterprise logistics architect about high-volume tracking, SLA calculations, and carrier claim recoveries.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-900">Demonstration Request Received</h3>
            <p className="text-xs text-emerald-800 max-w-md mx-auto">
              An enterprise architect will contact you within 4 business hours with an active sandbox instance configured for your annual volume tier.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 rounded-lg bg-white border border-brand-border shadow-xs space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Eleanor Vance"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.vance@company.com"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Apex Global Goods"
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1">Annual Parcel Volume</label>
                <select
                  value={form.annualVolume}
                  onChange={(e) => setForm({ ...form, annualVolume: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold bg-white"
                >
                  <option value="10000-50000">10,000 – 50,000 parcels/year</option>
                  <option value="50000-200000">50,000 – 200,000 parcels/year</option>
                  <option value="300000-500000">300,000 – 500,000 parcels/year (Target Scale)</option>
                  <option value="500000+">500,000+ parcels/year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Primary Couriers & Aggregators</label>
              <input
                type="text"
                value={form.primaryCarriers}
                onChange={(e) => setForm({ ...form, primaryCarriers: e.target.value })}
                placeholder="e.g. UPS, USPS, GLS, eShipper, DHL"
                className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">Operational Requirements / Notes</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your current tracking challenges, SLA cutoff rules, or Linnworks setup..."
                className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:border-brand-gold"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-brand-dark text-brand-paper hover:bg-brand-ink text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5 text-brand-gold" />
              Submit Enterprise Demo Request
            </button>
          </form>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
