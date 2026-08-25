import { GoogleGenAI } from '@google/genai';
import {
  TechnicalSummary,
  RecommendationType,
  SwingActionPlan,
} from './types';
import { roundToIDXTick } from './idx-rules';
import { AIProviderId, AI_PROVIDERS } from './ai-config';

export interface AISynthesisOutput {
  recommendation: RecommendationType;
  setupTitle: string;
  confidenceScore: number;
  summaryThesis: string;
  actionPlan: SwingActionPlan;
  keyCatalystsAndRisks: string[];
  modelUsed: string;
  providerUsed: AIProviderId;
}

export interface UserAIConfig {
  provider?: AIProviderId;
  apiKey?: string;
  model?: string;
}

const SYSTEM_PROMPT = `
Anda adalah "IDX Pro Swing Analyst", analis teknikal dan manajemen risiko profesional spesialis saham Bursa Efek Indonesia (IDX / BEI).

TUGAS ANDA:
Menganalisis data teknikal numerik yang TELAH DISEDIAKAN oleh sistem server secara objektif, menyusun narasi tesis trading swing (holding period 3-15 hari bursa), serta menentukan action plan.

ATURAN ANTI-HALUSINASI KETAT:
1. JANGAN PERNAH mengarang data harga, volume, atau indikator historis yang tidak tercantum dalam JSON konteks.
2. Semua angka rekomendasi (Entry, Target 1, Target 2, Stop Loss) HARUS konsisten dengan level support/resistance dan pergerakan harga saat ini.
3. Selalu prioritaskan Risk Management: Stop Loss WAJIB lebih rendah dari Entry Price (< Entry) untuk posisi Buy. Target Price WAJIB lebih tinggi dari Entry (> Entry).
4. Gunakan Bahasa Indonesia yang lugas, profesional, objektif, dan mudah dipahami oleh trader lokal Indonesia.
5. Format output WAJIB berupa objek JSON murni tanpa markdown wrapping (atau JSON valid).
`;

function buildUserPrompt(tech: TechnicalSummary): string {
  const contextPayload = {
    ticker: tech.quote.ticker,
    company_name: tech.quote.name,
    current_price: tech.quote.currentPrice,
    day_change_percent: tech.quote.changePercent,
    volume_today: tech.quote.volume,
    volume_20_sma: tech.quote.avgVolume20,
    volume_ratio: tech.volumeRatio20,
    volume_surge_detected: tech.volumeSurge,
    trend_status: tech.trend,
    trend_description: tech.trendDescription,
    ema_20: tech.ema20,
    ema_50: tech.ema50,
    ema_200: tech.ema200,
    rsi_14: tech.rsi14,
    rsi_status: tech.rsiStatus,
    stochastic_14_3_3: {
      k: tech.stochastic.k,
      d: tech.stochastic.d,
      cross: tech.stochastic.crossStatus,
      status: tech.stochastic.status,
    },
    bollinger_bands: {
      upper: tech.bollinger.upper,
      middle: tech.bollinger.middle,
      lower: tech.bollinger.lower,
      bandwidth_percent: tech.bollinger.bandwidth,
      is_volatility_squeeze: tech.bollinger.isSqueeze,
    },
    mfi_14_money_flow: tech.mfi14,
    detected_candlestick_pattern: tech.detectedPattern,
    macd_line: tech.macd.macd,
    macd_signal: tech.macd.signal,
    macd_cross: tech.macd.crossStatus,
    atr_14_volatility: tech.atr14,
    support_1: tech.support1,
    support_2: tech.support2,
    resistance_1: tech.resistance1,
    resistance_2: tech.resistance2,
    fifty_two_week_high: tech.quote.fiftyTwoWeekHigh,
    fifty_two_week_low: tech.quote.fiftyTwoWeekLow,
    market_cap: tech.quote.marketCap,
    pe_ratio: tech.quote.peRatio,
    pbv_ratio: tech.quote.pbvRatio,
    dividend_yield: tech.quote.dividendYield,
    consensus_signals: {
      total_buy: tech.consensus.totalBuy,
      total_neutral: tech.consensus.totalNeutral,
      total_sell: tech.consensus.totalSell,
      overall_rating: tech.consensus.overallRating,
    },
  };

  return `
Berikut adalah data teknikal terverifikasi untuk saham ${tech.quote.ticker} (${tech.quote.name}):
\`\`\`json
${JSON.stringify(contextPayload, null, 2)}
\`\`\`

Berikan analisis swing trading terstruktur dalam format JSON dengan schema persis seperti berikut:
{
  "recommendation": "BUY_ON_WEAKNESS" | "BUY_ON_BREAKOUT" | "WAIT_AND_SEE" | "AVOID",
  "setupTitle": "Judul setup ringkas (contoh: Pullback Buy on EMA20 Support)",
  "confidenceScore": 85,
  "summaryThesis": "Penjelasan 2-3 kalimat mengenai momentum, struktur trend, dan volume",
  "actionPlan": {
    "buyZone": "1850 - 1880",
    "entryPrice": 1865,
    "targetPrice1": 1980,
    "targetPrice2": 2080,
    "stopLoss": 1780,
    "riskRewardRatio": "1:2.4",
    "potentialProfitPct": 6.2,
    "potentialRiskPct": 2.6,
    "estimatedHoldingPeriod": "3 - 7 hari bursa (Fast Momentum)"
  },
  "keyCatalystsAndRisks": [
    "Poin penting support/resistance atau momentum 1",
    "Poin penting katalis/risiko 2",
    "Poin penting 3"
  ]
}
`;
}

