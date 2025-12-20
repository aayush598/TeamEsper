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

// lib/gemini.ts - Add this function to your existing file

/**
 * Generate production-ready code snippets for typing practice
 */
export async function generateCodeSnippet(
  topic: string,
  language: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<string> {
  try {
    const difficultyGuidelines = {
      beginner: '15-25 lines, basic concepts, simple logic',
      intermediate: '25-40 lines, moderate complexity, real-world patterns',
      advanced: '40-60 lines, complex logic, advanced patterns, optimization'
    };

    const prompt = `You are a senior software engineer creating production-ready code examples for typing practice and learning.

TOPIC: ${topic}
LANGUAGE: ${language}
DIFFICULTY: ${difficulty} (${difficultyGuidelines[difficulty]})

REQUIREMENTS:
1. Generate COMPLETE, FUNCTIONAL code or some part of any functioanlity partially
2. Code must be production-ready, scalable, and follow industry best practices
3. Include proper error handling, edge cases, and validation
4. Use meaningful variable names and clear logic
5. Add minimal but essential comments for complex sections
6. Follow language-specific conventions and idioms
7. Include proper imports/includes if needed
8. Code should demonstrate real-world problem solving
9. Must be standalone and executable
10. Target length: ${difficultyGuidelines[difficulty]}
11. Code must different everytime and cover advanced concept not basic concept
12. Code be generated for interviews questions that they may ask

EXAMPLES OF GOOD TOPICS:
- API request handler with error handling
- Binary search tree implementation
- React component with hooks and state management
- Database query optimization function
- Authentication middleware
- Data processing pipeline
- Algorithm implementation (sorting, searching)
- Design pattern implementation

DO NOT:
- Use placeholder comments like "// TODO" or "// Add logic here"
- Leave incomplete functions
- Skip error handling
- Use overly simple "hello world" style code
- Include explanatory text outside the code

OUTPUT:
Return ONLY the code, nothing else. No markdown formatting, no explanation, just pure code.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let code = response.text();

    // Clean up the response - remove markdown code blocks if present
    code = code.replace(/```[\w]*\n/g, '').replace(/```/g, '').trim();

    return code;
  } catch (error) {
    console.error("Gemini code generation error:", error);
    throw new Error("Failed to generate code snippet");
  }
}

/**
 * Generate a descriptive title for a code snippet
 */
export async function generateCodeTitle(
  code: string,
  topic: string,
  language: string
): Promise<{ title: string; description: string }> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 200,
      }
    });

    const prompt = `Analyze this ${language} code about ${topic} and provide:
1. A concise, professional title (5-8 words)
2. A brief description (10-15 words)

Code:
${code.substring(0, 500)}...

Respond in JSON format:
{
  "title": "...",
  "description": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean JSON response
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return {
      title: parsed.title || `${topic} Implementation`,
      description: parsed.description || `Professional ${language} code for ${topic}`
    };
  } catch (error) {
    console.error("Title generation error:", error);
    return {
      title: `${topic} Implementation in ${language}`,
      description: `Professional ${language} code demonstrating ${topic}`
    };
  }
}