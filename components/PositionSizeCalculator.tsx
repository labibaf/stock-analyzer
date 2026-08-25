'use client';

import React, { useState } from 'react';
import { formatIDR } from '@/lib/idx-rules';
import {
  Calculator,
  ShieldAlert,
  Wallet,
  Percent,
  SlidersHorizontal,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PositionSizeCalculatorProps {
  ticker: string;
  entryPrice: number;
  stopLoss: number;
  targetPrice1: number;
  targetPrice2: number;
}

export default function PositionSizeCalculator({
  ticker,
  entryPrice: initialEntryPrice,
  stopLoss: initialStopLoss,
  targetPrice1: initialTP1,
  targetPrice2: initialTP2,
}: PositionSizeCalculatorProps) {
  // State for calculation mode: 'RISK_BASED' (auto lot based on max loss %) vs 'LOT_BASED' (manual lots)
  const [calcMode, setCalcMode] = useState<'RISK_BASED' | 'LOT_BASED'>('RISK_BASED');

  // Portfolio capital & risk percentage
  const [portfolioCapital, setPortfolioCapital] = useState<number>(10_000_000); // Default Rp 10 Juta
  const [riskPercent, setRiskPercent] = useState<number>(2); // Default 2%
  const [manualLots, setManualLots] = useState<number>(10);

  // Editable prices (prefilled with swing trade plan)
  const [customEntry, setCustomEntry] = useState<number>(initialEntryPrice);
  const [customSL, setCustomSL] = useState<number>(initialStopLoss);
  const [customTP1, setCustomTP1] = useState<number>(initialTP1);
  const [customTP2, setCustomTP2] = useState<number>(initialTP2);
  const [showPriceSettings, setShowPriceSettings] = useState<boolean>(false);
  const [includeFee, setIncludeFee] = useState<boolean>(true); // Fee sekuritas: ~0.15% buy, 0.25% sell

  // Calculations
  const entry = Math.max(customEntry, 1);
  const sl = Math.min(customSL, entry - 1);
  const tp1 = Math.max(customTP1, entry + 1);
  const tp2 = Math.max(customTP2, tp1 + 1);

  const riskPerShare = Math.max(entry - sl, 1);
  const target1PerShare = Math.max(tp1 - entry, 1);
  const target2PerShare = Math.max(tp2 - entry, 1);

  const maxRiskRupiah = (portfolioCapital * riskPercent) / 100;

  // Compute calculated lots
  let activeLots = manualLots;
  if (calcMode === 'RISK_BASED') {
    const rawShares = Math.floor(maxRiskRupiah / riskPerShare);
    activeLots = Math.max(Math.floor(rawShares / 100), 1);
  }

  const totalShares = activeLots * 100;
  const grossCapitalRequired = totalShares * entry;

  // Broker fee estimates (IDX standard: Buy 0.15%, Sell 0.25%)
  const buyFee = includeFee ? grossCapitalRequired * 0.0015 : 0;
  const totalCapitalRequired = grossCapitalRequired + buyFee;
  const capitalAllocationPct = Number(
    ((totalCapitalRequired / (portfolioCapital || 1)) * 100).toFixed(1)
  );

  // Stop Loss calculations
  const grossLoss = totalShares * (entry - sl);
  const sellFeeSL = includeFee ? totalShares * sl * 0.0025 : 0;
  const netLossRupiah = grossLoss + buyFee + sellFeeSL;
  const netLossPercent = Number(((netLossRupiah / (portfolioCapital || 1)) * 100).toFixed(2));
  const priceLossPercent = Number((((entry - sl) / entry) * 100).toFixed(1));

  // TP1 calculations
  const grossProfitTP1 = totalShares * target1PerShare;
  const sellFeeTP1 = includeFee ? totalShares * tp1 * 0.0025 : 0;
  const netProfitTP1 = Math.max(grossProfitTP1 - buyFee - sellFeeTP1, 0);
  const priceProfitTP1Percent = Number((((tp1 - entry) / entry) * 100).toFixed(1));

  // TP2 calculations
  const grossProfitTP2 = totalShares * target2PerShare;
  const sellFeeTP2 = includeFee ? totalShares * tp2 * 0.0025 : 0;
  const netProfitTP2 = Math.max(grossProfitTP2 - buyFee - sellFeeTP2, 0);
  const priceProfitTP2Percent = Number((((tp2 - entry) / entry) * 100).toFixed(1));

  const rrRatio = netLossRupiah > 0 ? (netProfitTP1 / netLossRupiah).toFixed(1) : '2.0';

  const presetCapitals = [
    { label: '5 Jt', value: 5_000_000 },
    { label: '10 Jt', value: 10_000_000 },
    { label: '25 Jt', value: 25_000_000 },
    { label: '50 Jt', value: 50_000_000 },
    { label: '100 Jt', value: 100_000_000 },
  ];

  const handleResetPrices = () => {
    setCustomEntry(initialEntryPrice);
    setCustomSL(initialStopLoss);
    setCustomTP1(initialTP1);
    setCustomTP2(initialTP2);
  };

  const adjustLots = (delta: number) => {
    setCalcMode('LOT_BASED');
    setManualLots((prev) => Math.max(prev + delta, 1));
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-2xl transition-all">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 p-0.5 shadow-md shadow-sky-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Calculator className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Simulasi Eksekusi & Manajemen Lot ({ticker}.JK)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 font-semibold">
                1 Lot = 100 Lembar
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Position Sizing cerdas untuk melindungi modal & mengoptimalkan profit
            </p>
          </div>
        </div>

        {/* Tab Switcher: Risk-based vs Lot-based */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setCalcMode('RISK_BASED')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              calcMode === 'RISK_BASED'
                ? 'bg-sky-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Otomatis (Berdasarkan Risiko)</span>
          </button>
          <button
            onClick={() => {
              setCalcMode('LOT_BASED');
              setManualLots(activeLots);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              calcMode === 'LOT_BASED'
                ? 'bg-sky-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manual (Input Lot)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Section: Inputs & Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Portfolio Capital Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Modal Portofolio Trading
              </label>
              <span className="font-mono text-sm font-extrabold text-emerald-400">
                {formatIDR(portfolioCapital)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  value={portfolioCapital}
                  onChange={(e) => setPortfolioCapital(Math.max(Number(e.target.value) || 0, 0))}
                  step={1_000_000}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-white font-semibold outline-none transition-colors"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto mt-2.5 pt-2 border-t border-slate-900 no-scrollbar">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap mr-1">
                Preset:
              </span>
              {presetCapitals.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPortfolioCapital(p.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border whitespace-nowrap ${
                    portfolioCapital === p.value
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode-Specific Input: Risk Tolerance or Manual Lot Stepper */}
          {calcMode === 'RISK_BASED' ? (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-400" /> Toleransi Risiko Per Trade
                </label>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-xs text-slate-400">Max Loss:</span>
                  <span className="text-sm font-extrabold text-rose-400">
                    {formatIDR(maxRiskRupiah)} ({riskPercent}%)
                  </span>
                </div>
              </div>

              {/* Slider with preset buttons */}
              <div className="space-y-2 mt-1">
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setRiskPercent(1)}
                    className={`px-2 py-0.5 rounded border ${
                      riskPercent === 1
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    1% (Konservatif)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskPercent(2)}
                    className={`px-2 py-0.5 rounded border ${
                      riskPercent === 2
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    2% (Standar Ideal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskPercent(3)}
                    className={`px-2 py-0.5 rounded border ${
                      riskPercent === 3
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    3% (Moderat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskPercent(5)}
                    className={`px-2 py-0.5 rounded border ${
                      riskPercent === 5
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    5% (Agresif)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" /> Jumlah Lot yang Ingin Dibeli
                </span>
                <span className="font-mono text-sm font-bold text-sky-400">
                  {manualLots} Lot ({totalShares.toLocaleString('id-ID')} Lembar)
                </span>
              </label>

              {/* Stepper Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustLots(-10)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(-1)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  -1
                </button>
                <input
                  type="number"
                  min={1}
                  value={manualLots}
                  onChange={(e) => setManualLots(Math.max(Number(e.target.value) || 1, 1))}
                  className="flex-1 text-center bg-slate-900 border border-slate-700 rounded-xl py-2 font-mono text-base font-extrabold text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustLots(+1)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(+10)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(+50)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  +50
                </button>
              </div>
            </div>
          )}

          {/* Toggle for Customizing Entry / SL prices & Broker Fee */}
          <div className="flex items-center justify-between text-xs px-1">
            <button
              onClick={() => setShowPriceSettings(!showPriceSettings)}
              className="text-slate-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              <span>{showPriceSettings ? 'Sembunyikan' : 'Sesuaikan'} Harga Entry & Stop Loss</span>
              {showPriceSettings ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Broker Fee Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={includeFee}
                onChange={(e) => setIncludeFee(e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span>Hitung Fee Sekuritas (~0.15% / 0.25%)</span>
            </label>
          </div>

          {/* Collapsible Custom Price Inputs */}
          {showPriceSettings && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-semibold text-slate-300">Custom Harga Eksekusi:</span>
                <button
                  type="button"
                  onClick={handleResetPrices}
                  className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Reset ke Plan Awal
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Entry Price</label>
                  <input
                    type="number"
                    value={customEntry}
                    onChange={(e) => setCustomEntry(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 mb-1">Stop Loss (SL)</label>
                  <input
                    type="number"
                    value={customSL}
                    onChange={(e) => setCustomSL(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-2.5 py-1.5 font-mono text-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 mb-1">Target 1 (TP1)</label>
                  <input
                    type="number"
                    value={customTP1}
                    onChange={(e) => setCustomTP1(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-emerald-900/60 rounded-lg px-2.5 py-1.5 font-mono text-emerald-300"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 mb-1">Target 2 (TP2)</label>
                  <input
                    type="number"
                    value={customTP2}
                    onChange={(e) => setCustomTP2(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-emerald-900/60 rounded-lg px-2.5 py-1.5 font-mono text-emerald-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: The Execution Order Ticket Summary (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-950/90 to-slate-900 border border-sky-900/40 shadow-xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Ticket Header */}
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Order Execution Ticket
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                R:R Bersih <strong className="text-white">1:{rrRatio}</strong>
              </span>
            </div>

            {/* Hero Lot Number Display */}
            <div className="my-3 text-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Alokasi Pembelian Rekomendasi:</span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-0.5">
                {activeLots} <span className="text-lg font-bold text-sky-400">LOT</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                = {totalShares.toLocaleString('id-ID')} Lembar saham @ {formatIDR(entry)}
              </div>
            </div>

            {/* Financial Details Rows */}
            <div className="space-y-2 text-xs">
              {/* Modal Terpakai */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-400 font-medium">Total Dana Beli:</span>
                <span className="font-mono font-bold text-white">
                  {formatIDR(totalCapitalRequired)}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">({capitalAllocationPct}%)</span>
                </span>
              </div>

              {/* Skenario Cut Loss */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/30">
                <div>
                  <span className="text-rose-400 font-semibold block">Skenario Cut Loss (SL):</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Harga SL: {formatIDR(sl)} (-{priceLossPercent}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-rose-400 block">
                    -{formatIDR(netLossRupiah)}
                  </span>
                  <span className="text-[10px] text-rose-300/80 font-mono">
                    {netLossPercent}% portofolio
                  </span>
                </div>
              </div>

              {/* Skenario TP1 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                <div>
                  <span className="text-emerald-400 font-semibold block">Skenario Target 1 (TP1):</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Harga TP1: {formatIDR(tp1)} (+{priceProfitTP1Percent}%)
                  </span>
                </div>
                <span className="font-mono font-extrabold text-emerald-400">
                  +{formatIDR(netProfitTP1)}
                </span>
              </div>

              {/* Skenario TP2 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/10 border border-emerald-900/20">
                <div>
                  <span className="text-emerald-300 font-medium block">Skenario Target 2 (TP2):</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Harga TP2: {formatIDR(tp2)} (+{priceProfitTP2Percent}%)
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-300">
                  +{formatIDR(netProfitTP2)}
                </span>
              </div>
            </div>
          </div>

          {/* Sisa Cash Safety Note */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Sisa Cash Portofolio:</span>
            <span className="font-mono font-semibold text-slate-300">
              {formatIDR(Math.max(portfolioCapital - totalCapitalRequired, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
