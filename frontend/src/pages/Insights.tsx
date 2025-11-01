import React, { useEffect, useState } from 'react';
import { 
  getInsights, 
  // getCategoryBreakdown, 
  // getMonthlyTrends,
  InsightData as InsightDataType 
} from '../services/expenseService';
// import CategoryBreakdownChart from '../components/charts/CategoryBreakdownChart';
// import MonthlyTrendsChart from '../components/charts/MonthlyTrendsChart';
import SavingsSuggestionsComponent from '../components/SavingsSuggestions';
import Chatbot from '../components/Chatbot';
// import '../components/charts/Charts.css';
import './Insights.css';

const Insights: React.FC = () => {
  const [insights, setInsights] = useState<InsightDataType | null>(null);
  // const [categoryData, setCategoryData] = useState<any>(null);
  // const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch insights data only for now
      const insightsData = await getInsights();
      setInsights(insightsData);
      
      // TODO: Enable charts when Chart.js is properly configured
      // const [insightsData, categoryBreakdown, monthlyTrends] = await Promise.all([
      //   getInsights(),
      //   getCategoryBreakdown(),
      //   getMonthlyTrends()
      // ]);
      // setCategoryData(categoryBreakdown);
      // setMonthlyData(monthlyTrends);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch insights data.');
      console.error('Error fetching insights data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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
              <button className="retry-btn" onClick={fetchAllData}>
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

          {/* Charts Section */}
          {!loading && !error && (
            <section className="charts-section">
              <div className="section-header">
                <h2>📊 Visual Analytics</h2>
                <p>Interactive charts showing your spending patterns and trends</p>
              </div>
              
              <div className="charts-grid">
                {/* Charts temporarily disabled - will be enabled once Chart.js is properly configured */}
                <div className="chart-placeholder">
                  <h3>📊 Data Visualization</h3>
                  <p>Interactive charts will be available once Chart.js dependencies are resolved.</p>
                  <ul>
                    <li>📈 Category Breakdown Chart</li>
                    <li>📊 Monthly Spending Trends</li>
                    <li>💰 Savings Analytics</li>
                  </ul>
                </div>
                
                {/* TODO: Enable when Chart.js is working */}
                {/* {categoryData && categoryData.categories.length > 0 && (
                  <CategoryBreakdownChart 
                    data={categoryData.categories}
                    totalAmount={categoryData.total_amount}
                  />
                )} */}
                
                {/* {monthlyData && monthlyData.months.length > 0 && (
                  <div className="monthly-trends-container">
                    <div className="chart-controls">
                      <div className="chart-type-toggle">
                        <button 
                          className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
                          onClick={() => setChartType('line')}
                        >
                          📈 Line
                        </button>
                        <button 
                          className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                          onClick={() => setChartType('bar')}
                        >
                          📊 Bar
                        </button>
                      </div>
                    </div>
                    <MonthlyTrendsChart 
                      data={monthlyData.months}
                      chartType={chartType}
                    />
                  </div>
                )} */}
                
                {/* No Data State - Temporarily disabled */}
                {/* {(!categoryData || categoryData.categories.length === 0) && 
                 (!monthlyData || monthlyData.months.length === 0) && (
                  <div className="no-charts-data">
                    <div className="no-data-icon">📊</div>
                    <h3>No Chart Data Available</h3>
                    <p>Add some expenses to see visual analytics</p>
                    <a href="/" className="add-expenses-btn">Add Expenses</a>
                  </div>
                )} */}
              </div>
            </section>
          )}
          
          {/* Savings Suggestions Section */}
          {insights && (
            <section className="savings-section">
              <SavingsSuggestionsComponent />
            </section>
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

      {/* Floating Chatbot Button */}
      <button 
        className="chatbot-float-button"
        onClick={() => setIsChatbotOpen(true)}
        title="Ask VegaKash AI"
      >
        🤖
      </button>

      {/* Chatbot Component */}
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </div>
  );
};

export default Insights;