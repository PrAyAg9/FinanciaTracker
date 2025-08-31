import express from "express";
import { body, query, param, validationResult } from "express-validator";
import Transaction from "../models/Transaction.js";
import { parseTransactionWithAI } from "../services/aiService.js";

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
 * @route   GET /api/transactions
 * @desc    Get user's transactions with filtering and pagination
 * @access  Private
 */
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("category").optional().isString().trim(),
    query("type")
      .optional()
      .isIn(["income", "expense"])
      .withMessage("Type must be income or expense"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be valid ISO date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be valid ISO date"),
    query("search").optional().isString().trim(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const {
        page = 1,
        limit = 50,
        category,
        type,
        startDate,
        endDate,
        search,
      } = req.query;

      // Build filter object
      const filter = { userId };

      if (category) filter.category = new RegExp(category, "i");
      if (type) filter.type = type;
      if (search) {
        filter.$or = [
          { description: new RegExp(search, "i") },
          { category: new RegExp(search, "i") },
          { notes: new RegExp(search, "i") },
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const [transactions, total] = await Promise.all([
        Transaction.find(filter)
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Transaction.countDocuments(filter),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / parseInt(limit));
      const hasNextPage = parseInt(page) < totalPages;
      const hasPrevPage = parseInt(page) > 1;

      res.json({
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to fetch transactions",
      });
    }
  }
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get a specific transaction
 * @access  Private
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid transaction ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });

      if (!transaction) {
        return res.status(404).json({
          error: "Not Found",
          message: "Transaction not found",
        });
      }

      res.json({ transaction });
    } catch (error) {
      console.error("Get transaction error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to fetch transaction",
      });
    }
  }
);

/**
 * @route   POST /api/transactions/parse
 * @desc    Parse natural language transaction input using AI
 * @access  Private
 */
router.post(
  "/parse",
  [
    body("text")
      .notEmpty()
      .withMessage("Text is required")
      .isLength({ max: 500 })
      .withMessage("Text must be less than 500 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { text } = req.body;

      // Use AI service to parse the transaction(s)
      const parsedResult = await parseTransactionWithAI(text);

      // Check if result is array (multiple transactions) or single object
      const isMultiple = Array.isArray(parsedResult);

      res.json({
        success: true,
        isMultiple,
        parsedTransactions: isMultiple ? parsedResult : [parsedResult],
        originalText: text,
        count: isMultiple ? parsedResult.length : 1,
      });
    } catch (error) {
      console.error("Parse transaction error:", error);
      res.status(500).json({
        error: "Parsing Error",
        message:
          "Failed to parse transaction. Please try entering the details manually.",
      });
    }
  }
);

/**
 * @route   POST /api/transactions/bulk
 * @desc    Create multiple transactions at once
 * @access  Private
 */
router.post(
  "/bulk",
  [
    body("transactions")
      .isArray({ min: 1 })
      .withMessage("Transactions array is required"),
    body("transactions.*.description")
      .notEmpty()
      .withMessage("Description is required for each transaction")
      .isLength({ max: 200 })
      .withMessage("Description must be less than 200 characters"),
    body("transactions.*.amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be a positive number for each transaction"),
    body("transactions.*.type")
      .isIn(["income", "expense"])
      .withMessage("Type must be income or expense for each transaction"),
    body("transactions.*.category")
      .notEmpty()
      .withMessage("Category is required for each transaction"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { transactions } = req.body;

      // Prepare all transactions with user ID and default date
      const transactionData = transactions.map((transaction) => ({
        ...transaction,
        userId,
        date: transaction.date ? new Date(transaction.date) : new Date(),
      }));

      // Create all transactions
      const createdTransactions = await Transaction.insertMany(transactionData);

      res.status(201).json({
        message: `${createdTransactions.length} transactions created successfully`,
        transactions: createdTransactions,
        count: createdTransactions.length,
      });
    } catch (error) {
      console.error("Bulk create transactions error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to create transactions",
      });
    }
  }
);

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post(
  "/",
  [
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ max: 200 })
      .withMessage("Description must be less than 200 characters"),
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be a positive number"),
    body("type")
      .isIn(["income", "expense"])
      .withMessage("Type must be income or expense"),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isLength({ max: 50 })
      .withMessage("Category must be less than 50 characters"),
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be a valid ISO date"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes must be less than 500 characters"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
    body("tags.*")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 30 })
      .withMessage("Each tag must be less than 30 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const transactionData = {
        ...req.body,
        userId,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      };

      const transaction = new Transaction(transactionData);
      await transaction.save();

      res.status(201).json({
        message: "Transaction created successfully",
        transaction,
      });
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to create transaction",
      });
    }
  }
);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update a transaction
 * @access  Private
 */
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid transaction ID"),
    body("description")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Description must be less than 200 characters"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be a positive number"),
    body("type")
      .optional()
      .isIn(["income", "expense"])
      .withMessage("Type must be income or expense"),
    body("category")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Category must be less than 50 characters"),
    body("date")
      .optional()
      .isISO8601()
      .withMessage("Date must be a valid ISO date"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes must be less than 500 characters"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
    body("tags.*")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 30 })
      .withMessage("Each tag must be less than 30 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId },
        {
          ...req.body,
          ...(req.body.date && { date: new Date(req.body.date) }),
        },
        { new: true, runValidators: true }
      );

      if (!transaction) {
        return res.status(404).json({
          error: "Not Found",
          message: "Transaction not found",
        });
      }

      res.json({
        message: "Transaction updated successfully",
        transaction,
      });
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to update transaction",
      });
    }
  }
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction
 * @access  Private
 */
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid transaction ID")],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const transaction = await Transaction.findOneAndDelete({
        _id: id,
        userId,
      });

      if (!transaction) {
        return res.status(404).json({
          error: "Not Found",
          message: "Transaction not found",
        });
      }

      res.json({
        message: "Transaction deleted successfully",
        deletedTransaction: transaction,
      });
    } catch (error) {
      console.error("Delete transaction error:", error);
      res.status(500).json({
        error: "Server Error",
        message: "Failed to delete transaction",
      });
    }
  }
);

/**
 * @route   GET /api/transactions/categories/list
 * @desc    Get unique categories used by the user
 * @access  Private
 */
router.get("/categories/list", async (req, res) => {
  try {
    const userId = req.user._id;

    const categories = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
    ]);

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      error: "Server Error",
      message: "Failed to fetch categories",
    });
  }
});

export default router;
