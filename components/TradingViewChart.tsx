'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { CandleData, LinePoint } from '@/lib/types';
import { Eye, EyeOff, Layers, ZoomIn, Activity } from 'lucide-react';

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

export default function TradingViewChart({
  ticker,
  candles,
  ema20Data,
  ema50Data,
  ema200Data,
  bbUpperData,
  bbLowerData,
  support1,
  resistance1,
  stopLoss,
  targetPrice1,
  targetPrice2,
  isSqueeze,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

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

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

    // Clean up previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 480,
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
        timeVisible: true,
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

    const candleChartData = candles.map((c) => ({
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

    const volumeChartData = candles.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
    }));
    volumeSeries.setData(volumeChartData);

    // 3. EMA Series
    // EMA 20 (Amber/Yellow)
    const ema20Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      priceLineVisible: false,
      title: 'EMA 20',
      visible: showEMA20,
    });
    ema20Series.setData(ema20Data.map((d) => ({ time: d.time as Time, value: d.value })));
    ema20SeriesRef.current = ema20Series;

    // EMA 50 (Cyan)
    const ema50Series = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      priceLineVisible: false,
      title: 'EMA 50',
      visible: showEMA50,
    });
    ema50Series.setData(ema50Data.map((d) => ({ time: d.time as Time, value: d.value })));
    ema50SeriesRef.current = ema50Series;

    // EMA 200 (Purple)
    const ema200Series = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 2,
      priceLineVisible: false,
      title: 'EMA 200',
      visible: showEMA200,
    });
    ema200Series.setData(ema200Data.map((d) => ({ time: d.time as Time, value: d.value })));
    ema200SeriesRef.current = ema200Series;

    // 4. Bollinger Bands Series (Upper & Lower Bands)
    if (bbUpperData && bbUpperData.length > 0) {
      const bbUpperSeries = chart.addSeries(LineSeries, {
        color: 'rgba(56, 189, 248, 0.6)', // Sky 400
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        title: 'BB Upper',
        visible: showBollinger,
      });
      bbUpperSeries.setData(bbUpperData.map((d) => ({ time: d.time as Time, value: d.value })));
      bbUpperSeriesRef.current = bbUpperSeries;
    }

    if (bbLowerData && bbLowerData.length > 0) {
      const bbLowerSeries = chart.addSeries(LineSeries, {
        color: 'rgba(56, 189, 248, 0.6)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        title: 'BB Lower',
        visible: showBollinger,
      });
      bbLowerSeries.setData(bbLowerData.map((d) => ({ time: d.time as Time, value: d.value })));
      bbLowerSeriesRef.current = bbLowerSeries;
    }

    // 5. Price Lines for Support, Resistance, TP, SL
    if (showKeyLevels) {
      if (support1) {
        candleSeries.createPriceLine({
          price: support1,
          color: '#10b981',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Support (${support1})`,
        });
      }

      if (resistance1) {
        candleSeries.createPriceLine({
          price: resistance1,
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Resistance (${resistance1})`,
        });
      }

      if (targetPrice1) {
        candleSeries.createPriceLine({
          price: targetPrice1,
          color: '#34d399',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `🎯 TP 1 (${targetPrice1})`,
        });
      }

      if (targetPrice2) {
        candleSeries.createPriceLine({
          price: targetPrice2,
          color: '#10b981',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `🎯 TP 2 (${targetPrice2})`,
        });
      }

      if (stopLoss) {
        candleSeries.createPriceLine({
          price: stopLoss,
          color: '#f43f5e',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `🛑 Stop Loss (${stopLoss})`,
        });
      }
    }

    // Auto-fit content
    chart.timeScale().fitContent();

    // Resize Observer
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
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
  }, [candles, ema20Data, ema50Data, ema200Data, bbUpperData, bbLowerData, showKeyLevels, showEMA20, showEMA50, showEMA200, showBollinger, support1, resistance1, targetPrice1, targetPrice2, stopLoss]);

  // Handle toggles dynamically
  const toggleEMA20 = () => {
    const next = !showEMA20;
    setShowEMA20(next);
    ema20SeriesRef.current?.applyOptions({ visible: next });
  };

  const toggleEMA50 = () => {
    const next = !showEMA50;
    setShowEMA50(next);
    ema50SeriesRef.current?.applyOptions({ visible: next });
  };

  const toggleEMA200 = () => {
    const next = !showEMA200;
    setShowEMA200(next);
    ema200SeriesRef.current?.applyOptions({ visible: next });
  };

  const toggleBollinger = () => {
    const next = !showBollinger;
    setShowBollinger(next);
    bbUpperSeriesRef.current?.applyOptions({ visible: next });
    bbLowerSeriesRef.current?.applyOptions({ visible: next });
  };

  const handleResetZoom = () => {
    chartInstanceRef.current?.timeScale().fitContent();
  };

  return (
    <div className="bg-[#0b0f19] border border-[#162035] rounded-xl p-4 sm:p-5 shadow-lg">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-3 border-b border-[#141d30]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#131b2e] border border-[#1f2d4d] flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-200">
            Interactive Daily Candlestick ({ticker}.JK)
          </span>
          {isSqueeze && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800 flex items-center gap-1">
              🔥 BB Squeeze
            </span>
          )}
        </div>

        {/* Legend & Toggle Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* EMA 20 */}
          <button
            onClick={toggleEMA20}
            className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors flex items-center gap-1 border ${
              showEMA20
                ? 'bg-amber-950/50 border-amber-800/80 text-amber-300'
                : 'bg-[#101420] border-[#1a2236] text-slate-500 line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            EMA 20
          </button>

          {/* EMA 50 */}
          <button
            onClick={toggleEMA50}
            className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors flex items-center gap-1 border ${
              showEMA50
                ? 'bg-cyan-950/50 border-cyan-800/80 text-cyan-300'
                : 'bg-[#101420] border-[#1a2236] text-slate-500 line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
            EMA 50
          </button>

          {/* EMA 200 */}
          <button
            onClick={toggleEMA200}
            className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors flex items-center gap-1 border ${
              showEMA200
                ? 'bg-purple-950/50 border-purple-800/80 text-purple-300'
                : 'bg-[#101420] border-[#1a2236] text-slate-500 line-through'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            EMA 200
          </button>

          {/* Bollinger Bands Toggle */}
          <button
            onClick={toggleBollinger}
            className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors flex items-center gap-1 border ${
              showBollinger
                ? 'bg-sky-950/50 border-sky-800/80 text-sky-300'
                : 'bg-[#101420] border-[#1a2236] text-slate-400'
            }`}
          >
            <Activity className="w-3 h-3" />
            Bollinger
          </button>

          {/* Key Levels Toggle */}
          <button
            onClick={() => setShowKeyLevels(!showKeyLevels)}
            className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors flex items-center gap-1 border ${
              showKeyLevels
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                : 'bg-[#101420] border-[#1a2236] text-slate-400'
            }`}
          >
            {showKeyLevels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Levels
          </button>

          {/* Fit Zoom */}
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1 rounded bg-[#101420] hover:bg-[#151b2c] border border-[#1a2236] text-slate-400 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div
        ref={chartContainerRef}
        className="w-full rounded overflow-hidden relative"
        style={{ minHeight: '460px' }}
      />

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-[#161c2c]">
        <span>Scroll / pinch untuk zoom, geser untuk navigasi waktu.</span>
        <span className="font-mono">Timeframe: 1D</span>
      </div>
    </div>
  );
}