function parseAndValidateResponse(
  rawJsonString: string,
  modelName: string,
  provider: AIProviderId
): AISynthesisOutput | null {
  try {
    let cleanJson = rawJsonString.trim();
    cleanJson = cleanJson
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanJson);

    // Validate recommendation
    const validRecs: RecommendationType[] = [
      'BUY_ON_WEAKNESS',
      'BUY_ON_BREAKOUT',
      'WAIT_AND_SEE',
      'AVOID',
    ];
    const recommendation: RecommendationType = validRecs.includes(parsed.recommendation)
      ? parsed.recommendation
      : 'WAIT_AND_SEE';

    // Validate prices with IDX tick rounding
    const entryPrice = roundToIDXTick(Number(parsed.actionPlan?.entryPrice) || 0);
    let stopLoss = roundToIDXTick(Number(parsed.actionPlan?.stopLoss) || entryPrice * 0.95);
    let targetPrice1 = roundToIDXTick(Number(parsed.actionPlan?.targetPrice1) || entryPrice * 1.05);
    let targetPrice2 = roundToIDXTick(
      Number(parsed.actionPlan?.targetPrice2) || targetPrice1 * 1.05
    );

    // Sanity checks
    if (stopLoss >= entryPrice) {
      stopLoss = roundToIDXTick(entryPrice * 0.95);
    }
    if (targetPrice1 <= entryPrice) {
      targetPrice1 = roundToIDXTick(entryPrice * 1.05);
    }
    if (targetPrice2 <= targetPrice1) {
      targetPrice2 = roundToIDXTick(targetPrice1 * 1.05);
    }

    const potentialProfitPct = Number((((targetPrice1 - entryPrice) / entryPrice) * 100).toFixed(1));
    const potentialRiskPct = Number((((entryPrice - stopLoss) / entryPrice) * 100).toFixed(1));
    const riskAmount = entryPrice - stopLoss;
    const rewardAmount = targetPrice1 - entryPrice;
    const rrRatio = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(1) : '2.0';

    const actionPlan: SwingActionPlan = {
      buyZone: String(parsed.actionPlan?.buyZone || `${entryPrice * 0.99} - ${entryPrice}`),
      entryPrice,
      targetPrice1,
      targetPrice2,
      stopLoss,
      riskRewardRatio: `1:${rrRatio}`,
      potentialProfitPct,
      potentialRiskPct,
      estimatedHoldingPeriod: String(
        parsed.actionPlan?.estimatedHoldingPeriod || '5 - 10 hari bursa'
      ),
    };

    return {
      recommendation,
      setupTitle: String(parsed.setupTitle || 'Swing Trade Setup'),
      confidenceScore: Math.min(Math.max(Number(parsed.confidenceScore) || 75, 50), 99),
      summaryThesis: String(parsed.summaryThesis || ''),
      actionPlan,
      keyCatalystsAndRisks: Array.isArray(parsed.keyCatalystsAndRisks)
        ? parsed.keyCatalystsAndRisks.map(String)
        : [],
      modelUsed: modelName,
      providerUsed: provider,
    };
  } catch (err) {
    console.error('Failed to parse AI response:', err, rawJsonString);
    return null;
  }
}

