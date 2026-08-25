'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  IChartApi,
  ISeriesApi,
  LineStyle,
  Time,
} from 'lightweight-charts';
import { CandleData, LinePoint, ChartTimeframe } from '@/lib/types';
import { Eye, EyeOff, Layers, ZoomIn, Activity, Clock, Loader2 } from 'lucide-react';

interface TradingViewChartProps {
  ticker: string;
  candles: CandleData[];
  ema20Data: LinePoint[];
  ema50Data: LinePoint[];
  ema200Data: LinePoint[];
  bbUpperData?: LinePoint[];
  bbLowerData?: LinePoint[];
  support1?: number;
  resistance1?: number;
  stopLoss?: number;
  targetPrice1?: number;
  targetPrice2?: number;
  isSqueeze?: boolean;
}

const TIMEFRAME_OPTIONS: { label: string; value: ChartTimeframe; title: string }[] = [
  { label: '15m', value: '15m', title: '15 Menit (Intraday Momentum)' },
  { label: '1h', value: '1h', title: '1 Jam (Short-term Swing)' },
  { label: '1D', value: '1d', title: 'Daily (Primary Swing Trading)' },
  { label: '1W', value: '1wk', title: 'Weekly (Major Multi-month Trend)' },
  { label: '1M', value: '1mo', title: 'Monthly (Macro Multi-year Structure)' },
];

