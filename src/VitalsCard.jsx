import React from 'react';
import './VitalsCard.css';

// Core Web Vitals thresholds as per Google's guidelines
const thresholds = {
  LCP: { good: 2.5, poor: 4.0 }, // seconds
  CLS: { good: 0.1, poor: 0.25 }, // unitless
  INP: { good: 200, poor: 500 }, // milliseconds
  TTFB: { good: 800, poor: 1800 }, // milliseconds
};

const getScoreCategory = (metric, value) => {
  if (!value || value === 'N/A') return 'unknown';
  
  let normalizedValue = value;
  
  // Convert LCP from ms to seconds for comparison
  if (metric === 'LCP') {
    normalizedValue = value / 1000;
  }

  const threshold = thresholds[metric];
  if (normalizedValue <= threshold.good) return 'good';
  if (normalizedValue <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

const formatValue = (metric, value) => {
  if (value == null) return 'N/A';
  switch (metric) {
    case 'LCP':
      return value.toFixed(0) + 'ms';
    case 'CLS':
      return value.toFixed(3);
    case 'INP':
    case 'TTFB':
      return value.toFixed(0) + 'ms';
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
    TTFB: "Time to First Byte measures server response time"
  };

  return (
    <div className={'vital-card ' + scoreCategory}>
      <div className="vital-header">
        <h3 className="vital-name">{metric}</h3>
        <span className="vital-score">{formattedValue}</span>
      </div>
      <div className="vital-description">{descriptions[metric]}</div>
      <div className="score-indicator">
        <div className="score-label">{scoreCategory.replace('-', ' ')}</div>
        <div className="score-bars">
          <div className={'bar good ' + (scoreCategory === 'good' ? 'active' : '')} />
          <div className={'bar needs-improvement ' + (scoreCategory === 'needs-improvement' ? 'active' : '')} />
          <div className={'bar poor ' + (scoreCategory === 'poor' ? 'active' : '')} />
        </div>
      </div>
    </div>
  );
};

export default VitalsCard;