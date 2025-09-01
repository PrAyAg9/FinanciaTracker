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

Available Categories (choose the MOST appropriate one):
- Food & Dining: restaurants, fast food, cafes, food delivery, dining out
- Gas & Fuel: gas stations, fuel, petrol, diesel
- Groceries: supermarkets, grocery stores, food shopping
- Shopping: retail, clothing, electronics, online shopping, Amazon
- Entertainment: movies, games, subscriptions, streaming, concerts
- Bills & Utilities: electricity, water, internet, phone, utilities
- Travel: hotels, flights, transportation, vacation
- Healthcare: medical, pharmacy, doctor, hospital
- Education: courses, books, tuition, training
- Transportation: taxi, uber, bus, train, public transport
- Salary: salary, wages, paycheck
- Freelance: freelance work, consulting, side income
- Investment: dividends, returns, investment income
- Business: business income, sales
- Gift: gifts received, presents
- Other: anything that doesn't fit above categories

Text to parse: "${text}"

Examples:
- "Lunch at McDonald's $12.50" → category: "Food & Dining"
- "Gas station $45" → category: "Gas & Fuel"  
- "Netflix subscription $15" → category: "Entertainment"
- "Grocery shopping $85" → category: "Groceries"
- "Uber ride $25" → category: "Transportation"

Return JSON format:
{
  "amount": number,
  "description": "string", 
  "category": "exact category from list above",
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
  // Validate and correct category
  let validCategory = "Other";
  if (transaction.category && COMMON_CATEGORIES.includes(transaction.category)) {
    validCategory = transaction.category;
  } else {
    // Try to find a close match (case insensitive)
    const lowerCategory = transaction.category?.toLowerCase();
    const match = COMMON_CATEGORIES.find(cat => 
      cat.toLowerCase() === lowerCategory || 
      cat.toLowerCase().includes(lowerCategory) ||
      lowerCategory?.includes(cat.toLowerCase())
    );
    if (match) {
      validCategory = match;
    } else {
      console.log(`⚠️ Category "${transaction.category}" not found, using fallback parsing`);
      // Use fallback parsing for better category detection
      const fallback = simpleParseTransaction(originalText);
      validCategory = fallback.category;
    }
  }

  console.log(`📝 Transaction parsed: "${originalText}" → Category: "${validCategory}"`);

  return {
    amount: Math.abs(parseFloat(transaction.amount)) || 0,
    description: transaction.description || originalText.substring(0, 100),
    category: validCategory,
    type: ["income", "expense"].includes(transaction.type)
      ? transaction.type
      : "expense",
    date: isValidDate(transaction.date)
      ? transaction.date
      : new Date().toISOString().split("T")[0],
  };
};

/**
 * Simple fallback parsing with basic category detection
 */
const simpleParseTransaction = (text) => {
  const amountMatch = text.match(/[\$₹€£¥]?(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  const lowerText = text.toLowerCase();
  
  // Income detection
  const incomeKeywords = ["salary", "income", "received", "deposit", "bonus", "wage", "paycheck", "freelance"];
  const type = incomeKeywords.some((keyword) =>
    lowerText.includes(keyword)
  ) ? "income" : "expense";

  // Category detection based on keywords
  let category = "Other";
  
  const categoryKeywords = {
    "Food & Dining": ["restaurant", "dining", "food", "lunch", "dinner", "breakfast", "cafe", "coffee", "pizza", "burger", "mcdonald", "kfc", "subway", "starbucks", "domino", "delivery"],
    "Gas & Fuel": ["gas", "fuel", "petrol", "diesel", "shell", "bp", "exxon", "chevron", "station"],
    "Groceries": ["grocery", "supermarket", "walmart", "target", "costco", "kroger", "safeway", "market", "food shopping"],
    "Shopping": ["amazon", "shopping", "store", "retail", "clothing", "electronics", "mall", "online", "purchase"],
    "Entertainment": ["movie", "netflix", "spotify", "gaming", "steam", "entertainment", "subscription", "streaming", "concert", "theater"],
    "Bills & Utilities": ["electric", "electricity", "water", "internet", "phone", "utility", "bill", "cable", "mobile"],
    "Travel": ["hotel", "flight", "airplane", "vacation", "travel", "booking", "airbnb", "uber", "taxi"],
    "Transportation": ["uber", "taxi", "bus", "train", "metro", "transport", "parking", "toll"],
    "Healthcare": ["doctor", "medical", "pharmacy", "hospital", "health", "medicine", "clinic"],
    "Education": ["course", "education", "book", "tuition", "school", "university", "training"]
  };

  // Find the best matching category
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      category = cat;
      break;
    }
  }

  return {
    amount,
    description: text.substring(0, 100),
    category,
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
