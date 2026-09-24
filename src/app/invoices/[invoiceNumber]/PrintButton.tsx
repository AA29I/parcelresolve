'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
    >
      <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
    </button>
  );
}
