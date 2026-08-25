'use client';

import React, { useState } from 'react';
import {
  AIProviderId,
  AI_PROVIDERS,
} from '@/lib/ai-config';
import {
  KeyRound,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
  Cpu,
} from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const STORAGE_KEY_PROVIDER = 'idx_ai_provider';
export const STORAGE_KEY_API_KEY = 'idx_ai_api_key';
export const STORAGE_KEY_MODEL = 'idx_ai_model';

export function getStoredUserAIConfig(): {
  provider: AIProviderId;
  apiKey: string;
  model: string;
} {
  if (typeof window === 'undefined') {
    return { provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash' };
  }
  const provider = (localStorage.getItem(STORAGE_KEY_PROVIDER) || 'gemini') as AIProviderId;
  const apiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  const model =
    localStorage.getItem(STORAGE_KEY_MODEL) ||
    AI_PROVIDERS[provider]?.defaultModel ||
    'gemini-2.5-flash';
  return { provider, apiKey, model };
}

export default function AISettingsModal({
  isOpen,
  onClose,
  onSaved,
}: AISettingsModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(() => getStoredUserAIConfig().provider);
  const [apiKey, setApiKey] = useState<string>(() => getStoredUserAIConfig().apiKey);
  const [selectedModel, setSelectedModel] = useState<string>(() => getStoredUserAIConfig().model);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Testing & Status state
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  // Update default model when provider changes
  const handleProviderChange = (prov: AIProviderId) => {
    setSelectedProvider(prov);
    setSelectedModel(AI_PROVIDERS[prov].defaultModel);
    setTestResult({ status: 'idle' });
  };

  const handleTestAndSave = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        status: 'error',
        message: 'Masukkan API Key terlebih dahulu sebelum menyimpan.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult({ status: 'idle' });

    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
          model: selectedModel || AI_PROVIDERS[selectedProvider].defaultModel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY_PROVIDER, selectedProvider);
        localStorage.setItem(STORAGE_KEY_API_KEY, apiKey.trim());
        localStorage.setItem(
          STORAGE_KEY_MODEL,
          selectedModel || AI_PROVIDERS[selectedProvider].defaultModel
        );

        setTestResult({
          status: 'success',
          message: `Koneksi berhasil! Terhubung dengan model ${data.modelUsed || selectedModel}.`,
        });

        setTimeout(() => {
          onSaved();
          onClose();
        }, 1200);
      } else {
        setTestResult({
          status: 'error',
          message: data.error || 'API Key tidak valid atau kuota habis.',
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi server.';
      setTestResult({
        status: 'error',
        message: errorMsg,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem(STORAGE_KEY_PROVIDER);
    localStorage.removeItem(STORAGE_KEY_API_KEY);
    localStorage.removeItem(STORAGE_KEY_MODEL);
    setApiKey('');
    setTestResult({
      status: 'idle',
    });
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  const currentProviderConfig = AI_PROVIDERS[selectedProvider];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-[#1d273f] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#141d30] bg-[#070a12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#131b2e] border border-[#1f2d4d] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Pengaturan API Key AI (BYOK)
              </h3>
              <p className="text-xs text-slate-400">
                Gunakan API Key pribadimu untuk rekomendasi swing AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#131b2e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
          {/* Privacy & Security Note */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-start gap-2.5 text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="text-[11px] leading-relaxed">
              <strong>100% Aman & Privat:</strong> API Key kamu hanya disimpan di{' '}
              <span className="font-mono underline">localStorage</span> browser lokal perangkatmu.
              Key tidak pernah disimpan di database kami.
            </div>
          </div>

          {/* Provider Selection Grid */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Pilih Provider AI yang Didukung:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(AI_PROVIDERS) as AIProviderId[]).map((provKey) => {
                const prov = AI_PROVIDERS[provKey];
                const isSelected = selectedProvider === provKey;
                return (
                  <button
                    key={provKey}
                    type="button"
                    onClick={() => handleProviderChange(provKey)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500 shadow-md'
                        : 'bg-[#070a12] border-[#131b2e] hover:border-[#1e2a44] text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white block">{prov.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <span
                        className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded mt-1.5 inline-block ${
                          prov.isFreeTierAvailable
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : 'bg-[#131b2e] text-slate-400 border border-[#1e2a44]'
                        }`}
                      >
                        {prov.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                API Key {currentProviderConfig.name}:
              </label>
              <a
                href={currentProviderConfig.apiKeyHelpUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
              >
                <span>Dapatkan API Key di sini</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={currentProviderConfig.apiKeyPlaceholder}
                className="w-full bg-[#070a12] border border-[#19243c] focus:border-sky-500 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-white outline-none"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">{currentProviderConfig.apiKeyHelpText}</p>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Pilih Model AI:
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#070a12] border border-[#19243c] focus:border-sky-500 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
            >
              {currentProviderConfig.availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.isDefault ? '(Default Rekomendasi)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Test Status Banner */}
          {testResult.status === 'success' && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/60 flex items-center gap-2 text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}

          {testResult.status === 'error' && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-700/60 flex items-center gap-2 text-rose-300 font-medium">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#141d30] bg-[#070a12] gap-2">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClearKey}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141a2a] hover:bg-rose-950/40 border border-[#1e2840] hover:border-rose-800 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Key</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#141a2a] hover:bg-[#1a2236] border border-[#1e2840] text-slate-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={isTesting || !apiKey.trim()}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-[#1e263d] disabled:text-slate-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menguji Koneksi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tes & Simpan Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
