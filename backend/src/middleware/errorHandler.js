export const errorHandler = (error, req, res, next) => {
  console.error("Error:", error);

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid input data",
      details: errors,
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({
      error: "Duplicate Error",
      message: `${field} already exists`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (error.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID",
      message: "Invalid resource ID format",
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Authentication Error",
      message: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Authentication Error",
      message: "Token expired",
    });
  }

  // Default server error
  res.status(error.status || 500).json({
    error: "Server Error",
    message: error.message || "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
