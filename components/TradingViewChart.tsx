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
import { CandleData, EMAPoint } from '@/lib/types';
import { Eye, EyeOff, Layers, ZoomIn } from 'lucide-react';

interface TradingViewChartProps {
  ticker: string;
  candles: CandleData[];
  ema20Data: EMAPoint[];
  ema50Data: EMAPoint[];
  ema200Data: EMAPoint[];
  support1?: number;
  resistance1?: number;
  stopLoss?: number;
  targetPrice1?: number;
  targetPrice2?: number;
}

export default function TradingViewChart({
  ticker,
  candles,
  ema20Data,
  ema50Data,
  ema200Data,
  support1,
  resistance1,
  stopLoss,
  targetPrice1,
  targetPrice2,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  // Layer Visibility Toggles
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(true);
  const [showKeyLevels, setShowKeyLevels] = useState(true);

  // References to series instances for toggling
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

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

    // 4. Price Lines for Support, Resistance, TP, SL
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
  }, [candles, ema20Data, ema50Data, ema200Data, showKeyLevels, showEMA20, showEMA50, showEMA200, support1, resistance1, targetPrice1, targetPrice2, stopLoss]);

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

  const handleResetZoom = () => {
    chartInstanceRef.current?.timeScale().fitContent();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold text-slate-200">
            Interactive Daily Candlestick ({ticker}.JK)
          </span>
        </div>

        {/* Legend & Toggle Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* EMA 20 */}
          <button
            onClick={toggleEMA20}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
              showEMA20
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            EMA 20
          </button>

          {/* EMA 50 */}
          <button
            onClick={toggleEMA50}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
              showEMA50
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            EMA 50
          </button>

          {/* EMA 200 */}
          <button
            onClick={toggleEMA200}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
              showEMA200
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            EMA 200
          </button>

          {/* Key Levels Toggle */}
          <button
            onClick={() => setShowKeyLevels(!showKeyLevels)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
              showKeyLevels
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {showKeyLevels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Levels & Targets
          </button>

          {/* Fit Zoom */}
          <button
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div
        ref={chartContainerRef}
        className="w-full rounded-xl overflow-hidden relative"
        style={{ minHeight: '480px' }}
      />

      <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
        <span>Gunakan scroll mouse / pinch untuk zoom in-out, klik-geser untuk menggeser rentang waktu.</span>
        <span className="font-mono">Timeframe: 1D (Daily)</span>
      </div>
    </div>
  );
}
