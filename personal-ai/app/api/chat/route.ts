import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
  systemInstruction: `
You are a helpful assistant.
You MUST NOT generate:
- Programming code
- Code snippets
- Code blocks
- Markup code (HTML, JSX, Markdown code fences)
- Configuration files
- Terminal commands

If the user asks for code, explain the concept in plain English only.
Respond using simple text paragraphs and bullet points when helpful.
`,
})


    const result = await model.generateContent(prompt)
    const response = result.response.text()

    return NextResponse.json({ answer: response })
  } catch (error) {
    console.error('Gemini error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}
