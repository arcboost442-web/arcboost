"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle, LineSeries, AreaSeries } from "lightweight-charts";

type PricePoint = { time: number; value: number; };

export default function PriceChart({ data }: { data: PricePoint[] }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Filter out zero values dan sort by time
    const filtered = data
      .filter(d => d.value > 0)
      .sort((a, b) => a.time - b.time)
      .filter((d, i, arr) => i === 0 || d.time !== arr[i-1].time);

    if (filtered.length === 0) return;

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
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      crosshair: {
        vertLine: {
          color: "#3B82F6",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#2563EB",
        },
        horzLine: {
          color: "#3B82F6",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#2563EB",
        },
      },
    });

    // Area series — clean gradient seperti DexScreener
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#3B82F6",
      topColor: "rgba(37,99,235,0.3)",
      bottomColor: "rgba(37,99,235,0.0)",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: "#3B82F6",
      crosshairMarkerBackgroundColor: "#0F1A35",
    });

    areaSeries.setData(filtered.map(d => ({ time: d.time as any, value: d.value })));
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