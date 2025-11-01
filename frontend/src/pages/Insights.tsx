import React, { useEffect, useState } from 'react';
import { getInsights, InsightData as InsightDataType } from '../services/expenseService';
import './Insights.css';

const Insights: React.FC = () => {
  const [insights, setInsights] = useState<InsightDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await getInsights();
      setInsights(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="insights-wrapper">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>💰 VegaKash</h1>
            <span className="nav-tagline">AI-Powered Financial Insights</span>
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">Home</a>
            <a href="/insights" className="nav-link active">Insights</a>
            <a href="/reports" className="nav-link">Reports</a>
            <a href="/settings" className="nav-link">Settings</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h2>🧠 AI-Powered Financial Insights</h2>
            <p>Discover spending patterns, get smart recommendations, and optimize your financial health</p>
          </div>
        </section>

        {/* Content Section */}
        <section className="insights-content">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Analyzing your financial data...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchInsights}>
                Try Again
              </button>
            </div>
          )}

          {insights && (
            <div className="insights-grid">
              {/* Total Spent Card */}
              <div className="insight-card featured-card">
                <div className="card-header">
                  <div className="card-icon">💰</div>
                  <h3>Total Spending</h3>
                </div>
                <div className="card-content">
                  <div className="amount-display">₹{insights.total_spent.toLocaleString()}</div>
                  <p className="card-subtitle">This month's total expenses</p>
                </div>
              </div>

              {/* Top Categories */}
              <div className="insight-card">
                <div className="card-header">
                  <div className="card-icon">📊</div>
                  <h3>Top Spending Categories</h3>
                </div>
                <div className="card-content">
                  {insights.top_categories.length > 0 ? (
                    <ul className="insight-list">
                      {insights.top_categories.map((cat, i) => (
                        <li key={i} className="insight-item">
                          <span className="item-rank">#{i + 1}</span>
                          <span className="item-text">{cat}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">No categories data available</p>
                  )}
                </div>
              </div>

              {/* Spending Patterns */}
              <div className="insight-card">
                <div className="card-header">
                  <div className="card-icon">📈</div>
                  <h3>Spending Patterns</h3>
                </div>
                <div className="card-content">
                  {insights.patterns.length > 0 ? (
                    <ul className="insight-list">
                      {insights.patterns.map((pattern, i) => (
                        <li key={i} className="insight-item">
                          <span className="pattern-bullet">•</span>
                          <span className="item-text">{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">No patterns detected yet</p>
                  )}
                </div>
              </div>

              {/* Outliers */}
              <div className="insight-card warning-card">
                <div className="card-header">
                  <div className="card-icon">⚡</div>
                  <h3>Unusual Expenses</h3>
                </div>
                <div className="card-content">
                  {insights.outliers.length > 0 ? (
                    <ul className="insight-list">
                      {insights.outliers.map((outlier, i) => (
                        <li key={i} className="insight-item">
                          <span className="outlier-indicator">!</span>
                          <span className="item-text">{outlier}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">No unusual expenses detected</p>
                  )}
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="insight-card success-card full-width">
                <div className="card-header">
                  <div className="card-icon">💡</div>
                  <h3>Smart Recommendations</h3>
                </div>
                <div className="card-content">
                  {insights.suggestions.length > 0 ? (
                    <ul className="suggestion-list">
                      {insights.suggestions.map((suggestion, i) => (
                        <li key={i} className="suggestion-item">
                          <div className="suggestion-icon">✨</div>
                          <div className="suggestion-content">
                            <p>{suggestion}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">No recommendations available yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>VegaKash AI</h4>
            <p>Intelligent financial insights powered by advanced analytics</p>
          </div>
          <div className="footer-section">
            <h5>Features</h5>
            <ul>
              <li><a href="#patterns">Spending Analysis</a></li>
              <li><a href="#predictions">Smart Predictions</a></li>
              <li><a href="#recommendations">AI Recommendations</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h5>Support</h5>
            <ul>
              <li><a href="/help">Help Center</a></li>
              <li><a href="/contact">Contact Us</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 VegaKash. Empowering smarter financial decisions with AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default Insights;