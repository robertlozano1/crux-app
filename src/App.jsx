// Import React's useState hook for managing state
import { useState } from "react";
// Import the main CSS file for styling
import "./App.css";
// Import the VitalsCard component for displaying metrics
import VitalsCard from "./VitalsCard";

// Main App component: handles all UI and logic for the Core Web Vitals Checker
function App() {
  // State for the list of domains/URLs to check
  const [domains, setDomains] = useState([""]);
  // State for storing results from the API
  const [results, setResults] = useState({});
  // State for storing raw API responses
  const [rawResponses, setRawResponses] = useState({});
  // State for loading indicator
  const [loading, setLoading] = useState(false);
  // State for error messages
  const [error, setError] = useState("");
  // State for device type (DESKTOP or PHONE)
  const [formFactor, setFormFactor] = useState("PHONE");
  // State for query type (origin or url)
  const [queryType, setQueryType] = useState("origin");
  // State to track which input field is currently focused
  const [focusedInputIndex, setFocusedInputIndex] = useState(0);

  // Helper function to format the input for API requests
  // If 'origin', strips protocol and path, returns just the domain
  // If 'url', ensures the input starts with http(s)://
  const formatUrl = (input) => {
    if (queryType === "origin") {
      let cleanDomain = input.replace(/^(https?:\/\/)?/, "");
      cleanDomain = cleanDomain.split("/")[0];
      return `https://${cleanDomain}`;
    } else {
      if (!input.startsWith("http://") && !input.startsWith("https://")) {
        return `https://${input}`;
      }
      return input;
    }
  };

  // Add a new empty domain input field
  const addDomain = () => {
    setDomains([...domains, ""]);
  };

  // Remove a domain input field by index
  const removeDomain = (index) => {
    const newDomains = domains.filter((_, i) => i !== index);
    setDomains(newDomains);
  };

  // Update the value of a domain input field
  const updateDomain = (index, value) => {
    const newDomains = [...domains];
    newDomains[index] = value;
    setDomains(newDomains);
  };

  // Handle form submission: fetch Core Web Vitals data from the API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults({});
    setRawResponses({});

    try {
      // API key and endpoint for Chrome UX Report
      const apiKey = "AIzaSyDpsObJy_AXEpfqrUVGXM0uMQmAS8Dju3o";
      const url = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`;

      const allResults = {};
      const allRawResponses = {};

      // Loop through each domain and fetch its metrics
      for (const domain of domains) {
        if (!domain.trim()) continue;

        const cleanUrl = formatUrl(domain);
        if (!cleanUrl) {
          throw new Error(`Invalid domain: ${domain}`);
        }

        // Build the request body for the API
        const requestBody = {
          formFactor: formFactor,
          [queryType]: cleanUrl,
        };

        // Make the API request
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        // Handle API errors
        if (!response.ok) {
          throw new Error(
            `API Error for ${domain}: ${
              data.error?.message || "Failed to fetch data"
            }`
          );
        }

        // Store raw API response
        allRawResponses[domain] = data;

        // Extract metrics from the response
        const metrics = data.record?.metrics || {};
        const getValue = (metricValue) => {
          if (!metricValue) return null;
          return Number(metricValue);
        };

        // Build results object for each domain
        const domainResults = {
          LCP: getValue(metrics.largest_contentful_paint?.percentiles?.p75),
          CLS: getValue(metrics.cumulative_layout_shift?.percentiles?.p75),
          INP: getValue(metrics.interaction_to_next_paint?.percentiles?.p75),
          TTFB: getValue(
            metrics.experimental_time_to_first_byte?.percentiles?.p75
          ),
          "Image TTFB": getValue(
            metrics.largest_contentful_paint_element?.ttfb?.percentiles?.p75
          ),
        };

        // Filter out null values from results
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

      // Update state with results and raw responses
      setResults(allResults);
      setRawResponses(allRawResponses);
    } catch (error) {
      console.error("Error details:", error);

      // Build a user-friendly error message
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

  // Render the main UI
  return (
    <div className="crux-app-dashboard">
      {/* Header section with logo and title */}
      <div className="dashboard-header">
        <img
          src="/images/web-vitals-logo.png"
          alt="Core Web Vitals Logo"
          className="dashboard-logo"
        />
        <h1 className="dashboard-title">Core Web Vitals Checker</h1>
      </div>
      {/* Main form for entering domains and selecting options */}
      <form onSubmit={handleSubmit} className="dashboard-form">
        <div className="form-content">
          {/* Render input fields for each domain */}
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
                  onFocus={() => setFocusedInputIndex(index)}
                  required
                />
                {/* Only show the Go button for the first input */}
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
              {/* Show remove button for additional domain inputs */}
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

          {/* Example domains and add domain button */}
          <div className="shortcut-row">
            <div className="shortcut-examples">
              <span className="shortcut-label">Examples:</span>
              {/* Example domain buttons populate the focused input */}
              {["www.homes.com", "www.apartments.com", "www.loopnet.com"].map(
                (d) => (
                  <button
                    key={d}
                    type="button"
                    className="shortcut-btn"
                    onClick={() => {
                      const newDomains = [...domains];
                      newDomains[focusedInputIndex] = d;
                      setDomains(newDomains);
                    }}
                  >
                    {d}
                  </button>
                )
              )}
            </div>
            {/* Add another domain input field */}
            <button
              type="button"
              className="add-domain-btn"
              onClick={addDomain}
              disabled={domains.length >= 4}
            >
              + Compare Another Domain
            </button>
          </div>

          {/* Query type and device form factor selectors */}
          <div
            className="form-row"
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "20px",
              position: "relative",
              margin: "20px 0",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* Label for the selector section */}
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
              {/* Data Scope selector with emoji */}
              <div
                className="query-type-field"
                style={{ display: "flex", alignItems: "center" }}
              >
                <label className="query-type-label">Data Scope:</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <select
                    className="form-factor-select"
                    value={queryType}
                    onChange={(e) => setQueryType(e.target.value)}
                  >
                    <option value="origin">Origin</option>
                    <option value="url">URL</option>
                  </select>
                  {/* Show globe or link emoji based on query type */}
                  <span
                    style={{ fontSize: "24px", marginLeft: "8px" }}
                    role="img"
                    aria-label={queryType === "origin" ? "globe" : "link"}
                  >
                    {queryType === "origin" ? "🌎" : "🔗"}
                  </span>
                </div>
              </div>

              {/* Device Form Factor selector with emoji */}
              <div
                className="query-type-field"
                style={{ display: "flex", alignItems: "center" }}
              >
                <label className="query-type-label">Device Form Factor:</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <select
                    className="form-factor-select"
                    value={formFactor}
                    onChange={(e) => setFormFactor(e.target.value)}
                  >
                    <option value="DESKTOP">Desktop</option>
                    <option value="PHONE">Mobile</option>
                  </select>
                  {/* Show desktop or mobile emoji based on form factor */}
                  <span
                    style={{ fontSize: "24px", marginLeft: "8px" }}
                    role="img"
                    aria-label={
                      formFactor === "DESKTOP"
                        ? "desktop computer"
                        : "mobile phone"
                    }
                  >
                    {formFactor === "DESKTOP" ? "🖥️" : "📱"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      {/* Show error message if there is one */}
      {error && <div className="dashboard-error">{error}</div>}
      {/* Show results if available */}
      {Object.keys(results).length > 0 && (
        <div className="dashboard-results">
          <div className="results-grid">
            {/* Render results for each domain */}
            {Object.entries(results).map(([domain, metrics]) => (
              <div key={domain} className="domain-results">
                <h2 className="domain-title">{domain}</h2>
                <div className="metrics-list">
                  {/* Render each metric using VitalsCard */}
                  {Object.entries(metrics).map(([metric, value]) => (
                    <VitalsCard
                      key={`${domain}-${metric}`}
                      metric={metric}
                      value={value}
                    />
                  ))}
                </div>
                {/* Show raw API response for debugging */}
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
