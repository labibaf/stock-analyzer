import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { normalizeIDXTicker } from '@/lib/idx-rules';
import { CandleData, StockQuote, SwingAnalysisResult } from '@/lib/types';
import {
  evaluateTechnicalSummary,
  generateAlgorithmicSwingPlan,
} from '@/lib/technical-analysis';
import { generateAISwingAnalysis } from '@/lib/gemini';

// Initialize YahooFinance instance
const yf = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawTicker = searchParams.get('ticker') || 'BBCA';

  try {
    const { cleanSymbol, yahooSymbol } = normalizeIDXTicker(rawTicker);

    if (!cleanSymbol || cleanSymbol.length < 2) {
      return NextResponse.json(
        { error: 'Kode ticker saham tidak valid. Contoh: BBCA, BBRI, MEDC' },
        { status: 400 }
      );
    }

    // Fetch historical chart data (approx 2 years to ensure sufficient candles for EMA 200)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 550); // ~550 calendar days = ~380 trading days

    const chartResult = await yf.chart(yahooSymbol, {
      period1: startDate.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
      return NextResponse.json(
        { error: `Data saham untuk ticker ${cleanSymbol} tidak ditemukan di IDX.` },
        { status: 404 }
      );
    }

    // Filter valid quotes
    const rawQuotes = chartResult.quotes.filter(
      (q) => q.open != null && q.close != null && q.high != null && q.low != null
    );

    if (rawQuotes.length < 30) {
      return NextResponse.json(
        { error: `Data historis ${cleanSymbol} belum mencukupi untuk analisis teknikal.` },
        { status: 400 }
      );
    }

    const candles: CandleData[] = rawQuotes.map((q) => {
      const dateStr =
        q.date instanceof Date
          ? q.date.toISOString().split('T')[0]
          : new Date(q.date).toISOString().split('T')[0];

      return {
        time: dateStr,
        open: Math.round(q.open!),
        high: Math.round(q.high!),
        low: Math.round(q.low!),
        close: Math.round(q.close!),
        volume: Math.round(q.volume || 0),
      };
    });

    const latestCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];

    const currentPrice = chartResult.meta.regularMarketPrice ?? latestCandle.close;
    const previousClose =
      prevCandle ? prevCandle.close : chartResult.meta.chartPreviousClose ?? latestCandle.open;
    const change = currentPrice - previousClose;
    const changePercent =
      previousClose > 0 ? Number(((change / previousClose) * 100).toFixed(2)) : 0;

    const companyName =
      chartResult.meta.longName || chartResult.meta.shortName || `${cleanSymbol} Tbk`;

    // Fetch quote metadata for valuation multiples (PE, PBV, Dividend Yield, Market Cap)
    let marketCap: number | undefined;
    let peRatio: number | undefined;
    let pbvRatio: number | undefined;
    let dividendYield: number | undefined;

    try {
      const quoteData = await yf.quote(yahooSymbol);
      marketCap = quoteData?.marketCap;
      peRatio = quoteData?.trailingPE ? Number(quoteData.trailingPE.toFixed(1)) : undefined;
      pbvRatio = quoteData?.priceToBook ? Number(quoteData.priceToBook.toFixed(2)) : undefined;
      dividendYield = quoteData?.dividendYield
        ? Number((quoteData.dividendYield > 1 ? quoteData.dividendYield : quoteData.dividendYield * 100).toFixed(2))
        : undefined;
    } catch {
      // Graceful fallback if quote details are unavailable
    }

    const quote: StockQuote = {
      ticker: cleanSymbol,
      name: companyName,
      currency: chartResult.meta.currency || 'IDR',
      currentPrice,
      previousClose,
      change,
      changePercent,
      dayHigh: chartResult.meta.regularMarketDayHigh ?? latestCandle.high,
      dayLow: chartResult.meta.regularMarketDayLow ?? latestCandle.low,
      volume: chartResult.meta.regularMarketVolume ?? latestCandle.volume,
      avgVolume20: 0, // Will be computed in evaluateTechnicalSummary
      fiftyTwoWeekHigh: chartResult.meta.fiftyTwoWeekHigh ?? latestCandle.high,
      fiftyTwoWeekLow: chartResult.meta.fiftyTwoWeekLow ?? latestCandle.low,
      marketCap,
      peRatio,
      pbvRatio,
      dividendYield,
    };

    // 1. Deterministic Technical Calculations
    const {
      summary,
      ema20Points,
      ema50Points,
      ema200Points,
      bbUpperPoints,
      bbLowerPoints,
    } = evaluateTechnicalSummary(candles, quote);

    // 2. Deterministic Algorithmic Plan
    const algorithmicPlan = generateAlgorithmicSwingPlan(summary);

    // 3. AI Reasoning Synthesis (Gemini Free Tier)
    const aiOutput = await generateAISwingAnalysis(summary);

    // Assemble final response
    const finalResult: SwingAnalysisResult = {
      ticker: cleanSymbol,
      name: companyName,
      recommendation: aiOutput ? aiOutput.recommendation : algorithmicPlan.recommendation,
      setupTitle: aiOutput ? aiOutput.setupTitle : algorithmicPlan.setupTitle,
      confidenceScore: aiOutput ? aiOutput.confidenceScore : algorithmicPlan.confidenceScore,
      summaryThesis: aiOutput ? aiOutput.summaryThesis : algorithmicPlan.summaryThesis,
      actionPlan: aiOutput ? aiOutput.actionPlan : algorithmicPlan.actionPlan,
      keyCatalystsAndRisks: aiOutput
        ? aiOutput.keyCatalystsAndRisks
        : algorithmicPlan.keyCatalystsAndRisks,
      isAIGenerated: Boolean(aiOutput),
      modelUsed: aiOutput?.modelUsed,
      technicalSummary: summary,
      candles: candles.slice(-250), // Send last 250 trading days for chart
      ema20Data: ema20Points.slice(-250),
      ema50Data: ema50Points.slice(-250),
      ema200Data: ema200Points.slice(-250),
      bbUpperData: bbUpperPoints.slice(-250),
      bbLowerData: bbLowerPoints.slice(-250),
    };

    return NextResponse.json(finalResult, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: unknown) {
    console.error('API /api/analyze error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Terjadi kesalahan saat memproses data saham. Pastikan koneksi internet aktif.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
