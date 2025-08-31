// API configuration and types
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  TIMEOUT: 10000,
};

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  preferences?: {
    currency: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  lastLogin?: string;
  createdAt?: string;
}

// Transaction types
export interface Transaction {
  _id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  subcategory?: string;
  date: string;
  tags?: string[];
  location?: string;
  notes?: string;
  isRecurring: boolean;
  recurringInfo?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: string;
  };
  aiParsed?: boolean;
  rawInput?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  subcategory?: string;
  date?: string;
  tags?: string[];
  location?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringInfo?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: string;
  };
}

export interface UpdateTransactionInput
  extends Partial<CreateTransactionInput> {}

// Analytics types
export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  incomeCount: number;
  expenseCount: number;
  averageIncome: number;
  averageExpense: number;
  period: string;
  dateRange: {
    $gte: string;
    $lte: string;
  } | null;
  incomeChange?: string;
  expenseChange?: string;
}

export interface CategoryData {
  category: string;
  type: "income" | "expense";
  total: number;
  count: number;
  averageAmount: number;
  percentage: string;
}

export interface TrendData {
  date: string;
  income: number;
  expenses: number;
  net: number;
  incomeCount: number;
  expenseCount: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

// API Error type
export interface ApiError {
  error: string;
  message: string;
  details?: string[];
  status?: number;
}
