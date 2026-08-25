'use client';

import React, { useState } from 'react';
import { Search, Sparkles, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';
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
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  IDX <span className="text-sky-400">Swing</span> Analyzer
                </h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  IHSG / BEI
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                Anti-Hallucination Technical & AI Copilot
              </p>
            </div>
          </div>

          {/* Search Bar & AI Status */}
          <div className="flex items-center gap-3 flex-1 max-w-md ml-auto">
            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kode saham (e.g. BBRI, MEDC, ADRO)..."
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl pl-9 pr-20 py-2 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
              >
                {isLoading ? 'Loading...' : 'Analisa'}
              </button>
            </form>

            {/* AI Status Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap ${
                isAIGenerated
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
              title={
                isAIGenerated
                  ? `AI Mode Aktif (${modelUsed || 'Gemini Flash Free'})`
                  : 'Algorithmic Technical Engine Mode'
              }
            >
              {isAIGenerated ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Gemini AI</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Algo Engine</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Ticker Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap mr-1">Popular:</span>
          {POPULAR_IDX_STOCKS.map((stock) => {
            const isSelected = currentTicker.toUpperCase() === stock.ticker;
            return (
              <button
                key={stock.ticker}
                onClick={() => onSelectTicker(stock.ticker)}
                className={`px-2.5 py-1 rounded-lg font-mono transition-all whitespace-nowrap flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold shadow-sm shadow-sky-500/20'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>{stock.ticker}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
