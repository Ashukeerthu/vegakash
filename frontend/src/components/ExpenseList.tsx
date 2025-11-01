import React, { useState, useEffect } from 'react';
import { 
  getExpenses, 
  updateExpense, 
  deleteExpense,
  formatCurrency,
  formatDate,
  Expense as ExpenseType,
  ExpenseFilters
} from '../services/expenseService';
import './ExpenseList.css';

interface ExpenseListProps {
  refreshTrigger?: number;
  onExpenseUpdate?: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ refreshTrigger, onExpenseUpdate }) => {
  const [expenses, setExpenses] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExpenseType>>({});
  const [filters, setFilters] = useState<ExpenseFilters>({
    category: '',
    search: '',
    sort_by: 'date',
    sort_order: 'desc'
  });
  const [error, setError] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses(filters);
      setExpenses(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger, filters]);

  const handleEdit = (expense: ExpenseType) => {
    setEditingId(expense.id!);
    setEditForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      description: expense.description
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      await updateExpense(editingId, editForm);
      setEditingId(null);
      setEditForm({});
      fetchExpenses();
      onExpenseUpdate?.();
    } catch (err: any) {
      setError(err.message || 'Failed to update expense');
      console.error('Error updating expense:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await deleteExpense(id);
      fetchExpenses();
      onExpenseUpdate?.();
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
      console.error('Error deleting expense:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Food': '🍽️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Healthcare': '⚕️',
      'Education': '📚',
      'Utilities': '⚡',
      'Other': '📌'
    };
    return icons[category] || '📌';
  };

  if (loading) {
    return (
      <div className="expense-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-list-container">
      <div className="expense-list-header">
        <h3>💳 Recent Expenses</h3>
        
        {/* Filters */}
        <div className="expense-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search || ''}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Food">Food</option>
              <option value="Transportation">Transportation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Shopping">Shopping</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select
              value={filters.sort_by || 'date'}
              onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
              className="filter-select"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select
              value={filters.sort_order || 'desc'}
              onChange={(e) => setFilters({...filters, sort_order: e.target.value})}
              className="filter-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h4>No expenses found</h4>
          <p>Start adding your expenses to see them here</p>
        </div>
      ) : (
        <div className="expense-list">
          {expenses.map((expense) => (
            <div key={expense.id} className="expense-item">
              {editingId === expense.id ? (
                // Edit mode
                <div className="expense-edit-form">
                  <div className="edit-row">
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="edit-input"
                      placeholder="Title"
                    />
                    <input
                      type="number"
                      value={editForm.amount || ''}
                      onChange={(e) => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                      className="edit-input"
                      placeholder="Amount"
                    />
                  </div>
                  <div className="edit-row">
                    <select
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      className="edit-select"
                    >
                      <option value="Food">Food</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="date"
                      value={editForm.date || ''}
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                      className="edit-input"
                    />
                  </div>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="edit-textarea"
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <div className="edit-actions">
                    <button onClick={handleSaveEdit} className="save-btn">Save</button>
                    <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="expense-content">
                    <div className="expense-main">
                      <div className="expense-title-section">
                        <span className="category-icon">{getCategoryIcon(expense.category)}</span>
                        <div className="expense-details">
                          <h4 className="expense-title">{expense.title}</h4>
                          <span className="expense-category">{expense.category}</span>
                        </div>
                      </div>
                      <div className="expense-amount">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                    
                    <div className="expense-meta">
                      <span className="expense-date">{formatDate(expense.date)}</span>
                      {expense.description && (
                        <p className="expense-description">{expense.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="expense-actions">
                    <button 
                      onClick={() => handleEdit(expense)}
                      className="edit-btn"
                      title="Edit expense"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(expense.id!)}
                      className="delete-btn"
                      title="Delete expense"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;