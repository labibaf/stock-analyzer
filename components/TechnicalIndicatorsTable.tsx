'use client';

import React from 'react';
import { TechnicalSummary } from '@/lib/types';
import { formatIDR, formatVolume } from '@/lib/idx-rules';
import { Activity, Sliders, BarChart2, Flame, Shield } from 'lucide-react';

interface TechnicalIndicatorsTableProps {
  tech: TechnicalSummary;
}

export default function TechnicalIndicatorsTable({ tech }: TechnicalIndicatorsTableProps) {
  return (
    <div className="bg-[#0b0f19] border border-[#162035] rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[#141d30]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#131b2e] border border-[#1f2d4d] flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Parameter & Indikator Lengkap</h4>
            <p className="text-[10px] text-slate-400">Deterministic Mathematical Formula</p>
          </div>
        </div>
        <span className="text-[10px] text-sky-400 font-mono font-semibold px-2 py-0.5 rounded bg-[#131b2e] border border-[#1f2d4d]">
          100% Calculated
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 text-xs">
        {/* Moving Averages */}
        <div className="p-2.5 rounded bg-[#090c14] border border-[#192134] space-y-1.5">
          <span className="font-semibold text-slate-400 block border-b border-[#151b2a] pb-1 text-[11px] flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" /> Moving Averages
          </span>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">EMA 20:</span>
            <span className="font-mono font-semibold text-amber-400 tabular-nums">{formatIDR(tech.ema20)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">EMA 50:</span>
            <span className="font-mono font-semibold text-cyan-400 tabular-nums">{formatIDR(tech.ema50)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">EMA 200:</span>
            <span className="font-mono font-semibold text-purple-400 tabular-nums">{formatIDR(tech.ema200)}</span>
          </div>
        </div>

        {/* Momentum: RSI, Stochastic, MACD */}
        <div className="p-2.5 rounded bg-[#090c14] border border-[#192134] space-y-1.5">
          <span className="font-semibold text-slate-400 block border-b border-[#151b2a] pb-1 text-[11px] flex items-center gap-1">
            <BarChart2 className="w-3 h-3 text-purple-400" /> Momentum & Oscillators
          </span>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">RSI (14):</span>
            <span className="font-mono font-bold text-slate-100 tabular-nums">{tech.rsi14}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Stochastic:</span>
            <span className="font-mono text-cyan-400 tabular-nums font-semibold">
              {tech.stochastic.k} / {tech.stochastic.d}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">MACD Hist:</span>
            <span
              className={`font-mono font-bold tabular-nums ${
                tech.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {tech.macd.histogram > 0 ? `+${tech.macd.histogram}` : tech.macd.histogram}
            </span>
          </div>
        </div>

        {/* Volatility & Bollinger Bands */}
        <div className="p-2.5 rounded bg-[#090c14] border border-[#192134] space-y-1.5">
          <span className="font-semibold text-slate-400 block border-b border-[#151b2a] pb-1 text-[11px] flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" /> Volatilitas & Bands
          </span>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">ATR (14):</span>
            <span className="font-mono font-bold text-slate-100 tabular-nums">{formatIDR(tech.atr14)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">BB Upper:</span>
            <span className="font-mono text-slate-200 tabular-nums">{formatIDR(tech.bollinger.upper)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">BB Bandwidth:</span>
            <span className="font-mono font-semibold text-amber-400 tabular-nums">
              {tech.bollinger.bandwidth}% {tech.bollinger.isSqueeze ? '(Squeeze)' : ''}
            </span>
          </div>
        </div>

        {/* Liquidity & Money Flow */}
        <div className="p-2.5 rounded bg-[#090c14] border border-[#192134] space-y-1.5">
          <span className="font-semibold text-slate-400 block border-b border-[#151b2a] pb-1 text-[11px] flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" /> Likuiditas & Flow
          </span>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">20MA Volume:</span>
            <span className="font-mono text-slate-200 tabular-nums">{formatVolume(tech.quote.avgVolume20)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Surge Ratio:</span>
            <span className="font-mono font-bold text-amber-400 tabular-nums">{tech.volumeRatio20}x</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">MFI (14):</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">{tech.mfi14.value}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
