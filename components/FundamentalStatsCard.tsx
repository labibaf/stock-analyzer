'use client';

import React from 'react';
import { StockQuote } from '@/lib/types';
import { formatIDR } from '@/lib/idx-rules';
import { Landmark, PieChart, Coins, TrendingUp } from 'lucide-react';

interface FundamentalStatsCardProps {
  quote: StockQuote;
}

export default function FundamentalStatsCard({ quote }: FundamentalStatsCardProps) {
  // Format Market Cap to Triliun (T) or Miliar (B)
  const formatMarketCap = (marketCap: number | undefined) => {
    if (!marketCap || isNaN(marketCap)) return '-';
    if (marketCap >= 1_000_000_000_000) {
      return `Rp ${(marketCap / 1_000_000_000_000).toFixed(1)} T`;
    }
    if (marketCap >= 1_000_000_000) {
      return `Rp ${(marketCap / 1_000_000_000).toFixed(1)} B`;
    }
    return formatIDR(marketCap);
  };

  const getMarketCapTier = (marketCap: number | undefined) => {
    if (!marketCap) return 'IDX Listed';
    if (marketCap >= 50_000_000_000_000) return 'Big Cap (> 50T)';
    if (marketCap >= 5_000_000_000_000) return 'Mid Cap (5T-50T)';
    return 'Small Cap (< 5T)';
  };

  return (
    <div className="bg-[#0b0f19] border border-[#162035] rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full shadow-lg">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#141d30]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#131b2e] border border-[#1f2d4d] flex items-center justify-center">
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Valuasi & Fundamental</h4>
              <p className="text-[10px] text-slate-400">Metrik finansial resmi emiten</p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#131b2e] text-slate-300 border border-[#1f2d4d]">
            {getMarketCapTier(quote.marketCap)}
          </span>
        </div>

        {/* Grid of Fundamental Multiples */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
          {/* PER */}
          <div className="p-2.5 rounded bg-[#090c14] border border-[#192134]">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-0.5">
              <PieChart className="w-3 h-3 text-sky-400" />
              <span>PER</span>
            </div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {quote.peRatio !== undefined ? `${quote.peRatio}x` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {quote.peRatio !== undefined && quote.peRatio < 15 ? 'Wajar' : 'Premium'}
            </div>
          </div>

          {/* PBV */}
          <div className="p-2.5 rounded bg-[#090c14] border border-[#192134]">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-0.5">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>PBV</span>
            </div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {quote.pbvRatio !== undefined ? `${quote.pbvRatio}x` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {quote.pbvRatio !== undefined && quote.pbvRatio < 1.5 ? '< 1.5x' : '> 1.5x'}
            </div>
          </div>

          {/* Dividend Yield */}
          <div className="p-2.5 rounded bg-[#090c14] border border-[#192134]">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-0.5">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>Yield</span>
            </div>
            <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
              {quote.dividendYield !== undefined ? `${quote.dividendYield}%` : '0.0%'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {quote.dividendYield !== undefined && quote.dividendYield >= 5 ? 'High Div' : 'Standar'}
            </div>
          </div>

          {/* Market Cap */}
          <div className="p-2.5 rounded bg-[#090c14] border border-[#192134]">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-0.5">
              <Landmark className="w-3 h-3 text-purple-400" />
              <span>Market Cap</span>
            </div>
            <div className="text-sm font-bold font-mono text-white truncate tabular-nums">
              {formatMarketCap(quote.marketCap)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Valuasi BEI</div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#182032] flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Sektor: {quote.sector || 'IDX Equities'}</span>
        <span>Mata Uang: IDR</span>
      </div>
    </div>
  );
}
