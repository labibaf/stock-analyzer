import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { normalizeIDXTicker } from '@/lib/idx-rules';
import { CandleData, ChartTimeframe } from '@/lib/types';
import { calculateEMA, calculateBollingerBands } from '@/lib/technical-analysis';

// Initialize YahooFinance instance
const yf = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawTicker = searchParams.get('ticker') || 'BBCA';
  const intervalParam = (searchParams.get('interval') || '1d') as ChartTimeframe;

  try {
    const { cleanSymbol, yahooSymbol } = normalizeIDXTicker(rawTicker);

    if (!cleanSymbol || cleanSymbol.length < 2) {
      return NextResponse.json(
        { error: 'Kode ticker saham tidak valid.' },
        { status: 400 }
      );
    }

    // Determine query parameters based on timeframe
    let yfInterval: '15m' | '60m' | '1d' | '1wk' | '1mo' = '1d';
    let lookbackDays = 550;

    switch (intervalParam) {
      case '15m':
        yfInterval = '15m';
        lookbackDays = 30; // 30 days of 15m data
        break;
      case '1h':
        yfInterval = '60m';
        lookbackDays = 90; // 90 days of 1h data
        break;
      case '1d':
        yfInterval = '1d';
        lookbackDays = 550; // ~2 years for EMA 200
        break;
      case '1wk':
        yfInterval = '1wk';
        lookbackDays = 365 * 5; // 5 years of weekly data
        break;
      case '1mo':
        yfInterval = '1mo';
        lookbackDays = 365 * 10; // 10 years of monthly data
        break;
      default:
        yfInterval = '1d';
        lookbackDays = 550;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    const chartResult = await yf.chart(yahooSymbol, {
      period1: startDate.toISOString().split('T')[0],
      interval: yfInterval,
    });

    if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
      return NextResponse.json(
        { error: `Data candlestick ${intervalParam} untuk ${cleanSymbol} tidak ditemukan.` },
        { status: 404 }
      );
    }

    const isIntraday = intervalParam === '15m' || intervalParam === '1h';

    // Parse and sort quotes
    const rawQuotes = chartResult.quotes
      .filter(
        (q) => q.open != null && q.close != null && q.high != null && q.low != null
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const candles: CandleData[] = rawQuotes.map((q) => {
      const dateObj = q.date instanceof Date ? q.date : new Date(q.date);
      const time = isIntraday
        ? Math.floor(dateObj.getTime() / 1000)
        : dateObj.toISOString().split('T')[0];

      return {
        time,
        open: Math.round(q.open!),
        high: Math.round(q.high!),
        low: Math.round(q.low!),
        close: Math.round(q.close!),
        volume: Math.round(q.volume || 0),
      };
    });

    // Remove duplicate timestamps if any
    const uniqueCandles: CandleData[] = [];
    const seenTimes = new Set<string | number>();
    for (const c of candles) {
      if (!seenTimes.has(c.time)) {
        seenTimes.add(c.time);
        uniqueCandles.push(c);
      }
    }

    // Calculate EMAs and Bollinger Bands for the requested timeframe
    const ema20Points = calculateEMA(uniqueCandles, 20);
    const ema50Points = calculateEMA(uniqueCandles, 50);
    const ema200Points = calculateEMA(uniqueCandles, 200);
    const { upperSeries: bbUpperPoints, lowerSeries: bbLowerPoints } =
      calculateBollingerBands(uniqueCandles, 20, 2);

    return NextResponse.json({
      ticker: cleanSymbol,
      interval: intervalParam,
      candles: uniqueCandles,
      ema20: ema20Points,
      ema50: ema50Points,
      ema200: ema200Points,
      bbUpper: bbUpperPoints,
      bbLower: bbLowerPoints,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memuat data candlestick.';
    console.error('Candles fetch error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
