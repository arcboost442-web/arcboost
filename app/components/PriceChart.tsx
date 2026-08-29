"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle, LineSeries } from "lightweight-charts";

type PricePoint = { time: number; value: number; };

export default function PriceChart({ data }: { data: PricePoint[] }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748B",
      },
      grid: {
        vertLines: { color: "#1C2235" },
        horzLines: { color: "#1C2235" },
      },
      width: chartRef.current.clientWidth,
      height: 280,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1C2235",
      },
      rightPriceScale: {
        borderColor: "#1C2235",
      },
      crosshair: {
        vertLine: { color: "#2563EB", style: LineStyle.Dashed, width: 1 },
        horzLine: { color: "#2563EB", style: LineStyle.Dashed, width: 1 },
      },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#3B82F6",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: "#3B82F6",
      crosshairMarkerBackgroundColor: "#0F1A35",
    });

    lineSeries.setData(data);
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