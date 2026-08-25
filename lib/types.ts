export interface CandleData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EMAPoint {
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
  ema20Data: EMAPoint[];
  ema50Data: EMAPoint[];
  ema200Data: EMAPoint[];
}

export interface PopularStock {
  ticker: string;
  name: string;
  sector: string;
}
