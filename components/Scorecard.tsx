'use client';

import React from 'react';
import { StockQuote, TechnicalSummary } from '@/lib/types';
import { formatIDR, formatVolume } from '@/lib/idx-rules';
import {
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Activity,
  Gauge,
  Zap,
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

  // Calculate distance % from current price to support/resistance
  const getDistancePct = (level: number) => {
    const diff = ((level - quote.currentPrice) / quote.currentPrice) * 100;
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  };

  return (
    <div className="bg-[#0b0f19] border border-[#162035] rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full shadow-lg">
      {/* Top Section: Ticker Info & Big Price Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
                {quote.ticker}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#131b2e] text-sky-400 font-mono font-semibold border border-[#1f2d4d]">
                IDX / BEI
              </span>
              {tech.consensus && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                    tech.consensus.overallRating.includes('BUY')
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : tech.consensus.overallRating.includes('SELL')
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-amber-950/60 border-amber-800 text-amber-300'
                  }`}
                  title={`${tech.consensus.totalBuy} Buy, ${tech.consensus.totalNeutral} Neutral, ${tech.consensus.totalSell} Sell`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>
                    {tech.consensus.overallRating.replace('_', ' ')} ({tech.consensus.totalBuy}B / {tech.consensus.totalSell}S)
                  </span>
                </span>
              )}
              {tech.detectedPattern && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 ${
                    tech.detectedPattern.type === 'BULLISH'
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                      : tech.detectedPattern.type === 'BEARISH'
                      ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                      : 'bg-[#131b2e] border-[#1f2d4d] text-slate-300'
                  }`}
                  title={tech.detectedPattern.description}
                >
                  <span>🕯️</span>
                  <span>{tech.detectedPattern.name}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-medium">{quote.name}</p>
          </div>

          {/* Current Price & Day Change */}
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white tabular-nums">
              {formatIDR(quote.currentPrice)}
            </div>
            <div
              className={`flex items-center justify-end gap-1 text-xs sm:text-sm font-bold mt-0.5 tabular-nums ${
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

        {/* 52-Week Range Bar (Figma styled gradient bar) */}
        <div className="mt-3.5 pt-3 border-t border-[#141d30]">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span>52W L: <strong className="text-slate-200">{formatIDR(quote.fiftyTwoWeekLow)}</strong></span>
            <span className="text-slate-500 font-medium">Rentang 52W: {pos52.toFixed(0)}%</span>
            <span>52W H: <strong className="text-slate-200">{formatIDR(quote.fiftyTwoWeekHigh)}</strong></span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#121929] overflow-hidden relative border border-[#1a253d]">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${pos52}%` }}
            />
          </div>
        </div>
      </div>

      {/* Technical Matrix Table Rows (Figma layout) */}
      <div className="mt-3.5 space-y-1.5 text-xs">
        {/* Row 1: Trend Structure */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#070a12] border border-[#131b2e]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium">Struktur Tren:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-300 text-[11px]">
              EMA {tech.ema20} / {tech.ema50}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                tech.trend === 'STRONG_UPTREND'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : tech.trend === 'PULLBACK_UPTREND'
                  ? 'bg-cyan-950/60 border-cyan-800 text-cyan-400'
                  : tech.trend === 'CONSOLIDATION'
                  ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                  : 'bg-rose-950/60 border-rose-800 text-rose-400'
              }`}
            >
              {tech.trend === 'STRONG_UPTREND' && 'Strong Uptrend'}
              {tech.trend === 'PULLBACK_UPTREND' && 'Pullback Buy'}
              {tech.trend === 'CONSOLIDATION' && 'Sideways'}
              {tech.trend === 'DOWNTREND' && 'Downtrend'}
            </span>
          </div>
        </div>

        {/* Row 2: RSI 14 & MFI */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#070a12] border border-[#131b2e]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium">RSI (14) & Flow:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-200 font-bold tabular-nums">
              RSI {tech.rsi14} | MFI {tech.mfi14.value}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                tech.rsiStatus === 'OVERSOLD'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : tech.rsiStatus === 'HEALTHY_BULLISH'
                  ? 'bg-sky-950/60 border-sky-800 text-sky-400'
                  : tech.rsiStatus === 'OVERBOUGHT'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                  : 'bg-[#131b2e] border-[#1f2d4d] text-slate-300'
              }`}
            >
              {tech.rsiStatus === 'OVERSOLD' && 'Oversold (<32)'}
              {tech.rsiStatus === 'HEALTHY_BULLISH' && 'Bullish (42-60)'}
              {tech.rsiStatus === 'OVERBOUGHT' && 'Overbought (>70)'}
              {tech.rsiStatus === 'NEUTRAL' && 'Neutral'}
            </span>
          </div>
        </div>

        {/* Row 3: Stochastic (14,3,3) & Bandwidth */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#070a12] border border-[#131b2e]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Stochastic (14,3,3):</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-200 font-semibold text-[11px] tabular-nums">
              %K {tech.stochastic.k} / %D {tech.stochastic.d}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                tech.stochastic.crossStatus === 'BULLISH_CROSS'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : tech.stochastic.status === 'OVERSOLD'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : tech.stochastic.status === 'OVERBOUGHT'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                  : 'bg-[#131b2e] border-[#1f2d4d] text-slate-300'
              }`}
            >
              {tech.stochastic.crossStatus === 'BULLISH_CROSS'
                ? 'Bullish Cross'
                : tech.stochastic.status}
            </span>
          </div>
        </div>

        {/* Row 4: Volume & Volatilitas (ATR) */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#070a12] border border-[#131b2e]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Volume vs 20MA:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-200 font-bold tabular-nums">
              {tech.volumeRatio20}x ({formatVolume(quote.volume)})
            </span>
            {tech.bollinger.isSqueeze ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 border border-amber-800 text-amber-300 flex items-center gap-1">
                🔥 BB Squeeze
              </span>
            ) : tech.volumeSurge ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 border border-amber-800 text-amber-300">
                Surge Spike
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#131b2e] border border-[#1f2d4d] text-slate-400">
                Normal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Support & Resistance Price Level Table (Figma 4-row List) */}
      <div className="mt-3.5 pt-3 border-t border-[#141d30]">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-sky-400" /> Level Kunci Support & Resistance
          </span>
          <span className="font-mono text-slate-500">Jarak dari harga</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Support 1 */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-300 font-medium text-[11px]">Support 1 (S1)</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-bold text-emerald-400 block tabular-nums">{formatIDR(tech.support1)}</span>
              <span className="text-[10px] text-emerald-500/80">{getDistancePct(tech.support1)}</span>
            </div>
          </div>

          {/* Resistance 1 */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-300 font-medium text-[11px]">Resistance 1 (R1)</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-bold text-rose-400 block tabular-nums">{formatIDR(tech.resistance1)}</span>
              <span className="text-[10px] text-rose-500/80">{getDistancePct(tech.resistance1)}</span>
            </div>
          </div>

          {/* Support 2 */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/10 border border-emerald-900/20">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span className="text-slate-400 text-[11px]">Support 2 (S2)</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-semibold text-emerald-400/90 block tabular-nums">{formatIDR(tech.support2)}</span>
              <span className="text-[10px] text-emerald-500/70">{getDistancePct(tech.support2)}</span>
            </div>
          </div>

          {/* Resistance 2 */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/10 border border-rose-900/20">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              <span className="text-slate-400 text-[11px]">Resistance 2 (R2)</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-semibold text-rose-400/90 block tabular-nums">{formatIDR(tech.resistance2)}</span>
              <span className="text-[10px] text-rose-500/70">{getDistancePct(tech.resistance2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
