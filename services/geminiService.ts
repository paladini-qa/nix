import { GoogleGenAI } from "@google/genai";
import { Transaction, ParsedTransaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  return `Você é um assistente especializado em extrair informações de transações financeiras.
Analise o input do usuário e extraia os seguintes campos para cadastrar uma transação:

CAMPOS OBRIGATÓRIOS:
- description: Descrição breve da transação (ex: "Mercado Extra", "Salário")
- amount: Valor numérico (apenas o número, sem símbolos). Se não conseguir extrair, retorne null
- type: "income" para receitas/entradas ou "expense" para despesas/gastos
- category: Escolha a categoria mais apropriada da lista abaixo
- paymentMethod: Método de pagamento da lista abaixo
- date: Data no formato YYYY-MM-DD
- confidence: Número de 0 a 1 indicando sua confiança na extração

CATEGORIAS DE RECEITA DISPONÍVEIS:
${categories.income.map((c) => `- ${c}`).join("\n")}

CATEGORIAS DE DESPESA DISPONÍVEIS:
${categories.expense.map((c) => `- ${c}`).join("\n")}

MÉTODOS DE PAGAMENTO DISPONÍVEIS:
${paymentMethods.map((m) => `- ${m}`).join("\n")}

REGRAS DE INTERPRETAÇÃO:
1. Para datas relativas, considere que HOJE é ${todayStr}:
   - "hoje" = ${todayStr}
   - "ontem" = data de ontem
   - "semana passada" = 7 dias atrás
   - "mês passado" = mesmo dia do mês anterior
   - Se não mencionar data, use ${todayStr}

2. Inferências de tipo:
   - Palavras como "gastei", "paguei", "comprei", "despesa" = expense
   - Palavras como "recebi", "ganhei", "salário", "venda" = income
   - Na dúvida, assuma "expense" (mais comum)

3. Inferências de categoria:
   - "mercado", "supermercado", "feira" = Alimentação ou Mercado
   - "uber", "99", "taxi", "ônibus", "metrô" = Transporte
   - "aluguel", "condomínio" = Moradia
   - "netflix", "spotify", "cinema" = Lazer/Entretenimento
   - Use a categoria mais próxima disponível na lista

4. Inferências de método de pagamento:
   - "pix" = Pix
   - "cartão", "crédito", "débito" = Cartão correspondente
   - "dinheiro", "espécie" = Dinheiro
   - Se não mencionar, escolha o mais provável pelo contexto

IMPORTANTE: Responda APENAS com um objeto JSON válido, sem markdown, sem explicações.
Se não conseguir extrair algum campo, use valores padrão sensatos.

Formato de resposta esperado:
{
  "description": "string",
  "amount": number ou null,
  "type": "income" ou "expense",
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
  const systemPrompt = getTransactionParsingPrompt(categories, paymentMethods);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\nINPUT DO USUÁRIO:\n"${text}"`,
    });

    const responseText = response.text || "";
    
    // Limpa possíveis marcadores de código markdown
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    // Valida e normaliza os campos
    const result: ParsedTransaction = {
      description: parsed.description || text.slice(0, 50),
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
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
  const systemPrompt = getTransactionParsingPrompt(categories, paymentMethods);

  try {
    // Converte o áudio para base64
    const audioBase64 = await blobToBase64(audioBlob);
    
    // Determina o MIME type do áudio
    const mimeType = audioBlob.type || "audio/webm";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nO usuário gravou um áudio descrevendo uma transação financeira. Transcreva o áudio e extraia as informações da transação.\n\nResponda APENAS com o JSON, sem transcrição separada.`,
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
    });

    const responseText = response.text || "";

    // Limpa possíveis marcadores de código markdown
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    // Valida e normaliza os campos
    const result: ParsedTransaction = {
      description: parsed.description || "Transação por áudio",
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
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
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const imagePrompt = `Você é um assistente especializado em extrair informações de recibos e comprovantes financeiros.
Analise a imagem do recibo/comprovante e extraia as seguintes informações:

CAMPOS A EXTRAIR:
- description: Nome do estabelecimento ou descrição da compra
- amount: Valor TOTAL da compra (número, sem símbolos de moeda)
- type: "expense" para compras/gastos, "income" para recebimentos
- category: Categoria mais apropriada (veja lista abaixo)
- paymentMethod: Método de pagamento identificado
- date: Data do comprovante no formato YYYY-MM-DD (se não encontrar, use ${todayStr})
- confidence: Número de 0 a 1 indicando confiança na extração

CATEGORIAS DE RECEITA:
${categories.income.map((c) => `- ${c}`).join("\n")}

CATEGORIAS DE DESPESA:
${categories.expense.map((c) => `- ${c}`).join("\n")}

MÉTODOS DE PAGAMENTO:
${paymentMethods.map((m) => `- ${m}`).join("\n")}

DICAS PARA RECIBOS BRASILEIROS:
- Procure por "VALOR TOTAL", "TOTAL", "TOTAL A PAGAR"
- CPF/CNPJ na nota indica o estabelecimento
- "CRÉDITO", "DÉBITO", "PIX" indicam forma de pagamento
- Datas em formato DD/MM/YYYY devem ser convertidas para YYYY-MM-DD
- Se for cupom fiscal, procure a data/hora de emissão

IMPORTANTE: Responda APENAS com um objeto JSON válido.

{
  "description": "string",
  "amount": number ou null,
  "type": "income" ou "expense",
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
      model: "gemini-2.5-flash",
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
    });

    const responseText = response.text || "";

    // Limpa possíveis marcadores de código markdown
    const cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    // Valida e normaliza os campos
    const result: ParsedTransaction = {
      description: parsed.description || "Compra (recibo)",
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
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
