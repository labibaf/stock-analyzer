'use client';

import React, { useState } from 'react';
import { formatIDR } from '@/lib/idx-rules';
import { Calculator, ShieldAlert, Target, DollarSign, Wallet, Percent } from 'lucide-react';

interface PositionSizeCalculatorProps {
  ticker: string;
  entryPrice: number;
  stopLoss: number;
  targetPrice1: number;
  targetPrice2: number;
}

export default function PositionSizeCalculator({
  ticker,
  entryPrice,
  stopLoss,
  targetPrice1,
  targetPrice2,
}: PositionSizeCalculatorProps) {
  const [portfolioCapital, setPortfolioCapital] = useState<number>(10_000_000); // Rp 10 Juta default
  const [riskPercent, setRiskPercent] = useState<number>(2); // 2% risk tolerance default

  // Calculations for IDX (1 Lot = 100 shares)
  const riskAmountRupiah = (portfolioCapital * riskPercent) / 100;
  const riskPerShare = Math.max(entryPrice - stopLoss, 1);
  const sharesAllowed = Math.floor(riskAmountRupiah / riskPerShare);
  const lotsAllowed = Math.max(Math.floor(sharesAllowed / 100), 1);
  const totalShares = lotsAllowed * 100;

  const totalCapitalRequired = totalShares * entryPrice;
  const capitalAllocationPercent = Number(
    ((totalCapitalRequired / (portfolioCapital || 1)) * 100).toFixed(1)
  );

  const actualRiskRupiah = totalShares * (entryPrice - stopLoss);
  const actualRiskPercent = Number(
    ((actualRiskRupiah / (portfolioCapital || 1)) * 100).toFixed(2)
  );

  const potentialProfitTP1 = totalShares * (targetPrice1 - entryPrice);
  const potentialProfitTP2 = totalShares * (targetPrice2 - entryPrice);

  const presetCapitals = [5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              Kalkulator Lot & Manajemen Risiko ({ticker}.JK)
            </h4>
            <p className="text-[11px] text-slate-400">
              Position Sizing (1 Lot = 100 lembar) berbasis toleransi Stop Loss
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-semibold">
          1 Lot = 100 Lembar
        </span>
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {/* Portfolio Capital Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Total Modal Trading:
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {formatIDR(portfolioCapital)}
            </span>
          </label>
          <input
            type="number"
            value={portfolioCapital}
            onChange={(e) => setPortfolioCapital(Math.max(Number(e.target.value) || 0, 0))}
            step={1_000_000}
            className="w-full bg-slate-950 border border-slate-700/80 focus:border-sky-500 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 outline-none"
          />

          {/* Quick Preset Capital Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto mt-2 no-scrollbar">
            {presetCapitals.map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => setPortfolioCapital(cap)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap border transition-all ${
                  portfolioCapital === cap
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'
                }`}
              >
                {cap / 1_000_000} Jt
              </button>
            ))}
          </div>
        </div>

        {/* Max Risk Tolerance % */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-rose-400" /> Toleransi Risiko Per Trade:
            </span>
            <span className="font-mono text-rose-400 font-bold">{riskPercent}% ({formatIDR(riskAmountRupiah)})</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <span className="text-xs font-bold font-mono text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              {riskPercent}%
            </span>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 mt-2">
            <span>Konservatif (1%)</span>
            <span>Standar (2%)</span>
            <span>Agresif (3-5%)</span>
          </div>
        </div>
      </div>

      {/* Calculated Results Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800">
        {/* Recommended Lots Box */}
        <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-800/40 relative overflow-hidden">
          <div className="text-xs font-semibold text-sky-400 mb-0.5 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Rekomendasi Beli
          </div>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {lotsAllowed}{' '}
            <span className="text-sm font-semibold text-sky-400">Lot ({totalShares.toLocaleString('id-ID')} lembar)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total Dana: <span className="text-white font-mono font-semibold">{formatIDR(totalCapitalRequired)}</span> ({capitalAllocationPercent}% alokasi)
          </div>
        </div>

        {/* Max Risk if Cut Loss */}
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40">
          <div className="text-xs font-semibold text-rose-400 mb-0.5 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Maksimal Kerugian (Cut Loss)
          </div>
          <div className="text-xl font-black font-mono text-rose-400 tracking-tight">
            -{formatIDR(actualRiskRupiah)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tepat <span className="font-mono text-rose-300 font-semibold">{actualRiskPercent}%</span> dari total modal portofolio
          </div>
        </div>

        {/* Potential Profit TP1 & TP2 */}
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
          <div className="text-xs font-semibold text-emerald-400 mb-0.5 flex items-center gap-1">
            <Target className="w-3.5 h-3.5" /> Potensi Profit (Take Profit)
          </div>
          <div className="text-xl font-black font-mono text-emerald-400 tracking-tight">
            +{formatIDR(potentialProfitTP1)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            TP 2: <span className="text-emerald-300 font-mono font-semibold">+{formatIDR(potentialProfitTP2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
