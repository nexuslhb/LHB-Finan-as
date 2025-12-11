import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIAnalysisResult, TransactionType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeFinances = async (transactions: Transaction[]): Promise<AIAnalysisResult> => {
  if (transactions.length === 0) {
    return {
      summary: "Sem transações para analisar ainda. Comece a adicionar suas entradas e saídas!",
      financialHealthScore: 0,
      actionableTips: ["Adicione sua primeira transação."],
      projectedSavings: 0
    };
  }

  // Filter last 30 days for relevance, or take last 50 transactions to fit context
  const recentTransactions = transactions.slice(0, 50);
  const transactionData = JSON.stringify(recentTransactions.map(t => ({
    amount: t.amount,
    type: t.type,
    category: t.category,
    subCategory: t.subCategory,
    bank: t.bank, 
    paymentMethod: t.paymentMethod, // Added payment method to analysis
    date: t.date
  })));

  const prompt = `
    Analise o seguinte histórico de transações financeiras (formato JSON).
    A moeda é Real Brasileiro (BRL).
    Forneça uma avaliação de saúde financeira.
    Responda estritamente em Português do Brasil (pt-BR).
    
    Transações: ${transactionData}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um consultor financeiro especialista. Analise padrões de gastos (categorias, subcategorias, bancos e formas de pagamento), identifique desperdícios e sugira melhorias. Seja conciso e encorajador. Responda em Português do Brasil.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Um breve resumo de 2 frases sobre o comportamento financeiro do usuário em Português.",
            },
            financialHealthScore: {
              type: Type.NUMBER,
              description: "Uma pontuação de 0 a 100 representando a saúde financeira.",
            },
            actionableTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 dicas práticas e acionáveis para melhorar o fluxo de caixa em Português.",
            },
            projectedSavings: {
              type: Type.NUMBER,
              description: "Economia mensal potencial estimada se as dicas forem seguidas.",
            }
          },
          required: ["summary", "financialHealthScore", "actionableTips", "projectedSavings"],
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      summary: "Não foi possível analisar as finanças no momento.",
      financialHealthScore: 0,
      actionableTips: ["Verifique sua conexão com a internet", "Verifique se a chave da API é válida"],
      projectedSavings: 0
    };
  }
};