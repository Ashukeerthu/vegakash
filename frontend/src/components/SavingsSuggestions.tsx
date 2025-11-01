import React, { useState, useEffect } from 'react';
import { getSavingsSuggestions, SavingsSuggestions } from '../services/expenseService';
import './SavingsSuggestions.css';

const SavingsSuggestionsComponent: React.FC = () => {
  const [savings, setSavings] = useState<SavingsSuggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSavingsSuggestions();
        setSavings(data);
      } catch (error) {
        console.error('Failed to fetch savings suggestions:', error);
        setError('Failed to load savings suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSavings();
  }, []);

  if (loading) {
    return (
      <div className="savings-suggestions">
        <div className="savings-header">
          <h3>💡 Savings Suggestions</h3>
        </div>
        <div className="savings-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your spending patterns...</p>
        </div>
      </div>
    );
  }

  if (error || !savings) {
    return (
      <div className="savings-suggestions">
        <div className="savings-header">
          <h3>💡 Savings Suggestions</h3>
        </div>
        <div className="savings-error">
          <p>Unable to generate savings suggestions at the moment.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="savings-suggestions">
      <div className="savings-header">
        <h3>💡 Savings Suggestions</h3>
        {savings.potential_savings > 0 && (
          <div className="potential-savings">
            <span className="savings-amount">₹{savings.potential_savings.toFixed(2)}</span>
            <span className="savings-label">Potential Monthly Savings</span>
          </div>
        )}
      </div>

      {savings.priority_areas.length > 0 && (
        <div className="priority-areas">
          <h4>🎯 Priority Areas</h4>
          <div className="priority-tags">
            {savings.priority_areas.map((area, index) => (
              <span key={index} className="priority-tag">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="suggestions-list">
        <h4>💰 Recommendations</h4>
        {savings.suggestions.length > 0 ? (
          <ul className="suggestions">
            {savings.suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-item">
                <div className="suggestion-icon">
                  {index === 0 ? '🏆' : index === 1 ? '⭐' : '💡'}
                </div>
                <div className="suggestion-text">
                  {suggestion}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-suggestions">
            Start tracking more expenses to get personalized savings suggestions!
          </p>
        )}
      </div>

      <div className="savings-footer">
        <div className="savings-tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">
            Small changes in spending habits can lead to significant savings over time.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SavingsSuggestionsComponent;