import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatWithNixAI = async (
  userMessage: string,
  transactions: Transaction[],
  conversationHistory: ChatMessage[]
): Promise<string> => {
  // Prepare transaction summary for context
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get current month transactions
  const currentMonthTxs = transactions.filter((t) => {
    const [y, m] = t.date.split("-");
    return parseInt(y) === currentYear && parseInt(m) === currentMonth + 1;
  });

  // Calculate summary stats
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const currentMonthIncome = currentMonthTxs
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const currentMonthExpense = currentMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  // Get categories breakdown
  const categoryExpenses: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryExpenses[t.category] =
        (categoryExpenses[t.category] || 0) + t.amount;
    });

  // Simplify recent transactions (last 50)
  const recentTransactions = transactions.slice(0, 50).map((t) => ({
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
    paymentMethod: t.paymentMethod,
  }));

  // Build conversation context
  const historyContext = conversationHistory
    .slice(-10) // Last 10 messages for context
    .map((m) => `${m.role === "user" ? "User" : "NixAI"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are NixAI, an intelligent and friendly personal finance assistant for the Nix app.
You have access to the user's financial data and can help them understand their finances, provide insights, and give recommendations.

IMPORTANT GUIDELINES:
- Be concise but helpful
- Use markdown formatting for better readability
- Use emojis sparingly but appropriately
- When discussing money, always be encouraging and non-judgmental
- If asked about specific transactions, refer to the data provided
- Provide actionable advice when possible
- If you don't have enough data to answer, say so politely

USER'S FINANCIAL CONTEXT:
- Total Income (all time): $${totalIncome.toFixed(2)}
- Total Expenses (all time): $${totalExpense.toFixed(2)}
- Overall Balance: $${(totalIncome - totalExpense).toFixed(2)}
- Current Month Income: $${currentMonthIncome.toFixed(2)}
- Current Month Expenses: $${currentMonthExpense.toFixed(2)}
- Current Month Balance: $${(currentMonthIncome - currentMonthExpense).toFixed(
    2
  )}
- Total Transactions: ${transactions.length}

Category Spending Breakdown:
${Object.entries(categoryExpenses)
  .sort(([, a], [, b]) => b - a)
  .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)}`)
  .join("\n")}

Recent Transactions (last 50):
${JSON.stringify(recentTransactions, null, 2)}

${historyContext ? `\nPREVIOUS CONVERSATION:\n${historyContext}\n` : ""}

Now respond to the user's message:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\nUser: ${userMessage}`,
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Error in NixAI chat:", error);
    throw error;
  }
};

export const getFinancialInsights = async (
  transactions: Transaction[],
  month: string,
  year: number
): Promise<string> => {
  if (transactions.length === 0) {
    return "There are not enough transactions in this period to generate an analysis.";
  }

  // Simplify data to reduce token usage and noise
  const simpleData = transactions.map((t) => ({
    desc: t.description,
    val: t.amount,
    type: t.type,
    cat: t.category,
    date: t.date,
  }));

  const prompt = `
    Act as an experienced personal financial consultant.
    Analyze the following financial data for ${month} ${year}.
    
    Data (JSON):
    ${JSON.stringify(simpleData)}

    Please provide:
    1. A brief summary of financial health (balance, biggest expenses).
    2. Two observations about spending patterns.
    3. One actionable recommendation to save money next month.

    Format the response in Markdown, use bullet points and maintain a professional but friendly tone. Use emojis where appropriate.
    If the balance is negative, give specific advice to get out of the red.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Error fetching Gemini insights:", error);
    return "An error occurred while connecting to the AI. Please try again later.";
  }
};
