import express from "express";
import { query, validationResult } from "express-validator";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid input data",
      details: errors.array(),
    });
  }
  next();
};

/**
 * @route   GET /api/analytics/summary
 * @desc    Get financial summary for dashboard cards
 * @access  Private
 */
router.get(
  "/summary",
  [
    query("period")
      .optional()
      .isIn(["week", "month", "year", "all"])
      .withMessage("Period must be week, month, year, or all"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be valid ISO date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be valid ISO date"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { period = "month", startDate, endDate } = req.query;

      // Calculate date range
      let dateFilter = {};
      const now = new Date();

      if (startDate && endDate) {
        dateFilter = {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        };
      } else {
        switch (period) {
          case "week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            dateFilter = { date: { $gte: weekStart } };
            break;
          case "month":
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { date: { $gte: monthStart } };
            break;
          case "year":
            const yearStart = new Date(now.getFullYear(), 0, 1);
            dateFilter = { date: { $gte: yearStart } };
            break;
          case "all":
          default:
            dateFilter = {};
        }
      }

      // Aggregate financial data
      const summary = await Transaction.aggregate([
        {
          $match: {
            userId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
            averageAmount: { $avg: "$amount" },
          },
        },
      ]);

      // Process results
      const result = {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        incomeCount: 0,
        expenseCount: 0,
        averageIncome: 0,
        averageExpense: 0,
        period,
        dateRange: dateFilter.date || null,
      };

      summary.forEach((item) => {
        if (item._id === "income") {
          result.totalIncome = item.total;
          result.incomeCount = item.count;
          result.averageIncome = item.averageAmount;
        } else if (item._id === "expense") {
          result.totalExpenses = item.total;
          result.expenseCount = item.count;
          result.averageExpense = item.averageAmount;
        }
      });

      result.netIncome = result.totalIncome - result.totalExpenses;

      // Get previous period for comparison
      let previousPeriodFilter = {};
      if (period === "month") {
        const prevMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        previousPeriodFilter = {
          date: {
            $gte: prevMonthStart,
            $lte: prevMonthEnd,
          },
        };
      }

      const previousSummary = await Transaction.aggregate([
        {
          $match: {
            userId,
            ...previousPeriodFilter,
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]);

      // Calculate percentage changes
      let previousIncome = 0;
      let previousExpenses = 0;

      previousSummary.forEach((item) => {
        if (item._id === "income") previousIncome = item.total;
        if (item._id === "expense") previousExpenses = item.total;
      });

      result.incomeChange =
        previousIncome > 0
          ? (
              ((result.totalIncome - previousIncome) / previousIncome) *
              100
            ).toFixed(1)
          : null;

      result.expenseChange =
        previousExpenses > 0
          ? (
              ((result.totalExpenses - previousExpenses) / previousExpenses) *
              100
            ).toFixed(1)
          : null;

      res.json(result);
    } catch (error) {
      console.error("Get summary error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to fetch financial summary",
      });
    }
  }
);

/**
 * @route   GET /api/analytics/categories
 * @desc    Get spending breakdown by categories for pie chart
 * @access  Private
 */
router.get(
  "/categories",
  [
    query("period")
      .optional()
      .isIn(["week", "month", "year", "all"])
      .withMessage("Period must be week, month, year, or all"),
    query("type")
      .optional()
      .isIn(["income", "expense", "both"])
      .withMessage("Type must be income, expense, or both"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be valid ISO date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be valid ISO date"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const {
        period = "month",
        type = "expense",
        startDate,
        endDate,
      } = req.query;

      // Calculate date range
      let dateFilter = {};
      const now = new Date();

      if (startDate && endDate) {
        dateFilter = {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        };
      } else {
        switch (period) {
          case "week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            dateFilter = { date: { $gte: weekStart } };
            break;
          case "month":
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { date: { $gte: monthStart } };
            break;
          case "year":
            const yearStart = new Date(now.getFullYear(), 0, 1);
            dateFilter = { date: { $gte: yearStart } };
            break;
          case "all":
          default:
            dateFilter = {};
        }
      }

      // Build type filter
      let typeFilter = {};
      if (type !== "both") {
        typeFilter = { type };
      }

      // Aggregate by categories
      // --- CORRECTED AGGREGATION PIPELINE ---
      const categories = await Transaction.aggregate([
        {
          $match: {
            userId,
            ...dateFilter,
            ...typeFilter,
          },
        },
        {
          // 1. Group ONLY by the category field.
          // The result will have the shape the frontend expects: { _id: "CategoryName", total: ... }
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
        {
          // 2. Sort by the total amount descending.
          $sort: { total: -1 },
        },
      ]);
      // --- END OF CORRECTION ---

      res.json({
        categories, // Send this simplified data directly to the frontend
        period,
        type,
        dateRange: dateFilter.date || null,
      });
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to fetch category analytics",
      });
    }
  }
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get financial trends over time for line chart
 * @access  Private
 */
