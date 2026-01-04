import { GoogleGenAI } from "@google/genai";
import { Transaction, ParsedTransaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  try {
    const prompt = `Analise se o texto a seguir indica uma intenção do usuário de REGISTRAR/CADASTRAR uma transação financeira (gasto ou receita).

Texto: "${text}"

Responda APENAS com JSON:
{
  "isTransactionIntent": boolean,
  "confidence": number (0 a 1),
  "suggestedType": "income" ou "expense" ou null,
  "reason": "explicação curta"
}

Exemplos de intenção de cadastro:
- "gastei 50 no uber" -> true, expense
- "recebi 3000 de salário" -> true, income  
- "paguei 200 de luz" -> true, expense
- "50 reais no mercado com pix" -> true, expense

Exemplos que NÃO são intenção de cadastro:
- "quanto gastei esse mês?" -> false (pergunta)
- "como economizar?" -> false (pergunta)
- "me mostra minhas despesas" -> false (consulta)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = (response.text || "")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(responseText);

    return {
      isTransactionIntent: parsed.isTransactionIntent === true,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      cleanedText: text.trim(),
      suggestedType: parsed.suggestedType || undefined,
    };
  } catch (error) {
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
  try {
    const availableCategories = type === "income" ? categories.income : categories.expense;

    const prompt = `Analise a descrição de uma transação financeira e sugira a categoria mais apropriada.

DESCRIÇÃO: "${description}"
TIPO: ${type === "income" ? "Receita" : "Despesa"}

CATEGORIAS DISPONÍVEIS:
${availableCategories.map((c, i) => `${i + 1}. ${c}`).join("\n")}

INSTRUÇÕES:
1. Escolha APENAS uma categoria da lista acima
2. Baseie-se em padrões comuns de nomenclatura
3. Se a descrição for muito vaga, escolha a mais provável

Responda APENAS com JSON:
{
  "category": "nome exato da categoria da lista",
  "confidence": número de 0 a 1
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = (response.text || "")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(responseText);

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
