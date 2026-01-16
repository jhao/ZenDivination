import React from 'react';

export const YinYangSymbol = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M50,2 A48,48 0 0,1 50,98 A24,24 0 0,1 50,50 A24,24 0 0,0 50,2 Z" fill="currentColor" />
    <circle cx="50" cy="26" r="6" fill="#1a1a1a" />
    <circle cx="50" cy="74" r="6" fill="currentColor" />
  </svg>
);
