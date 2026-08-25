'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SwingAnalysisResult } from '@/lib/types';
import Header from '@/components/Header';
import Scorecard from '@/components/Scorecard';
import SwingPlanCard from '@/components/SwingPlanCard';
import PositionSizeCalculator from '@/components/PositionSizeCalculator';
import TradingViewChart from '@/components/TradingViewChart';
import AICopilotCard from '@/components/AICopilotCard';
import FundamentalStatsCard from '@/components/FundamentalStatsCard';
import TechnicalIndicatorsTable from '@/components/TechnicalIndicatorsTable';
import AISettingsModal, { getStoredUserAIConfig } from '@/components/AISettingsModal';
import { AI_PROVIDERS, AIProviderId } from '@/lib/ai-config';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [ticker, setTicker] = useState('BBCA');
  const [data, setData] = useState<SwingAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Modal & BYOK Configuration
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [userAIConfig, setUserAIConfig] = useState<{
    provider: AIProviderId;
    apiKey: string;
    model: string;
  }>(getStoredUserAIConfig);

  const fetchAnalysis = useCallback(async (tickerSymbol: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const storedAI = getStoredUserAIConfig();
      const headers: Record<string, string> = {};

      if (storedAI.apiKey) {
        headers['x-ai-provider'] = storedAI.provider;
        headers['x-ai-api-key'] = storedAI.apiKey;
        headers['x-ai-model'] = storedAI.model;
      }

      const response = await fetch(`/api/analyze?ticker=${encodeURIComponent(tickerSymbol)}`, {
        headers,
      });
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
        const storedAI = getStoredUserAIConfig();
        const headers: Record<string, string> = {};

        if (storedAI.apiKey) {
          headers['x-ai-provider'] = storedAI.provider;
          headers['x-ai-api-key'] = storedAI.apiKey;
          headers['x-ai-model'] = storedAI.model;
        }

        const response = await fetch(`/api/analyze?ticker=${encodeURIComponent(ticker)}`, {
          headers,
        });
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

  const handleSavedAISettings = () => {
    const updated = getStoredUserAIConfig();
    setUserAIConfig(updated);
    // Re-run analysis with updated AI key
    fetchAnalysis(ticker);
  };

  const activeProvider = AI_PROVIDERS[userAIConfig.provider];
  const hasCustomKey = Boolean(userAIConfig.apiKey);

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f]">
      {/* Top Navigation & Quick Stock Chips */}
      <Header
        currentTicker={ticker}
        onSelectTicker={handleSelectTicker}
        isLoading={isLoading}
        isAIGenerated={Boolean(data?.isAIGenerated)}
        modelUsed={data?.modelUsed}
        onOpenAISettings={() => setIsAISettingsOpen(true)}
        activeProviderName={activeProvider?.name}
        hasCustomKey={hasCustomKey}
      />

      {/* Main Content Area (Full Width Fluid) */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 max-w-[1920px] mx-auto">
        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-md bg-rose-950/30 border border-rose-800/50 flex items-center justify-between gap-3 text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchAnalysis(ticker)}
              className="px-2.5 py-1 rounded bg-rose-900/50 hover:bg-rose-900 border border-rose-750 text-xs font-medium text-white transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !data && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-56 rounded-lg bg-[#0e121d] border border-[#1c2438]" />
              <div className="h-56 rounded-lg bg-[#0e121d] border border-[#1c2438]" />
            </div>
            <div className="h-44 rounded-lg bg-[#0e121d] border border-[#1c2438]" />
            <div className="h-96 rounded-lg bg-[#0e121d] border border-[#1c2438]" />
          </div>
        )}

        {/* Main Dashboard Content */}
        {data && (
          <div className="space-y-4">
            {/* Row 1: Stock Scorecard & Swing Trade Action Plan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Scorecard quote={data.technicalSummary.quote} tech={data.technicalSummary} />
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

            {/* Row 2: Interactive Position Sizing & Money Management Calculator */}
            <div>
              <PositionSizeCalculator
                key={data.ticker}
                ticker={data.ticker}
                entryPrice={data.actionPlan.entryPrice}
                stopLoss={data.actionPlan.stopLoss}
                targetPrice1={data.actionPlan.targetPrice1}
                targetPrice2={data.actionPlan.targetPrice2}
              />
            </div>

            {/* Row 3: Interactive Candlestick Chart (with EMAs, Bollinger Bands, & Multi-Timeframe) */}
            <div>
              <TradingViewChart
                key={data.ticker}
                ticker={data.ticker}
                candles={data.candles}
                ema20Data={data.ema20Data}
                ema50Data={data.ema50Data}
                ema200Data={data.ema200Data}
                bbUpperData={data.bbUpperData}
                bbLowerData={data.bbLowerData}
                support1={data.technicalSummary.support1}
                resistance1={data.technicalSummary.resistance1}
                stopLoss={data.actionPlan.stopLoss}
                targetPrice1={data.actionPlan.targetPrice1}
                targetPrice2={data.actionPlan.targetPrice2}
                isSqueeze={data.technicalSummary.bollinger.isSqueeze}
              />
            </div>

            {/* Row 4: AI Copilot Synthesis & Fundamental Valuation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
                <FundamentalStatsCard quote={data.technicalSummary.quote} />
              </div>
            </div>

            {/* Row 5: Complete Technical Indicators Consensus Table */}
            <div>
              <TechnicalIndicatorsTable tech={data.technicalSummary} />
            </div>
          </div>
        )}
      </main>

      {/* BYOK AI Settings Modal */}
      <AISettingsModal
        key={isAISettingsOpen ? 'open' : 'closed'}
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        onSaved={handleSavedAISettings}
      />

      {/* Footer & Disclaimer */}
      <footer className="border-t border-[#141d30] bg-[#07080c] mt-8 py-4 text-slate-500 text-xs">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0 border border-sky-500/30">
              <Image
                src="/logo.png"
                alt="IDX Swing Analyzer"
                fill
                sizes="20px"
                className="object-cover"
              />
            </div>
            <span>
              <strong>IDX Swing Analyzer</strong> — Real-time verified market data & deterministic math engine.
            </span>
          </div>

          <div className="text-slate-500 text-center sm:text-right">
            <span>Riset & edukasi swing trading. Bukan ajakan transaksi keuangan mutlak.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
