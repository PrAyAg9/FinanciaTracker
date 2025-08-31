import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: null,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    location: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      maxlength: 500,
      default: null,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringInfo: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        default: null,
      },
      interval: {
        type: Number,
        min: 1,
        default: 1,
      },
      endDate: {
        type: Date,
        default: null,
      },
    },
    aiParsed: {
      type: Boolean,
      default: false,
    },
    rawInput: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ date: -1 });

// Virtual for formatted amount
transactionSchema.virtual("formattedAmount").get(function () {
  return this.type === "expense" ? -this.amount : this.amount;
});

// Method to check if transaction is from current month
transactionSchema.methods.isCurrentMonth = function () {
  const now = new Date();
  const transactionDate = new Date(this.date);
  return (
    transactionDate.getMonth() === now.getMonth() &&
    transactionDate.getFullYear() === now.getFullYear()
  );
};

// Static method to get transactions by date range
transactionSchema.statics.findByDateRange = function (
  userId,
  startDate,
  endDate
) {
  return this.find({
    userId: userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: -1 });
};

// Static method to get transactions by category
transactionSchema.statics.findByCategory = function (userId, category) {
  return this.find({
    userId: userId,
    category: category,
  }).sort({ date: -1 });
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
