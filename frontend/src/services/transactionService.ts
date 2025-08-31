import {
  API_CONFIG,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  PaginatedResponse,
} from "./types";

interface TransactionFilters {
  page?: number;
  limit?: number;
  category?: string;
  type?: "income" | "expense";
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface ParsedTransaction {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  notes?: string;
  date: string;
  aiParsed: boolean;
  rawInput: string;
}

class TransactionService {
  private baseURL = API_CONFIG.BASE_URL;

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get transactions with optional filtering
   */
  async getTransactions(filters: TransactionFilters = {}): Promise<{
    transactions: Transaction[];
    pagination: PaginatedResponse<Transaction>["pagination"];
  }> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${this.baseURL}/api/transactions?${params.toString()}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch transactions");
      }

      return {
        transactions: data.transactions,
        pagination: data.pagination,
      };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch transactions");
    }
  }

  /**
   * Get a single transaction by ID
   */
  async getTransaction(id: string): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseURL}/api/transactions/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch transaction");
      }

      return data.transaction;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch transaction");
    }
  }

  /**
   * Parse natural language transaction text
   */
  async parseTransaction(text: string): Promise<ParsedTransaction> {
    try {
      const response = await fetch(`${this.baseURL}/api/transactions/parse`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to parse transaction");
      }

      // Backend returns parsedTransactions array, take the first one
      if (data.parsedTransactions && data.parsedTransactions.length > 0) {
        return data.parsedTransactions[0];
      } else {
        throw new Error("No transaction data received from parser");
      }
    } catch (error) {
      console.error("Error parsing transaction:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to parse transaction");
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    transactionData: CreateTransactionInput
  ): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseURL}/api/transactions`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create transaction");
      }

      return data.transaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to create transaction");
    }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(
    id: string,
    updates: UpdateTransactionInput
  ): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseURL}/api/transactions/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update transaction");
      }

      return data.transaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to update transaction");
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/transactions/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to delete transaction");
    }
  }

  /**
   * Get unique categories used by the user
   */
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    try {
      const response = await fetch(
        `${this.baseURL}/api/transactions/categories/list`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch categories");
      }

      return data.categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch categories");
    }
  }
}

export const transactionService = new TransactionService();
