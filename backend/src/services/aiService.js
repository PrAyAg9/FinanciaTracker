import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure environment variables are loaded
dotenv.config();

// Debug environment variables
console.log("🔍 AI Service Environment Check:");
console.log(
  "GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY ? "Present" : "Missing"
);
console.log(
  "Key starts with:",
  process.env.GEMINI_API_KEY
    ? process.env.GEMINI_API_KEY.substring(0, 10) + "..."
    : "N/A"
);

// Initialize Gemini client only if API key is provided
let genAI = null;
if (
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== "your-gemini-api-key-here"
) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ Gemini AI initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Gemini AI:", error.message);
  }
} else {
  console.log("⚠️ Gemini API key not configured, will use fallback parsing");
}

// Common categories for transactions
const COMMON_CATEGORIES = [
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

/**
 * Parse natural language transaction text using Gemini AI
 */
export const parseTransactionWithAI = async (text) => {
  try {
    if (!genAI) {
      console.log("Gemini not configured, using simple parsing for:", text);
      return simpleParseTransaction(text);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Parse this transaction text into JSON. Return ONLY valid JSON, no other text.

Categories: ${COMMON_CATEGORIES.join(", ")}
Text: "${text}"

Format:
{
  "amount": number,
  "description": "string", 
  "category": "string",
  "type": "income" or "expense",
  "date": "YYYY-MM-DD"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text().trim();

    // Clean and parse the response
    let cleanResponse = aiResponse
      .replace(/```json\s*/, "")
      .replace(/```\s*$/, "");

    let parsedData;
    try {
      parsedData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.warn("Failed to parse Gemini response, using fallback");
      return simpleParseTransaction(text);
    }

    return enhanceTransaction(parsedData, text);
  } catch (error) {
    console.warn("Gemini AI parsing failed:", error.message);
    return simpleParseTransaction(text);
  }
};

/**
 * Enhance transaction with validation
 */
const enhanceTransaction = (transaction, originalText) => {
  return {
    amount: Math.abs(parseFloat(transaction.amount)) || 0,
    description: transaction.description || originalText.substring(0, 100),
    category: COMMON_CATEGORIES.includes(transaction.category)
      ? transaction.category
      : "Other",
    type: ["income", "expense"].includes(transaction.type)
      ? transaction.type
      : "expense",
    date: isValidDate(transaction.date)
      ? transaction.date
      : new Date().toISOString().split("T")[0],
  };
};

/**
 * Simple fallback parsing
 */
const simpleParseTransaction = (text) => {
  const amountMatch = text.match(/[\$₹€£¥]?(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  const incomeKeywords = ["salary", "income", "received", "deposit", "bonus"];
  const type = incomeKeywords.some((keyword) =>
    text.toLowerCase().includes(keyword)
  )
    ? "income"
    : "expense";

  return {
    amount,
    description: text.substring(0, 100),
    category: "Other",
    type,
    date: new Date().toISOString().split("T")[0],
  };
};

/**
 * Validate date format
 */
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

export { simpleParseTransaction, COMMON_CATEGORIES };
