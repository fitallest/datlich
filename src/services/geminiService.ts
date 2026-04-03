import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const callGemini = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Không thể tạo nội dung.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi kết nối AI.";
  }
};
