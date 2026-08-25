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
  Target,
  AlertTriangle,
  Info,
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

  // Validated Price Points
  const entry = Math.max(customEntry, 1);
  const sl = Math.min(customSL, entry - 1);
  const tp1 = Math.max(customTP1, entry + 1);
  const tp2 = Math.max(customTP2, tp1 + 1);

  const riskPerShare = Math.max(entry - sl, 1);
  const target1PerShare = Math.max(tp1 - entry, 1);
  const target2PerShare = Math.max(tp2 - entry, 1);

  // Cost per 1 lot (100 shares) including buy fee
  const costPerLotGross = entry * 100;
  const costPerLot = costPerLotGross * (includeFee ? 1.0015 : 1);

  // Maximum purchasing power based on 100% available cash
  const maxCashLots = portfolioCapital > 0 ? Math.floor(portfolioCapital / costPerLot) : 0;

  // Maximum allowed risk in Rupiah
  const maxRiskRupiah = (portfolioCapital * riskPercent) / 100;

  // Compute calculated lots
  let activeLots = manualLots;
  let isCashConstrained = false;

  if (calcMode === 'RISK_BASED') {
    const rawSharesByRisk = Math.floor(maxRiskRupiah / riskPerShare);
    const lotsByRisk = Math.floor(rawSharesByRisk / 100);

    if (maxCashLots === 0) {
      // Capital is smaller than 1 lot
      activeLots = 0;
    } else if (lotsByRisk > maxCashLots) {
      // Risk tolerance would allow more shares, but cash capital limits it to maxCashLots (NEVER > 100% Cash!)
      activeLots = maxCashLots;
      isCashConstrained = true;
    } else {
      activeLots = Math.max(lotsByRisk, 1);
    }
  }

  const totalShares = activeLots * 100;
  const grossCapitalRequired = totalShares * entry;

  // Broker fee estimates (IDX standard: Buy 0.15%, Sell 0.25%)
  const buyFee = includeFee ? grossCapitalRequired * 0.0015 : 0;
  const totalCapitalRequired = grossCapitalRequired + buyFee;
  const capitalAllocationPct = Number(
    ((totalCapitalRequired / (portfolioCapital || 1)) * 100).toFixed(1)
  );

  const isOverBudget = totalCapitalRequired > portfolioCapital;

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
    <div className="bg-[#0b0f19] border border-[#162035] rounded-xl p-4 sm:p-5 shadow-lg">
      {/* Header & Mode Switcher (Figma styled) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#141d30]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#131b2e] border border-[#1f2d4d] flex items-center justify-center">
            <Calculator className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Simulasi Buy & Manajemen Lot ({ticker}.JK)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b2e] text-sky-300 border border-[#1f2d4d] font-semibold">
                1 Lot = 100 Lembar
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Position Sizing presisi terkontrol batas maksimal modal tunai</p>
          </div>
        </div>

        {/* Tab Switcher: Risk-based vs Lot-based */}
        <div className="flex items-center bg-[#070a12] p-1 rounded-lg border border-[#131b2e] text-xs self-start sm:self-auto">
          <button
            onClick={() => setCalcMode('RISK_BASED')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              calcMode === 'RISK_BASED'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Otomatis (Berdasar Risiko)</span>
          </button>
          <button
            onClick={() => {
              setCalcMode('LOT_BASED');
              setManualLots(Math.max(activeLots, 1));
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              calcMode === 'LOT_BASED'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manual (Input Lot)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3.5">
        {/* Left Section: Inputs & Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Portfolio Capital Card */}
          <div className="p-3.5 rounded-lg bg-[#070a12] border border-[#131b2e]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Modal Portofolio Trading
              </label>
              <div className="text-right">
                <span className="font-mono text-sm font-black text-emerald-400 tabular-nums">
                  {formatIDR(portfolioCapital)}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Maks Beli: <strong>{maxCashLots} Lot</strong> cash
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  value={portfolioCapital || ''}
                  onChange={(e) => setPortfolioCapital(Math.max(Number(e.target.value) || 0, 0))}
                  placeholder="Masukkan total modal (contoh: 10000000)"
                  className="w-full bg-[#101420] border border-[#1e273d] focus:border-sky-500 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white font-bold outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto mt-2.5 pt-2 border-t border-[#121828] no-scrollbar">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap mr-1">
                Preset Modal:
              </span>
              {presetCapitals.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPortfolioCapital(p.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border whitespace-nowrap ${
                    portfolioCapital === p.value
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
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
            <div className="p-3.5 rounded-lg bg-[#070a12] border border-[#131b2e]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-400" /> Toleransi Risiko Per Trade (0.1% - 20%)
                </label>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-slate-400 text-[11px]">Max Cut Loss:</span>
                  <span className="font-bold text-rose-400 tabular-nums">
                    {formatIDR(maxRiskRupiah)} ({riskPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Smooth Slider (0.1% - 20%, step 0.1%) */}
              <div className="space-y-2 mt-1">
                <input
                  type="range"
                  min={0.1}
                  max={20}
                  step={0.1}
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-2 bg-[#121929] rounded-lg transition-all"
                />

                {/* Preset Risk Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-mono pt-1">
                  <span className="text-[10px] text-slate-500 font-sans font-medium mr-0.5">Preset:</span>
                  {[1, 2, 3, 5, 10, 15, 20].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskPercent(r)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors border whitespace-nowrap ${
                        riskPercent === r
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                          : 'bg-[#101420] hover:bg-[#151b2c] border-[#1a2236] text-slate-400'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              {isCashConstrained && (
                <div className="mt-2.5 p-2 rounded bg-sky-950/30 border border-sky-900/50 flex items-start gap-1.5 text-[11px] text-sky-300">
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    Alokasi dibatasi maksimal <strong>{maxCashLots} Lot (100% Modal Cash)</strong> agar tidak melebihi total modal portofoliomu.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-[#070a12] border border-[#131b2e]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" /> Jumlah Lot yang Ingin Dibeli
                </label>
                <span className="font-mono text-xs font-bold text-sky-400 tabular-nums">
                  {manualLots} Lot ({totalShares.toLocaleString('id-ID')} Lembar)
                </span>
              </div>

              {/* Stepper Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustLots(-50)}
                  className="px-2.5 py-1.5 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded-md text-xs font-mono font-bold"
                >
                  -50
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(-10)}
                  className="px-2.5 py-1.5 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded-md text-xs font-mono font-bold"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(-1)}
                  className="px-2.5 py-1.5 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded-md text-xs font-mono font-bold"
                >
                  -1
                </button>
                <input
                  type="number"
                  min={1}
                  value={manualLots}
                  onChange={(e) => setManualLots(Math.max(Number(e.target.value) || 1, 1))}
                  className="flex-1 text-center bg-[#101420] border border-[#1e273d] rounded-md py-1.5 font-mono text-base font-black text-white outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => adjustLots(+1)}
                  className="px-2.5 py-1.5 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded-md text-xs font-mono font-bold"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(+10)}
                  className="px-2.5 py-1.5 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded-md text-xs font-mono font-bold"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => adjustLots(+50)}
                  className="px-2.5 py-1.5 bg-[#101420] hover:bg-[#151b2c] border border-[#1e273d] text-slate-300 rounded-md text-xs font-mono font-bold"
                >
                  +50
                </button>
              </div>

              {isOverBudget && (
                <div className="mt-2.5 p-2 rounded bg-rose-950/40 border border-rose-900/60 flex items-center gap-1.5 text-[11px] text-rose-300 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    ⚠️ Alokasi {manualLots} Lot butuh dana {formatIDR(totalCapitalRequired)} ({capitalAllocationPct}% dari modal portofoliomu).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Toggle for Customizing Entry / SL prices & Broker Fee */}
          <div className="flex items-center justify-between text-xs px-1">
            <button
              onClick={() => setShowPriceSettings(!showPriceSettings)}
              className="text-slate-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors font-medium text-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              <span>{showPriceSettings ? 'Sembunyikan' : 'Kustomisasi'} Entry & Stop Loss</span>
              {showPriceSettings ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Broker Fee Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 text-xs">
              <input
                type="checkbox"
                checked={includeFee}
                onChange={(e) => setIncludeFee(e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span>Hitung Fee Broker (~0.15% / 0.25%)</span>
            </label>
          </div>

          {/* Collapsible Custom Price Inputs */}
          {showPriceSettings && (
            <div className="p-3.5 rounded-lg bg-[#070a12] border border-[#131b2e] space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#141d30] text-xs">
                <span className="font-semibold text-slate-300">Custom Level Harga Eksekusi:</span>
                <button
                  type="button"
                  onClick={handleResetPrices}
                  className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-xs"
                >
                  <RotateCcw className="w-3 h-3" /> Reset ke Plan Awal
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Entry Price</label>
                  <input
                    type="number"
                    value={customEntry}
                    onChange={(e) => setCustomEntry(Number(e.target.value) || 0)}
                    className="w-full bg-[#101420] border border-[#1e273d] rounded-md px-2.5 py-1.5 font-mono text-white text-xs tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 text-[11px] mb-1">Stop Loss (SL)</label>
                  <input
                    type="number"
                    value={customSL}
                    onChange={(e) => setCustomSL(Number(e.target.value) || 0)}
                    className="w-full bg-[#101420] border border-rose-900/60 rounded-md px-2.5 py-1.5 font-mono text-rose-300 text-xs tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[11px] mb-1">Target 1 (TP1)</label>
                  <input
                    type="number"
                    value={customTP1}
                    onChange={(e) => setCustomTP1(Number(e.target.value) || 0)}
                    className="w-full bg-[#101420] border border-emerald-900/60 rounded-md px-2.5 py-1.5 font-mono text-emerald-300 text-xs tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 text-[11px] mb-1">Target 2 (TP2)</label>
                  <input
                    type="number"
                    value={customTP2}
                    onChange={(e) => setCustomTP2(Number(e.target.value) || 0)}
                    className="w-full bg-[#101420] border border-emerald-900/60 rounded-md px-2.5 py-1.5 font-mono text-emerald-300 text-xs tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: The Execution Order Ticket Summary (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-lg bg-[#070a12] border border-[#19243c] shadow-inner">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#141d30]">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Order Execution Ticket
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                R:R Bersih <strong className="text-white">1:{rrRatio}</strong>
              </span>
            </div>

            {/* Hero Lot Number Display */}
            <div className="my-3 text-center p-3 rounded-lg bg-[#0d1322] border border-[#172238]">
              <span className="text-xs text-slate-400 block font-medium">Alokasi Pembelian Rekomendasi:</span>
              <div className="text-3xl font-black font-mono tracking-tight text-white mt-0.5 tabular-nums">
                {activeLots} <span className="text-lg font-bold text-sky-400">LOT</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                {activeLots > 0 ? (
                  `= ${totalShares.toLocaleString('id-ID')} Lembar @ ${formatIDR(entry)}`
                ) : (
                  <span className="text-amber-400">Modal belum mencukupi untuk 1 Lot (${formatIDR(costPerLot)})</span>
                )}
              </div>
            </div>

            {/* Financial Details Rows */}
            <div className="space-y-2 text-xs">
              {/* Modal Terpakai */}
              <div
                className={`flex items-center justify-between p-2 rounded-md border ${
                  isOverBudget
                    ? 'bg-rose-950/30 border-rose-800 text-rose-300'
                    : 'bg-[#101626] border-[#1a243c]'
                }`}
              >
                <span className="text-slate-400 font-medium">Total Dana Beli:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {formatIDR(totalCapitalRequired)}{' '}
                  <span
                    className={`text-[10px] font-semibold ${
                      isOverBudget ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    ({capitalAllocationPct}%)
                  </span>
                </span>
              </div>

              {/* Skenario Cut Loss */}
              <div className="flex items-center justify-between p-2 rounded-md bg-rose-950/25 border border-rose-900/40">
                <div>
                  <span className="text-rose-400 font-bold block">Skenario Cut Loss (SL):</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Harga SL: {formatIDR(sl)} (-{priceLossPercent}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-rose-400 block tabular-nums">
                    -{formatIDR(netLossRupiah)}
                  </span>
                  <span className="text-[10px] text-rose-300/80 font-mono">
                    {netLossPercent}% portofolio
                  </span>
                </div>
              </div>

              {/* Skenario TP1 */}
              <div className="flex items-center justify-between p-2 rounded-md bg-emerald-950/25 border border-emerald-900/40">
                <div>
                  <span className="text-emerald-400 font-bold block flex items-center gap-1">
                    <Target className="w-3 h-3" /> Target 1 (TP1):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Harga TP1: {formatIDR(tp1)} (+{priceProfitTP1Percent}%)
                  </span>
                </div>
                <span className="font-mono font-black text-emerald-400 tabular-nums">
                  +{formatIDR(netProfitTP1)}
                </span>
              </div>

              {/* Skenario TP2 */}
              <div className="flex items-center justify-between p-2 rounded-md bg-emerald-950/15 border border-emerald-900/25">
                <div>
                  <span className="text-emerald-300 font-medium block">Target 2 (TP2):</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Harga TP2: {formatIDR(tp2)} (+{priceProfitTP2Percent}%)
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-300 tabular-nums">
                  +{formatIDR(netProfitTP2)}
                </span>
              </div>
            </div>
          </div>

          {/* Sisa Cash Safety Note */}
          <div className="mt-3 pt-2.5 border-t border-[#141d30] flex items-center justify-between text-xs text-slate-500">
            <span>Sisa Cash Portofolio:</span>
            <span
              className={`font-mono font-bold tabular-nums ${
                isOverBudget ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {isOverBudget
                ? `Kurang ${formatIDR(totalCapitalRequired - portfolioCapital)}`
                : formatIDR(Math.max(portfolioCapital - totalCapitalRequired, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
