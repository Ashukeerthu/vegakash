import React, { useState, useEffect } from 'react';
import { getExpenses, addExpense, Expense as ExpenseType } from '../services/expenseService';
import ExpenseList from '../components/ExpenseList';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses({ limit: 10, sort_by: 'date', sort_order: 'desc' });
      setExpenses(data);
    } catch (err: any) {
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
    
    // Reset messages
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      console.log('Form submitted with data:', formData);
      
      // Validate required fields
      if (!formData.title || !formData.category || !formData.amount || !formData.date) {
        throw new Error('Please fill in all required fields');
      }
      
      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      console.log('Calling addExpense with:', {
        title: formData.title,
        category: formData.category,
        amount: amount,
        date: formData.date,
        description: formData.description || undefined
      });
      
      const result = await addExpense({
        title: formData.title,
        category: formData.category,
        amount: amount,
        date: formData.date,
        description: formData.description || undefined
      });
      
      console.log('Expense added successfully:', result);
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        amount: '',
        date: '',
        description: ''
      });
      
      setIsFormVisible(false);
      setSuccess(`Expense "${result.title}" added successfully!`);
      
      // Refresh the expenses list
      await fetchExpenses();
      
    } catch (err: any) {
      console.error('Error adding expense:', err);
      setError(err.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
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
          {error && (
            <div className="alert alert-error">
              <span>❌ {error}</span>
              <button onClick={() => setError('')} className="alert-close">×</button>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <span>✅ {success}</span>
              <button onClick={() => setSuccess('')} className="alert-close">×</button>
            </div>
          )}
          
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
                  <button type="submit" className="btn-submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Expenses List Section */}
        <section className="expenses-section">
          <ExpenseList onExpenseUpdate={fetchExpenses} />
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