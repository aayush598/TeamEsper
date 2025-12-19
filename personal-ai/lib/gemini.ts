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

/**
 * Generate daily decision question using Gemini 2.5 Flash
 */
export async function generateDailyQuestion(prompt: string): Promise<string> {
  try {
    // Use Gemini 2.5 Flash model (lite version)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",  // Latest flash model
      generationConfig: {
        temperature: 0.9,  // Higher creativity for diverse questions
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate question with Gemini");
  }
}

/**
 * Ask AI about the generated question for clarifications
 */
export async function askAIAboutQuestion(contextPrompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7,  // More focused responses for Q&A
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to get AI response");
  }
}
