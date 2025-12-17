import { GoogleGenAI } from "@google/genai";
import { Transaction, TYPE_LABELS, CATEGORY_LABELS } from '../types';

export const generateFinancialInsight = async (transactions: Transaction[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not configured. Please check your environment settings.";
  }

  // Filter for current month to keep context relevant and small
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  if (currentMonthTransactions.length === 0) {
    return "本月暂无交易记录，快去记一笔吧！";
  }

  // Summarize data for the prompt to save tokens
  const summary = currentMonthTransactions.map(t => 
    `- ${t.date.split('T')[0]}: ${TYPE_LABELS[t.type]} (${CATEGORY_LABELS[t.category]}) - ${t.amount}元 - ${t.description}`
  ).join('\n');

  const prompt = `
    你是一位专业的私人理财顾问。请根据以下我本月的记账记录，提供一份简短的财务分析和建议。
    
    记录数据:
    ${summary}

    请分析：
    1. 总支出和总收入的情况。
    2. "日常"与"额外"花销的比例是否合理。
    3. 给出一条具体的省钱或理财建议。
    
    请用亲切、鼓励的语气，使用Markdown格式输出，字数控制在300字以内。
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "无法生成分析结果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析过程中发生错误，请稍后再试。";
  }
};