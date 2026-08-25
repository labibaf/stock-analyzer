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
  Zap,
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
    <div className="bg-[#0e121d] border border-[#1c2438] rounded-lg p-4 flex flex-col justify-between h-full">
      {/* Top Section: Ticker Info & Price */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white">
                {quote.ticker}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#161c2c] text-slate-400 font-mono border border-[#232d46]">
                IDX
              </span>

              {/* Candlestick Pattern Badge */}
              {tech.detectedPattern && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 ${
                    tech.detectedPattern.type === 'BULLISH'
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                      : tech.detectedPattern.type === 'BEARISH'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-400'
                      : 'bg-[#161c2c] border-[#232d46] text-slate-300'
                  }`}
                  title={tech.detectedPattern.description}
                >
                  <span>🕯️</span>
                  <span>{tech.detectedPattern.name}</span>
                </span>
              )}

              {/* Bollinger Squeeze Alert Badge */}
              {tech.bollinger.isSqueeze && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>BB Squeeze</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{quote.name}</p>
          </div>

          {/* Current Price & Change */}
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {formatIDR(quote.currentPrice)}
            </div>
            <div
              className={`flex items-center justify-end gap-1 text-xs font-semibold mt-0.5 tabular-nums ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>
                {quote.change > 0 ? `+${quote.change}` : quote.change} (
                {quote.changePercent > 0 ? `+${quote.changePercent}` : quote.changePercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* 52-Week Range Bar */}
        <div className="mt-3 pt-2.5 border-t border-[#182032]">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
            <span>52W L: {formatIDR(quote.fiftyTwoWeekLow)}</span>
            <span className="text-slate-500">Rentang 52W: {pos52.toFixed(0)}%</span>
            <span>52W H: {formatIDR(quote.fiftyTwoWeekHigh)}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#161c2c] overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-300"
              style={{ width: `${pos52}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Key Technical Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        {/* Trend Box */}
        <div className="p-2.5 rounded-md bg-[#090c14] border border-[#192134]">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            <Activity className="w-3 h-3 text-sky-400" />
            <span>Tren</span>
          </div>
          <div className="text-xs font-semibold text-slate-100 flex items-center gap-1">
            {tech.trend === 'STRONG_UPTREND' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Strong Uptrend
              </span>
            )}
            {tech.trend === 'PULLBACK_UPTREND' && (
              <span className="text-cyan-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Pullback Buy
              </span>
            )}
            {tech.trend === 'CONSOLIDATION' && (
              <span className="text-amber-400">Sideways</span>
            )}
            {tech.trend === 'DOWNTREND' && (
              <span className="text-rose-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Downtrend
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            EMA20: {tech.ema20} | 50: {tech.ema50}
          </div>
        </div>

        {/* RSI & MFI */}
        <div className="p-2.5 rounded-md bg-[#090c14] border border-[#192134]">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            <Gauge className="w-3 h-3 text-purple-400" />
            <span>RSI & MFI</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold font-mono text-white tabular-nums">{tech.rsi14}</span>
            <span
              className={`text-[10px] font-semibold ${
                tech.rsiStatus === 'OVERSOLD'
                  ? 'text-emerald-400'
                  : tech.rsiStatus === 'OVERBOUGHT'
                  ? 'text-rose-400'
                  : tech.rsiStatus === 'HEALTHY_BULLISH'
                  ? 'text-sky-400'
                  : 'text-slate-400'
              }`}
            >
              {tech.rsiStatus === 'OVERSOLD' && 'Oversold'}
              {tech.rsiStatus === 'HEALTHY_BULLISH' && 'Bullish'}
              {tech.rsiStatus === 'OVERBOUGHT' && 'Overbought'}
              {tech.rsiStatus === 'NEUTRAL' && 'Neutral'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            MFI: <span className="text-slate-300 font-semibold">{tech.mfi14.value}</span>
          </div>
        </div>

        {/* Stochastic (14, 3, 3) */}
        <div className="p-2.5 rounded-md bg-[#090c14] border border-[#192134]">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Stochastic</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono text-xs">
            <span className="font-bold text-white tabular-nums">{tech.stochastic.k}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 tabular-nums">{tech.stochastic.d}</span>
            {tech.stochastic.crossStatus === 'BULLISH_CROSS' && (
              <span className="text-[9px] bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-1 rounded ml-auto">
                Cross
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            BW: <span className="text-slate-300">{tech.bollinger.bandwidth}%</span>
          </div>
        </div>

        {/* Volume & Surge */}
        <div className="p-2.5 rounded-md bg-[#090c14] border border-[#192134]">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Volume vs 20MA</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold font-mono text-white tabular-nums">
              {tech.volumeRatio20}x
            </span>
            {tech.volumeSurge && (
              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-950/60 text-amber-300 font-bold border border-amber-800">
                Surge
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
            Vol: {formatVolume(quote.volume)}
          </div>
        </div>
      </div>

      {/* Key Support & Resistance Levels Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2.5 pt-2.5 border-t border-[#182032] text-xs">
        <div className="flex items-center justify-between p-1.5 rounded bg-[#0b0e17] border border-[#171e30]">
          <span className="text-slate-400 text-[11px]">S1</span>
          <span className="font-mono font-semibold text-emerald-400 tabular-nums">{formatIDR(tech.support1)}</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded bg-[#0b0e17] border border-[#171e30]">
          <span className="text-slate-400 text-[11px]">S2</span>
          <span className="font-mono text-emerald-300/80 tabular-nums">{formatIDR(tech.support2)}</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded bg-[#0b0e17] border border-[#171e30]">
          <span className="text-slate-400 text-[11px]">R1</span>
          <span className="font-mono font-semibold text-rose-400 tabular-nums">{formatIDR(tech.resistance1)}</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded bg-[#0b0e17] border border-[#171e30]">
          <span className="text-slate-400 text-[11px]">R2</span>
          <span className="font-mono text-rose-300/80 tabular-nums">{formatIDR(tech.resistance2)}</span>
        </div>
      </div>
    </div>
  );
}
