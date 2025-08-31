import { API_CONFIG, FinancialSummary, CategoryData, TrendData } from "./types";

interface AnalyticsFilters {
  period?: "week" | "month" | "year" | "all";
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense" | "both";
  groupBy?: "day" | "week" | "month";
}

interface Insight {
  type: "positive" | "warning" | "info";
  title: string;
  message: string;
  recommendation: string;
}

interface InsightsResponse {
  insights: Insight[];
  summary: {
    currentMonth: {
      income: number;
      expenses: number;
      net: number;
    };
    lastMonth: {
      income: number;
      expenses: number;
      net: number;
    };
    topCategories: Array<{
      _id: string;
      total: number;
      count: number;
    }>;
  };
}

class AnalyticsService {
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
   * Get financial summary for dashboard cards
   */
  async getSummary(filters: AnalyticsFilters = {}): Promise<FinancialSummary> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${this.baseURL}/api/analytics/summary?${params.toString()}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch financial summary");
      }

      return data;
    } catch (error) {
      console.error("Error fetching summary:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch financial summary");
    }
  }

  /**
   * Get spending breakdown by categories for pie chart
   */
  async getCategories(filters: AnalyticsFilters = {}): Promise<{
    categories: CategoryData[];
    totalAmount: number;
    period: string;
    type: string;
    dateRange: any;
  }> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${this.baseURL}/api/analytics/categories?${params.toString()}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch category analytics");
      }

      return data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch category analytics");
    }
  }

  /**
   * Get financial trends over time for line chart
   */
  async getTrends(filters: AnalyticsFilters = {}): Promise<{
    trends: TrendData[];
    period: string;
    groupBy: string;
    dateRange: any;
  }> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(
        `${this.baseURL}/api/analytics/trends?${params.toString()}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch trends analytics");
      }

      return data;
    } catch (error) {
      console.error("Error fetching trends:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch trends analytics");
    }
  }

  /**
   * Get financial insights and recommendations
   */
  async getInsights(): Promise<InsightsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/analytics/insights`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch financial insights");
      }

      return data;
    } catch (error) {
      console.error("Error fetching insights:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch financial insights");
    }
  }

  /**
   * Get quick stats for dashboard
   */
  async getQuickStats(): Promise<{
    totalTransactions: number;
    thisMonthTransactions: number;
    averageTransactionAmount: number;
    mostUsedCategory: string;
  }> {
    try {
      // This would ideally be a separate endpoint, but we can derive it from existing data
      const [summary, categories] = await Promise.all([
        this.getSummary({ period: "month" }),
        this.getCategories({ period: "month", type: "expense" }),
      ]);

      const totalTransactions = summary.incomeCount + summary.expenseCount;
      const totalAmount = summary.totalIncome + summary.totalExpenses;
      const averageTransactionAmount =
        totalTransactions > 0 ? totalAmount / totalTransactions : 0;
      const mostUsedCategory =
        categories.categories.length > 0
          ? categories.categories[0].category
          : "None";

      return {
        totalTransactions,
        thisMonthTransactions: totalTransactions,
        averageTransactionAmount,
        mostUsedCategory,
      };
    } catch (error) {
      console.error("Error fetching quick stats:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch quick stats");
    }
  }

  /**
   * Get comprehensive user statistics for profile page
   */
  async getUserStats(): Promise<{
    totalTransactions: number;
    categoriesUsed: number;
    totalIncome: number;
    totalExpenses: number;
    accountAge: string;
    mostUsedCategory: string;
    averageMonthlySpending: number;
  }> {
    try {
      // Get all-time data
      const [allTimeSummary, allTimeCategories] = await Promise.all([
        this.getSummary({ period: "all" }),
        this.getCategories({ period: "all", type: "both" }),
      ]);

      const totalTransactions = allTimeSummary.incomeCount + allTimeSummary.expenseCount;
      const uniqueCategories = new Set();
      
      // Count unique categories from both income and expense categories
      allTimeCategories.categories.forEach(cat => uniqueCategories.add(cat.category));
      
      const mostUsedCategory = allTimeCategories.categories.length > 0
        ? allTimeCategories.categories[0].category
        : "None";

      // Calculate account age (simplified - in real app would use user creation date)
      const accountAge = "3 months"; // This would come from user account data

      // Calculate average monthly spending (simplified calculation)
      const averageMonthlySpending = allTimeSummary.totalExpenses / 3; // Assuming 3 months

      return {
        totalTransactions,
        categoriesUsed: uniqueCategories.size,
        totalIncome: allTimeSummary.totalIncome,
        totalExpenses: allTimeSummary.totalExpenses,
        accountAge,
        mostUsedCategory,
        averageMonthlySpending,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to fetch user stats");
    }
  }
}

export const analyticsService = new AnalyticsService();
