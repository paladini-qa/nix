import { GoogleGenAI } from "@google/genai";
import { Transaction, ParsedTransaction, TransactionType } from "@/domain/entities";
import { getReportDate } from "@/domain/usecases/transactionUtils";

/**
 * Single env name (Vite injects GEMINI_API_KEY from .env).
 * Use isGeminiConfigured() before calling AI; show GEMINI_NOT_CONFIGURED_MESSAGE in UI when false.
 */
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();

export const isGeminiConfigured = (): boolean => GEMINI_API_KEY.length > 0;

/** User-facing copy when Smart Input / Nix AI is used without API key */
export const GEMINI_NOT_CONFIGURED_MESSAGE =
  "Configure GEMINI_API_KEY in your .env file to use Finance Control AI and Smart Input.";

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY || "placeholder-key-not-used",
});

function throwIfGeminiNotConfigured(): void {
  if (!isGeminiConfigured()) {
    const err = new Error("GEMINI_NOT_CONFIGURED");
    (err as Error & { code?: string }).code = "GEMINI_NOT_CONFIGURED";
    throw err;
  }
}

export function checkAndThrowGeminiError(error: any): void {
  if (error && typeof error === "object") {
    const status = error.status || error.statusCode;
    const message = error.message || "";
    
    if (
      status === 429 || 
      /429/i.test(message) || 
      /RESOURCE_EXHAUSTED/i.test(message) || 
      /quota exceeded/i.test(message) || 
      /Quota excedida/i.test(message)
    ) {
      const err = new Error("GEMINI_QUOTA_EXCEEDED");
      (err as any).code = "GEMINI_QUOTA_EXCEEDED";
      (err as any).originalError = error;
      throw err;
    }
    
    if (
      status === 403 || 
      status === 400 || 
      /403/i.test(message) || 
      /400/i.test(message) || 
      /API_KEY_INVALID/i.test(message) || 
      /API key not valid/i.test(message) || 
      /invalid key/i.test(message)
    ) {
      const err = new Error("GEMINI_INVALID_KEY");
      (err as any).code = "GEMINI_INVALID_KEY";
      (err as any).originalError = error;
      throw err;
    }
  }
}

/**
 * Parses and normalizes a dynamic value (string or number) into a valid float amount or null.
 * Extremely robust to handle Brazilian and US currency formats, spaces, comma decimals, etc.
 */
function parseAmount(val: any): number | null {
  if (typeof val === "number" && !isNaN(val)) {
    return val;
  }
  if (typeof val !== "string") {
    if (val && typeof val === "object" && typeof val.amount === "number") {
      return val.amount;
    }
    return null;
  }

  let cleaned = val.trim();
  // Remove currency symbols (R$, $, etc.) and spaces
  cleaned = cleaned.replace(/[R$\s]/gi, "");

  if (!cleaned) return null;

  const commaCount = (cleaned.match(/,/g) || []).length;
  const dotCount = (cleaned.match(/\./g) || []).length;

  if (commaCount === 1 && dotCount === 0) {
    cleaned = cleaned.replace(",", ".");
  } else if (dotCount === 1 && commaCount === 0) {
    // Already in standard dot format
  } else if (commaCount === 1 && dotCount > 0) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (dotCount === 1 && commaCount > 0) {
    cleaned = cleaned.replace(/,/g, "");
  } else {
    // General fallback: locate decimal separator at the end
    const lastCommaIndex = cleaned.lastIndexOf(",");
    const lastDotIndex = cleaned.lastIndexOf(".");
    
    if (lastCommaIndex > lastDotIndex && lastCommaIndex > cleaned.length - 4) {
      cleaned = cleaned.substring(0, lastCommaIndex).replace(/[\.,]/g, "") + "." + cleaned.substring(lastCommaIndex + 1);
    } else if (lastDotIndex > lastCommaIndex && lastDotIndex > cleaned.length - 4) {
      cleaned = cleaned.substring(0, lastDotIndex).replace(/[\.,]/g, "") + "." + cleaned.substring(lastDotIndex + 1);
    } else {
      cleaned = cleaned.replace(/[^\d\.,-]/g, "");
      const comma = cleaned.lastIndexOf(",");
      if (comma !== -1) {
        cleaned = cleaned.substring(0, comma).replace(/[\.,]/g, "") + "." + cleaned.substring(comma + 1);
      }
    }
  }

  const parsedFloat = parseFloat(cleaned);
  return isNaN(parsedFloat) ? null : parsedFloat;
}

