import React, { useState, useEffect } from 'react';
import { getExpenses, addExpense, Expense as ExpenseType } from '../services/expenseService';
import './Home.css';

const Home: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    date: '',
    description: ''
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses({ limit: 10, sort_by: 'date', sort_order: 'desc' });
      setExpenses(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error fetching expenses');
      console.error('Error fetching expenses:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addExpense({
        title: formData.title,
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description || undefined
      });
      setFormData({
        title: '',
        category: '',
        amount: '',
        date: '',
        description: ''
      });
      setIsFormVisible(false);
      fetchExpenses();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error adding expense');
      console.error('Error adding expense:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="home-wrapper">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <h1>💰 VegaKash</h1>
            <span className="nav-tagline">Personal Finance Manager</span>
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link active">Home</a>
            <a href="/insights" className="nav-link">Insights</a>
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
            <h2>Welcome to Your Financial Dashboard</h2>
            <p>Track, manage, and optimize your expenses with ease</p>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-number">₹{totalExpenses.toLocaleString()}</div>
                <div className="stat-label">Total Expenses</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{expenses.length}</div>
                <div className="stat-label">Total Records</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {expenses.length > 0 ? Math.round(totalExpenses / expenses.length) : 0}
                </div>
                <div className="stat-label">Avg. per Entry</div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Section */}
        <section className="action-section">
          <button 
            className="add-expense-btn"
            onClick={() => setIsFormVisible(!isFormVisible)}
          >
            <span className="btn-icon">+</span>
            Add New Expense
          </button>
        </section>

        {/* Form Section */}
        {isFormVisible && (
          <section className="form-section">
            <div className="form-container">
              <div className="form-header">
                <h3>💸 Add New Expense</h3>
                <button 
                  className="close-btn"
                  onClick={() => setIsFormVisible(false)}
                >
                  ×
                </button>
              </div>
              <form className="expense-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input 
                      id="title"
                      name="title" 
                      placeholder="e.g., Grocery Shopping" 
                      value={formData.title} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select 
                      id="category"
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange} 
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Food & Dining">🍽️ Food & Dining</option>
                      <option value="Transportation">🚗 Transportation</option>
                      <option value="Shopping">🛍️ Shopping</option>
                      <option value="Entertainment">🎬 Entertainment</option>
                      <option value="Bills & Utilities">💡 Bills & Utilities</option>
                      <option value="Healthcare">🏥 Healthcare</option>
                      <option value="Education">📚 Education</option>
                      <option value="Travel">✈️ Travel</option>
                      <option value="Others">📌 Others</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="amount">Amount (₹)</label>
                    <input 
                      id="amount"
                      name="amount" 
                      type="number" 
                      placeholder="0.00" 
                      value={formData.amount} 
                      onChange={handleChange} 
                      min="0"
                      step="0.01"
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input 
                      id="date"
                      name="date" 
                      type="date" 
                      value={formData.date} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="description">Description (Optional)</label>
                  <textarea 
                    id="description"
                    name="description" 
                    placeholder="Add any additional notes..." 
                    value={formData.description} 
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsFormVisible(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Expenses List Section */}
        <section className="expenses-section">
          <div className="section-header">
            <h3>📋 Recent Expenses</h3>
            <span className="expenses-count">{expenses.length} entries</span>
          </div>
          
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h4>No expenses yet</h4>
              <p>Start tracking your expenses by adding your first entry above!</p>
            </div>
          ) : (
            <div className="expenses-grid">
              {expenses.map(exp => (
                <div key={exp.id} className="expense-card">
                  <div className="expense-header">
                    <h4 className="expense-title">{exp.title}</h4>
                    <span className="expense-amount">₹{exp.amount.toLocaleString()}</span>
                  </div>
                  <div className="expense-meta">
                    <span className="expense-category">{exp.category}</span>
                    <span className="expense-date">{new Date(exp.date).toLocaleDateString()}</span>
                  </div>
                  {exp.description && (
                    <p className="expense-description">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>VegaKash</h4>
            <p>Your trusted personal finance companion</p>
          </div>
          <div className="footer-section">
            <h5>Quick Links</h5>
            <ul>
              <li><a href="/">Dashboard</a></li>
              <li><a href="/insights">Insights</a></li>
              <li><a href="/reports">Reports</a></li>
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
          <p>&copy; 2025 VegaKash. Made with ❤️ for better financial management.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;