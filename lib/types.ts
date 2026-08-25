export interface CandleData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LinePoint {
  time: string;
  value: number;
}

export interface StockQuote {
  ticker: string;
  name: string;
  currency: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume20: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap?: number;
  peRatio?: number;
  pbvRatio?: number;
  dividendYield?: number;
  sector?: string;
}

export type TrendStatus =
  | 'STRONG_UPTREND'
  | 'PULLBACK_UPTREND'
  | 'CONSOLIDATION'
  | 'DOWNTREND';

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  crossStatus: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL';
}

export interface StochasticResult {
  k: number;
  d: number;
  crossStatus: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL';
  status: 'OVERSOLD' | 'HEALTHY' | 'OVERBOUGHT';
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  isSqueeze: boolean;
}

export interface MFIResult {
  value: number;
  status: 'OVERSOLD' | 'HEALTHY' | 'OVERBOUGHT';
}

export type CandlePatternType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface CandlePattern {
  name: string;
  type: CandlePatternType;
  description: string;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TechnicalSummary {
  quote: StockQuote;
  ema20: number;
  ema50: number;
  ema200: number;
  trend: TrendStatus;
  trendDescription: string;
  rsi14: number;
  rsiStatus: 'OVERSOLD' | 'HEALTHY_BULLISH' | 'NEUTRAL' | 'OVERBOUGHT';
  macd: MACDResult;
  stochastic: StochasticResult;
  bollinger: BollingerBandsResult;
  mfi14: MFIResult;
  detectedPattern: CandlePattern | null;
  atr14: number;
  volumeRatio20: number; // Volume today / 20-day SMA volume
  volumeSurge: boolean; // > 1.3x
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
}

export type RecommendationType =
  | 'BUY_ON_WEAKNESS'
  | 'BUY_ON_BREAKOUT'
  | 'WAIT_AND_SEE'
  | 'AVOID';

export interface SwingActionPlan {
  buyZone: string;
  entryPrice: number;
  targetPrice1: number;
  targetPrice2: number;
  stopLoss: number;
  riskRewardRatio: string;
  potentialProfitPct: number;
  potentialRiskPct: number;
  estimatedHoldingPeriod: string;
}

export interface SwingAnalysisResult {
  ticker: string;
  name: string;
  recommendation: RecommendationType;
  setupTitle: string;
  confidenceScore: number;
  summaryThesis: string;
  actionPlan: SwingActionPlan;
  keyCatalystsAndRisks: string[];
  isAIGenerated: boolean;
  modelUsed?: string;
  technicalSummary: TechnicalSummary;
  candles: CandleData[];
  ema20Data: LinePoint[];
  ema50Data: LinePoint[];
  ema200Data: LinePoint[];
  bbUpperData?: LinePoint[];
  bbLowerData?: LinePoint[];
}

export interface PopularStock {
  ticker: string;
  name: string;
  sector: string;
}
