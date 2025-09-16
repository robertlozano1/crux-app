import React from "react";
import "./VitalsCard.css";

// Core Web Vitals thresholds as per Google's guidelines
const thresholds = {
  LCP: { good: 2.5, poor: 4.0 }, // seconds
  CLS: { good: 0.1, poor: 0.25 }, // unitless
  INP: { good: 200, poor: 500 }, // milliseconds
  TTFB: { good: 800, poor: 1800 }, // milliseconds
  "Image TTFB": { good: 800, poor: 1800 }, // milliseconds
};

const getScoreCategory = (metric, value) => {
  if (value === null || value === undefined || value === "N/A")
    return "unknown";

  let normalizedValue = value;

  // Convert LCP from ms to seconds for comparison
  if (metric === "LCP") {
    normalizedValue = value / 1000;
  }

  const threshold = thresholds[metric];
  if (normalizedValue <= threshold.good) return "good";
  if (normalizedValue <= threshold.poor) return "needs-improvement";
  return "poor";
};

const formatValue = (metric, value) => {
  if (value == null) return "N/A";
  switch (metric) {
    case "LCP":
      return value.toFixed(0) + "ms";
    case "CLS":
      return value.toFixed(3);
    case "INP":
    case "TTFB":
    case "Image TTFB":
      return value.toFixed(0) + "ms";
    default:
      return value.toString();
  }
};

const VitalsCard = ({ metric, value }) => {
  const scoreCategory = getScoreCategory(metric, value);
  const formattedValue = formatValue(metric, value);

  const descriptions = {
    LCP: "Largest Contentful Paint measures loading performance",
    CLS: "Cumulative Layout Shift measures visual stability",
    INP: "Interaction to Next Paint measures responsiveness",
    "Image TTFB": "Time to First Byte for the LCP image",
    TTFB: "Time to First Byte measures server response time",
  };

  // Calculate the percentage for the value bar
  const calculateValuePercentage = () => {
    if (!value || value === "N/A") return 0;

    let normalizedValue = value;
    let threshold = thresholds[metric];

    // Convert LCP from ms to seconds for comparison
    if (metric === "LCP") {
      normalizedValue = value / 1000;
    }

    // Calculate percentage based on thresholds
    if (normalizedValue <= threshold.good) {
      return (normalizedValue / threshold.good) * 33.33;
    } else if (normalizedValue <= threshold.poor) {
      return (
        33.33 +
        ((normalizedValue - threshold.good) /
          (threshold.poor - threshold.good)) *
          33.33
      );
    } else {
      return Math.min(
        100,
        66.66 + ((normalizedValue - threshold.poor) / threshold.poor) * 33.33
      );
    }
  };

  return (
    <div className="vital-metric-row">
      <div className="metric-info">
        <span className="metric-name tooltip-container">
          {metric}
          <span className="tooltip-text">{descriptions[metric]}</span>
        </span>
        <span className={`metric-value ${scoreCategory}`}>
          {formattedValue}
        </span>
      </div>
      <div className="metric-bar-container">
        <div className="threshold-markers">
          <div className="threshold good" style={{ left: "33.33%" }} />
          <div
            className="threshold needs-improvement"
            style={{ left: "66.66%" }}
          />
        </div>
        <div className="value-bar-container">
          <div
            className={`value-bar ${scoreCategory}`}
            style={{ width: `${calculateValuePercentage()}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default VitalsCard;
