'use client';

import React from 'react';
import { TechnicalSummary } from '@/lib/types';
import { formatIDR, formatVolume } from '@/lib/idx-rules';
import { Activity, Sliders, BarChart2 } from 'lucide-react';

interface TechnicalIndicatorsTableProps {
  tech: TechnicalSummary;
}

export default function TechnicalIndicatorsTable({ tech }: TechnicalIndicatorsTableProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h4 className="text-sm font-bold text-white">Parameter & Indikator Lengkap</h4>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Formula Deterministic</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-xs">
        {/* Moving Averages */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <span className="font-semibold text-slate-400 block border-b border-slate-800/60 pb-1 flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" /> Moving Averages (EMA)
          </span>
          <div className="flex justify-between">
            <span className="text-slate-400">EMA 20 (Short):</span>
            <span className="font-mono font-bold text-amber-400">{formatIDR(tech.ema20)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">EMA 50 (Medium):</span>
            <span className="font-mono font-bold text-cyan-400">{formatIDR(tech.ema50)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">EMA 200 (Long):</span>
            <span className="font-mono font-bold text-purple-400">{formatIDR(tech.ema200)}</span>
          </div>
        </div>

        {/* Momentum & Oscillators */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <span className="font-semibold text-slate-400 block border-b border-slate-800/60 pb-1 flex items-center gap-1">
            <BarChart2 className="w-3 h-3 text-purple-400" /> Momentum & MACD
          </span>
          <div className="flex justify-between">
            <span className="text-slate-400">RSI 14:</span>
            <span className="font-mono font-bold text-slate-100">{tech.rsi14}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">MACD Line / Signal:</span>
            <span className="font-mono text-slate-200">
              {tech.macd.macd} / {tech.macd.signal}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">MACD Histogram:</span>
            <span
              className={`font-mono font-bold ${
                tech.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {tech.macd.histogram > 0 ? `+${tech.macd.histogram}` : tech.macd.histogram}
            </span>
          </div>
        </div>

        {/* Volatility & Volume */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <span className="font-semibold text-slate-400 block border-b border-slate-800/60 pb-1">
            Volatilitas & Likuiditas
          </span>
          <div className="flex justify-between">
            <span className="text-slate-400">ATR 14 (Volatilitas):</span>
            <span className="font-mono font-bold text-slate-100">{formatIDR(tech.atr14)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">20-SMA Volume:</span>
            <span className="font-mono text-slate-200">{formatVolume(tech.quote.avgVolume20)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Volume Surge Ratio:</span>
            <span className="font-mono font-bold text-amber-400">{tech.volumeRatio20}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}
