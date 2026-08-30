"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from "lightweight-charts";

type PricePoint = { time: number; value: number; };

export default function PriceChart({ data }: { data: PricePoint[] }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Konversi data line ke candlestick simulasi
    const candles = data.map((d, i) => {
      const prev = i > 0 ? data[i-1].value : d.value;
      const change = (Math.random() - 0.48) * d.value * 0.1;
      const open  = prev;
      const close = d.value;
      const high  = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low   = Math.min(open, close) * (1 - Math.random() * 0.02);
      return { time: d.time as any, open, high, low, close };
    });

    const volumes = data.map((d, i) => {
      const prev = i > 0 ? data[i-1].value : d.value;
      const isUp = d.value >= prev;
      return {
        time: d.time as any,
        value: Math.random() * 1000000 + 100000,
        color: isUp ? "rgba(52,211,153,0.4)" : "rgba(239,68,68,0.4)",
      };
    });

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748B",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(28,34,53,0.8)" },
        horzLines: { color: "rgba(28,34,53,0.8)" },
      },
      width: chartRef.current.clientWidth,
      height: 320,
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
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#2563EB",
          width: 1,
          style: 2,
          labelBackgroundColor: "#2563EB",
        },
        horzLine: {
          color: "#2563EB",
          width: 1,
          style: 2,
          labelBackgroundColor: "#2563EB",
        },
      },
    });

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:          "#34D399",
      downColor:        "#EF4444",
      borderUpColor:    "#34D399",
      borderDownColor:  "#EF4444",
      wickUpColor:      "#34D399",
      wickDownColor:    "#EF4444",
    });
    candleSeries.setData(candles);

    // Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(volumes);

    chart.timeScale().fitContent();

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