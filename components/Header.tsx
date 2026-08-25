'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Sparkles, Cpu, Settings } from 'lucide-react';
import { POPULAR_IDX_STOCKS } from '@/lib/idx-rules';

interface HeaderProps {
  currentTicker: string;
  onSelectTicker: (ticker: string) => void;
  isLoading: boolean;
  isAIGenerated: boolean;
  modelUsed?: string;
  onOpenAISettings: () => void;
  activeProviderName?: string;
  hasCustomKey?: boolean;
}

export default function Header({
  currentTicker,
  onSelectTicker,
  isLoading,
  isAIGenerated,
  modelUsed,
  onOpenAISettings,
  activeProviderName,
  hasCustomKey,
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
    <header className="border-b border-[#162035] bg-[#080b13]/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-sky-500/30 bg-[#070a12] shadow-sm shadow-sky-500/20 shrink-0">
                <Image
                  src="/logo.png"
                  alt="IDX Swing Analyzer Logo"
                  fill
                  sizes="32px"
                  className="object-cover"
                  priority
                />
              </div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>IDX</span>
                <span className="text-sky-400 font-normal">Swing Analyzer</span>
              </h1>
            </div>
          </div>

          {/* Search Form & AI Key Settings Button */}
          <div className="flex items-center gap-2.5 flex-1 max-w-lg sm:ml-auto">
            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kode saham (e.g. BBCA, MEDC)..."
                className="w-full bg-[#0d121f] border border-[#1c273f] focus:border-sky-500 focus:bg-[#101726] rounded-lg pl-8 pr-16 py-1.5 text-xs text-slate-100 placeholder-slate-500 transition-colors outline-none font-mono font-semibold"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 disabled:bg-[#1e2538] text-white font-semibold text-[11px] rounded-md transition-colors"
              >
                {isLoading ? 'Loading' : 'Analisa'}
              </button>
            </form>

            {/* AI Key Settings Trigger Button (BYOK) */}
            <button
              type="button"
              onClick={onOpenAISettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all whitespace-nowrap ${
                hasCustomKey || isAIGenerated
                  ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-[#0d121f] border-[#1c273f] text-slate-300 hover:bg-[#151d30] hover:text-white'
              }`}
              title={
                hasCustomKey
                  ? `AI Key Aktif: ${activeProviderName} (${modelUsed || 'Model Kustom'})`
                  : 'Klik untuk memasukkan API Key AI Anda sendiri (Gemini, Groq, OpenAI, Claude, DeepSeek)'
              }
            >
              {hasCustomKey || isAIGenerated ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI: {activeProviderName || 'Gemini'}</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>Algo Mode</span>
                </>
              )}
              <Settings className="w-3 h-3 text-slate-400 ml-0.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Ticker Quick Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar text-xs border-t border-[#141d30] mt-2.5">
          <span className="text-slate-500 text-[11px] font-semibold whitespace-nowrap mr-1">
            Likuid:
          </span>
          {POPULAR_IDX_STOCKS.map((stock) => {
            const isSelected = currentTicker.toUpperCase() === stock.ticker;
            return (
              <button
                key={stock.ticker}
                onClick={() => onSelectTicker(stock.ticker)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap border ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold shadow-sm'
                    : 'bg-[#0d121f] hover:bg-[#141b2c] border-[#1a253c] text-slate-400 hover:text-slate-200'
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
