'use client';

import React from 'react';
import { StockQuote, TechnicalSummary } from '@/lib/types';
import { formatIDR, formatVolume } from '@/lib/idx-rules';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
} from 'lucide-react';

interface ScorecardProps {
  quote: StockQuote;
  tech: TechnicalSummary;
}

export default function Scorecard({ quote, tech }: ScorecardProps) {
  const isPositive = quote.change >= 0;

  // Calculate 52-week position percentage
  const range52 = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow;
  const pos52 =
    range52 > 0
      ? Math.min(Math.max(((quote.currentPrice - quote.fiftyTwoWeekLow) / range52) * 100, 0), 100)
      : 50;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
      {/* Top Section: Ticker Info & Price */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {quote.ticker}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                IDX / BEI
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5 line-clamp-1 font-medium">{quote.name}</p>
          </div>

          {/* Current Price & Change */}
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
              {formatIDR(quote.currentPrice)}
            </div>
            <div
              className={`flex items-center justify-end gap-1 text-sm font-semibold mt-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>
                {quote.change > 0 ? `+${quote.change}` : quote.change} (
                {quote.changePercent > 0 ? `+${quote.changePercent}` : quote.changePercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* 52-Week Range Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>52W Low: {formatIDR(quote.fiftyTwoWeekLow)}</span>
            <span className="text-slate-500 font-mono">Posisi 52W: {pos52.toFixed(0)}%</span>
            <span>52W High: {formatIDR(quote.fiftyTwoWeekHigh)}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-sky-400 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${pos52}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Key Technical Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* Trend Box */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Struktur Tren</span>
          </div>
          <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
            {tech.trend === 'STRONG_UPTREND' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Strong Uptrend
              </span>
            )}
            {tech.trend === 'PULLBACK_UPTREND' && (
              <span className="text-cyan-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Pullback Buy
              </span>
            )}
            {tech.trend === 'CONSOLIDATION' && (
              <span className="text-amber-400 flex items-center gap-1">Sideways Range</span>
            )}
            {tech.trend === 'DOWNTREND' && (
              <span className="text-rose-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Downtrend
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            EMA20: {tech.ema20} | EMA50: {tech.ema50}
          </div>
        </div>

        {/* RSI 14 */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>RSI (14) Momentum</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold font-mono text-white">{tech.rsi14}</span>
            <span
              className={`text-[11px] font-semibold ${
                tech.rsiStatus === 'OVERSOLD'
                  ? 'text-emerald-400'
                  : tech.rsiStatus === 'OVERBOUGHT'
                  ? 'text-rose-400'
                  : tech.rsiStatus === 'HEALTHY_BULLISH'
                  ? 'text-sky-400'
                  : 'text-slate-400'
              }`}
            >
              {tech.rsiStatus === 'OVERSOLD' && 'Oversold (<32)'}
              {tech.rsiStatus === 'HEALTHY_BULLISH' && 'Bullish (42-60)'}
              {tech.rsiStatus === 'OVERBOUGHT' && 'Overbought (>70)'}
              {tech.rsiStatus === 'NEUTRAL' && 'Neutral'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${
                tech.rsi14 > 70
                  ? 'bg-rose-500'
                  : tech.rsi14 < 32
                  ? 'bg-emerald-500'
                  : 'bg-sky-400'
              }`}
              style={{ width: `${Math.min(tech.rsi14, 100)}%` }}
            />
          </div>
        </div>

        {/* Volume Spike / Activity */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Volume vs 20-SMA</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold font-mono text-white">
              {tech.volumeRatio20}x
            </span>
            {tech.volumeSurge ? (
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Surge Spike!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Normal</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Vol: {formatVolume(quote.volume)} | Avg: {formatVolume(quote.avgVolume20)}
          </div>
        </div>

        {/* Dynamic ATR Volatility */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>ATR 14 (Volatilitas)</span>
          </div>
          <div className="text-base font-extrabold font-mono text-white">
            {formatIDR(tech.atr14)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Nafas fluktuasi harian ~{((tech.atr14 / quote.currentPrice) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Key Support & Resistance Levels Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
          <span className="text-slate-400 font-medium">Support 1</span>
          <span className="font-mono font-bold text-emerald-400">{formatIDR(tech.support1)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/10 border border-emerald-800/20">
          <span className="text-slate-400 font-medium">Support 2</span>
          <span className="font-mono font-semibold text-emerald-300">{formatIDR(tech.support2)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-800/30">
          <span className="text-slate-400 font-medium">Resistance 1</span>
          <span className="font-mono font-bold text-rose-400">{formatIDR(tech.resistance1)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/10 border border-rose-800/20">
          <span className="text-slate-400 font-medium">Resistance 2</span>
          <span className="font-mono font-semibold text-rose-300">{formatIDR(tech.resistance2)}</span>
        </div>
      </div>
    </div>
  );
}
