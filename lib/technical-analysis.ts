import {
  CandleData,
  EMAPoint,
  TechnicalSummary,
  TrendStatus,
  StockQuote,
  MACDResult,
  RecommendationType,
  SwingActionPlan,
} from './types';
import { roundToIDXTick } from './idx-rules';

/**
 * Calculates Exponential Moving Average (EMA) for an array of closing prices
 */
export function calculateEMA(candles: CandleData[], period: number): EMAPoint[] {
  if (candles.length < period) return [];

  const k = 2 / (period + 1);
  const emaData: EMAPoint[] = [];

  // Initial SMA as first EMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let currentEMA = sum / period;
  emaData.push({ time: candles[period - 1].time, value: currentEMA });

  for (let i = period; i < candles.length; i++) {
    currentEMA = candles[i].close * k + currentEMA * (1 - k);
    emaData.push({ time: candles[i].time, value: currentEMA });
  }

  return emaData;
}

/**
 * Calculates RSI (14) using Wilder's Smoothing
 */
export function calculateRSI(candles: CandleData[], period: number = 14): number {
  if (candles.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) {
      gains += diff;
    } else {
      losses += Math.abs(diff);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return Number(rsi.toFixed(2));
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(candles: CandleData[]): MACDResult {
  if (candles.length < 35) {
    return {
      macd: 0,
      signal: 0,
      histogram: 0,
      crossStatus: 'NEUTRAL',
    };
  }

  const ema12 = calculateEMA(candles, 12);
  const ema26 = calculateEMA(candles, 26);

  // Match timestamps between EMA 12 and EMA 26
  const macdLineSeries: { time: string; value: number }[] = [];
  const ema26Map = new Map<string, number>();
  ema26.forEach((item) => ema26Map.set(item.time, item.value));

  for (const item12 of ema12) {
    const val26 = ema26Map.get(item12.time);
    if (val26 !== undefined) {
      macdLineSeries.push({
        time: item12.time,
        value: item12.value - val26,
      });
    }
  }

  if (macdLineSeries.length < 9) {
    return { macd: 0, signal: 0, histogram: 0, crossStatus: 'NEUTRAL' };
  }

  // Calculate 9 EMA of the MACD Line (Signal Line)
  const kSignal = 2 / (9 + 1);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += macdLineSeries[i].value;
  }
  let currentSignal = sum / 9;

  for (let i = 9; i < macdLineSeries.length; i++) {
    currentSignal = macdLineSeries[i].value * kSignal + currentSignal * (1 - kSignal);
  }

  const latestMACD = macdLineSeries[macdLineSeries.length - 1].value;
  const prevMACD =
    macdLineSeries.length >= 2 ? macdLineSeries[macdLineSeries.length - 2].value : latestMACD;
  const histogram = latestMACD - currentSignal;

  let crossStatus: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL' = 'NEUTRAL';
  if (prevMACD <= currentSignal && latestMACD > currentSignal) {
    crossStatus = 'BULLISH_CROSS';
  } else if (prevMACD >= currentSignal && latestMACD < currentSignal) {
    crossStatus = 'BEARISH_CROSS';
  }

  return {
    macd: Number(latestMACD.toFixed(2)),
    signal: Number(currentSignal.toFixed(2)),
    histogram: Number(histogram.toFixed(2)),
    crossStatus,
  };
}

/**
 * Calculates ATR (14) - Average True Range
 */
export function calculateATR(candles: CandleData[], period: number = 14): number {
  if (candles.length <= period) return 0;

  const trValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trValues.push(tr);
  }

  let atr = 0;
  for (let i = 0; i < period; i++) {
    atr += trValues[i];
  }
  atr /= period;

  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
  }

  return Number(atr.toFixed(2));
}

/**
 * Finds Support & Resistance levels from recent swing highs and lows (last 60 candles)
 */
