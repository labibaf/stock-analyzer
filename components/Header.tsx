'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Cpu } from 'lucide-react';
import { POPULAR_IDX_STOCKS } from '@/lib/idx-rules';

interface HeaderProps {
  currentTicker: string;
  onSelectTicker: (ticker: string) => void;
  isLoading: boolean;
  isAIGenerated: boolean;
  modelUsed?: string;
}

export default function Header({
  currentTicker,
  onSelectTicker,
  isLoading,
  isAIGenerated,
  modelUsed,
}: HeaderProps) {
  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectTicker(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  return (
    <header className="border-b border-[#1c2234] bg-[#0b0e17]/95 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100">
                IDX <span className="text-sky-400 font-normal">Swing Analyzer</span>
              </h1>
            </div>
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#141824] border border-[#273148] text-slate-400">
              IHSG / BEI
            </span>
          </div>

          {/* Search Form & Status */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md sm:ml-auto">
            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kode saham (e.g. BBCA, MEDC)..."
                className="w-full bg-[#111522] border border-[#1f283d] focus:border-sky-500 focus:bg-[#141928] rounded-md pl-8 pr-16 py-1.5 text-xs text-slate-100 placeholder-slate-500 transition-colors outline-none font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 disabled:bg-[#1e2538] text-white font-medium text-[11px] rounded transition-colors"
              >
                {isLoading ? 'Loading' : 'Analisa'}
              </button>
            </form>

            {/* AI Status Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#111522] border border-[#1f283d] text-[11px] font-medium text-slate-400 whitespace-nowrap"
              title={
                isAIGenerated
                  ? `AI Mode Aktif (${modelUsed || 'Gemini Flash Free'})`
                  : 'Deterministic Engine'
              }
            >
              {isAIGenerated ? (
                <>
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span className="text-slate-300">Gemini</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3 h-3 text-slate-400" />
                  <span>Algo</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ticker Quick Chips Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar text-xs border-t border-[#161c2d] mt-2">
          <span className="text-slate-500 text-[11px] font-medium whitespace-nowrap mr-1">
            Likuid:
          </span>
          {POPULAR_IDX_STOCKS.map((stock) => {
            const isSelected = currentTicker.toUpperCase() === stock.ticker;
            return (
              <button
                key={stock.ticker}
                onClick={() => onSelectTicker(stock.ticker)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors whitespace-nowrap border ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 font-semibold'
                    : 'bg-[#101420] hover:bg-[#151b2c] border-[#1a2236] text-slate-400 hover:text-slate-200'
                }`}
              >
                {stock.ticker}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
