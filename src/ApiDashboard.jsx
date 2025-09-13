import React from "react";
import "./ApiDashboard.css";

function formatMetric(metric) {
  if (!metric) return "N/A";
  if (metric.percentile) {
    // LCP is in ms, convert to s
    if (metric.unit === "millisecond" && metric.category === "LCP") {
      return `${(metric.percentile / 1000).toFixed(2)}s`;
    }
    // CLS is unitless
    if (metric.unit === "unitless" && metric.category === "CLS") {
      return metric.percentile.toFixed(2);
    }
    // INP, TTFB in ms
    return `${metric.percentile}ms`;
  }
  return "N/A";
}

export default function ApiDashboard({ rawResponse }) {
  if (!rawResponse || !rawResponse.record) return null;
  const metrics = rawResponse.record.metrics || {};
  return (
    <div className="api-dashboard">
      <h3>API Metrics Summary</h3>
      <div className="api-metrics-grid">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="api-metric-card">
            <div className="api-metric-title">
              {key.replace(/_/g, " ").toUpperCase()}
            </div>
            <div className="api-metric-value">
              {formatMetric({
                percentile: value.percentile,
                unit: value.unit,
                category: key.toUpperCase(),
              })}
            </div>
            <div className="api-metric-details">
              <span>Unit: {value.unit || "N/A"}</span>
              <span>Category: {key.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>
      <details style={{ marginTop: "18px", textAlign: "left" }}>
        <summary>Show full API response</summary>
        <pre
          style={{
            fontSize: "0.85em",
            background: "#f4f4f4",
            padding: "10px",
            borderRadius: "8px",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(rawResponse, null, 2)}
        </pre>
      </details>
    </div>
  );
}
