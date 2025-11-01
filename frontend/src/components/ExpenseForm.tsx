import { useState } from 'react';
import { addExpense } from '../services/expenseService';
import './ExpenseForm.css';

const ExpenseForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    date: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Validate form data
      if (!formData.title || !formData.category || !formData.amount || !formData.date) {
        setSubmitMessage('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Prepare expense data
      const expenseData = {
        title: formData.title,
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description || ''
      };

      console.log('Submitting expense:', expenseData);
      
      // Call the addExpense service
      const newExpense = await addExpense(expenseData);
      console.log('Expense added successfully:', newExpense);
      
      // Reset form and show success message
      setFormData({
        title: '',
        category: '',
        amount: '',
        date: '',
        description: ''
      });
      setSubmitMessage('✅ Expense added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitMessage(''), 3000);
      
    } catch (error) {
      console.error('Error adding expense:', error);
      setSubmitMessage('❌ Error adding expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="expense-form-container">
      <h2>Add New Expense</h2>
      {submitMessage && (
        <div className={`message ${submitMessage.includes('✅') ? 'success' : 'error'}`}>
          {submitMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input 
            id="title"
            name="title" 
            type="text"
            placeholder="Enter expense title" 
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select 
            id="category"
            name="category" 
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Shopping">Shopping</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Utilities">Utilities</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (₹) *</label>
          <input 
            id="amount"
            name="amount" 
            type="number" 
            step="0.01"
            min="0"
            placeholder="0.00" 
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input 
            id="date"
            name="date" 
            type="date" 
            value={formData.date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea 
            id="description"
            name="description" 
            placeholder="Optional description" 
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;