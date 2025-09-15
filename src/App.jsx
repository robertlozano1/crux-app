import { useState } from "react";
import "./App.css";
import VitalsCard from "./VitalsCard";

function App() {
  const [domains, setDomains] = useState([""]);
  const [results, setResults] = useState({});
  const [rawResponses, setRawResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formFactor, setFormFactor] = useState("PHONE"); // still using "PHONE" for API compatibility
  const [queryType, setQueryType] = useState("origin"); // "origin" or "url"

  const formatUrl = (input) => {
    if (queryType === "origin") {
      // Remove protocol if present and any paths
      let cleanDomain = input.replace(/^(https?:\/\/)?/, "");
      cleanDomain = cleanDomain.split("/")[0];
      return `https://${cleanDomain}`;
    } else {
      // For URL mode, ensure URL has protocol
      if (!input.startsWith("http://") && !input.startsWith("https://")) {
        return `https://${input}`;
      }
      return input;
    }
  };

  const addDomain = () => {
    setDomains([...domains, ""]);
  };

  const removeDomain = (index) => {
    const newDomains = domains.filter((_, i) => i !== index);
    setDomains(newDomains);
  };

  const updateDomain = (index, value) => {
    const newDomains = [...domains];
    newDomains[index] = value;
    setDomains(newDomains);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults({});
    setRawResponses({});

    try {
      const apiKey = "AIzaSyDpsObJy_AXEpfqrUVGXM0uMQmAS8Dju3o";
      const url = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`;

      const allResults = {};
      const allRawResponses = {};

      for (const domain of domains) {
        if (!domain.trim()) continue;

        const cleanUrl = formatUrl(domain);
        if (!cleanUrl) {
          throw new Error(`Invalid domain: ${domain}`);
        }

        const requestBody = {
          formFactor: formFactor,
          [queryType]: cleanUrl,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            `API Error for ${domain}: ${
              data.error?.message || "Failed to fetch data"
            }`
          );
        }

        allRawResponses[domain] = data;

        const metrics = data.record?.metrics || {};
        const getValue = (metricValue) => {
          if (!metricValue) return null;
          return Number(metricValue);
        };

        const domainResults = {
          LCP: getValue(metrics.largest_contentful_paint?.percentiles?.p75),
          CLS: getValue(metrics.cumulative_layout_shift?.percentiles?.p75),
          INP: getValue(metrics.interaction_to_next_paint?.percentiles?.p75),
          TTFB: getValue(
            metrics.experimental_time_to_first_byte?.percentiles?.p75
          ),
        };

        // Filter out null values
        allResults[domain] = Object.entries(domainResults).reduce(
          (acc, [key, value]) => {
            if (value !== null) {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );
      }

      setResults(allResults);
      setRawResponses(allRawResponses);
    } catch (error) {
      console.error("Error details:", error);

      let errorMessage = "Could not fetch Core Web Vitals. ";
      if (error.message.includes("API key not found")) {
        errorMessage +=
          "API key is missing. Please check your environment setup.";
      } else if (error.message.includes("Invalid Value")) {
        errorMessage += "Please enter valid domain names (e.g., example.com).";
      } else if (error.message.includes("No data found")) {
        errorMessage += "No Core Web Vitals data available for these domains.";
      } else if (!navigator.onLine) {
        errorMessage += "Please check your internet connection.";
      } else {
        errorMessage += error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crux-app-dashboard">
      <div className="dashboard-header">
        <img
          src="/images/web-vitals-logo.png"
          alt="Core Web Vitals Logo"
          className="dashboard-logo"
        />
        <h1 className="dashboard-title">Core Web Vitals Checker</h1>
      </div>
      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-content">
          {domains.map((domain, index) => (
            <div key={index} className="domain-input-group">
              <div className="input-with-button">
                <input
                  type="text"
                  className="dashboard-input"
                  placeholder={
                    queryType === "origin"
                      ? "Enter domain name (e.g. example.com)"
                      : "Enter URL (e.g. https://example.com/page)"
                  }
                  value={domain}
                  onChange={(e) => updateDomain(index, e.target.value)}
                  required
                />
                {index === 0 && (
                  <button
                    className="fetch-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Checking..." : "Go"}
                  </button>
                )}
              </div>
              {domains.length > 1 && (
                <button
                  type="button"
                  className="remove-domain-btn"
                  onClick={() => removeDomain(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <div className="shortcut-row">
            <span className="shortcut-label">Examples:</span>
            {["www.homes.com", "www.apartments.com", "www.loopnet.com"].map(
              (d) => (
                <button
                  key={d}
                  type="button"
                  className="shortcut-btn"
                  onClick={() => {
                    const newDomains = [...domains];
                    newDomains[0] = d;
                    setDomains(newDomains);
                  }}
                >
                  {d}
                </button>
              )
            )}
          </div>

          <div
            className="form-row"
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "20px",
              position: "relative",
              margin: "20px 0",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "-12px",
                left: "10px",
                background: "white",
                padding: "0 5px",
                color: "#666",
                fontSize: "14px",
              }}
            >
              Query Type Selector
            </span>

            <div className="query-type-grid">
              <div className="query-type-field">
                <label className="query-type-label">Data Scope:</label>
                <select
                  className="form-factor-select"
                  value={queryType}
                  onChange={(e) => setQueryType(e.target.value)}
                >
                  <option value="origin">Origin</option>
                  <option value="url">URL</option>
                </select>
              </div>

              <div className="query-type-field">
                <label className="query-type-label">Device Form Factor:</label>
                <select
                  className="form-factor-select"
                  value={formFactor}
                  onChange={(e) => setFormFactor(e.target.value)}
                >
                  <option value="DESKTOP">Desktop</option>
                  <option value="PHONE">Mobile</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="add-domain-btn"
              onClick={addDomain}
              disabled={domains.length >= 4}
            >
              Compare Domain
            </button>
          </div>
        </div>
      </form>
      {error && <div className="dashboard-error">{error}</div>}
      {Object.keys(results).length > 0 && (
        <div className="dashboard-results">
          <div className="results-grid">
            {Object.entries(results).map(([domain, metrics]) => (
              <div key={domain} className="domain-results">
                <h2 className="domain-title">{domain}</h2>
                <div className="metrics-list">
                  {Object.entries(metrics).map(([metric, value]) => (
                    <VitalsCard
                      key={`${domain}-${metric}`}
                      metric={metric}
                      value={value}
                    />
                  ))}
                </div>
                <details style={{ marginTop: "15px", textAlign: "left" }}>
                  <summary style={{ cursor: "pointer", userSelect: "none" }}>
                    Show raw API response
                  </summary>
                  <pre
                    style={{
                      fontSize: "0.9em",
                      background: "#f4f4f4",
                      padding: "10px",
                      borderRadius: "4px",
                      overflowX: "auto",
                      marginTop: "10px",
                    }}
                  >
                    {JSON.stringify(rawResponses[domain], null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