export function findSupportResistanceLevels(
  candles: CandleData[],
  currentPrice: number
): { support1: number; support2: number; resistance1: number; resistance2: number } {
  const lookback = Math.min(candles.length, 60);
  const recentCandles = candles.slice(-lookback);

  const swingLows: number[] = [];
  const swingHighs: number[] = [];

  for (let i = 2; i < recentCandles.length - 2; i++) {
    const c = recentCandles[i];
    const isLow =
      c.low <= recentCandles[i - 1].low &&
      c.low <= recentCandles[i - 2].low &&
      c.low <= recentCandles[i + 1].low &&
      c.low <= recentCandles[i + 2].low;

    const isHigh =
      c.high >= recentCandles[i - 1].high &&
      c.high >= recentCandles[i - 2].high &&
      c.high >= recentCandles[i + 1].high &&
      c.high >= recentCandles[i + 2].high;

    if (isLow) swingLows.push(c.low);
    if (isHigh) swingHighs.push(c.high);
  }

  // Filter supports below current price
  const validSupports = swingLows
    .filter((p) => p < currentPrice)
    .sort((a, b) => b - a); // highest to lowest below current

  // Filter resistances above current price
  const validResistances = swingHighs
    .filter((p) => p > currentPrice)
    .sort((a, b) => a - b); // lowest to highest above current

  const support1 = validSupports[0] ?? roundToIDXTick(currentPrice * 0.95);
  const support2 = validSupports[1] ?? roundToIDXTick(support1 * 0.96);

  const resistance1 = validResistances[0] ?? roundToIDXTick(currentPrice * 1.05);
  const resistance2 = validResistances[1] ?? roundToIDXTick(resistance1 * 1.05);

  return {
    support1: roundToIDXTick(support1),
    support2: roundToIDXTick(support2),
    resistance1: roundToIDXTick(resistance1),
    resistance2: roundToIDXTick(resistance2),
  };
}

/**
 * Evaluates the Technical Summary deterministically
 */
export function evaluateTechnicalSummary(
  candles: CandleData[],
  quote: StockQuote
): {
  summary: TechnicalSummary;
  ema20Points: EMAPoint[];
  ema50Points: EMAPoint[];
  ema200Points: EMAPoint[];
} {
  const ema20Points = calculateEMA(candles, 20);
  const ema50Points = calculateEMA(candles, 50);
  const ema200Points = calculateEMA(candles, 200);

  const latestEMA20 = ema20Points[ema20Points.length - 1]?.value ?? quote.currentPrice;
  const latestEMA50 = ema50Points[ema50Points.length - 1]?.value ?? quote.currentPrice;
  const latestEMA200 = ema200Points[ema200Points.length - 1]?.value ?? quote.currentPrice;

  const rsi14 = calculateRSI(candles, 14);
  const macd = calculateMACD(candles);
  const atr14 = calculateATR(candles, 14);

  // Volume 20 SMA
  const lookbackVolume = Math.min(candles.length, 20);
  let totalVol = 0;
  for (let i = candles.length - lookbackVolume; i < candles.length; i++) {
    totalVol += candles[i].volume;
  }
  const avgVolume20 = totalVol / lookbackVolume || quote.volume;
  const volumeRatio20 = avgVolume20 > 0 ? quote.volume / avgVolume20 : 1;
  const volumeSurge = volumeRatio20 >= 1.3;

  // Trend Determination
  const price = quote.currentPrice;
  let trend: TrendStatus = 'CONSOLIDATION';
  let trendDescription = 'Konsolidasi / Sideways';

  if (price > latestEMA20 && latestEMA20 > latestEMA50 && latestEMA50 > latestEMA200) {
    trend = 'STRONG_UPTREND';
    trendDescription = 'Strong Uptrend (Price > EMA20 > EMA50 > EMA200)';
  } else if (latestEMA50 > latestEMA200 && price <= latestEMA20 * 1.02 && price >= latestEMA50 * 0.98) {
    trend = 'PULLBACK_UPTREND';
    trendDescription = 'Pullback di area Support EMA (Uptrend Re-test)';
  } else if (price < latestEMA50 && price < latestEMA200) {
    trend = 'DOWNTREND';
    trendDescription = 'Downtrend di bawah EMA 50 & 200';
  } else {
    trend = 'CONSOLIDATION';
    trendDescription = 'Sideways di sekitar Moving Average';
  }

  // RSI status
  let rsiStatus: 'OVERSOLD' | 'HEALTHY_BULLISH' | 'NEUTRAL' | 'OVERBOUGHT' = 'NEUTRAL';
  if (rsi14 < 32) {
    rsiStatus = 'OVERSOLD';
  } else if (rsi14 >= 42 && rsi14 <= 60) {
    rsiStatus = 'HEALTHY_BULLISH';
  } else if (rsi14 > 70) {
    rsiStatus = 'OVERBOUGHT';
  }

  const { support1, support2, resistance1, resistance2 } = findSupportResistanceLevels(
    candles,
    price
  );

  const summary: TechnicalSummary = {
    quote: {
      ...quote,
      avgVolume20: Math.round(avgVolume20),
    },
    ema20: Math.round(latestEMA20),
    ema50: Math.round(latestEMA50),
    ema200: Math.round(latestEMA200),
    trend,
    trendDescription,
    rsi14,
    rsiStatus,
    macd,
    atr14,
    volumeRatio20: Number(volumeRatio20.toFixed(2)),
    volumeSurge,
    support1,
    support2,
    resistance1,
    resistance2,
  };

  return {
    summary,
    ema20Points,
    ema50Points,
    ema200Points,
  };
}