export default function TradingViewChart({
  ticker,
  candles: initialCandles,
  ema20Data: initialEma20,
  ema50Data: initialEma50,
  ema200Data: initialEma200,
  bbUpperData: initialBbUpper,
  bbLowerData: initialBbLower,
  support1,
  resistance1,
  stopLoss,
  targetPrice1,
  targetPrice2,
  isSqueeze,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  // Timeframe state
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>('1d');
  const [isLoadingTimeframe, setIsLoadingTimeframe] = useState(false);

  // Active chart data
  const [activeCandles, setActiveCandles] = useState<CandleData[]>(initialCandles);
  const [activeEma20, setActiveEma20] = useState<LinePoint[]>(initialEma20);
  const [activeEma50, setActiveEma50] = useState<LinePoint[]>(initialEma50);
  const [activeEma200, setActiveEma200] = useState<LinePoint[]>(initialEma200);
  const [activeBbUpper, setActiveBbUpper] = useState<LinePoint[] | undefined>(initialBbUpper);
  const [activeBbLower, setActiveBbLower] = useState<LinePoint[] | undefined>(initialBbLower);

  // Layer Visibility Toggles
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showKeyLevels, setShowKeyLevels] = useState(true);

  // References to series instances for toggling
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);



  // Fetch timeframe candles
  const handleSelectTimeframe = useCallback(
    async (tf: ChartTimeframe) => {
      if (tf === selectedTimeframe) return;
      setSelectedTimeframe(tf);

      if (tf === '1d') {
        setActiveCandles(initialCandles);
        setActiveEma20(initialEma20);
        setActiveEma50(initialEma50);
        setActiveEma200(initialEma200);
        setActiveBbUpper(initialBbUpper);
        setActiveBbLower(initialBbLower);
        return;
      }

      setIsLoadingTimeframe(true);
      try {
        const res = await fetch(`/api/candles?ticker=${ticker}&interval=${tf}`);
        const data = await res.json();
        if (data.candles && data.candles.length > 0) {
          setActiveCandles(data.candles);
          setActiveEma20(data.ema20 || []);
          setActiveEma50(data.ema50 || []);
          setActiveEma200(data.ema200 || []);
          setActiveBbUpper(data.bbUpper || []);
          setActiveBbLower(data.bbLower || []);
        }
      } catch (err) {
        console.error('Failed to load timeframe candles:', err);
      } finally {
        setIsLoadingTimeframe(false);
      }
    },
    [
      selectedTimeframe,
      ticker,
      initialCandles,
      initialEma20,
      initialEma50,
      initialEma200,
      initialBbUpper,
      initialBbLower,
    ]
  );

  useEffect(() => {
    if (!chartContainerRef.current || activeCandles.length === 0) return;

    // Clean up previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;

    const isIntraday = selectedTimeframe === '15m' || selectedTimeframe === '1h';

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientWidth < 640 ? 360 : 480,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: '#131b2e' },
        horzLines: { color: '#131b2e' },
      },
      crosshair: {
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7',
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7',
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25, // Leave room for volume overlay
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: isIntraday,
        secondsVisible: false,
      },
    });

    chartInstanceRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // Emerald 500
      downColor: '#f43f5e', // Rose 500
      borderUpColor: '#10b981',
      borderDownColor: '#f43f5e',
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    const candleChartData = activeCandles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(candleChartData);

    // 2. Volume Histogram Overlay
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay mode
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.75, // Lower 25% area
        bottom: 0,
      },
    });

    const volumeChartData = activeCandles.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)',
    }));
    volumeSeries.setData(volumeChartData);

    // 3. EMA 20 (Amber)
    const ema20Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'EMA 20',
      visible: showEMA20,
    });
    ema20Series.setData(activeEma20.map((p) => ({ time: p.time as Time, value: p.value })));
    ema20SeriesRef.current = ema20Series;

    // 4. EMA 50 (Cyan)
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      title: 'EMA 50',
      visible: showEMA50,
    });
    ema50Series.setData(activeEma50.map((p) => ({ time: p.time as Time, value: p.value })));
    ema50SeriesRef.current = ema50Series;

    // 5. EMA 200 (Purple)
    const ema200Series = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 2,
      title: 'EMA 200',
      visible: showEMA200,
    });
    ema200Series.setData(activeEma200.map((p) => ({ time: p.time as Time, value: p.value })));
    ema200SeriesRef.current = ema200Series;

    // 6. Bollinger Bands Upper & Lower (Sky Blue Dashed)
    if (activeBbUpper && activeBbUpper.length > 0) {
      const bbUpperSeries = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        title: 'BB Upper',
        visible: showBollinger,
      });
      bbUpperSeries.setData(activeBbUpper.map((p) => ({ time: p.time as Time, value: p.value })));
      bbUpperSeriesRef.current = bbUpperSeries;
    }

    if (activeBbLower && activeBbLower.length > 0) {
      const bbLowerSeries = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        title: 'BB Lower',
        visible: showBollinger,
      });
      bbLowerSeries.setData(activeBbLower.map((p) => ({ time: p.time as Time, value: p.value })));
      bbLowerSeriesRef.current = bbLowerSeries;
    }

    // 7. Key Horizontal Price Levels (Support, Resistance, SL, TP)
    if (showKeyLevels) {
      if (targetPrice2) {
        candleSeries.createPriceLine({
          price: targetPrice2,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'TP2 Target',
        });
      }

      if (targetPrice1) {
        candleSeries.createPriceLine({
          price: targetPrice1,
          color: '#34d399',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'TP1 Target',
        });
      }

      if (resistance1 && resistance1 !== targetPrice1) {
        candleSeries.createPriceLine({
          price: resistance1,
          color: '#fbbf24',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'R1 Resisten',
        });
      }

      if (support1) {
        candleSeries.createPriceLine({
          price: support1,
          color: '#38bdf8',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'S1 Support',
        });
      }

      if (stopLoss) {
        candleSeries.createPriceLine({
          price: stopLoss,
          color: '#f43f5e',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'Stop Loss',
        });
      }
    }

    // Fit content into viewport smoothly
    chart.timeScale().fitContent();

    // Responsive window resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientWidth < 640 ? 360 : 480,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [
    activeCandles,
    activeEma20,
    activeEma50,
    activeEma200,
    activeBbUpper,
    activeBbLower,
    showEMA20,
    showEMA50,
    showEMA200,
    showBollinger,
    showKeyLevels,
    support1,
    resistance1,
    stopLoss,
    targetPrice1,
    targetPrice2,
    selectedTimeframe,
  ]);

  const handleResetZoom = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-[#162035] rounded-xl p-4 sm:p-5 shadow-lg">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-3 border-b border-[#141d30]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#131b2e] border border-[#1f2d4d] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              Interactive Candlestick ({ticker}.JK)
            </span>
            {isSqueeze && (
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800 flex items-center gap-1">
                🔥 Squeeze
              </span>
            )}
          </div>

          {/* Timeframe Selector Pills */}
          <div className="flex items-center bg-[#070a12] p-1 rounded-lg border border-[#131b2e] text-xs">
            <span className="text-[10px] text-slate-500 font-mono px-1.5 hidden sm:inline flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> TF:
            </span>
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.value}
                onClick={() => handleSelectTimeframe(tf.value)}
                disabled={isLoadingTimeframe}
                title={tf.title}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  selectedTimeframe === tf.value
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131b2e]'
                }`}
              >
                {tf.label}
              </button>
            ))}
            {isLoadingTimeframe && (
              <Loader2 className="w-3 h-3 text-sky-400 animate-spin ml-1.5 mr-1" />
            )}
          </div>
        </div>

        {/* Indicators Overlay Toggles & Reset Zoom */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* EMA 20 Toggle */}
          <button
            onClick={() => setShowEMA20(!showEMA20)}
            className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
              showEMA20
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-[#101420] text-slate-500 border-[#1a2236]'
            }`}
          >
            {showEMA20 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>EMA 20</span>
          </button>

          {/* EMA 50 Toggle */}
          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
              showEMA50
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-[#101420] text-slate-500 border-[#1a2236]'
            }`}
          >
            {showEMA50 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>EMA 50</span>
          </button>

          {/* EMA 200 Toggle */}
          <button
            onClick={() => setShowEMA200(!showEMA200)}
            className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
              showEMA200
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                : 'bg-[#101420] text-slate-500 border-[#1a2236]'
            }`}
          >
            {showEMA200 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>EMA 200</span>
          </button>

          {/* Bollinger Bands Toggle */}
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
              showBollinger
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : 'bg-[#101420] text-slate-500 border-[#1a2236]'
            }`}
          >
            {showBollinger ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Bollinger (20,2)</span>
          </button>

          {/* Key Levels Toggle */}
          <button
            onClick={() => setShowKeyLevels(!showKeyLevels)}
            className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
              showKeyLevels
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-[#101420] text-slate-500 border-[#1a2236]'
            }`}
          >
            {showKeyLevels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Level SL/TP</span>
          </button>

          {/* Reset Zoom Button */}
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 bg-[#101420] hover:bg-[#161c2c] border border-[#1a2236] text-slate-400 hover:text-slate-200 rounded-md transition-colors flex items-center gap-1 font-mono text-[11px]"
            title="Reset Zoom Chart"
          >
            <ZoomIn className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div
        ref={chartContainerRef}
        className="w-full rounded-lg overflow-hidden border border-[#131b2e] bg-[#090d16]"
      />

      {/* Legend and Indicator Notes */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-[#141d30] text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
            <span>EMA 20</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
            <span>EMA 50</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-purple-400 inline-block" />
            <span>EMA 200</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-400 border-b border-dashed inline-block" />
            <span>Bollinger Bands</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
            <span>TP1 / TP2 Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
            <span>Stop Loss</span>
          </div>
        </div>

        <div className="text-slate-500 flex items-center gap-1">
          <Activity className="w-3 h-3 text-sky-400" />
          <span>TradingView Lightweight Canvas • Interactive Pan & Zoom</span>
        </div>
      </div>
    </div>
  );
}
