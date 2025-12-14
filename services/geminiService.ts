import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (transactions: Transaction[], month: string, year: number): Promise<string> => {
  if (transactions.length === 0) {
    return "Não há transações suficientes neste período para gerar uma análise.";
  }

  // Simplify data to reduce token usage and noise
  const simpleData = transactions.map(t => ({
    desc: t.description,
    val: t.amount,
    type: t.type,
    cat: t.category,
    date: t.date
  }));

  const prompt = `
    Atue como um consultor financeiro pessoal experiente.
    Analise os seguintes dados financeiros referentes a ${month} de ${year}.
    
    Dados (JSON):
    ${JSON.stringify(simpleData)}

    Por favor, forneça:
    1. Um breve resumo da saúde financeira (saldo, maiores gastos).
    2. Duas observações sobre padrões de gastos.
    3. Uma recomendação acionável para economizar dinheiro no próximo mês.

    Formate a resposta em Markdown, use bullet points e mantenha um tom profissional mas amigável. Use emojis onde apropriado.
    Se o saldo for negativo, dê conselhos específicos para sair do vermelho.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Error fetching Gemini insights:", error);
    return "Ocorreu um erro ao conectar com a inteligência artificial. Tente novamente mais tarde.";
  }
};
