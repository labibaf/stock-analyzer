'use client';

import React from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, Lightbulb, Cpu } from 'lucide-react';

interface AICopilotCardProps {
  ticker: string;
  summaryThesis: string;
  keyCatalystsAndRisks: string[];
  isAIGenerated: boolean;
  modelUsed?: string;
}

export default function AICopilotCard({
  ticker,
  summaryThesis,
  keyCatalystsAndRisks,
  isAIGenerated,
  modelUsed,
}: AICopilotCardProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isAIGenerated ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {isAIGenerated ? 'AI Swing Analyst Synthesis' : 'Algorithmic Technical Synthesis'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isAIGenerated
                ? `Powered by ${modelUsed || 'Google Gemini Flash'} (Free Tier)`
                : 'Deterministic Rule-Based Engine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Grounded Real-Data</span>
        </div>
      </div>

      {/* Summary Thesis */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mb-1.5">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Analisis Struktur & Tesis Swing</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-normal bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/90">
          {summaryThesis ||
            `Analisis teknikal untuk ${ticker} menunjukkan peluang swing berdasarkan struktur moving average dan level support/resistance historis.`}
        </p>
      </div>

      {/* Key Catalysts & Risks */}
      {keyCatalystsAndRisks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/70">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Poin Kunci & Manajemen Risiko</span>
          </div>
          <ul className="space-y-1.5">
            {keyCatalystsAndRisks.map((item, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/50"
              >
                <span className="text-sky-400 font-bold">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
