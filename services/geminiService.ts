import { GoogleGenAI } from "@google/genai";
import { HexagramData, LineType, Language } from "../types";

export const interpretHexagram = async (
  hexagram: HexagramData,
  question: string,
  language: Language
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  let structureDesc = "";
  hexagram.lines.forEach((line, index) => {
    const position = index + 1;
    let typeDesc = "";
    switch (line.lineType) {
      case LineType.ShaoYin: typeDesc = "Yin (Broken) - Unchanging"; break;
      case LineType.ShaoYang: typeDesc = "Yang (Solid) - Unchanging"; break;
      case LineType.LaoYin: typeDesc = "Old Yin (Broken) - Changes to Yang"; break;
      case LineType.LaoYang: typeDesc = "Old Yang (Solid) - Changes to Yin"; break;
    }
    structureDesc += `Line ${position} (from bottom): ${typeDesc}\n`;
  });

  // Language instructions
  let langInstruction = "";
  switch (language) {
    case 'zh-CN': langInstruction = "Please respond strictly in Simplified Chinese (简体中文)."; break;
    case 'zh-TW': langInstruction = "Please respond strictly in Traditional Chinese (繁體中文)."; break;
    case 'ja': langInstruction = "Please respond strictly in Japanese (日本語)."; break;
    case 'en': langInstruction = "Please respond in English."; break;
    default: langInstruction = "Please respond in Simplified Chinese."; break;
  }

  const prompt = `
    You are an expert I Ching (Book of Changes) master with deep knowledge of the Liu Yao (Six Lines/Six Relations) method (六爻纳甲).
    
    ${langInstruction}
    
    The user has cast the following hexagram:
    ${structureDesc}
    
    User's Question: "${question || "General Fortune/Situation"}"
    
    **CRITICAL ANALYSIS STEP (Liu Yao Method):**
    1.  First, categorize the user's question (e.g., Wealth, Career, Relationship, Health, Litigation, Lost Items).
    2.  Identify the **Subject Line (Shi)** and **Object Line (Ying)** of the hexagram.
    3.  Identify the **Use God (Yong Shen / 用神)**: The specific Six Relation (Parent, Official, Wealth, Brother, Offspring) that governs the question's topic.
        *   Example: Asking about Money -> Wealth Line (妻财).
        *   Example: Asking about Career/Husband -> Official Line (官鬼).
        *   Example: Asking about Parents/Education/Contracts -> Parent Line (父母).
        *   Example: Asking about Children/Pleasure -> Offspring Line (子孙).
        *   Example: Asking about Siblings/Friends -> Brother Line (兄弟).
    4.  Analyze the relationship between the Shi line, the Ying line, and the Use God. Are they helping each other or conflicting?
    
    Please provide a comprehensive interpretation following this structure (Use Markdown):
    
    1.  **Hexagram Identification**: Original Hexagram (Ben Gua) and Changed Hexagram (Bian Gua).
    2.  **Liu Yao Diagnosis**:
        *   State the **Subject (Shi)** and **Object (Ying)**.
        *   Identify the **Key Focus (Use God)** for the question "${question}".
        *   Briefly explain the elemental relationship (e.g., "The Wealth line holds the Subject, indicating...").
    3.  **General Meaning**: The core archetype of the Original Hexagram.
    4.  **In-Depth Analysis**: Combining the Hexagram meaning with the Liu Yao relations. If there are moving lines, analyze them specifically as the dynamic factors of the situation.
    5.  **Direct Answer**: A direct, actionable prediction or answer to the question.
    6.  **Guidance**: Philosophical or practical advice.
    
    Tone: Mystical yet clear, supportive, and highly logical based on traditional rules.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Sorry, the spirits are quiet right now (No response from AI).";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while consulting the oracle. Please try again later.";
  }
};