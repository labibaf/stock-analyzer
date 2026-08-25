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
    <div className="bg-[#0b0f19] border border-[#162035] rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full shadow-lg">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#141d30]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#131b2e] border border-[#1f2d4d] flex items-center justify-center">
              {isAIGenerated ? (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                {isAIGenerated ? 'AI Swing Analyst Synthesis' : 'Algorithmic Technical Synthesis'}
              </h4>
              <p className="text-[10px] text-slate-400">
                {isAIGenerated
                  ? `Google Gemini (${modelUsed || 'Flash Free'})`
                  : 'Deterministic Rule Engine'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-850/60 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" />
            <span>Real-Data Grounded</span>
          </div>
        </div>

        {/* Summary Thesis */}
        <div className="mt-3">
          <div className="flex items-center gap-1 text-[11px] text-sky-400 font-medium mb-1">
            <Lightbulb className="w-3 h-3" />
            <span>Tesis & Struktur Chart</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed bg-[#090c14] p-3 rounded border border-[#192134]">
            {summaryThesis ||
              `Analisis teknikal untuk ${ticker} menunjukkan peluang swing berdasarkan struktur moving average dan level support/resistance historis.`}
          </p>
        </div>
      </div>

      {/* Key Catalysts & Risks */}
      {keyCatalystsAndRisks.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#182032]">
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium mb-1.5">
            <AlertTriangle className="w-3 h-3" />
            <span>Katalis & Observasi Kunci</span>
          </div>
          <ul className="space-y-1">
            {keyCatalystsAndRisks.map((item, idx) => (
              <li
                key={idx}
                className="text-[11px] text-slate-300 flex items-start gap-1.5 bg-[#090c14] px-2.5 py-1.5 rounded border border-[#192134]"
              >
                <span className="text-sky-400 font-bold">•</span>
                <span className="leading-normal">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
