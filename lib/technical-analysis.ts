import {
  CandleData,
  LinePoint,
  TechnicalSummary,
  TrendStatus,
  StockQuote,
  MACDResult,
  StochasticResult,
  BollingerBandsResult,
  MFIResult,
  CandlePattern,
  RecommendationType,
  SwingActionPlan,
  TechnicalConsensus,
  SingleIndicatorSignal,
  SignalVerdict,
} from './types';
import { roundToIDXTick, formatIDR } from './idx-rules';

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(candles: CandleData[], period: number): LinePoint[] {
  if (candles.length < period) return [];

  const k = 2 / (period + 1);
  const emaData: LinePoint[] = [];

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
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
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
    return { macd: 0, signal: 0, histogram: 0, crossStatus: 'NEUTRAL' };
  }

  const ema12 = calculateEMA(candles, 12);
  const ema26 = calculateEMA(candles, 26);

  const macdLineSeries: LinePoint[] = [];
  const ema26Map = new Map<string | number, number>();
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
 * Calculates Stochastic Oscillator (14, 3, 3)
 */
export function calculateStochastic(
  candles: CandleData[],
  periodK: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): StochasticResult {
  if (candles.length < periodK + smoothK + smoothD) {
    return { k: 50, d: 50, crossStatus: 'NEUTRAL', status: 'HEALTHY' };
  }

  const rawKList: number[] = [];

  for (let i = periodK - 1; i < candles.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;

    for (let j = i - periodK + 1; j <= i; j++) {
      if (candles[j].high > highestHigh) highestHigh = candles[j].high;
      if (candles[j].low < lowestLow) lowestLow = candles[j].low;
    }

    const currentClose = candles[i].close;
    const diff = highestHigh - lowestLow;
    const kVal = diff === 0 ? 50 : ((currentClose - lowestLow) / diff) * 100;
    rawKList.push(kVal);
  }

  // Smooth %K
  const smoothedK: number[] = [];
  for (let i = smoothK - 1; i < rawKList.length; i++) {
    let sum = 0;
    for (let j = i - smoothK + 1; j <= i; j++) {
      sum += rawKList[j];
    }
    smoothedK.push(sum / smoothK);
  }

  // Smooth %D
  const smoothedD: number[] = [];
  for (let i = smoothD - 1; i < smoothedK.length; i++) {
    let sum = 0;
    for (let j = i - smoothD + 1; j <= i; j++) {
      sum += smoothedK[j];
    }
    smoothedD.push(sum / smoothD);
  }

  const latestK = smoothedK[smoothedK.length - 1] ?? 50;
  const prevK = smoothedK[smoothedK.length - 2] ?? latestK;
  const latestD = smoothedD[smoothedD.length - 1] ?? 50;
  const prevD = smoothedD[smoothedD.length - 2] ?? latestD;

  let crossStatus: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL' = 'NEUTRAL';
  if (prevK <= prevD && latestK > latestD) {
    crossStatus = 'BULLISH_CROSS';
  } else if (prevK >= prevD && latestK < latestD) {
    crossStatus = 'BEARISH_CROSS';
  }

  let status: 'OVERSOLD' | 'HEALTHY' | 'OVERBOUGHT' = 'HEALTHY';
  if (latestK < 20 && latestD < 25) {
    status = 'OVERSOLD';
  } else if (latestK > 80 && latestD > 75) {
    status = 'OVERBOUGHT';
  }

  return {
    k: Number(latestK.toFixed(1)),
    d: Number(latestD.toFixed(1)),
    crossStatus,
    status,
  };
}

/**
 * Calculates Bollinger Bands (20, 2) and detects Volatility Squeeze
 */
