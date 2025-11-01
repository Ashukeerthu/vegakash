import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Configure axios with error handling
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 422) {
      // Validation error
      const validationErrors = error.response.data.errors || [error.response.data.detail];
      throw new Error(`Validation Error: ${validationErrors.join(', ')}`);
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export interface Expense {
  id?: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
}

export interface ExpenseFilters {
  category?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: string;
  sort_order?: string;
  skip?: number;
  limit?: number;
}

export interface InsightData {
  total_spent: number;
  top_categories: string[];
  patterns: string[];
  outliers: string[];
  suggestions: string[];
}

// Expense service functions
export const addExpense = async (data: Expense): Promise<Expense> => {
  try {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const getExpenses = async (filters: ExpenseFilters = {}): Promise<Expense[]> => {
  try {
    const response = await apiClient.get('/expenses', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const getExpense = async (id: number): Promise<Expense> => {
  try {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }
};

export const updateExpense = async (id: number, data: Partial<Expense>): Promise<Expense> => {
  try {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/expenses/${id}`);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export const getExpenseStats = async () => {
  try {
    const response = await apiClient.get('/expenses/stats/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/expenses/categories/list');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// AI service functions
export const getInsights = async (): Promise<InsightData> => {
  try {
    const response = await apiClient.post('/ai/insights');
    return response.data;
  } catch (error) {
    console.error('Error fetching insights:', error);
    throw error;
  }
};

export const getSpendingTrends = async (days: number = 30) => {
  try {
    const response = await apiClient.get(`/ai/spending-trends?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching spending trends:', error);
    throw error;
  }
};

// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Utility function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};