/**
 * Executes AI analysis across any supported provider (Gemini, Groq, OpenAI, OpenRouter, Anthropic)
 */
export async function generateAISwingAnalysis(
  tech: TechnicalSummary,
  userConfig?: UserAIConfig
): Promise<AISynthesisOutput | null> {
  const provider = userConfig?.provider || 'gemini';
  let apiKey = userConfig?.apiKey?.trim();

  // If user didn't supply key, fallback to server GEMINI_API_KEY if provider is gemini
  if (!apiKey && provider === 'gemini') {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  const model = userConfig?.model || AI_PROVIDERS[provider]?.defaultModel || 'gemini-2.5-flash';
  const userPrompt = buildUserPrompt(tech);

  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '';
      return parseAndValidateResponse(text, `${model} (Gemini)`, 'gemini');
    }

    if (provider === 'groq' || provider === 'openai' || provider === 'openrouter') {
      let endpoint = 'https://api.openai.com/v1/chat/completions';
      const extraHeaders: Record<string, string> = {};

      if (provider === 'groq') {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      } else if (provider === 'openrouter') {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        extraHeaders['HTTP-Referer'] = 'https://stock-analyzer.vercel.app';
        extraHeaders['X-Title'] = 'IDX Swing Analyzer';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`${provider} API error (${res.status}):`, errorText);
        return null;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      return parseAndValidateResponse(content, `${model} (${provider.toUpperCase()})`, provider);
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `${userPrompt}\n\nJawab HANYA dalam format JSON valid tanpa format markdown atau penjelasan teks di luar JSON.`,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Anthropic API error (${res.status}):`, errorText);
        return null;
      }

      const data = await res.json();
      const content = data.content?.[0]?.text || '';
      return parseAndValidateResponse(content, `${model} (Claude)`, 'anthropic');
    }
  } catch (err) {
    console.error(`Error calling AI provider (${provider}):`, err);
    return null;
  }

  return null;
}

/**
 * Validates a user's API key with a small lightweight test prompt
 */
export async function testUserApiKey(
  provider: AIProviderId,
  apiKey: string,
  model?: string
): Promise<{ success: boolean; error?: string; modelUsed?: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, error: 'API key tidak boleh kosong.' };
  }

  const modelToUse = model || AI_PROVIDERS[provider]?.defaultModel || 'gemini-2.5-flash';

  try {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: [{ role: 'user', parts: [{ text: 'Balas hanya kata "OK" jika terhubung.' }] }],
      });
      if (response.text) {
        return { success: true, modelUsed: modelToUse };
      }
    }

    if (provider === 'groq' || provider === 'openai' || provider === 'openrouter') {
      let endpoint = 'https://api.openai.com/v1/chat/completions';
      const extraHeaders: Record<string, string> = {};

      if (provider === 'groq') {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      } else if (provider === 'openrouter') {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        extraHeaders['HTTP-Referer'] = 'https://stock-analyzer.vercel.app';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [{ role: 'user', content: 'Ping. Balas hanya "OK".' }],
          max_tokens: 10,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          error:
            errJson.error?.message ||
            `API error code ${res.status}: Gagal mengotentikasi API Key.`,
        };
      }

      return { success: true, modelUsed: modelToUse };
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping. Balas hanya "OK".' }],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          error:
            errJson.error?.message ||
            `Anthropic API error ${res.status}: API Key tidak valid.`,
        };
      }

      return { success: true, modelUsed: modelToUse };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Koneksi ke server AI gagal.';
    return { success: false, error: errorMsg };
  }

  return { success: false, error: 'Provider AI tidak didukung.' };
}