export function calculateBollingerBands(
  candles: CandleData[],
  period: number = 20,
  stdDevMult: number = 2
): {
  result: BollingerBandsResult;
  upperSeries: LinePoint[];
  lowerSeries: LinePoint[];
} {
  if (candles.length < period) {
    const price = candles[candles.length - 1]?.close || 1000;
    return {
      result: {
        upper: price * 1.05,
        middle: price,
        lower: price * 0.95,
        bandwidth: 10,
        isSqueeze: false,
      },
      upperSeries: [],
      lowerSeries: [],
    };
  }

  const upperSeries: LinePoint[] = [];
  const lowerSeries: LinePoint[] = [];
  const bandwidthHistory: number[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const middle = sum / period;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(candles[j].close - middle, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    const upper = middle + stdDevMult * stdDev;
    const lower = middle - stdDevMult * stdDev;
    const bandwidth = middle > 0 ? ((upper - lower) / middle) * 100 : 0;

    upperSeries.push({ time: candles[i].time, value: roundToIDXTick(upper) });
    lowerSeries.push({ time: candles[i].time, value: roundToIDXTick(lower) });
    bandwidthHistory.push(bandwidth);
  }

  const latestUpper = upperSeries[upperSeries.length - 1]?.value || 0;
  const latestLower = lowerSeries[lowerSeries.length - 1]?.value || 0;
  const latestMiddle = Math.round((latestUpper + latestLower) / 2);
  const latestBandwidth = bandwidthHistory[bandwidthHistory.length - 1] || 0;

  // Squeeze Detection: Compare current bandwidth with lowest 15% threshold over last 60 days
  const recentBandwidths = bandwidthHistory.slice(-60);
  const sortedBW = [...recentBandwidths].sort((a, b) => a - b);
  const squeezeThreshold = sortedBW[Math.floor(sortedBW.length * 0.15)] || sortedBW[0];
  const isSqueeze = latestBandwidth <= squeezeThreshold && latestBandwidth < 8.0;

  return {
    result: {
      upper: latestUpper,
      middle: latestMiddle,
      lower: latestLower,
      bandwidth: Number(latestBandwidth.toFixed(2)),
      isSqueeze,
    },
    upperSeries,
    lowerSeries,
  };
}

/**
 * Calculates Money Flow Index (MFI 14)
 */
export function calculateMFI(candles: CandleData[], period: number = 14): MFIResult {
  if (candles.length <= period) {
    return { value: 50, status: 'HEALTHY' };
  }

  const typicalPrices: number[] = candles.map((c) => (c.high + c.low + c.close) / 3);
  const rawMoneyFlows: number[] = typicalPrices.map((tp, idx) => tp * candles[idx].volume);

  let positiveFlow = 0;
  let negativeFlow = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    if (typicalPrices[i] > typicalPrices[i - 1]) {
      positiveFlow += rawMoneyFlows[i];
    } else if (typicalPrices[i] < typicalPrices[i - 1]) {
      negativeFlow += rawMoneyFlows[i];
    }
  }

  let mfi = 50;
  if (negativeFlow === 0) {
    mfi = 100;
  } else {
    const moneyRatio = positiveFlow / negativeFlow;
    mfi = 100 - 100 / (1 + moneyRatio);
  }

  mfi = Number(mfi.toFixed(1));
  let status: 'OVERSOLD' | 'HEALTHY' | 'OVERBOUGHT' = 'HEALTHY';
  if (mfi < 25) status = 'OVERSOLD';
  else if (mfi > 75) status = 'OVERBOUGHT';

  return { value: mfi, status };
}

/**
 * Detects Candlestick Patterns from the latest daily candles
 */
