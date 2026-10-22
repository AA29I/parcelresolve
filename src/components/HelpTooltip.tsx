'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  title?: string;
  className?: string;
}

export default function HelpTooltip({ text, title, className = '' }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex items-center ml-1 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-brand-muted hover:text-brand-gold focus:outline-none transition-colors"
        aria-label="Help information"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <span
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-brand-dark text-brand-paper text-[11px] rounded-lg shadow-xl border border-brand-gold/30 pointer-events-none transition-all"
          style={{ lineHeight: 1.4 }}
        >
          {title && <span className="block font-bold text-brand-gold mb-1">{title}</span>}
          <span className="block font-normal text-brand-paper/90">{text}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brand-dark" />
        </span>
      )}
    </span>
  );
}
