import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

export async function generateQuestions(
  prompt: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;

    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    throw new Error(`Failed to generate questions: ${message}`);
  }
}
