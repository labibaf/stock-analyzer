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
    <div className="bg-[#0e121d] border border-[#1c2438] rounded-lg p-4">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#182032]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#161c2c] border border-[#232d46] flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">
                Simulasi Eksekusi & Manajemen Lot ({ticker}.JK)
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161c2c] text-slate-400 border border-[#232d46]">
                1 Lot = 100 Lembar
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Position Sizing berbasis toleransi Stop Loss</p>
          </div>
        </div>

        {/* Tab Switcher: Risk-based vs Lot-based */}
        <div className="flex items-center bg-[#090c14] p-0.5 rounded-md border border-[#192134] text-xs self-start sm:self-auto">
          <button
            onClick={() => setCalcMode('RISK_BASED')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              calcMode === 'RISK_BASED'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Otomatis (Berdasar Risiko)</span>
          </button>
          <button
            onClick={() => {
              setCalcMode('LOT_BASED');
              setManualLots(activeLots);
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              calcMode === 'LOT_BASED'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Manual (Input Lot)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">
        {/* Left Section: Inputs & Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Portfolio Capital Card */}
          <div className="p-3 rounded-md bg-[#090c14] border border-[#192134]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Modal Portofolio Trading
              </label>
              <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                {formatIDR(portfolioCapital)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  value={portfolioCapital}
                  onChange={(e) => setPortfolioCapital(Math.max(Number(e.target.value) || 0, 0))}
                  step={1_000_000}
                  className="w-full bg-[#101420] border border-[#1e273d] focus:border-sky-500 rounded pl-8 pr-2.5 py-1.5 text-xs font-mono text-white outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto mt-2 pt-1.5 border-t border-[#131826] no-scrollbar">
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap mr-1">
                Preset:
              </span>
              {presetCapitals.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPortfolioCapital(p.value)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border whitespace-nowrap ${
                    portfolioCapital === p.value
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-semibold'
                      : 'bg-[#101420] hover:bg-[#151b2c] border-[#1a2236] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode-Specific Input: Risk Tolerance or Manual Lot Stepper */}
          {calcMode === 'RISK_BASED' ? (
            <div className="p-3 rounded-md bg-[#090c14] border border-[#192134]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-400" /> Toleransi Risiko Per Trade
                </label>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-slate-400 text-[11px]">Max Loss:</span>
                  <span className="font-bold text-rose-400 tabular-nums">
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
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-[#161c2c] rounded"
                />
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setRiskPercent(1)}
                    className={`px-1.5 py-0.5 rounded border ${
                      riskPercent === 1
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 font-semibold'
                        : 'bg-[#101420] border-[#1a2236] text-slate-400'
                    }`}
                  >
                    1% Konservatif
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskPercent(2)}
                    className={`px-1.5 py-0.5 rounded border ${
                      riskPercent === 2
                        ? 'bg-sky-950/60 border-sky-800 text-sky-300 font-semibold'
                        : 'bg-[#101420] border-[#1a2236] text-slate-400'
                    }`}
                  >
                    2% Standar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskPercent(3)}
                    className={`px-1.5 py-0.5 rounded border ${
                      riskPercent === 3
                        ? 'bg-amber-950/60 border-amber-800 text-amber-300 font-semibold'
                        : 'bg-[#101420] border-[#1a2236] text-slate-400'
                    }`}
                  >
                    3% Moderat
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskPercent(5)}
                    className={`px-1.5 py-0.5 rounded border ${
                      riskPercent === 5
                        ? 'bg-rose-950/60 border-rose-800 text-rose-300 font-semibold'
                        : 'bg-[#101420] border-[#1a2236] text-slate-400'
                    }`}
                  >
                    5% Agresif
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-md bg-[#090c14] border border-[#192134]">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" /> Jumlah Lot yang Ingin Dibeli
                </span>
                <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">
                  {manualLots} Lot ({totalShares.toLocaleString('id-ID')} Lembar)
                </span>
              </label>

              {/* Stepper Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustLots(-10)}
                  className="px-2.5 py-1 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded text-xs font-mono font-semibold"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(-1)}
                  className="px-2.5 py-1 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded text-xs font-mono font-semibold"
                >
                  -1
                </button>
                <input
                  type="number"
                  min={1}
                  value={manualLots}
                  onChange={(e) => setManualLots(Math.max(Number(e.target.value) || 1, 1))}
                  className="flex-1 text-center bg-[#101420] border border-[#1e273d] rounded py-1 font-mono text-sm font-bold text-white outline-none tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => adjustLots(+1)}
                  className="px-2.5 py-1 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded text-xs font-mono font-semibold"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(+10)}
                  className="px-2.5 py-1 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded text-xs font-mono font-semibold"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(+50)}
                  className="px-2.5 py-1 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded text-xs font-mono font-semibold"
                >
                  +50
                </button>
              </div>
            </div>
          )}

          {/* Toggle for Customizing Entry / SL prices & Broker Fee */}
          <div className="flex items-center justify-between text-xs px-0.5">
            <button
              onClick={() => setShowPriceSettings(!showPriceSettings)}
              className="text-slate-400 hover:text-sky-300 flex items-center gap-1 transition-colors text-[11px]"
            >
              <SlidersHorizontal className="w-3 h-3 text-sky-400" />
              <span>{showPriceSettings ? 'Sembunyikan' : 'Kustomisasi'} Entry & SL</span>
              {showPriceSettings ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {/* Broker Fee Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 text-[11px]">
              <input
                type="checkbox"
                checked={includeFee}
                onChange={(e) => setIncludeFee(e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span>Fee Sekuritas (~0.15% / 0.25%)</span>
            </label>
          </div>

          {/* Collapsible Custom Price Inputs */}
          {showPriceSettings && (
            <div className="p-3 rounded-md bg-[#090c14] border border-[#192134] space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#151b2a] text-[11px]">
                <span className="font-semibold text-slate-300">Custom Harga:</span>
                <button
                  type="button"
                  onClick={handleResetPrices}
                  className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[10px]"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-0.5">Entry Price</label>
                  <input
                    type="number"
                    value={customEntry}
                    onChange={(e) => setCustomEntry(Number(e.target.value) || 0)}
                    className="w-full bg-[#101420] border border-[#1e273d] rounded px-2 py-1 font-mono text-white text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 text-[10px] mb-0.5">Stop Loss (SL)</label>
                  <input
                    type="number"
                    value={customSL}
                    onChange={(e) => setCustomSL(Number(e.target.value) || 0)}
                    className="w-full bg-[#101420] border border-rose-900/60 rounded px-2 py-1 font-mono text-rose-300 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5">Target 1 (TP1)</label>
                  <input
                    type="number"
                    value={customTP1}
                    onChange={(e) => setCustomTP1(Number(e.target.value) || 0)}
                    className="w-full bg-[#101420] border border-emerald-900/60 rounded px-2 py-1 font-mono text-emerald-300 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[10px] mb-0.5">Target 2 (TP2)</label>
                  <input
                    type="number"
                    value={customTP2}
                    onChange={(e) => setCustomTP2(Number(e.target.value) || 0)}
                    className="w-full bg-[#101420] border border-emerald-900/60 rounded px-2 py-1 font-mono text-emerald-300 text-xs tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: The Execution Order Ticket Summary (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-3.5 rounded-md bg-[#090c14] border border-[#1e283e]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#161c2c]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Order Ticket
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                R:R Bersih <strong className="text-white">1:{rrRatio}</strong>
              </span>
            </div>

            {/* Hero Lot Number Display */}
            <div className="my-2.5 text-center p-2.5 rounded bg-[#101420] border border-[#1a2236]">
              <span className="text-[11px] text-slate-400 block">Rekomendasi Pembelian:</span>
              <div className="text-2xl font-bold font-mono tracking-tight text-white mt-0.5 tabular-nums">
                {activeLots} <span className="text-sm font-semibold text-sky-400">LOT</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                = {totalShares.toLocaleString('id-ID')} Lembar @ {formatIDR(entry)}
              </div>
            </div>

            {/* Financial Details Rows */}
            <div className="space-y-1.5 text-xs">
              {/* Modal Terpakai */}
              <div className="flex items-center justify-between p-1.5 rounded bg-[#101420] border border-[#171e30]">
                <span className="text-slate-400 text-[11px]">Total Modal:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {formatIDR(totalCapitalRequired)}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">({capitalAllocationPct}%)</span>
                </span>
              </div>

              {/* Skenario Cut Loss */}
              <div className="flex items-center justify-between p-1.5 rounded bg-rose-950/20 border border-rose-900/30">
                <div>
                  <span className="text-rose-400 font-medium text-[11px] block">Cut Loss (SL):</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatIDR(sl)} (-{priceLossPercent}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-rose-400 block tabular-nums">
                    -{formatIDR(netLossRupiah)}
                  </span>
                  <span className="text-[10px] text-rose-300/70 font-mono">
                    {netLossPercent}% portofolio
                  </span>
                </div>
              </div>

              {/* Skenario TP1 */}
              <div className="flex items-center justify-between p-1.5 rounded bg-emerald-950/20 border border-emerald-900/30">
                <div>
                  <span className="text-emerald-400 font-medium text-[11px] block">Target 1 (TP1):</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatIDR(tp1)} (+{priceProfitTP1Percent}%)
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  +{formatIDR(netProfitTP1)}
                </span>
              </div>

              {/* Skenario TP2 */}
              <div className="flex items-center justify-between p-1.5 rounded bg-emerald-950/10 border border-emerald-900/20">
                <div>
                  <span className="text-emerald-300 text-[11px] block">Target 2 (TP2):</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatIDR(tp2)} (+{priceProfitTP2Percent}%)
                  </span>
                </div>
                <span className="font-mono text-emerald-300 font-semibold tabular-nums">
                  +{formatIDR(netProfitTP2)}
                </span>
              </div>
            </div>
          </div>

          {/* Sisa Cash Safety Note */}
          <div className="mt-2.5 pt-2 border-t border-[#161c2c] flex items-center justify-between text-[11px] text-slate-500">
            <span>Sisa Cash:</span>
            <span className="font-mono font-medium text-slate-300 tabular-nums">
              {formatIDR(Math.max(portfolioCapital - totalCapitalRequired, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
