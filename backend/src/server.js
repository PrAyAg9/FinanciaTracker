import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables FIRST
dotenv.config();

// Debug environment variables
console.log("🔧 Environment Debug:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "Loaded" : "Missing"
);
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Loaded" : "Missing");
console.log(
  "GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY ? "Loaded" : "Missing"
);

// Import middleware
import { authenticateToken } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Import routes AFTER environment variables are loaded
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import analyticsRoutes from "./routes/analytics.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/finance-dashboard",
      {
        // Remove deprecated options, mongoose 6+ handles these automatically
      }
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // Don't exit process, let the app continue and retry
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

// Initialize database connection
connectDB();

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Public routes (no authentication required)
app.use("/auth", authRoutes);

// Protected routes (authentication required)
app.use("/api/transactions", authenticateToken, transactionRoutes);
app.use("/api/analytics", authenticateToken, analyticsRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
  );
  console.log(`🔗 Backend URL: http://localhost:${PORT}`);
});

export default app;