/**
 * Safely extracts and parses JSON array or object from an LLM response string.
 * This is extremely robust to conversational preambles, markdown formatting, etc.
 */
function parseJSONSafely(text: string): any {
  if (!text) {
    throw new Error("Resposta vazia da IA.");
  }
  
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Try parsing directly first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Ignore direct parse failure and try regex/substring extraction
  }

  // Look for JSON array [ ... ]
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    try {
      return JSON.parse(cleaned.substring(arrayStart, arrayEnd + 1));
    } catch (e) {
      // Ignore
    }
  }

  // Look for JSON object { ... }
  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    try {
      return JSON.parse(cleaned.substring(objStart, objEnd + 1));
    } catch (e) {
      // Ignore
    }
  }

  throw new Error("Não foi possível extrair um JSON válido da resposta da IA: " + text);
}

// ========================================
// Intent Detection - Detecção de Intenção de Cadastro
// ========================================

/**
 * Resultado da detecção de intenção
 */
export interface IntentDetectionResult {
  isTransactionIntent: boolean;
  confidence: number;
  cleanedText: string;
  suggestedType?: TransactionType;
}

/**
 * Padrões para detecção de intenção de cadastro de transação
 * Ordenados por especificidade (mais específico primeiro)
 */
const TRANSACTION_PATTERNS = [
  // Comandos explícitos
  { pattern: /^(?:cadastrar|registrar|adicionar|anotar|salvar)[:.]?\s*(.+)/i, confidence: 0.95 },
  
  // Padrões com verbos de gasto + valor
  { pattern: /(?:gastei|paguei|comprei|gastar|pagar|comprar)\s+(?:r\$?\s*)?\d/i, confidence: 0.9 },
  
  // Padrões com verbos de receita + valor
  { pattern: /(?:recebi|ganhei|receber|ganhar)\s+(?:r\$?\s*)?\d/i, confidence: 0.9 },
  
  // Valor + contexto de local/forma de pagamento
  { pattern: /(?:r\$?\s*)?\d+(?:[.,]\d{2})?\s+(?:no|na|em|de|do|da|com|por|pra|para)\s+\w/i, confidence: 0.85 },
  
  // Palavras-chave financeiras + valor
  { pattern: /(?:despesa|gasto|receita|entrada|saída|conta|boleto|fatura)\s+(?:de\s+)?(?:r\$?\s*)?\d/i, confidence: 0.85 },
  
  // Valor seguido de verbo/contexto
  { pattern: /\d+(?:[.,]\d{2})?\s*(?:reais|real|pila|conto|mango)/i, confidence: 0.8 },
  
  // Menção de forma de pagamento comum
  { pattern: /(?:pix|cartão|crédito|débito|dinheiro|boleto)\s+(?:de\s+)?(?:r\$?\s*)?\d/i, confidence: 0.8 },
  
  // Apenas valor com R$ explícito
  { pattern: /r\$\s*\d+(?:[.,]\d{2})?/i, confidence: 0.6 },
];

/**
 * Detecta se o texto do usuário indica intenção de cadastrar uma transação
 * Usa análise de padrões para detecção rápida e eficiente
 */
export const detectTransactionIntent = (text: string): IntentDetectionResult => {
  const trimmedText = text.trim();
  
  // Se contiver várias linhas e houver números em pelo menos duas linhas, é altamente provável ser um cadastro em lote!
  const lines = trimmedText.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const linesWithNumbers = lines.filter(l => /\d+/.test(l));
    if (linesWithNumbers.length >= 2) {
      return {
        isTransactionIntent: true,
        confidence: 0.95,
        cleanedText: trimmedText,
        suggestedType: "expense"
      };
    }
  }

  // Verifica cada padrão
  for (const { pattern, confidence } of TRANSACTION_PATTERNS) {
    const match = trimmedText.match(pattern);
    if (match) {
      // Para comandos explícitos, extrai o texto limpo (sem o comando)
      let cleanedText = trimmedText;
      if (match[1]) {
        cleanedText = match[1].trim();
      }
      
      // Detecta tipo sugerido baseado em palavras-chave
      let suggestedType: TransactionType = "expense";
      if (/(?:recebi|ganhei|receber|ganhar|salário|venda|entrada|freelance|bônus|prêmio)/i.test(trimmedText)) {
        suggestedType = "income";
      }
      
      return {
        isTransactionIntent: true,
        confidence,
        cleanedText,
        suggestedType,
      };
    }
  }
  
  return {
    isTransactionIntent: false,
    confidence: 0,
    cleanedText: trimmedText,
  };
};