router.get(
  "/trends",
  [
    query("period")
      .optional()
      .isIn(["week", "month", "year"])
      .withMessage("Period must be week, month, or year"),
    query("groupBy")
      .optional()
      .isIn(["day", "week", "month"])
      .withMessage("GroupBy must be day, week, or month"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be valid ISO date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be valid ISO date"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const {
        period = "year",
        groupBy = "month",
        startDate,
        endDate,
      } = req.query;

      // Calculate date range
      let dateFilter = {};
      const now = new Date();

      if (startDate && endDate) {
        dateFilter = {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        };
      } else {
        switch (period) {
          case "week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - 7);
            dateFilter = { date: { $gte: weekStart } };
            break;
          case "month":
            const monthStart = new Date(now);
            monthStart.setMonth(now.getMonth() - 1);
            dateFilter = { date: { $gte: monthStart } };
            break;
          case "year":
          default:
            const yearStart = new Date(now);
            yearStart.setFullYear(now.getFullYear() - 1);
            dateFilter = { date: { $gte: yearStart } };
        }
      }

      // Define grouping format based on groupBy parameter
      let groupFormat;
      switch (groupBy) {
        case "day":
          groupFormat = {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          };
          break;
        case "week":
          groupFormat = {
            year: { $year: "$date" },
            week: { $week: "$date" },
          };
          break;
        case "month":
        default:
          groupFormat = {
            year: { $year: "$date" },
            month: { $month: "$date" },
          };
      }

      // Aggregate trends data
      const trends = await Transaction.aggregate([
        {
          $match: {
            userId,
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: {
              ...groupFormat,
              type: "$type",
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
            "_id.week": 1,
          },
        },
      ]);

      // Process and format the data for charts
      const processedData = {};

      trends.forEach((item) => {
        let dateKey;
        if (groupBy === "day") {
          dateKey = `${item._id.year}-${String(item._id.month).padStart(
            2,
            "0"
          )}-${String(item._id.day).padStart(2, "0")}`;
        } else if (groupBy === "week") {
          dateKey = `${item._id.year}-W${String(item._id.week).padStart(
            2,
            "0"
          )}`;
        } else {
          dateKey = `${item._id.year}-${String(item._id.month).padStart(
            2,
            "0"
          )}`;
        }

        if (!processedData[dateKey]) {
          processedData[dateKey] = {
            date: dateKey,
            income: 0,
            expenses: 0,
            net: 0,
            incomeCount: 0,
            expenseCount: 0,
          };
        }

        if (item._id.type === "income") {
          processedData[dateKey].income = item.total;
          processedData[dateKey].incomeCount = item.count;
        } else {
          processedData[dateKey].expenses = item.total;
          processedData[dateKey].expenseCount = item.count;
        }

        processedData[dateKey].net =
          processedData[dateKey].income - processedData[dateKey].expenses;
      });

      // Convert to array and sort
      const trendsArray = Object.values(processedData).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      res.json({
        trends: trendsArray,
        period,
        groupBy,
        dateRange: dateFilter.date || null,
      });
    } catch (error) {
      console.error("Get trends error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to fetch trends analytics",
      });
    }
  }
);

/**
 * @route   GET /api/analytics/patterns
 * @desc    Get spending patterns and smart insights
 * @access  Private
 */
router.get("/patterns", async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get spending patterns by day of week
    const dayPatterns = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$date" },
          totalSpent: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get spending patterns by time of month
    const monthPatterns = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            week: { $ceil: { $divide: [{ $dayOfMonth: "$date" }, 7] } },
          },
          totalSpent: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.week": 1 },
      },
    ]);

    // Get category frequency over time
    const categoryTrends = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            category: "$category",
            week: { $week: "$date" },
          },
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          weeks: {
            $push: {
              week: "$_id.week",
              amount: "$amount",
              count: "$count",
            },
          },
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: "$count" },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Map day numbers to names
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const formattedDayPatterns = dayPatterns.map((pattern) => ({
      day: dayNames[pattern._id - 1],
      dayNumber: pattern._id,
      totalSpent: pattern.totalSpent,
      transactionCount: pattern.transactionCount,
      averageAmount: Math.round(pattern.averageAmount * 100) / 100,
    }));

    res.json({
      patterns: {
        dayOfWeek: formattedDayPatterns,
        monthPhases: monthPatterns,
        categoryTrends: categoryTrends.slice(0, 10), // Top 10 categories
      },
      insights: generatePatternInsights(
        formattedDayPatterns,
        monthPatterns,
        categoryTrends
      ),
    });
  } catch (error) {
    console.error("Get patterns error:", error);
    res.status(500).json({
      error: "Server Error",
      message: "Failed to fetch spending patterns",
    });
  }
});

/**
 * Generate insights from spending patterns
 */
