'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Sparkles, Brain, Settings, MessageSquare, Eye, EyeOff, Calendar, History } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/sonner'
import { toast as sonnerToast } from 'sonner'

interface DailyQuestion {
  id: number
  question: string
  answer: string
  category: string
  createdAt: string
}

interface HistoryItem {
  id: number
  question: string
  answer: string
  category: string
  userNotes?: string
  createdAt: string
}

const DEFAULT_PROMPT = `You are a life coach and mentor for Indian students from tier-3 colleges.

Generate ONE thought-provoking question about future decisions that a final-year BTech ECE student (8th semester) should think about.

### STUDENT CONTEXT:
- Final year BTech ECE student (8th semester)
- Tier-3 college in India
- Family income: Less than 25,000 INR/month
- Category: OBC
- Location: Tier-2/3 city
- Strengths: Technical skills (Web Development, AI/ML, Agentic AI, Hardware basics)
- Weaknesses: Limited knowledge of worldly systems, decision-making, practical life management
- Needs help with: Government procedures, financial management, relationships, household management, social presence, professional responsibilities

### QUESTION CATEGORIES (randomly pick one):
1. Career & Placement
2. Financial Planning & Management
3. Government Documentation & Legal
4. Higher Education & Skill Development
5. Family & Relationships
6. Professional Networking & Social Presence
7. Personal Development & Habits
8. Housing & Independent Living
9. Health & Insurance
10. Post-Graduation Transition

### RULES:
- Generate ONLY ONE question
- Make it specific to Indian tier-3 college context
- Consider financial constraints (family income <25k/month)
- Focus on practical, actionable decisions
- Question should help student think 3-6 months ahead
- Avoid generic motivational questions
- Include real-world scenarios faced by students from similar backgrounds

### OUTPUT FORMAT:
Return a JSON object with exactly this structure:
{
  "question": "Your detailed question here",
  "answer": "A comprehensive, practical answer considering the student's background and constraints. Include 3-4 concrete action steps with realistic timelines and budget considerations.",
  "category": "One of the 10 categories listed above"
}

Generate the question now.`

export default function DailyDecisionTool() {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT)
  const [todayQuestion, setTodayQuestion] = useState<DailyQuestion | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isAskingAI, setIsAskingAI] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return

    loadTodayQuestion()
    loadHistory()
  }, [isLoaded, isSignedIn])

  const loadTodayQuestion = async () => {
    try {
      const response = await fetch('/api/daily-decision/today')
      if (response.ok) {
        const data = await response.json()
        setTodayQuestion(data.question)
        setLastGenerated(data.question?.createdAt || null)
      }
    } catch (error) {
      console.error('Error loading today\'s question:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/daily-decision/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const canGenerateToday = () => {
    if (!lastGenerated) return true
    const lastDate = new Date(lastGenerated).toDateString()
    const today = new Date().toDateString()
    return lastDate !== today
  }

  const handleGenerateQuestion = async () => {
    if (!canGenerateToday()) {
      sonnerToast.error('You can only generate one question per day!')
      return
    }

    setIsGenerating(true)
    setShowAnswer(false)

    try {
      const response = await fetch('/api/daily-decision/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt })
      })

      if (response.ok) {
        const data = await response.json()
        setTodayQuestion(data.question)
        setLastGenerated(new Date().toISOString())
        sonnerToast.success('Today\'s question generated!')
        loadHistory()
      } else {
        const errorData = await response.json()
        sonnerToast.error(errorData.error || 'Failed to generate question')
      }
    } catch (error) {
      console.error('Error generating question:', error)
      sonnerToast.error('Error generating question')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAskAI = async () => {
    if (!aiQuery.trim() || !todayQuestion) {
      sonnerToast.error('Please enter a question')
      return
    }

    setIsAskingAI(true)
    setAiResponse('')

    try {
      const response = await fetch('/api/daily-decision/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: todayQuestion.question,
          answer: todayQuestion.answer,
          userQuery: aiQuery
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiResponse(data.response)
      } else {
        sonnerToast.error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Error asking AI:', error)
      sonnerToast.error('Error asking AI')
    } finally {
      setIsAskingAI(false)
    }
  }

  const handleLoadHistoryItem = (item: HistoryItem) => {
    setTodayQuestion({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: item.category,
      createdAt: item.createdAt
    })
    setShowAnswer(false)
    setAiQuery('')
    setAiResponse('')
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Daily Decision Coach
              </h1>
              <p className="text-xs text-gray-600">One Question a Day for Better Decisions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Prompt Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Prompt Configuration
                </CardTitle>
                <CardDescription>
                  Customize the AI prompt for question generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Custom Prompt Template</Label>
                  <Textarea
                    placeholder="Enter your custom prompt..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={15}
                    className="font-mono text-xs"
                  />
                </div>
                <Button 
                  onClick={() => {
                    setCustomPrompt(DEFAULT_PROMPT)
                    sonnerToast.success('Prompt reset to default')
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Reset to Default
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Today's Question */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today&apos;s Question
                  </span>
                  {todayQuestion && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {todayQuestion.category}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!todayQuestion ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <Brain className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No question generated yet for today</p>
                    <Button 
                      onClick={handleGenerateQuestion}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Today&apos;s Question
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {todayQuestion.question}
                      </p>
                    </div>

                    <Button
                      onClick={() => setShowAnswer(!showAnswer)}
                      variant="outline"
                      className="w-full"
                    >
                      {showAnswer ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Answer
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Answer
                        </>
                      )}
                    </Button>

                    {showAnswer && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="text-sm font-semibold text-green-900 mb-2">Answer:</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {todayQuestion.answer}
                        </p>
                      </div>
                    )}

                    {canGenerateToday() ? (
                      <Button 
                        onClick={handleGenerateQuestion}
                        disabled={isGenerating}
                        variant="secondary"
                        className="w-full"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate New Question
                      </Button>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-yellow-800">
                          ✓ Question generated for today. Come back tomorrow for a new one!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ask AI Section */}
            {todayQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Ask AI About This Question
                  </CardTitle>
                  <CardDescription>
                    Get more insights or clarifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Your Question</Label>
                    <Textarea
                      placeholder="E.g., Can you give me more specific examples? What if I have constraints X?"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleAskAI}
                    disabled={isAskingAI || !aiQuery.trim()}
                    className="w-full"
                  >
                    {isAskingAI ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Asking AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Ask AI
                      </>
                    )}
                  </Button>

                  {aiResponse && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">AI Response:</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {aiResponse}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - History */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Question History
                </CardTitle>
                <CardDescription>
                  View your past decision questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-center">
                      <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-sm text-gray-500">No history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <Card
                          key={item.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleLoadHistoryItem(item)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {item.question}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}