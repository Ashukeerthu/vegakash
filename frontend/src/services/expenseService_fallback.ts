import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Configure axios with error handling
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // Reduced timeout for faster fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// localStorage fallback for offline mode
const STORAGE_KEY = 'vegakash_expenses';
let backendAvailable = true;

// Check if backend is available
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch (error) {
    console.warn('Backend not available, using localStorage fallback');
    return false;
  }
};

// localStorage helpers
const getExpensesFromStorage = (): Expense[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

const saveExpensesToStorage = (expenses: Expense[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

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
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    // Custom error handling
    if (error.response?.status === 404) {
      throw new Error(`Resource not found: ${error.config?.url}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      backendAvailable = false;
      throw new Error('Unable to connect to server. Using offline mode.');
    } else {
      throw new Error(error.response?.data?.detail || error.message || 'An unexpected error occurred');
    }
  }
);

export interface Expense {
  id?: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseFilters {
  category?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ExpenseResponse {
  expenses: Expense[];
  total: number;
  limit: number;
  offset: number;
}

// Initialize backend check
let backendCheckPromise: Promise<boolean> | null = null;

const ensureBackendCheck = async (): Promise<boolean> => {
  if (!backendCheckPromise) {
    backendCheckPromise = checkBackendHealth();
  }
  backendAvailable = await backendCheckPromise;
  return backendAvailable;
};

export const getExpenses = async (filters: ExpenseFilters = {}): Promise<Expense[]> => {
  await ensureBackendCheck();
  
  if (!backendAvailable) {
    // Fallback to localStorage
    let expenses = getExpensesFromStorage();
    
    // Apply filters
    if (filters.search) {
      expenses = expenses.filter(exp => 
        exp.title.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }
    
    if (filters.category) {
      expenses = expenses.filter(exp => exp.category === filters.category);
    }
    
    // Apply sorting
    if (filters.sort_by) {
      expenses.sort((a, b) => {
        const key = filters.sort_by as keyof Expense;
        let aVal = a[key];
        let bVal = b[key];
        
        // Handle undefined values
        if (aVal === undefined) aVal = '';
        if (bVal === undefined) bVal = '';
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (filters.sort_order === 'desc') {
          return aVal < bVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    return expenses;
  }

  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ExpenseResponse>(`/expenses?${params}`);
    return response.data.expenses;
  } catch (error) {
    backendAvailable = false;
    console.warn('Falling back to localStorage due to API error');
    return getExpensesFromStorage();
  }
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense> => {
  await ensureBackendCheck();
  
  if (!backendAvailable) {
    // Fallback to localStorage
    const expenses = getExpensesFromStorage();
    const newExpense: Expense = {
      ...expense,
      id: Date.now(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    expenses.push(newExpense);
    saveExpensesToStorage(expenses);
    return newExpense;
  }

  try {
    const response = await apiClient.post<Expense>('/expenses', expense);
    return response.data;
  } catch (error) {
    backendAvailable = false;
    console.warn('Falling back to localStorage due to API error');
    // Retry with localStorage
    return addExpense(expense);
  }
};

export const updateExpense = async (id: number, expense: Partial<Expense>): Promise<Expense> => {
  await ensureBackendCheck();
  
  if (!backendAvailable) {
    // Fallback to localStorage
    const expenses = getExpensesFromStorage();
    const index = expenses.findIndex(exp => exp.id === id);
    if (index === -1) {
      throw new Error('Expense not found');
    }
    
    expenses[index] = {
      ...expenses[index],
      ...expense,
      updated_at: new Date().toISOString()
    };
    saveExpensesToStorage(expenses);
    return expenses[index];
  }

  try {
    const response = await apiClient.put<Expense>(`/expenses/${id}`, expense);
    return response.data;
  } catch (error) {
    backendAvailable = false;
    console.warn('Falling back to localStorage due to API error');
    // Retry with localStorage
    return updateExpense(id, expense);
  }
};

export const deleteExpense = async (id: number): Promise<void> => {
  await ensureBackendCheck();
  
  if (!backendAvailable) {
    // Fallback to localStorage
    const expenses = getExpensesFromStorage();
    const filteredExpenses = expenses.filter(exp => exp.id !== id);
    saveExpensesToStorage(filteredExpenses);
    return;
  }

  try {
    await apiClient.delete(`/expenses/${id}`);
  } catch (error) {
    backendAvailable = false;
    console.warn('Falling back to localStorage due to API error');
    // Retry with localStorage
    return deleteExpense(id);
  }
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Add some sample data for offline mode
const initializeSampleData = (): void => {
  const existingData = getExpensesFromStorage();
  if (existingData.length === 0) {
    const sampleExpenses: Expense[] = [
      {
        id: 1,
        title: "Groceries",
        category: "Food",
        amount: 2500,
        date: "2025-11-01",
        description: "Weekly grocery shopping",
        created_at: "2025-11-01T10:00:00Z",
        updated_at: "2025-11-01T10:00:00Z"
      },
      {
        id: 2,
        title: "Gas Bill",
        category: "Utilities",
        amount: 1200,
        date: "2025-10-31",
        description: "Monthly gas bill payment",
        created_at: "2025-10-31T15:30:00Z",
        updated_at: "2025-10-31T15:30:00Z"
      },
      {
        id: 3,
        title: "Movie Tickets",
        category: "Entertainment",
        amount: 800,
        date: "2025-10-30",
        description: "Weekend movie with family",
        created_at: "2025-10-30T18:00:00Z",
        updated_at: "2025-10-30T18:00:00Z"
      }
    ];
    saveExpensesToStorage(sampleExpenses);
    console.log('Initialized with sample expense data for offline mode');
  }
};

// Initialize sample data when the module loads
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(initializeSampleData, 100);
}