/**
 * Detecta intenção usando IA para casos ambíguos
 * Mais preciso mas mais lento - usar apenas quando padrões não são suficientes
 */
export const detectTransactionIntentWithAI = async (
  text: string
): Promise<IntentDetectionResult> => {
  // Primeiro tenta detecção por padrões (rápido)
  const patternResult = detectTransactionIntent(text);
  if (patternResult.isTransactionIntent && patternResult.confidence >= 0.8) {
    return patternResult;
  }
  
  // Se não tem certeza, usa IA
  if (!isGeminiConfigured()) {
    return patternResult;
  }
  try {
    const prompt = `Analyze if the following text indicates a user's intention to REGISTER/RECORD a financial transaction (expense or income).

Texto: "${text}"

Respond ONLY with JSON:
{
  "isTransactionIntent": boolean,
  "confidence": number (0 to 1),
  "suggestedType": "income" or "expense" or null,
  "reason": "short explanation"
}

Examples of registration intent:
- "spent 50 on uber" -> true, expense
- "received 3000 salary" -> true, income  
- "paid 200 light bill" -> true, expense
- "50 dollars at the supermarket with cash" -> true, expense

Examples that are NOT registration intent:
- "how much did I spend this month?" -> false (question)
- "how to save money?" -> false (question)
- "show me my expenses" -> false (query)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text || "";
    const parsed = parseJSONSafely(responseText);

    return {
      isTransactionIntent: parsed.isTransactionIntent === true,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      cleanedText: text.trim(),
      suggestedType: parsed.suggestedType || undefined,
    };
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error detecting intent with AI:", error);
    // Fallback para resultado dos padrões
    return patternResult;
  }
};

// ========================================
// Smart Input - Cadastro Inteligente via IA
// ========================================

/**
 * Gera o prompt base para extração de transações
 */
const getTransactionParsingPrompt = (
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[]
): string => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  return `You are an assistant specialized in extracting information from financial transactions.
Analyze the user input and extract the following fields to register a transaction:

REQUIRED FIELDS:
- description: Brief description of the transaction (e.g. "Walmart", "Salary")
- amount: Numeric value (number only, no symbols). If unable to extract, return null
- type: "income" for income/revenues or "expense" for expenses/spendings
- category: Choose the most appropriate category from the list below
- paymentMethod: Payment method from the list below
- date: Date in YYYY-MM-DD format
- confidence: Number from 0 to 1 indicating your confidence in the extraction

AVAILABLE INCOME CATEGORIES:
${categories.income.map((c) => `- ${c}`).join("\n")}

AVAILABLE EXPENSE CATEGORIES:
${categories.expense.map((c) => `- ${c}`).join("\n")}

AVAILABLE PAYMENT METHODS:
${paymentMethods.map((m) => `- ${m}`).join("\n")}

INTERPRETATION RULES:
1. For relative dates, consider TODAY is ${todayStr}:
   - "today" = ${todayStr}
   - "yesterday" = yesterday's date
   - "last week" = 7 days ago
   - "last month" = same day of previous month
   - If no date is mentioned, use ${todayStr}

2. Type inferences:
   - Words like "spent", "paid", "bought", "expense", "purchase", "gastei", "paguei" = expense
   - Words like "received", "earned", "salary", "sale", "recebi", "ganhei" = income
   - If in doubt, assume "expense" (most common)

3. Category inferences:
   - "market", "grocery", "supermarket", "food", "mercado", "supermercado" = Food
   - "uber", "99", "taxi", "bus", "subway", "gasoline", "gas", "transporte" = Transportation
   - "rent", "condo", "aluguel" = Housing
   - "netflix", "spotify", "cinema", "movies" = Entertainment
   - Use the closest available category from the list

4. Payment method inferences:
   - "pix" = Pix
   - "card", "credit", "debit", "cartão", "crédito", "débito" = Corresponding Card
   - "cash", "money", "dinheiro" = Cash
   - If not mentioned, choose the most probable from context

IMPORTANT: Respond ONLY with a valid JSON object, no markdown, no explanations.
If unable to extract a field, use sensible default values.

Expected response format:
{
  "description": "string",
  "amount": number or null,
  "type": "income" or "expense",
  "category": "string",
  "paymentMethod": "string",
  "date": "YYYY-MM-DD",
  "confidence": number
}`;
};

/**
 * Extrai dados de transação a partir de texto livre
 */
export const parseTransactionFromText = async (
  text: string,
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[]
): Promise<ParsedTransaction> => {
  throwIfGeminiNotConfigured();
  const systemPrompt = getTransactionParsingPrompt(categories, paymentMethods);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUSER INPUT:\n"${text}"` }] }],
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text || "";
    const parsed = parseJSONSafely(responseText);

    // Valida e normaliza os campos
    const result: ParsedTransaction = {
      description: parsed.description || text.slice(0, 50),
      amount: parseAmount(parsed.amount),
      type: (parsed.type === "income" || parsed.type === "expense"
        ? parsed.type
        : "expense") as TransactionType,
      category:
        parsed.category ||
        (parsed.type === "income"
          ? categories.income[0]
          : categories.expense[0]),
      paymentMethod: parsed.paymentMethod || paymentMethods[0],
      date: parsed.date || new Date().toISOString().split("T")[0],
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.5,
      rawInput: text,
    };

    // Valida se a categoria está na lista
    const validCategories =
      result.type === "income" ? categories.income : categories.expense;
    if (!validCategories.includes(result.category)) {
      result.category = validCategories[0];
      result.confidence = Math.max(0, result.confidence - 0.2);
    }

    // Valida se o método de pagamento está na lista
    if (!paymentMethods.includes(result.paymentMethod)) {
      result.paymentMethod = paymentMethods[0];
      result.confidence = Math.max(0, result.confidence - 0.1);
    }

    return result;
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error parsing transaction from text:", error);

    // Retorna um resultado padrão em caso de erro
    return {
      description: text.slice(0, 50),
      amount: null,
      type: "expense",
      category: categories.expense[0] || "Outros",
      paymentMethod: paymentMethods[0] || "Dinheiro",
      date: new Date().toISOString().split("T")[0],
      confidence: 0,
      rawInput: text,
    };
  }
};

