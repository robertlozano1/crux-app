// Simple bar chart for vitals
import React from "react";
import "./VitalsChart.css";

const VITAL_COLORS = {
  LCP: "#646cff",
  CLS: "#ffb300",
  INP: "#00bfae",
  TTFB: "#d32f2f",
};

export default function VitalsChart({ results }) {
  if (!results) return null;
  // Parse numeric values for chart
  const values = {
    LCP: parseFloat(results.LCP) || 0,
    CLS: parseFloat(results.CLS) || 0,
    INP: parseFloat(results.INP) || 0,
    TTFB: parseFloat(results.TTFB) || 0,
  };
  // Find max for scaling
  const max = Math.max(...Object.values(values));
  return (
    <div className="vitals-chart">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="chart-row">
          <span className="chart-label">{key}</span>
          <div className="chart-bar-bg">
            <div
              className="chart-bar"
              style={{
                width: `${max ? (value / max) * 100 : 0}%`,
                background: VITAL_COLORS[key],
              }}
            >
              <span className="chart-value">{results[key]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