export function detectCandlestickPattern(candles: CandleData[]): CandlePattern | null {
  if (candles.length < 3) return null;

  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  const currentBody = Math.abs(current.close - current.open);
  const currentRange = current.high - current.low || 1;
  const currentUpperShadow = current.high - Math.max(current.open, current.close);
  const currentLowerShadow = Math.min(current.open, current.close) - current.low;
  const isCurrentGreen = current.close >= current.open;

  const prevBody = Math.abs(prev.close - prev.open);
  const isPrevGreen = prev.close >= prev.open;

  // 1. Doji (Indecision)
  if (currentBody <= currentRange * 0.1) {
    return {
      name: 'Doji',
      type: 'NEUTRAL',
      description: 'Pola Doji menunjukkan keragu-raguan antara buyer dan seller di pasar.',
      reliability: 'MEDIUM',
    };
  }

  // 2. Bullish Engulfing
  if (!isPrevGreen && isCurrentGreen && current.open <= prev.close && current.close >= prev.open && currentBody > prevBody * 1.1) {
    return {
      name: 'Bullish Engulfing',
      type: 'BULLISH',
      description: 'Candle hijau membungkus candle merah sebelumnya, sinyal kuat pembalikan arah naik.',
      reliability: 'HIGH',
    };
  }

  // 3. Bearish Engulfing
  if (isPrevGreen && !isCurrentGreen && current.open >= prev.close && current.close <= prev.open && currentBody > prevBody * 1.1) {
    return {
      name: 'Bearish Engulfing',
      type: 'BEARISH',
      description: 'Candle merah membungkus candle hijau sebelumnya, sinyal koreksi/tekanan jual.',
      reliability: 'HIGH',
    };
  }

  // 4. Hammer (Bullish Reversal on support)
  if (currentLowerShadow >= 2 * currentBody && currentUpperShadow <= 0.25 * currentBody && currentRange > 0) {
    return {
      name: 'Hammer',
      type: 'BULLISH',
      description: 'Ekor bawah panjang menunjukkan buyer berhasil menolak harga murah dan memantul.',
      reliability: 'HIGH',
    };
  }

  // 5. Shooting Star (Bearish Reversal on resistance)
  if (currentUpperShadow >= 2 * currentBody && currentLowerShadow <= 0.25 * currentBody && currentRange > 0) {
    return {
      name: 'Shooting Star',
      type: 'BEARISH',
      description: 'Ekor atas panjang menunjukkan seller menolak kenaikan harga di level resistance.',
      reliability: 'HIGH',
    };
  }

  // 6. Inverted Hammer (Bullish Reversal)
  if (currentUpperShadow >= 2 * currentBody && currentLowerShadow <= 0.25 * currentBody && !isPrevGreen) {
    return {
      name: 'Inverted Hammer',
      type: 'BULLISH',
      description: 'Peluang pembalikan arah setelah fase koreksi tertekan.',
      reliability: 'MEDIUM',
    };
  }

  // 7. Morning Star (3 candles)
  const isPrev2Red = prev2.close < prev2.open;
  if (isPrev2Red && prevBody < currentRange * 0.4 && isCurrentGreen && current.close > (prev2.open + prev2.close) / 2) {
    return {
      name: 'Morning Star',
      type: 'BULLISH',
      description: 'Pola 3 candle formasi bintang fajar, sinyal kuat dimulainya tren naik baru.',
      reliability: 'HIGH',
    };
  }

  return null;
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

  const validSupports = swingLows
    .filter((p) => p < currentPrice)
    .sort((a, b) => b - a);

  const validResistances = swingHighs
    .filter((p) => p > currentPrice)
    .sort((a, b) => a - b);

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
 * Computes individual indicator signals and aggregate consensus (Buy/Sell/Neutral)
 */
export function computeTechnicalConsensus(
  price: number,
  quote: StockQuote,
  ema20: number,
  ema50: number,
  ema200: number,
  rsi14: number,
  macd: MACDResult,
  stochastic: StochasticResult,
  bollinger: BollingerBandsResult,
  mfi14: MFIResult,
  detectedPattern: CandlePattern | null,
  volumeRatio20: number
): TechnicalConsensus {
  const signals: SingleIndicatorSignal[] = [];

  // 1. Moving Averages
  const ema20Signal: SignalVerdict = price > ema20 ? 'BUY' : price < ema20 ? 'SELL' : 'NEUTRAL';
  signals.push({
    name: 'EMA (20)',
    category: 'MA',
    value: formatIDR(ema20),
    signal: ema20Signal,
    reason: price > ema20 ? 'Harga di atas EMA 20' : 'Harga di bawah EMA 20',
  });

  const ema50Signal: SignalVerdict = price > ema50 ? 'BUY' : price < ema50 ? 'SELL' : 'NEUTRAL';
  signals.push({
    name: 'EMA (50)',
    category: 'MA',
    value: formatIDR(ema50),
    signal: ema50Signal,
    reason: price > ema50 ? 'Harga di atas EMA 50' : 'Harga di bawah EMA 50',
  });

  const ema200Signal: SignalVerdict = price > ema200 ? 'BUY' : price < ema200 ? 'SELL' : 'NEUTRAL';
  signals.push({
    name: 'EMA (200)',
    category: 'MA',
    value: formatIDR(ema200),
    signal: ema200Signal,
    reason: price > ema200 ? 'Uptrend Jangka Panjang' : 'Downtrend di bawah EMA 200',
  });

  const maCrossSignal: SignalVerdict = ema20 > ema50 ? 'BUY' : ema20 < ema50 ? 'SELL' : 'NEUTRAL';
  signals.push({
    name: 'MA Alignment (20/50)',
    category: 'MA',
    value: ema20 > ema50 ? 'Bullish' : 'Bearish',
    signal: maCrossSignal,
    reason: ema20 > ema50 ? 'EMA 20 berada di atas EMA 50' : 'EMA 20 di bawah EMA 50',
  });

  // 2. Oscillators & Momentum
  let rsiSignal: SignalVerdict = 'NEUTRAL';
  let rsiReason = 'Zona Netral (42-60)';
  if (rsi14 < 32) {
    rsiSignal = 'BUY';
    rsiReason = 'Oversold (Potensi Rebound)';
  } else if (rsi14 >= 42 && rsi14 <= 65) {
    rsiSignal = 'BUY';
    rsiReason = 'Healthy Bullish Momentum';
  } else if (rsi14 > 70) {
    rsiSignal = 'SELL';
    rsiReason = 'Overbought (Rawan Koreksi)';
  }
  signals.push({
    name: 'RSI (14)',
    category: 'OSCILLATOR',
    value: `${rsi14}`,
    signal: rsiSignal,
    reason: rsiReason,
  });

  let stochSignal: SignalVerdict = 'NEUTRAL';
  let stochReason = 'Netral';
  if (stochastic.crossStatus === 'BULLISH_CROSS' || stochastic.status === 'OVERSOLD') {
    stochSignal = 'BUY';
    stochReason = 'Bullish Crossover / Oversold';
  } else if (stochastic.crossStatus === 'BEARISH_CROSS' || stochastic.status === 'OVERBOUGHT') {
    stochSignal = 'SELL';
    stochReason = 'Bearish Cross / Overbought';
  } else if (stochastic.k > stochastic.d) {
    stochSignal = 'BUY';
    stochReason = '%K di atas %D';
  } else {
    stochSignal = 'SELL';
    stochReason = '%K di bawah %D';
  }
  signals.push({
    name: 'Stochastic (14,3,3)',
    category: 'OSCILLATOR',
    value: `%K ${stochastic.k} / %D ${stochastic.d}`,
    signal: stochSignal,
    reason: stochReason,
  });

  let macdSignal: SignalVerdict = 'NEUTRAL';
  let macdReason = 'Netral';
  if (macd.histogram > 0) {
    macdSignal = 'BUY';
    macdReason = 'Histogram Positif (Bullish Momentum)';
  } else if (macd.histogram < 0) {
    macdSignal = 'SELL';
    macdReason = 'Histogram Negatif (Bearish Momentum)';
  }
  signals.push({
    name: 'MACD (12,26,9)',
    category: 'OSCILLATOR',
    value: `${macd.histogram > 0 ? '+' : ''}${macd.histogram}`,
    signal: macdSignal,
    reason: macdReason,
  });

  let mfiSignal: SignalVerdict = 'NEUTRAL';
  let mfiReason = 'Netral';
  if (mfi14.value < 30) {
    mfiSignal = 'BUY';
    mfiReason = 'Oversold Akumulasi Uang Masuk';
  } else if (mfi14.value >= 50 && mfi14.value <= 80) {
    mfiSignal = 'BUY';
    mfiReason = 'Capital Inflow Positif';
  } else if (mfi14.value > 80) {
    mfiSignal = 'SELL';
    mfiReason = 'Overbought Capital Outflow';
  }
  signals.push({
    name: 'MFI (14)',
    category: 'OSCILLATOR',
    value: `${mfi14.value}`,
    signal: mfiSignal,
    reason: mfiReason,
  });

  // 3. Volatility & Price Action
  let bbSignal: SignalVerdict = 'NEUTRAL';
  let bbReason = 'Didalam Band';
  if (price <= bollinger.lower * 1.015) {
    bbSignal = 'BUY';
    bbReason = 'Dekat Lower Band (Support)';
  } else if (bollinger.isSqueeze) {
    bbSignal = 'NEUTRAL';
    bbReason = 'BB Squeeze (Menunggu Breakout)';
  } else if (price >= bollinger.upper * 0.99) {
    bbSignal = 'SELL';
    bbReason = 'Dekat Upper Band (Resistance)';
  } else if (price > bollinger.middle) {
    bbSignal = 'BUY';
    bbReason = 'Di Atas Middle Band (SMA 20)';
  }
  signals.push({
    name: 'Bollinger Bands (20,2)',
    category: 'VOLATILITY',
    value: `BW ${bollinger.bandwidth}%`,
    signal: bbSignal,
    reason: bbReason,
  });

  let volSignal: SignalVerdict = 'NEUTRAL';
  let volReason = 'Volume Rata-rata';
  if (volumeRatio20 >= 1.25 && quote.change >= 0) {
    volSignal = 'BUY';
    volReason = 'Volume Spike Akumulasi Naik';
  } else if (volumeRatio20 >= 1.25 && quote.change < 0) {
    volSignal = 'SELL';
    volReason = 'Volume Spike Tekanan Jual';
  }
  signals.push({
    name: 'Volume vs 20-SMA',
    category: 'VOLATILITY',
    value: `${volumeRatio20}x`,
    signal: volSignal,
    reason: volReason,
  });

  let candleSignal: SignalVerdict = 'NEUTRAL';
  let candleReason = 'Tanpa Pola Ekstrem';
  if (detectedPattern?.type === 'BULLISH') {
    candleSignal = 'BUY';
    candleReason = `Pola Bullish ${detectedPattern.name}`;
  } else if (detectedPattern?.type === 'BEARISH') {
    candleSignal = 'SELL';
    candleReason = `Pola Bearish ${detectedPattern.name}`;
  }
  signals.push({
    name: 'Pola Candlestick',
    category: 'VOLATILITY',
    value: detectedPattern ? detectedPattern.name : 'Normal',
    signal: candleSignal,
    reason: candleReason,
  });

  // Aggregate Counts
  const totalBuy = signals.filter((s) => s.signal === 'BUY').length;
  const totalNeutral = signals.filter((s) => s.signal === 'NEUTRAL').length;
  const totalSell = signals.filter((s) => s.signal === 'SELL').length;

  const maSignals = signals.filter((s) => s.category === 'MA');
  const maBuy = maSignals.filter((s) => s.signal === 'BUY').length;
  const maSell = maSignals.filter((s) => s.signal === 'SELL').length;
  const maNeutral = maSignals.filter((s) => s.signal === 'NEUTRAL').length;
  const maVerdict: SignalVerdict = maBuy > maSell ? 'BUY' : maSell > maBuy ? 'SELL' : 'NEUTRAL';

  const oscSignals = signals.filter((s) => s.category === 'OSCILLATOR');
  const oscBuy = oscSignals.filter((s) => s.signal === 'BUY').length;
  const oscSell = oscSignals.filter((s) => s.signal === 'SELL').length;
  const oscNeutral = oscSignals.filter((s) => s.signal === 'NEUTRAL').length;
  const oscVerdict: SignalVerdict = oscBuy > oscSell ? 'BUY' : oscSell > oscBuy ? 'SELL' : 'NEUTRAL';

  let overallRating: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' = 'NEUTRAL';
  if (totalBuy >= 7) {
    overallRating = 'STRONG_BUY';
  } else if (totalBuy >= 5 && totalBuy > totalSell) {
    overallRating = 'BUY';
  } else if (totalSell >= 7) {
    overallRating = 'STRONG_SELL';
  } else if (totalSell >= 5 && totalSell > totalBuy) {
    overallRating = 'SELL';
  } else {
    overallRating = 'NEUTRAL';
  }

  return {
    totalBuy,
    totalNeutral,
    totalSell,
    totalIndicators: signals.length,
    overallRating,
    maRating: { buy: maBuy, neutral: maNeutral, sell: maSell, verdict: maVerdict },
    oscillatorRating: { buy: oscBuy, neutral: oscNeutral, sell: oscSell, verdict: oscVerdict },
    signals,
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
  ema20Points: LinePoint[];
  ema50Points: LinePoint[];
  ema200Points: LinePoint[];
  bbUpperPoints: LinePoint[];
  bbLowerPoints: LinePoint[];
} {
  const ema20Points = calculateEMA(candles, 20);
  const ema50Points = calculateEMA(candles, 50);
  const ema200Points = calculateEMA(candles, 200);

  const latestEMA20 = ema20Points[ema20Points.length - 1]?.value ?? quote.currentPrice;
  const latestEMA50 = ema50Points[ema50Points.length - 1]?.value ?? quote.currentPrice;
  const latestEMA200 = ema200Points[ema200Points.length - 1]?.value ?? quote.currentPrice;

  const rsi14 = calculateRSI(candles, 14);
  const macd = calculateMACD(candles);
  const stochastic = calculateStochastic(candles, 14, 3, 3);
  const { result: bollinger, upperSeries: bbUpperPoints, lowerSeries: bbLowerPoints } =
    calculateBollingerBands(candles, 20, 2);
  const mfi14 = calculateMFI(candles, 14);
  const detectedPattern = detectCandlestickPattern(candles);
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

  const consensus = computeTechnicalConsensus(
    price,
    quote,
    Math.round(latestEMA20),
    Math.round(latestEMA50),
    Math.round(latestEMA200),
    rsi14,
    macd,
    stochastic,
    bollinger,
    mfi14,
    detectedPattern,
    Number(volumeRatio20.toFixed(2))
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
    stochastic,
    bollinger,
    mfi14,
    detectedPattern,
    atr14,
    volumeRatio20: Number(volumeRatio20.toFixed(2)),
    volumeSurge,
    support1,
    support2,
    resistance1,
    resistance2,
    consensus,
  };

  return {
    summary,
    ema20Points,
    ema50Points,
    ema200Points,
    bbUpperPoints,
    bbLowerPoints,
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

  if (tech.bollinger.isSqueeze) {
    setupTitle = '🔥 Bollinger Squeeze (Potensi Breakout Ledakan Volatilitas)';
    confidenceScore += 5;
  }

  if (tech.trend === 'STRONG_UPTREND' && tech.volumeSurge) {
    recommendation = 'BUY_ON_BREAKOUT';
    setupTitle = tech.bollinger.isSqueeze
      ? '🔥 Squeeze Breakout with Volume Surge'
      : 'Strong Uptrend Momentum Breakout';
    confidenceScore = 88;
    buyZoneLow = roundToIDXTick(price * 0.99);
    buyZoneHigh = roundToIDXTick(price * 1.02);
    entryPrice = price;
    targetPrice1 = roundToIDXTick(Math.max(tech.resistance1, price + 1.8 * atr));
    targetPrice2 = roundToIDXTick(Math.max(tech.resistance2, targetPrice1 + 1.5 * atr));
    stopLoss = roundToIDXTick(Math.max(tech.support1, price - 1.0 * atr));
    summaryThesis = `${tech.quote.ticker} berada dalam struktur Strong Uptrend di atas EMA 20/50/200 dengan lonjakan volume ${tech.volumeRatio20}x di atas rata-rata. ${
      tech.detectedPattern ? `Terdeteksi pola ${tech.detectedPattern.name}. ` : ''
    }Momentum bullish kuat untuk menguji level resistance selanjutnya.`;
  } else if (
    tech.trend === 'PULLBACK_UPTREND' ||
    (tech.trend === 'STRONG_UPTREND' && tech.rsiStatus === 'HEALTHY_BULLISH') ||
    (tech.stochastic.status === 'OVERSOLD' && tech.stochastic.crossStatus === 'BULLISH_CROSS')
  ) {
    recommendation = 'BUY_ON_WEAKNESS';
    setupTitle =
      tech.stochastic.crossStatus === 'BULLISH_CROSS'
        ? 'Stochastic Bullish Cross on EMA Support'
        : 'Pullback Buy on EMA Support';
    confidenceScore = 82;
    buyZoneLow = roundToIDXTick(Math.min(tech.ema20, tech.support1));
    buyZoneHigh = roundToIDXTick(price);
    entryPrice = roundToIDXTick((buyZoneLow + buyZoneHigh) / 2);
    targetPrice1 = roundToIDXTick(Math.max(tech.resistance1, entryPrice + 1.8 * atr));
    targetPrice2 = roundToIDXTick(Math.max(tech.resistance2, targetPrice1 + 1.5 * atr));
    stopLoss = roundToIDXTick(buyZoneLow - 0.7 * atr);
    summaryThesis = `${tech.quote.ticker} sedang mengalami koreksi sehat (pullback) menguji support dinamis EMA 20/50 dengan RSI ${tech.rsi14} dan Stochastic ${tech.stochastic.k}/${tech.stochastic.d}. ${
      tech.detectedPattern ? `Konfirmasi pola candlestick ${tech.detectedPattern.name}. ` : ''
    }Menawarkan entry risk-to-reward yang menarik untuk swing trader.`;
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
    summaryThesis = `${tech.quote.ticker} memasuki zona jenuh jual (RSI ${tech.rsi14} < 32, MFI ${tech.mfi14.value}) di sekitar area support kuat ${tech.support1}. Berpotensi mengalami technical rebound jangka pendek.`;
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
    setupTitle = tech.bollinger.isSqueeze
      ? '🔥 Sideways Squeeze (Menunggu Arah Breakout)'
      : 'Sideways Menunggu Volume Breakout';
    confidenceScore = 65;
    buyZoneLow = roundToIDXTick(tech.support1);
    buyZoneHigh = roundToIDXTick(tech.support1 * 1.02);
    entryPrice = roundToIDXTick((buyZoneLow + buyZoneHigh) / 2);
    targetPrice1 = roundToIDXTick(tech.resistance1);
    targetPrice2 = roundToIDXTick(tech.resistance2);
    stopLoss = roundToIDXTick(tech.support1 - 0.6 * atr);
    summaryThesis = `${tech.quote.ticker} bergerak sideways di rentang support ${tech.support1} dan resistance ${tech.resistance1}. Disarankan menunggu konfirmasi volume breakout sebelum membuka posisi atau antri di dekat support.`;
  }

  // Safety checks
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

  // Compute dynamic estimated holding period based on ATR distance to target
  let estimatedHoldingPeriod = '5 - 10 hari bursa';
  if (atr > 0) {
    const atrMovementDays = Math.max(Math.ceil((targetPrice1 - entryPrice) / (atr * 0.8)), 2);
    const maxDays = Math.max(Math.ceil((targetPrice2 - entryPrice) / (atr * 0.7)), atrMovementDays + 2);

    if (recommendation === 'BUY_ON_BREAKOUT') {
      estimatedHoldingPeriod = `${Math.min(atrMovementDays, 3)} - ${Math.max(atrMovementDays + 3, 7)} hari bursa (Fast Momentum)`;
    } else if (setupTitle.includes('Oversold')) {
      estimatedHoldingPeriod = `${Math.min(atrMovementDays, 2)} - ${Math.max(atrMovementDays + 2, 5)} hari bursa (Quick Rebound)`;
    } else if (tech.bollinger.isSqueeze || tech.trend === 'CONSOLIDATION') {
      estimatedHoldingPeriod = `${Math.max(atrMovementDays, 7)} - ${Math.max(maxDays, 15)} hari bursa (Base Breakout)`;
    } else if (recommendation === 'AVOID') {
      estimatedHoldingPeriod = 'N/A (Hindari Entry)';
    } else {
      estimatedHoldingPeriod = `${atrMovementDays} - ${maxDays} hari bursa`;
    }
  }

  const actionPlan: SwingActionPlan = {
    buyZone: `${buyZoneLow} - ${buyZoneHigh}`,
    entryPrice,
    targetPrice1,
    targetPrice2,
    stopLoss,
    riskRewardRatio,
    potentialProfitPct,
    potentialRiskPct,
    estimatedHoldingPeriod,
  };

  const keyCatalystsAndRisks: string[] = [
    `Support kunci berada di ${tech.support1} dan ${tech.support2}`,
    `Resistance target terdekat di ${tech.resistance1} (TP1) dan ${tech.resistance2} (TP2)`,
    `Stochastic (14,3,3): ${tech.stochastic.k} / ${tech.stochastic.d} (${tech.stochastic.crossStatus.replace('_', ' ')})`,
    tech.bollinger.isSqueeze
      ? '🔥 Bollinger Band Squeeze terdeteksi: volatilitas menyempit bersiap breakout'
      : `Bollinger Bandwidth: ${tech.bollinger.bandwidth}%`,
    tech.detectedPattern
      ? `Pola Candlestick: ${tech.detectedPattern.name} (${tech.detectedPattern.type})`
      : `Volatilitas harian (ATR 14) sebesar ${tech.atr14} poin`,
    `Volume ratio saat ini: ${tech.volumeRatio20}x vs 20 SMA | MFI (14): ${tech.mfi14.value}`,
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
