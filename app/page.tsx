'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SwingAnalysisResult } from '@/lib/types';
import Header from '@/components/Header';
import Scorecard from '@/components/Scorecard';
import SwingPlanCard from '@/components/SwingPlanCard';
import TradingViewChart from '@/components/TradingViewChart';
import AICopilotCard from '@/components/AICopilotCard';
import TechnicalIndicatorsTable from '@/components/TechnicalIndicatorsTable';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const [ticker, setTicker] = useState('BBCA');
  const [data, setData] = useState<SwingAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async (tickerSymbol: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analyze?ticker=${encodeURIComponent(tickerSymbol)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memuat data saham.');
      }

      setData(result);
      setTicker(result.ticker);
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menganalisis saham.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const runFetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analyze?ticker=${encodeURIComponent(ticker)}`);
        const result = await response.json();
        if (ignore) return;

        if (!response.ok) {
          throw new Error(result.error || 'Gagal memuat data saham.');
        }

        setData(result);
      } catch (err: unknown) {
        if (ignore) return;
        console.error('Fetch error:', err);
        setError(
          err instanceof Error ? err.message : 'Terjadi kesalahan saat menganalisis saham.'
        );
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    runFetch();

    return () => {
      ignore = true;
    };
  }, [ticker]);

  const handleSelectTicker = (newTicker: string) => {
    setTicker(newTicker);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation & Quick Stock Chips */}
      <Header
        currentTicker={ticker}
        onSelectTicker={handleSelectTicker}
        isLoading={isLoading}
        isAIGenerated={Boolean(data?.isAIGenerated)}
        modelUsed={data?.modelUsed}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 backdrop-blur-md flex items-center justify-between gap-3 text-rose-200 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchAnalysis(ticker)}
              className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !data && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 rounded-2xl bg-slate-900/80 border border-slate-800" />
              <div className="h-64 rounded-2xl bg-slate-900/80 border border-slate-800" />
            </div>
            <div className="h-[480px] rounded-2xl bg-slate-900/80 border border-slate-800" />
          </div>
        )}

        {/* Data Display */}
        {data && (
          <div className="space-y-6">
            {/* Top Cards: Scorecard (Metrics) & Swing Plan Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Key Stats & Metric Gauges */}
              <div className="lg:col-span-6">
                <Scorecard quote={data.technicalSummary.quote} tech={data.technicalSummary} />
              </div>

              {/* Right Column: Swing Action Plan & Targets */}
              <div className="lg:col-span-6">
                <SwingPlanCard
                  ticker={data.ticker}
                  name={data.name}
                  currentPrice={data.technicalSummary.quote.currentPrice}
                  recommendation={data.recommendation}
                  setupTitle={data.setupTitle}
                  confidenceScore={data.confidenceScore}
                  actionPlan={data.actionPlan}
                  isAIGenerated={data.isAIGenerated}
                />
              </div>
            </div>

            {/* Middle Section: Interactive Candlestick Chart */}
            <div>
              <TradingViewChart
                ticker={data.ticker}
                candles={data.candles}
                ema20Data={data.ema20Data}
                ema50Data={data.ema50Data}
                ema200Data={data.ema200Data}
                support1={data.technicalSummary.support1}
                resistance1={data.technicalSummary.resistance1}
                stopLoss={data.actionPlan.stopLoss}
                targetPrice1={data.actionPlan.targetPrice1}
                targetPrice2={data.actionPlan.targetPrice2}
              />
            </div>

            {/* Bottom Section: AI Copilot Synthesis & Complete Indicators Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <AICopilotCard
                  ticker={data.ticker}
                  summaryThesis={data.summaryThesis}
                  keyCatalystsAndRisks={data.keyCatalystsAndRisks}
                  isAIGenerated={data.isAIGenerated}
                  modelUsed={data.modelUsed}
                />
              </div>

              <div className="lg:col-span-5">
                <TechnicalIndicatorsTable tech={data.technicalSummary} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer & Disclaimer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 mt-12 py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>
              <strong>IDX Swing Analyzer</strong> — Analisis data real-time berbasis kalkulasi
              matematika presisi & Google Gemini Free Tier.
            </span>
          </div>

          <div className="text-slate-500 text-center sm:text-right">
            <span>
              Disclaimer: Aplikasi ini untuk tujuan riset & edukasi teknikal. Bukan ajakan beli/jual
              mutlak.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