/**
 * Deterministic Algorithmic Fallback Engine for Swing Trade Plan
 */
export function generateAlgorithmicSwingPlan(tech: TechnicalSummary): {
  recommendation: RecommendationType;
  setupTitle: string;
  confidenceScore: number;
  summaryThesis: string;
  actionPlan: SwingActionPlan;
  keyCatalystsAndRisks: string[];
} {
  const price = tech.quote.currentPrice;
  const atr = tech.atr14 > 0 ? tech.atr14 : price * 0.03;

  let recommendation: RecommendationType = 'WAIT_AND_SEE';
  let setupTitle = 'Konsolidasi Menunggu Konfirmasi';
  let confidenceScore = 65;
  let summaryThesis = '';
  let buyZoneLow = roundToIDXTick(price * 0.98);
  let buyZoneHigh = roundToIDXTick(price * 1.01);
  let entryPrice = price;
  let targetPrice1 = tech.resistance1;
  let targetPrice2 = tech.resistance2;
  let stopLoss = roundToIDXTick(tech.support1 - 0.5 * atr);

  if (tech.trend === 'STRONG_UPTREND' && tech.volumeSurge) {
    recommendation = 'BUY_ON_BREAKOUT';
    setupTitle = 'Strong Uptrend Momentum Breakout';
    confidenceScore = 85;
    buyZoneLow = roundToIDXTick(price * 0.99);
    buyZoneHigh = roundToIDXTick(price * 1.02);
    entryPrice = price;
    targetPrice1 = roundToIDXTick(Math.max(tech.resistance1, price + 1.8 * atr));
    targetPrice2 = roundToIDXTick(Math.max(tech.resistance2, targetPrice1 + 1.5 * atr));
    stopLoss = roundToIDXTick(Math.max(tech.support1, price - 1.0 * atr));
    summaryThesis = `${tech.quote.ticker} berada dalam struktur Strong Uptrend di atas EMA 20/50/200 dengan volume transaksi ${tech.volumeRatio20}x di atas rata-rata 20 hari. Momentum bullish kuat untuk menguji level resistance selanjutnya.`;
  } else if (tech.trend === 'PULLBACK_UPTREND' || (tech.trend === 'STRONG_UPTREND' && tech.rsiStatus === 'HEALTHY_BULLISH')) {
    recommendation = 'BUY_ON_WEAKNESS';
    setupTitle = 'Pullback Buy on EMA Support';
    confidenceScore = 80;
    buyZoneLow = roundToIDXTick(Math.min(tech.ema20, tech.support1));
    buyZoneHigh = roundToIDXTick(price);
    entryPrice = roundToIDXTick((buyZoneLow + buyZoneHigh) / 2);
    targetPrice1 = roundToIDXTick(Math.max(tech.resistance1, entryPrice + 1.8 * atr));
    targetPrice2 = roundToIDXTick(Math.max(tech.resistance2, targetPrice1 + 1.5 * atr));
    stopLoss = roundToIDXTick(buyZoneLow - 0.7 * atr);
    summaryThesis = `${tech.quote.ticker} sedang mengalami koreksi sehat (pullback) menguji support dinamis EMA 20/50 dengan RSI di level ${tech.rsi14}. Menawarkan entry risk-to-reward yang menarik untuk swing trader.`;
  } else if (tech.rsiStatus === 'OVERSOLD' || price <= tech.support1 * 1.02) {
    recommendation = 'BUY_ON_WEAKNESS';
    setupTitle = 'Oversold Technical Rebound';
    confidenceScore = 72;
    buyZoneLow = roundToIDXTick(tech.support1 * 0.98);
    buyZoneHigh = roundToIDXTick(tech.support1 * 1.02);
    entryPrice = roundToIDXTick((buyZoneLow + buyZoneHigh) / 2);
    targetPrice1 = roundToIDXTick(Math.max(tech.ema20, tech.resistance1));
    targetPrice2 = roundToIDXTick(Math.max(tech.resistance2, targetPrice1 + 1.5 * atr));
    stopLoss = roundToIDXTick(tech.support2 - 0.5 * atr);
    summaryThesis = `${tech.quote.ticker} memasuki zona jenuh jual (RSI ${tech.rsi14} < 32) di sekitar area support kuat ${tech.support1}. Berpotensi mengalami technical rebound jangka pendek.`;
  } else if (tech.trend === 'DOWNTREND') {
    recommendation = 'AVOID';
    setupTitle = 'Downtrend Tertekan di Bawah EMA 200';
    confidenceScore = 80;
    buyZoneLow = roundToIDXTick(tech.support1 * 0.96);
    buyZoneHigh = roundToIDXTick(tech.support1);
    entryPrice = buyZoneLow;
    targetPrice1 = roundToIDXTick(tech.ema20);
    targetPrice2 = roundToIDXTick(tech.resistance1);
    stopLoss = roundToIDXTick(tech.support2 - 0.5 * atr);
    summaryThesis = `${tech.quote.ticker} masih berada di bawah tekanan tren bearish (di bawah EMA 50 dan EMA 200). Disarankan menghindari entry swing agresif hingga terjadi breakout struktur tren.`;
  } else {
    recommendation = 'WAIT_AND_SEE';
    setupTitle = 'Sideways Menunggu Volume Breakout';
    confidenceScore = 65;
    buyZoneLow = roundToIDXTick(tech.support1);
    buyZoneHigh = roundToIDXTick(tech.support1 * 1.02);
    entryPrice = roundToIDXTick((buyZoneLow + buyZoneHigh) / 2);
    targetPrice1 = roundToIDXTick(tech.resistance1);
    targetPrice2 = roundToIDXTick(tech.resistance2);
    stopLoss = roundToIDXTick(tech.support1 - 0.6 * atr);
    summaryThesis = `${tech.quote.ticker} bergerak sideways di rentang support ${tech.support1} dan resistance ${tech.resistance1}. Disarankan menunggu konfirmasi volume breakout sebelum membuka posisi atau antri di dekat support.`;
  }

  // Safety checks: ensure stop loss < entry and target > entry
  if (stopLoss >= entryPrice) {
    stopLoss = roundToIDXTick(entryPrice * 0.95);
  }
  if (targetPrice1 <= entryPrice) {
    targetPrice1 = roundToIDXTick(entryPrice * 1.05);
  }
  if (targetPrice2 <= targetPrice1) {
    targetPrice2 = roundToIDXTick(targetPrice1 * 1.05);
  }

  const riskAmount = entryPrice - stopLoss;
  const rewardAmount = targetPrice1 - entryPrice;
  const rrRatioNumber = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(1) : '1.5';
  const riskRewardRatio = `1:${rrRatioNumber}`;

  const potentialProfitPct = Number((((targetPrice1 - entryPrice) / entryPrice) * 100).toFixed(1));
  const potentialRiskPct = Number((((entryPrice - stopLoss) / entryPrice) * 100).toFixed(1));

  const actionPlan: SwingActionPlan = {
    buyZone: `${buyZoneLow} - ${buyZoneHigh}`,
    entryPrice,
    targetPrice1,
    targetPrice2,
    stopLoss,
    riskRewardRatio,
    potentialProfitPct,
    potentialRiskPct,
    estimatedHoldingPeriod: '5 - 10 hari bursa',
  };

  const keyCatalystsAndRisks: string[] = [
    `Support kunci berada di ${tech.support1} dan ${tech.support2}`,
    `Resistance target terdekat di ${tech.resistance1} (TP1) dan ${tech.resistance2} (TP2)`,
    `Volatilitas harian (ATR 14) sebesar ${tech.atr14} poin per hari`,
    `Volume ratio saat ini: ${tech.volumeRatio20}x vs 20 SMA`,
  ];

  return {
    recommendation,
    setupTitle,
    confidenceScore,
    summaryThesis,
    actionPlan,
    keyCatalystsAndRisks,
  };
}
