import { GoogleGenAI } from '@google/genai';
import {
  TechnicalSummary,
  RecommendationType,
  SwingActionPlan,
} from './types';
import { roundToIDXTick } from './idx-rules';

export interface AISynthesisOutput {
  recommendation: RecommendationType;
  setupTitle: string;
  confidenceScore: number;
  summaryThesis: string;
  actionPlan: SwingActionPlan;
  keyCatalystsAndRisks: string[];
  modelUsed: string;
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

export async function generateAISwingAnalysis(
  tech: TechnicalSummary
): Promise<AISynthesisOutput | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

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
    };

    const userPrompt = `
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
    "estimatedHoldingPeriod": "5 - 10 hari bursa"
  },
  "keyCatalystsAndRisks": [
    "Poin penting support/resistance atau momentum 1",
    "Poin penting katalis/risiko 2",
    "Poin penting 3"
  ]
}
`;

    // Try gemini-2.5-flash or gemini-2.0-flash or gemini-1.5-flash
    const modelName = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Low temperature for high consistency and low hallucination
      },
    });

    const responseText = response.text?.trim() || '';
    if (!responseText) return null;

    // Clean JSON response (if wrapped in markdown codeblocks)
    const jsonString = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonString);

    // Validate and sanitize prices against IDX tick rules and safety bounds
    let entry = Number(parsed.actionPlan?.entryPrice) || tech.quote.currentPrice;
    let tp1 = Number(parsed.actionPlan?.targetPrice1) || tech.resistance1;
    let tp2 = Number(parsed.actionPlan?.targetPrice2) || tech.resistance2;
    let sl = Number(parsed.actionPlan?.stopLoss) || roundToIDXTick(tech.support1 - 0.5 * (tech.atr14 || 10));

    // IDX tick alignment
    entry = roundToIDXTick(entry);
    tp1 = roundToIDXTick(tp1);
    tp2 = roundToIDXTick(tp2);
    sl = roundToIDXTick(sl);

    // Safety checks
    if (sl >= entry) sl = roundToIDXTick(entry * 0.95);
    if (tp1 <= entry) tp1 = roundToIDXTick(entry * 1.05);
    if (tp2 <= tp1) tp2 = roundToIDXTick(tp1 * 1.05);

    const riskAmount = entry - sl;
    const rewardAmount = tp1 - entry;
    const rrRatio = riskAmount > 0 ? `1:${(rewardAmount / riskAmount).toFixed(1)}` : '1:2.0';

    const profitPct = Number((((tp1 - entry) / entry) * 100).toFixed(1));
    const riskPct = Number((((entry - sl) / entry) * 100).toFixed(1));

    const sanitizedPlan: SwingActionPlan = {
      buyZone: parsed.actionPlan?.buyZone || `${roundToIDXTick(entry * 0.99)} - ${roundToIDXTick(entry * 1.01)}`,
      entryPrice: entry,
      targetPrice1: tp1,
      targetPrice2: tp2,
      stopLoss: sl,
      riskRewardRatio: rrRatio,
      potentialProfitPct: profitPct,
      potentialRiskPct: riskPct,
      estimatedHoldingPeriod: parsed.actionPlan?.estimatedHoldingPeriod || '5 - 10 hari bursa',
    };

    const validRecommendation: RecommendationType = [
      'BUY_ON_WEAKNESS',
      'BUY_ON_BREAKOUT',
      'WAIT_AND_SEE',
      'AVOID',
    ].includes(parsed.recommendation)
      ? parsed.recommendation
      : 'WAIT_AND_SEE';

    return {
      recommendation: validRecommendation,
      setupTitle: parsed.setupTitle || 'Swing Trade Setup',
      confidenceScore: Math.min(Math.max(Number(parsed.confidenceScore) || 75, 50), 98),
      summaryThesis: parsed.summaryThesis || '',
      actionPlan: sanitizedPlan,
      keyCatalystsAndRisks: Array.isArray(parsed.keyCatalystsAndRisks)
        ? parsed.keyCatalystsAndRisks
        : [],
      modelUsed: modelName,
    };
  } catch (error) {
    console.warn('Gemini AI synthesis fallback triggered:', error);
    return null;
  }
}