/**
 * Converte um Blob para base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:audio/webm;base64," ou similar
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Transcreve áudio e extrai dados de transação
 */
export const parseTransactionFromAudio = async (
  audioBlob: Blob,
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[]
): Promise<ParsedTransaction> => {
  throwIfGeminiNotConfigured();
  const systemPrompt = getTransactionParsingPrompt(categories, paymentMethods);

  try {
    // Converte o áudio para base64
    const audioBase64 = await blobToBase64(audioBlob);
    
    // Determina o MIME type do áudio
    const mimeType = audioBlob.type || "audio/webm";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nThe user recorded an audio describing a financial transaction. Transcribe the audio and extract the transaction details.\n\nRespond ONLY with the JSON, without separate transcription.`,
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64,
              },
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text || "";
    const parsed = parseJSONSafely(responseText);

    // Valida e normaliza os campos
    const result: ParsedTransaction = {
      description: parsed.description || "Transação por áudio",
      amount: parseAmount(parsed.amount),
      type: (parsed.type === "income" || parsed.type === "expense"
        ? parsed.type
        : "expense") as TransactionType,
      category:
        parsed.category ||
        (parsed.type === "income"
          ? categories.income[0]
          : categories.expense[0]),
      paymentMethod: parsed.paymentMethod || paymentMethods[0],
      date: parsed.date || new Date().toISOString().split("T")[0],
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.5,
      rawInput: "[áudio]",
    };

    // Valida se a categoria está na lista
    const validCategories =
      result.type === "income" ? categories.income : categories.expense;
    if (!validCategories.includes(result.category)) {
      result.category = validCategories[0];
      result.confidence = Math.max(0, result.confidence - 0.2);
    }

    // Valida se o método de pagamento está na lista
    if (!paymentMethods.includes(result.paymentMethod)) {
      result.paymentMethod = paymentMethods[0];
      result.confidence = Math.max(0, result.confidence - 0.1);
    }

    return result;
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error parsing transaction from audio:", error);

    return {
      description: "Transação por áudio",
      amount: null,
      type: "expense",
      category: categories.expense[0] || "Outros",
      paymentMethod: paymentMethods[0] || "Dinheiro",
      date: new Date().toISOString().split("T")[0],
      confidence: 0,
      rawInput: "[áudio - erro na transcrição]",
    };
  }
};

/**
 * Extrai dados de transação a partir de imagem de recibo/comprovante
 */
export const parseTransactionFromImage = async (
  imageBase64: string,
  mimeType: string,
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[]
): Promise<ParsedTransaction> => {
  throwIfGeminiNotConfigured();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const imagePrompt = `You are an assistant specialized in extracting information from receipts and financial statements.
Analyze the receipt/statement image and extract the following details:

FIELDS TO EXTRACT:
- description: Name of the establishment or purchase description
- amount: TOTAL value of the purchase (number, no currency symbols)
- type: "expense" for purchases/spendings, "income" for revenues/receipts
- category: Most appropriate category (see list below)
- paymentMethod: Identified payment method
- date: Date on the receipt in YYYY-MM-DD format (if not found, use ${todayStr})
- confidence: Number from 0 to 1 indicating confidence in the extraction

INCOME CATEGORIES:
${categories.income.map((c) => `- ${c}`).join("\n")}

EXPENSE CATEGORIES:
${categories.expense.map((c) => `- ${c}`).join("\n")}

PAYMENT METHODS:
${paymentMethods.map((m) => `- ${m}`).join("\n")}

TIPS FOR BRAZILIAN RECEIPTS:
- Look for "VALOR TOTAL", "TOTAL", "TOTAL A PAGAR"
- CNPJ/CPF on the note indicates the merchant name
- "CRÉDITO", "DÉBITO", "PIX" indicate the payment form
- Dates in DD/MM/YYYY format must be converted to YYYY-MM-DD
- For retail coupons, look for issuance date/time

IMPORTANT: Respond ONLY with a valid JSON object.

{
  "description": "string",
  "amount": number or null,
  "type": "income" or "expense",
  "category": "string",
  "paymentMethod": "string",
  "date": "YYYY-MM-DD",
  "confidence": number
}`;

  try {
    // Remove prefixo data:image/... se presente
    const cleanBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            { text: imagePrompt },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text || "";
    const parsed = parseJSONSafely(responseText);

    // Valida e normaliza os campos
    const result: ParsedTransaction = {
      description: parsed.description || "Compra (recibo)",
      amount: parseAmount(parsed.amount),
      type: (parsed.type === "income" || parsed.type === "expense"
        ? parsed.type
        : "expense") as TransactionType,
      category:
        parsed.category ||
        (parsed.type === "income"
          ? categories.income[0]
          : categories.expense[0]),
      paymentMethod: parsed.paymentMethod || paymentMethods[0],
      date: parsed.date || todayStr,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.5,
      rawInput: "[imagem]",
    };

    // Valida se a categoria está na lista
    const validCategories =
      result.type === "income" ? categories.income : categories.expense;
    if (!validCategories.includes(result.category)) {
      result.category = validCategories[0];
      result.confidence = Math.max(0, result.confidence - 0.2);
    }

    // Valida se o método de pagamento está na lista
    if (!paymentMethods.includes(result.paymentMethod)) {
      result.paymentMethod = paymentMethods[0];
      result.confidence = Math.max(0, result.confidence - 0.1);
    }

    return result;
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error parsing transaction from image:", error);

    return {
      description: "Compra (recibo)",
      amount: null,
      type: "expense",
      category: categories.expense[0] || "Outros",
      paymentMethod: paymentMethods[0] || "Dinheiro",
      date: todayStr,
      confidence: 0,
      rawInput: "[imagem - erro na leitura]",
    };
  }
};

// ========================================
// Cadastro em lote - extração de múltiplas transações
// ========================================

/**
 * Prompt para extrair uma ou várias transações (cadastro em lote).
 * Retorna sempre um array; o modelo deve identificar se é uma ou várias transações.
 */
const getBatchTransactionParsingPrompt = (
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[]
): string => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  return `You are an assistant specialized in extracting information from financial transactions.
The user may describe ONE or MULTIPLE transactions in the same text/audio/image.
Your task is to identify ALL transactions mentioned and extract details for each one.

For EACH transaction extract:
- description: Brief description (e.g. "Walmart", "Uber")
- amount: Numeric value (number only). If unable to extract, return null
- type: "income" or "expense"
- category: Most appropriate category from the list below
- paymentMethod: Payment method from the list below
- date: Date in YYYY-MM-DD format
- confidence: Number from 0 to 1 indicating confidence in the extraction

INCOME CATEGORIES:
${categories.income.map((c) => `- ${c}`).join("\n")}

EXPENSE CATEGORIES:
${categories.expense.map((c) => `- ${c}`).join("\n")}

PAYMENT METHODS:
${paymentMethods.map((m) => `- ${m}`).join("\n")}

RULES:
1. TODAY = ${todayStr}. Use for relative date expressions ("today", "yesterday", etc.) when applicable.
2. If there is no date, use ${todayStr}.
3. If the user lists multiple spendings/purchases/revenues, return an object for each one.
4. In list printouts or receipts, each line item can be a transaction.
5. Always return a JSON ARRAY of objects, even if there is only one transaction.
6. If the input/image is a credit card invoice screenshot, bank statement, or account logs list, identify and extract EACH purchase or movement listed individually. DO NOT group or summarize them into a single transaction (like "credit card bill" or "total"). Each line item listed must become a separate object in the array.

Respond ONLY with a valid JSON: an array of objects.
Format: [ { "description": "...", "amount": number or null, "type": "income" or "expense", "category": "...", "paymentMethod": "...", "date": "YYYY-MM-DD", "confidence": number }, ... ]`;
};

/**
 * Normaliza e valida um array de transações extraídas pela IA
 */
function normalizeBatchResult(
  parsed: unknown,
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[],
  rawInput: string
): ParsedTransaction[] {
  const todayStr = new Date().toISOString().split("T")[0];
  const arr = Array.isArray(parsed) ? parsed : [parsed];

  return arr.map((item: any, index: number) => {
    const validCategories =
      (item?.type === "income" ? categories.income : categories.expense) || categories.expense;
    const cat = item?.category && validCategories.includes(item.category)
      ? item.category
      : validCategories[0] || "Other";
    const pm = item?.paymentMethod && paymentMethods.includes(item.paymentMethod)
      ? item.paymentMethod
      : paymentMethods[0] || "Pix";

    return {
      description: typeof item?.description === "string" ? item.description.slice(0, 100) : `Transação ${index + 1}`,
      amount: parseAmount(item?.amount),
      type: (item?.type === "income" || item?.type === "expense" ? item.type : "expense") as TransactionType,
      category: cat,
      paymentMethod: pm,
      date: typeof item?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : todayStr,
      confidence: typeof item?.confidence === "number" ? Math.min(1, Math.max(0, item.confidence)) : 0.5,
      rawInput: index === 0 ? rawInput : "[lote]",
    };
  });
}

/**
 * Extrai uma ou várias transações a partir de texto (cadastro em lote)
 */
export const parseBatchFromText = async (
  text: string,
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[]
): Promise<ParsedTransaction[]> => {
  throwIfGeminiNotConfigured();
  const prompt = getBatchTransactionParsingPrompt(categories, paymentMethods);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: `${prompt}\n\nUSER INPUT:\n"${text}"` }] }],
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text || "";
    const parsed = parseJSONSafely(responseText);
    return normalizeBatchResult(parsed, categories, paymentMethods, text);
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error parsing batch from text:", error);
    const single = await parseTransactionFromText(text, categories, paymentMethods);
    return [single];
  }
};

/**
 * Extrai uma ou várias transações a partir de áudio (cadastro em lote)
 */
export const parseBatchFromAudio = async (
  audioBlob: Blob,
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[]
): Promise<ParsedTransaction[]> => {
  throwIfGeminiNotConfigured();
  const prompt = getBatchTransactionParsingPrompt(categories, paymentMethods);

  try {
    const audioBase64 = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || "audio/webm";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${prompt}\n\nThe user recorded an audio describing one or multiple transactions. Transcribe and extract ALL transactions. Respond ONLY with the JSON array.`,
            },
            { inlineData: { mimeType, data: audioBase64 } },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text || "";
    const parsed = parseJSONSafely(responseText);
    return normalizeBatchResult(parsed, categories, paymentMethods, "[áudio]");
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error parsing batch from audio:", error);
    const single = await parseTransactionFromAudio(audioBlob, categories, paymentMethods);
    return [single];
  }
};

