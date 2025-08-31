import React, { useState } from "react";
import { Sparkles, Send, Plus, Camera } from "lucide-react";
import { transactionService } from "../../services/transactionService";
import OCRScanner from "../OCRScanner";

interface TransactionInputProps {
  onTransactionAdded: () => void;
}

interface ParsedTransaction {
  amount: number;
  description: string;
  category: string;
  type: "income" | "expense";
  date: string;
}

const TransactionInput: React.FC<TransactionInputProps> = ({
  onTransactionAdded,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTransaction, setParsedTransaction] =
    useState<ParsedTransaction | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showOCRScanner, setShowOCRScanner] = useState(false);

  const examples = [
    "Dinner at Italian restaurant $65",
    "Salary deposit $3500",
    "Gas for car $45.20",
    "Coffee at Starbucks $4.75",
    "Freelance payment $600",
  ];

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      const parsed = await transactionService.parseTransaction(inputValue);
      setParsedTransaction(parsed);
    } catch (error) {
      console.error("Failed to parse transaction:", error);
      alert("Failed to parse transaction. Please try again or enter manually.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!parsedTransaction) return;

    try {
      await transactionService.createTransaction(parsedTransaction);
      setInputValue("");
      setParsedTransaction(null);
      onTransactionAdded();
    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert("Failed to create transaction. Please try again.");
    }
  };

  const handleOCRTransactionParsed = (transaction: ParsedTransaction) => {
    setParsedTransaction(transaction);
    setShowOCRScanner(false);
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Add Transaction
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOCRScanner(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Receipt</span>
            </button>
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Describe your transaction in natural language and let AI parse it for
          you
        </p>

        <form onSubmit={handleAISubmit} className="mb-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g., Lunch at McDonald's $12.50"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isLoading ? "Parsing..." : "Parse"}</span>
            </button>
          </div>
        </form>

        {/* Parsed Transaction Preview */}
        {parsedTransaction && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              AI Parsed Transaction:
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">Description:</span>{" "}
                {parsedTransaction.description}
              </div>
              <div>
                <span className="text-green-600">Amount:</span> $
                {parsedTransaction.amount}
              </div>
              <div>
                <span className="text-green-600">Category:</span>{" "}
                {parsedTransaction.category}
              </div>
              <div>
                <span className="text-green-600">Type:</span>{" "}
                {parsedTransaction.type}
              </div>
            </div>
            <div className="flex space-x-3 mt-3">
              <button
                onClick={handleConfirmTransaction}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Confirm & Add
              </button>
              <button
                onClick={() => setParsedTransaction(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500 mb-2">Examples:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <ManualTransactionModal
          onClose={() => setShowManualModal(false)}
          onTransactionAdded={onTransactionAdded}
        />
      )}

      {/* OCR Scanner Modal */}
      {showOCRScanner && (
        <OCRScanner
          onTransactionParsed={handleOCRTransactionParsed}
          onClose={() => setShowOCRScanner(false)}
        />
      )}
    </>
  );
};

// Manual Transaction Modal Component
interface ManualTransactionModalProps {
  onClose: () => void;
  onTransactionAdded: () => void;
}

const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({
  onClose,
  onTransactionAdded,
}) => {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Food & Dining",
    "Gas & Fuel",
    "Groceries",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Travel",
    "Healthcare",
    "Education",
    "Transportation",
    "Salary",
    "Freelance",
    "Investment",
    "Business",
    "Gift",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.category) return;

    setIsSubmitting(true);
    try {
      await transactionService.createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      onTransactionAdded();
      onClose();
    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert("Failed to create transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Add Transaction Manually
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Lunch at restaurant"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "income" | "expense",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.description ||
                  !formData.amount ||
                  !formData.category
                }
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Adding..." : "Add Transaction"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionInput;