const generatePatternInsights = (
  dayPatterns,
  monthPatterns,
  categoryTrends
) => {
  const insights = [];

  // Find highest spending day
  const highestSpendingDay = dayPatterns.reduce(
    (max, day) => (day.totalSpent > max.totalSpent ? day : max),
    dayPatterns[0] || { totalSpent: 0 }
  );

  if (highestSpendingDay && highestSpendingDay.totalSpent > 0) {
    insights.push({
      type: "info",
      title: "Peak Spending Day",
      message: `You spend the most on ${
        highestSpendingDay.day
      }s ($${highestSpendingDay.totalSpent.toFixed(2)} total)`,
      recommendation: `Consider budgeting extra for ${highestSpendingDay.day}s or planning major purchases for lower-spending days.`,
    });
  }

  // Find most frequent category
  if (categoryTrends.length > 0) {
    const topCategory = categoryTrends[0];
    insights.push({
      type: "info",
      title: "Most Active Category",
      message: `${topCategory._id} is your most frequent spending category (${topCategory.totalCount} transactions)`,
      recommendation: `Look for optimization opportunities in ${topCategory._id} to maximize your savings.`,
    });
  }

  // Weekly spending variance
  if (monthPatterns.length > 1) {
    const weeklyAmounts = monthPatterns.map((week) => week.totalSpent);
    const avgWeekly =
      weeklyAmounts.reduce((a, b) => a + b, 0) / weeklyAmounts.length;
    const variance = weeklyAmounts.some(
      (amount) => Math.abs(amount - avgWeekly) > avgWeekly * 0.3
    );

    if (variance) {
      insights.push({
        type: "warning",
        title: "Irregular Spending Pattern",
        message:
          "Your weekly spending varies significantly throughout the month",
        recommendation:
          "Consider creating a weekly budget to smooth out spending patterns.",
      });
    }
  }

  return insights;
};

/**
 * @route   GET /api/analytics/insights
 * @desc    Get financial insights and recommendations
 * @access  Private
 */
router.get("/insights", async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month data
    const currentMonthData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: currentMonthStart },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get last month data
    const lastMonthData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: lastMonthStart,
            $lte: lastMonthEnd,
          },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get top spending categories this month
    const topCategories = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: { $gte: currentMonthStart },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Generate insights
    const insights = [];

    // Process current vs last month comparison
    let currentIncome = 0,
      currentExpenses = 0;
    let lastIncome = 0,
      lastExpenses = 0;

    currentMonthData.forEach((item) => {
      if (item._id === "income") currentIncome = item.total;
      if (item._id === "expense") currentExpenses = item.total;
    });

    lastMonthData.forEach((item) => {
      if (item._id === "income") lastIncome = item.total;
      if (item._id === "expense") lastExpenses = item.total;
    });

    // Spending trend insight
    if (lastExpenses > 0) {
      const expenseChange =
        ((currentExpenses - lastExpenses) / lastExpenses) * 100;
      if (expenseChange > 10) {
        insights.push({
          type: "warning",
          title: "Increased Spending",
          message: `Your expenses have increased by ${expenseChange.toFixed(
            1
          )}% compared to last month.`,
          recommendation:
            "Review your spending patterns and consider budgeting for the categories where you spend the most.",
        });
      } else if (expenseChange < -10) {
        insights.push({
          type: "positive",
          title: "Great Savings",
          message: `You've reduced your expenses by ${Math.abs(
            expenseChange
          ).toFixed(1)}% compared to last month!`,
          recommendation:
            "Keep up the good work! Consider investing the savings.",
        });
      }
    }

    // Top category insight
    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      insights.push({
        type: "info",
        title: "Top Spending Category",
        message: `You've spent $${topCategory.total.toFixed(2)} on ${
          topCategory._id
        } this month.`,
        recommendation: `This represents your largest expense category. Consider if there are ways to optimize spending on ${topCategory._id}.`,
      });
    }

    // Savings rate insight
    if (currentIncome > 0) {
      const savingsRate =
        ((currentIncome - currentExpenses) / currentIncome) * 100;
      if (savingsRate > 20) {
        insights.push({
          type: "positive",
          title: "Excellent Savings Rate",
          message: `You're saving ${savingsRate.toFixed(
            1
          )}% of your income this month!`,
          recommendation:
            "Consider investing your surplus or building an emergency fund.",
        });
      } else if (savingsRate < 0) {
        insights.push({
          type: "warning",
          title: "Spending More Than Earning",
          message: "Your expenses exceed your income this month.",
          recommendation:
            "Review your expenses and create a budget to get back on track.",
        });
      }
    }

    res.json({
      insights,
      summary: {
        currentMonth: {
          income: currentIncome,
          expenses: currentExpenses,
          net: currentIncome - currentExpenses,
        },
        lastMonth: {
          income: lastIncome,
          expenses: lastExpenses,
          net: lastIncome - lastExpenses,
        },
        topCategories,
      },
    });
  } catch (error) {
    console.error("Get insights error:", error);
    res.status(500).json({
      error: "Server Error",
      message: "Failed to fetch financial insights",
    });
  }
});

export default router;
