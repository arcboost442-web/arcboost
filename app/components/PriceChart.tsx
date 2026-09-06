"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from "lightweight-charts";

type PricePoint = { time: number; value: number; volume?: number };

const CANDLE_INTERVAL = 3600; // 1 jam, dalam detik

function aggregateToCandles(data: PricePoint[]) {
  const filtered = data
    .filter(d => d.value > 0)
    .sort((a, b) => a.time - b.time);

  if (filtered.length === 0) return [];

  const buckets = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>();

  for (const point of filtered) {
    const bucketTime = Math.floor(point.time / CANDLE_INTERVAL) * CANDLE_INTERVAL;
    const existing = buckets.get(bucketTime);
    if (!existing) {
      buckets.set(bucketTime, {
        open: point.value,
        high: point.value,
        low: point.value,
        close: point.value,
        volume: point.volume || 0,
      });
    } else {
      existing.high = Math.max(existing.high, point.value);
      existing.low = Math.min(existing.low, point.value);
      existing.close = point.value;
      existing.volume += point.volume || 0;
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([time, c]) => ({ time, ...c }));
}

export default function PriceChart({ data }: { data: PricePoint[] }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const candles = aggregateToCandles(data);
    if (candles.length === 0) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748B",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(28,34,53,0.6)" },
        horzLines: { color: "rgba(28,34,53,0.6)" },
      },
      width: chartRef.current.clientWidth,
      height: 300,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1C2235",
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: "#1C2235",
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderUpColor: "#22C55E",
      borderDownColor: "#EF4444",
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
      priceLineVisible: false,
    });
    candleSeries.setData(candles.map(c => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(candles.map(c => ({
      time: c.time as any,
      value: c.volume,
      color: c.close >= c.open ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
    })));

    if (candles.length <= 5) {
      chart.timeScale().applyOptions({ barSpacing: 24, rightOffset: 8 });
    } else {
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); chart.remove(); };
  }, [data]);

  if (data.length === 0) return null;
  return <div ref={chartRef} style={{ width: "100%", borderRadius: "8px", overflow: "hidden" }} />;
}
