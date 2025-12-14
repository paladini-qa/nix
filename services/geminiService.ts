import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
