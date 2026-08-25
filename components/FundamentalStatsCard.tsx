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
      return `Rp ${(marketCap / 1_000_000_000_000).toFixed(1)} Triliun`;
    }
    if (marketCap >= 1_000_000_000) {
      return `Rp ${(marketCap / 1_000_000_000).toFixed(1)} Miliar`;
    }
    return formatIDR(marketCap);
  };

  const getMarketCapTier = (marketCap: number | undefined) => {
    if (!marketCap) return 'IDX Listed';
    if (marketCap >= 50_000_000_000_000) return 'Big Cap (Blue Chip > 50T)';
    if (marketCap >= 5_000_000_000_000) return 'Mid Cap (Second Liner 5T-50T)';
    return 'Small Cap (< 5T)';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Valuasi & Fundamental Ringkas</h4>
            <p className="text-[11px] text-slate-400">Metrik fundamental emiten dari laporan keuangan resmi</p>
          </div>
        </div>

        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
          {getMarketCapTier(quote.marketCap)}
        </span>
      </div>

      {/* Grid of Fundamental Multiples */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
        {/* PER */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 font-medium mb-1">
            <PieChart className="w-3.5 h-3.5 text-sky-400" />
            <span>P/E Ratio (PER)</span>
          </div>
          <div className="text-lg font-black font-mono text-white">
            {quote.peRatio !== undefined ? `${quote.peRatio}x` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {quote.peRatio !== undefined && quote.peRatio < 15
              ? 'Valuasi Wajar / Menarik'
              : 'Valuasi Premium'}
          </div>
        </div>

        {/* PBV */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 font-medium mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Price to Book (PBV)</span>
          </div>
          <div className="text-lg font-black font-mono text-white">
            {quote.pbvRatio !== undefined ? `${quote.pbvRatio}x` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {quote.pbvRatio !== undefined && quote.pbvRatio < 1.5
              ? 'Below / Near Book Value'
              : 'Above Book Value'}
          </div>
        </div>

        {/* Dividend Yield */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 font-medium mb-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Dividend Yield</span>
          </div>
          <div className="text-lg font-black font-mono text-amber-400">
            {quote.dividendYield !== undefined ? `${quote.dividendYield}%` : '0.0%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {quote.dividendYield !== undefined && quote.dividendYield >= 5
              ? '🔥 High Dividend Stock'
              : 'Standard Dividend'}
          </div>
        </div>

        {/* Market Cap */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 font-medium mb-1">
            <Landmark className="w-3.5 h-3.5 text-purple-400" />
            <span>Kapitalisasi Pasar</span>
          </div>
          <div className="text-sm font-bold font-mono text-white line-clamp-1">
            {formatMarketCap(quote.marketCap)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total Valuasi Bursa</div>
        </div>
      </div>
    </div>
  );
}
