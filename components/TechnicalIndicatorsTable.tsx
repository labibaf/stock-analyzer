'use client';

import React, { useState } from 'react';
import { TechnicalSummary, SignalVerdict } from '@/lib/types';
import { formatIDR } from '@/lib/idx-rules';
import {
  Activity,
  Sliders,
  BarChart2,
  Flame,
  Shield,
  CheckCircle2,
  MinusCircle,
  XCircle,
  TrendingUp,
  Layers,
} from 'lucide-react';

interface TechnicalIndicatorsTableProps {
  tech: TechnicalSummary;
}

export default function TechnicalIndicatorsTable({ tech }: TechnicalIndicatorsTableProps) {
  const [activeTab, setActiveTab] = useState<'SIGNALS' | 'RAW'>('SIGNALS');
  const consensus = tech.consensus;

  const getVerdictBadge = (rating: string) => {
    switch (rating) {
      case 'STRONG_BUY':
        return {
          label: 'STRONG BUY',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60',
          indicatorBg: 'bg-emerald-500',
        };
      case 'BUY':
        return {
          label: 'BUY',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
          indicatorBg: 'bg-emerald-400',
        };
      case 'STRONG_SELL':
        return {
          label: 'STRONG SELL',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/60',
          indicatorBg: 'bg-rose-500',
        };
      case 'SELL':
        return {
          label: 'SELL',
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
          indicatorBg: 'bg-rose-400',
        };
      case 'NEUTRAL':
      default:
        return {
          label: 'NEUTRAL',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          indicatorBg: 'bg-amber-400',
        };
    }
  };

  const getSignalPill = (signal: SignalVerdict) => {
    switch (signal) {
      case 'BUY':
        return {
          label: 'BUY',
          className: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80',
          icon: CheckCircle2,
        };
      case 'SELL':
        return {
          label: 'SELL',
          className: 'bg-rose-950/80 text-rose-300 border-rose-700/80',
          icon: XCircle,
        };
      case 'NEUTRAL':
      default:
        return {
          label: 'NEUTRAL',
          className: 'bg-slate-800/80 text-slate-300 border-slate-700',
          icon: MinusCircle,
        };
    }
  };

  const verdict = getVerdictBadge(consensus.overallRating);

  // Percentages for the consensus meter bar
  const total = consensus.totalIndicators || 11;
  const buyPct = Math.round((consensus.totalBuy / total) * 100);
  const neutralPct = Math.round((consensus.totalNeutral / total) * 100);
  const sellPct = Math.round((consensus.totalSell / total) * 100);

  return (
    <div className="bg-[#0b0f19] border border-[#162035] rounded-xl p-4 sm:p-5 shadow-lg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#141d30]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#131b2e] border border-[#1f2d4d] flex items-center justify-center">
            <Sliders className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Konsensus Sinyal Indikator Teknikal
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b2e] text-sky-300 border border-[#1f2d4d] font-semibold">
                11 Indikator Dihitung
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Agregasi sinyal objektif dari Moving Averages, Oscillators, & Volatilitas
            </p>
          </div>
        </div>

        {/* Tab Switcher: Signals List vs Raw Indicators */}
        <div className="flex items-center bg-[#070a12] p-1 rounded-lg border border-[#131b2e] text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('SIGNALS')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'SIGNALS'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Sinyal Buy / Sell ({consensus.totalBuy}B - {consensus.totalNeutral}N - {consensus.totalSell}S)
            </span>
            <span className="sm:hidden">
              Sinyal ({consensus.totalBuy}B/{consensus.totalSell}S)
            </span>
          </button>
          <button
            onClick={() => setActiveTab('RAW')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'RAW'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Data Mentah</span>
          </button>
        </div>
      </div>

      {/* Hero Consensus Meter Banner (TradingView Style) */}
      <div className="my-3.5 p-3.5 rounded-lg bg-[#070a12] border border-[#131b2e] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Overall Verdict Badge */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Rating Konsensus Keseluruhan:</span>
            <div
              className={`px-3 py-1 rounded-lg border text-xs font-black tracking-wider flex items-center gap-1.5 ${verdict.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${verdict.indicatorBg}`} />
              <span>{verdict.label}</span>
            </div>
          </div>

          {/* Right: Buy, Neutral, Sell Counter Badges */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{consensus.totalBuy} BUY</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 font-bold flex items-center gap-1">
              <MinusCircle className="w-3 h-3 text-slate-400" />
              <span>{consensus.totalNeutral} NEUTRAL</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-700/60 text-rose-300 font-bold flex items-center gap-1">
              <XCircle className="w-3 h-3 text-rose-400" />
              <span>{consensus.totalSell} SELL</span>
            </span>
          </div>
        </div>

        {/* Segmented Proportional Meter Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-[#111624] rounded-full overflow-hidden flex border border-[#1a2338]">
            {consensus.totalBuy > 0 && (
              <div
                style={{ width: `${buyPct}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Buy: ${consensus.totalBuy} (${buyPct}%)`}
              />
            )}
            {consensus.totalNeutral > 0 && (
              <div
                style={{ width: `${neutralPct}%` }}
                className="bg-slate-500 h-full transition-all duration-500"
                title={`Neutral: ${consensus.totalNeutral} (${neutralPct}%)`}
              />
            )}
            {consensus.totalSell > 0 && (
              <div
                style={{ width: `${sellPct}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Sell: ${consensus.totalSell} (${sellPct}%)`}
              />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span className="text-emerald-400 font-semibold">{buyPct}% Bullish Signal</span>
            <span className="text-slate-400">{neutralPct}% Netral</span>
            <span className="text-rose-400 font-semibold">{sellPct}% Bearish Signal</span>
          </div>
        </div>

        {/* Group Breakdown: Moving Averages vs Oscillators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#121828] text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[#0b0f19] border border-[#151c2e]">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Activity className="w-3 h-3 text-amber-400" /> Tren Moving Averages:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-emerald-400 font-bold">{consensus.maRating.buy}B</span>
              <span className="text-slate-400">/ {consensus.maRating.neutral}N /</span>
              <span className="text-rose-400 font-bold">{consensus.maRating.sell}S</span>
              <span className="text-slate-200 font-semibold ml-1">({consensus.maRating.verdict})</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#0b0f19] border border-[#151c2e]">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <BarChart2 className="w-3 h-3 text-purple-400" /> Momentum & Oscillators:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-emerald-400 font-bold">{consensus.oscillatorRating.buy}B</span>
              <span className="text-slate-400">/ {consensus.oscillatorRating.neutral}N /</span>
              <span className="text-rose-400 font-bold">{consensus.oscillatorRating.sell}S</span>
              <span className="text-slate-200 font-semibold ml-1">({consensus.oscillatorRating.verdict})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 1: Detailed Signals Breakdown Table */}
      {activeTab === 'SIGNALS' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {consensus.signals.map((item, idx) => {
            const pill = getSignalPill(item.signal);
            const PillIcon = pill.icon;

            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#070a12] border border-[#131b2e] flex items-center justify-between gap-2 hover:border-[#1e2942] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">({item.value})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                    {item.reason}
                  </span>
                </div>

                <div
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 ${pill.className}`}
                >
                  <PillIcon className="w-2.5 h-2.5" />
                  <span>{pill.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tab 2: Raw Indicator Multi-column Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 text-xs">
          {/* Moving Averages */}
          <div className="p-3 rounded-lg bg-[#070a12] border border-[#131b2e] space-y-1.5">
            <span className="font-semibold text-slate-300 block border-b border-[#141d30] pb-1 text-[11px] flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400" /> Moving Averages
            </span>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">EMA 20:</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums">{formatIDR(tech.ema20)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">EMA 50:</span>
              <span className="font-mono font-bold text-cyan-400 tabular-nums">{formatIDR(tech.ema50)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">EMA 200:</span>
              <span className="font-mono font-bold text-purple-400 tabular-nums">{formatIDR(tech.ema200)}</span>
            </div>
          </div>

          {/* Momentum: RSI, Stochastic, MACD */}
          <div className="p-3 rounded-lg bg-[#070a12] border border-[#131b2e] space-y-1.5">
            <span className="font-semibold text-slate-300 block border-b border-[#141d30] pb-1 text-[11px] flex items-center gap-1">
              <BarChart2 className="w-3 h-3 text-purple-400" /> Momentum & Oscillators
            </span>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">RSI (14):</span>
              <span className="font-mono font-bold text-slate-100 tabular-nums">{tech.rsi14}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Stochastic:</span>
              <span className="font-mono text-cyan-400 tabular-nums font-bold">
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
          <div className="p-3 rounded-lg bg-[#070a12] border border-[#131b2e] space-y-1.5">
            <span className="font-semibold text-slate-300 block border-b border-[#141d30] pb-1 text-[11px] flex items-center gap-1">
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
              <span className="font-mono font-bold text-amber-400 tabular-nums">
                {tech.bollinger.bandwidth}% {tech.bollinger.isSqueeze ? '(Squeeze)' : ''}
              </span>
            </div>
          </div>

          {/* Liquidity & Money Flow */}
          <div className="p-3 rounded-lg bg-[#070a12] border border-[#131b2e] space-y-1.5">
            <span className="font-semibold text-slate-300 block border-b border-[#141d30] pb-1 text-[11px] flex items-center gap-1">
              <Flame className="w-3 h-3 text-sky-400" /> Likuiditas & Aliran Dana
            </span>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">MFI (14):</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">{tech.mfi14.value}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Vol / 20MA:</span>
              <span
                className={`font-mono font-bold tabular-nums ${
                  tech.volumeSurge ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {tech.volumeRatio20}x {tech.volumeSurge ? '🔥' : ''}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Candle Pattern:</span>
              <span className="font-mono text-slate-300 truncate text-[10px]">
                {tech.detectedPattern ? tech.detectedPattern.name : 'Normal'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