/**
 * Extrai uma ou várias transações a partir de imagem (cadastro em lote)
 */
export const parseBatchFromImage = async (
  imageBase64: string,
  mimeType: string,
  categories: { income: string[]; expense: string[] },
  paymentMethods: string[]
): Promise<ParsedTransaction[]> => {
  throwIfGeminiNotConfigured();
  const todayStr = new Date().toISOString().split("T")[0];
  const prompt = getBatchTransactionParsingPrompt(categories, paymentMethods);

  const imageInstruction = `Analyze the image (receipt, invoice, shopping list, or bank statement).
It may contain ONE or MULTIPLE transactions. Extract ALL you can identify.
Each item in a list, each row of a statement, or each purchase on a receipt can be a transaction.
Respond ONLY with a JSON array of objects (even if it is only one).`;

  try {
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            { text: `${prompt}\n\n${imageInstruction}` },
            { inlineData: { mimeType: mimeType || "image/jpeg", data: cleanBase64 } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "";
    const parsed = parseJSONSafely(responseText);
    return normalizeBatchResult(parsed, categories, paymentMethods, "[imagem]");
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error parsing batch from image:", error);
    const single = await parseTransactionFromImage(imageBase64, mimeType, categories, paymentMethods);
    return [single];
  }
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatWithNixAI = async (
  userMessage: string,
  transactions: Transaction[],
  conversationHistory: ChatMessage[]
): Promise<string> => {
  throwIfGeminiNotConfigured();
  // Prepare transaction summary for context
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get current month transactions (usa data de relatório)
  const currentMonthTxs = transactions.filter((t) => {
    const [y, m] = getReportDate(t).split("-");
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

  const systemPrompt = `You are Finance Control AI, an intelligent and friendly personal finance assistant for the Finance Control app.
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
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }],
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error in NixAI chat:", error);
    throw error;
  }
};

// ========================================
// Category Suggestion - Sugestão Preditiva de Categoria
// ========================================

export interface CategorySuggestion {
  category: string;
  confidence: number;
}

/**
 * Sugere a categoria mais apropriada com base na descrição da transação usando IA.
 * Usa cache local de padrões conhecidos para melhor performance.
 */
export const suggestCategoryWithAI = async (
  description: string,
  categories: { income: string[]; expense: string[] },
  type: TransactionType
): Promise<CategorySuggestion> => {
  // Primeiro, tenta detectar por padrões locais (rápido)
  const localSuggestion = suggestCategoryLocal(description, type, categories);
  if (localSuggestion.confidence >= 0.8) {
    return localSuggestion;
  }

  // Se não tem certeza, usa IA
  if (!isGeminiConfigured()) {
    return localSuggestion;
  }
  try {
    const availableCategories = type === "income" ? categories.income : categories.expense;

    const prompt = `Analyze the description of a financial transaction and suggest the most appropriate category.

DESCRIPTION: "${description}"
TYPE: ${type === "income" ? "Income" : "Expense"}

AVAILABLE CATEGORIES:
${availableCategories.map((c, i) => `${i + 1}. ${c}`).join("\n")}

INSTRUCTIONS:
1. Choose ONLY one category from the list above
2. Base your suggestion on common naming conventions
3. If description is very vague, choose the most probable category

Respond ONLY with JSON:
{
  "category": "exact category name from the list",
  "confidence": number from 0 to 1
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text || "";
    const parsed = parseJSONSafely(responseText);

    // Valida se a categoria está na lista
    if (availableCategories.includes(parsed.category)) {
      return {
        category: parsed.category,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
      };
    }

    // Se a IA retornou uma categoria inválida, usa a sugestão local
    return localSuggestion;
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error suggesting category with AI:", error);
    // Fallback para sugestão local
    return localSuggestion;
  }
};

/**
 * Padrões locais para sugestão rápida de categoria (sem IA)
 */
const CATEGORY_PATTERNS: { pattern: RegExp; category: string; type: TransactionType }[] = [
  // Alimentação
  { pattern: /mercado|supermercado|feira|açougue|padaria|hortifruti/i, category: "Alimentação", type: "expense" },
  { pattern: /restaurante|lanchonete|pizzaria|hamburgueria|sushi|ifood|uber\s*eats|rappi/i, category: "Alimentação", type: "expense" },
  { pattern: /café|coffee|starbucks|bakery/i, category: "Alimentação", type: "expense" },

  // Transporte
  { pattern: /uber|99|taxi|táxi|cabify|lyft|indriver/i, category: "Transporte", type: "expense" },
  { pattern: /ônibus|metro|metrô|trem|brt|bilhete\s*único/i, category: "Transporte", type: "expense" },
  { pattern: /gasolina|combustível|posto|shell|ipiranga|petrobras|br\s*mania/i, category: "Transporte", type: "expense" },
  { pattern: /estacionamento|parking|zona\s*azul|estapar/i, category: "Transporte", type: "expense" },

  // Moradia
  { pattern: /aluguel|rent|condomínio|iptu|luz|energia|elétrica|água|esgoto|gás/i, category: "Moradia", type: "expense" },
  { pattern: /internet|wi-?fi|fibra|net|claro|vivo|oi|tim/i, category: "Moradia", type: "expense" },

  // Lazer
  { pattern: /cinema|teatro|show|concerto|ingresso|ticket/i, category: "Lazer", type: "expense" },
  { pattern: /netflix|spotify|disney|hbo|prime|youtube\s*premium|apple\s*music/i, category: "Lazer", type: "expense" },
  { pattern: /jogo|game|steam|playstation|xbox|nintendo/i, category: "Lazer", type: "expense" },

  // Saúde
  { pattern: /farmácia|drogaria|droga\s*raia|drogasil|pague\s*menos|remédio|medicamento/i, category: "Saúde", type: "expense" },
  { pattern: /médico|consulta|hospital|clínica|dentista|exame|laboratório/i, category: "Saúde", type: "expense" },
  { pattern: /academia|gym|crossfit|pilates|yoga/i, category: "Saúde", type: "expense" },

  // Educação
  { pattern: /curso|udemy|coursera|alura|faculdade|universidade|escola|mensalidade/i, category: "Educação", type: "expense" },
  { pattern: /livro|livraria|amazon\s*kindle|e-?book/i, category: "Educação", type: "expense" },

  // Compras
  { pattern: /amazon|mercado\s*livre|shopee|aliexpress|magalu|americanas|casas\s*bahia/i, category: "Compras", type: "expense" },
  { pattern: /roupa|vestuário|zara|renner|c&a|riachuelo|hering/i, category: "Compras", type: "expense" },
  { pattern: /eletrônico|celular|notebook|computador|apple\s*store/i, category: "Compras", type: "expense" },

  // Receitas
  { pattern: /salário|pagamento|remuneração|holerite|contracheque/i, category: "Salário", type: "income" },
  { pattern: /freelance|freela|projeto|consultoria/i, category: "Freelance", type: "income" },
  { pattern: /investimento|dividendo|rendimento|juros|ações|fii/i, category: "Investimentos", type: "income" },
  { pattern: /venda|vendas|comissão/i, category: "Vendas", type: "income" },
  { pattern: /reembolso|restituição|devolução/i, category: "Reembolso", type: "income" },
];

/**
 * Sugere categoria localmente usando padrões regex (rápido, sem API)
 */
const suggestCategoryLocal = (
  description: string,
  type: TransactionType,
  categories: { income: string[]; expense: string[] }
): CategorySuggestion => {
  const availableCategories = type === "income" ? categories.income : categories.expense;

  // Procura por padrões conhecidos
  for (const { pattern, category, type: patternType } of CATEGORY_PATTERNS) {
    if (patternType === type && pattern.test(description)) {
      // Verifica se a categoria sugerida existe na lista do usuário
      const matchingCategory = availableCategories.find(
        (c) => c.toLowerCase() === category.toLowerCase() ||
               c.toLowerCase().includes(category.toLowerCase()) ||
               category.toLowerCase().includes(c.toLowerCase())
      );

      if (matchingCategory) {
        return {
          category: matchingCategory,
          confidence: 0.85,
        };
      }
    }
  }

  // Se não encontrou padrão, retorna a primeira categoria com baixa confiança
  return {
    category: availableCategories[0] || "Outros",
    confidence: 0.3,
  };
};

export const getFinancialInsights = async (
  transactions: Transaction[],
  month: string,
  year: number
): Promise<string> => {
  throwIfGeminiNotConfigured();
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
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error fetching Gemini insights:", error);
    return "An error occurred while connecting to the AI. Please try again later.";
  }
};
/**
 * Gera um título curto e criativo para a conversa baseado na primeira mensagem
 */
export const generateChatTitle = async (firstMessage: string): Promise<string> => {
  if (!isGeminiConfigured()) return "New Conversation";
  
  try {
    const prompt = `Generate a short and creative title (maximum 4 words) in English for a conversation that starts with the following input: "${firstMessage}". Respond with only the title, without quotes or ending punctuation. If it is audio or an image, generate something generic related to finance.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return (response.text || "New Conversation").trim();
  } catch (error) {
    checkAndThrowGeminiError(error);
    console.error("Error generating chat title:", error);
    return "New Conversation";
  }
};
