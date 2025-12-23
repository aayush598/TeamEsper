'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Plus, Trash2, Sparkles, Brain, Settings, FileText, Copy } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/sonner'
import { toast as sonnerToast } from 'sonner'

interface Topic {
  id: number;
  name: string;
}

interface Prompt {
  id: number;
  title: string;
  prompt: string;
}

interface HistoryItem {
  id: number;
  topics: string[];
  quizMode: string;
  questionType: string;
  numQuestions: number;
  createdAt: string;
}

const DEFAULT_PROMPT = `You are a senior technical interviewer at a top product-based company.

Your task is to generate ONLY QUESTIONS (no answers, no hints, no explanations).

### STRICT RULES:
- Do NOT include answers or solutions.
- Do NOT include explanations.
- Do NOT generate beginner or definition-only questions.
- Assume the candidate has already studied the topic.
- Difficulty level: Intermediate to Advanced (Interview level).
- Questions must test:
  - Practical understanding
  - Edge cases
  - Trade-offs
  - Real-world scenarios
  - Problem-solving ability
- Avoid trivial, textbook, or memorization-based questions.

### TOPICS:
{topics}

### QUIZ MODE:
{quiz_mode}

Rules for quiz mode:
- combined → questions must combine multiple topics together.
- individual → generate questions separately for each topic.
- selective → generate questions ONLY from the selected topics.

### QUESTION TYPE:
{question_type}

Rules for question type:
- conceptual → theory, design, architecture, reasoning questions.
- coding → implementation, debugging, optimization, edge-case handling.
- both → mix conceptual and coding questions evenly.

### NUMBER OF QUESTIONS:
{num_questions}

### OUTPUT FORMAT:
- Numbered list
- Questions only
- No answers
- No headings
- No topic names in output`

export default function QuestionGenerator() {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptText, setNewPromptText] = useState(DEFAULT_PROMPT);

  const [selectedPromptId, setSelectedPromptId] = useState("default");
  const [activePrompt, setActivePrompt] = useState(DEFAULT_PROMPT);

  const [useAllTopics, setUseAllTopics] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [quizMode, setQuizMode] = useState("combined");
  const [questionType, setQuestionType] = useState("both");
  const [numQuestions, setNumQuestions] = useState(15);

  const [generatedQuestions, setGeneratedQuestions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [history, setHistory] = useState<HistoryItem[]>([]);


  useEffect(() => {
    if (!isLoaded) return;        // wait for Clerk
    if (!isSignedIn) return;      // user not signed in

    loadData();
    loadHistory();
  }, [isLoaded, isSignedIn]);


  const loadData = async () => {
    try {
      
      const [topicsRes, promptsRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/prompts')
      ])
      console.log('Testing 124')
      if (topicsRes.ok) {
        const data = await topicsRes.json()
        setTopics(data.topics || [])
      }
      
      if (promptsRes.ok) {
        const data = await promptsRes.json()
        setPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      sonnerToast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadHistory = async () => {
    const res = await fetch("/api/question-history");
    if (!res.ok) return;

    const data = await res.json();
    setHistory(data.history || []);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      sonnerToast.success("Copied to clipboard");
    } catch {
      sonnerToast.error("Failed to copy");
    }
  };


  const handleDeleteHistory = async (
    id: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // prevents loading the card

    const confirmed = confirm('Are you sure you want to delete this history?');
    if (!confirmed) return;

    const res = await fetch(`/api/question-history/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setHistory((prev) => prev.filter((h) => h.id !== id));
      sonnerToast.success("History deleted");
    } else {
      sonnerToast.error("Failed to delete history");
    }
  };



  const handleAddTopic = async () => {
    if (!newTopic.trim()) {
      sonnerToast.error('Please enter a topic name')
      return
    }

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTopic.trim() })
      })

      if (response.ok) {
        sonnerToast.success('Topic added successfully')
        setNewTopic('')
        loadData()
      } else {
        sonnerToast.error('Failed to add topic')
      }
    } catch (error) {
      console.error('Error adding topic:', error)
      sonnerToast.error('Error adding topic')
    }
  }

  const handleDeleteTopic = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`/api/topics/${id}`, { method: 'DELETE' })
      if (response.ok) {
        sonnerToast.success('Topic deleted')
        loadData()
      }
    } catch (error) {
      console.error('Error deleting topic:', error)
      sonnerToast.error('Error deleting topic')
    }
  }

  const handleSavePrompt = async () => {
    if (!newPromptTitle.trim() || !newPromptText.trim()) {
      sonnerToast.error('Please enter both title and prompt')
      return
    }

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPromptTitle, prompt: newPromptText })
      })

      if (response.ok) {
        sonnerToast.success('Prompt saved successfully')
        setNewPromptTitle('')
        setNewPromptText(DEFAULT_PROMPT)
        loadData()
      } else {
        sonnerToast.error('Failed to save prompt')
      }
    } catch (error) {
      console.error('Error saving prompt:', error)
      sonnerToast.error('Error saving prompt')
    }
  }

  const handlePromptSelect = async (value: string): Promise<void> => {
    setSelectedPromptId(value)
    if (value === 'default') {
      setActivePrompt(DEFAULT_PROMPT)
    } else {
      try {
        const response = await fetch(`/api/prompts/${value}`)
        if (response.ok) {
          const data = await response.json()
          setActivePrompt(data.prompt.prompt)
        }
      } catch (error) {
        console.error('Error loading prompt:', error)
      }
    }
  }

  const handleToggleTopic = (topicName: string): void => {
    setSelectedTopics(prev => 
      prev.includes(topicName) 
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName]
    )
  }

  const handleGenerateQuestions = async () => {
    const topicsToUse = useAllTopics ? topics.map(t => t.name) : selectedTopics
    
    if (topicsToUse.length === 0) {
      sonnerToast.error('Please select at least one topic')
      return
    }

    setIsGenerating(true)
    setGeneratedQuestions('')

    try {
      const finalPrompt = activePrompt
        .replace('{topics}', topicsToUse.join(', '))
        .replace('{quiz_mode}', quizMode)
        .replace('{question_type}', questionType)
        .replace('{num_questions}', numQuestions.toString())

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalPrompt,
          topics: topicsToUse,
          promptTemplate:
            selectedPromptId === "default"
              ? "Default Prompt"
              : prompts.find(p => p.id.toString() === selectedPromptId)?.title ?? "Custom",
          quizMode,
          questionType,
          numQuestions,
        }),
      });

      if (response.ok) {
        const data = await response.json()
        setGeneratedQuestions(data.questions)
        loadHistory()
        sonnerToast.success('Questions generated successfully!')
      } else {
        const errorData = await response.json()
        sonnerToast.error(errorData.error || 'Failed to generate questions')
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      sonnerToast.error('Error generating questions')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
                <Brain className="h-6 w-6 text-indigo-600" />
                Question Generator
              </h1>
              <p className="text-xs text-gray-600">AI-Powered Interview Questions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Tabs defaultValue="topics" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="topics">
                  <FileText className="h-4 w-4 mr-2" />
                  Topics
                </TabsTrigger>
                <TabsTrigger value="prompts">
                  <Settings className="h-4 w-4 mr-2" />
                  Prompts
                </TabsTrigger>
              </TabsList>

              {/* Topics Tab */}
              <TabsContent value="topics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Topic</CardTitle>
                    <CardDescription>Add skills or topics for question generation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., React, Python, Algorithms"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                      />
                      <Button onClick={handleAddTopic} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stored Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {topics.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No topics added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {topics.map((topic) => (
                            <div 
                              key={topic.id} 
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100"
                            >
                              <span className="text-sm font-medium">{topic.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTopic(topic.id)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prompts Tab */}
              <TabsContent value="prompts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create Prompt Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Prompt Title</Label>
                      <Input
                        placeholder="e.g., Senior Level Questions"
                        value={newPromptTitle}
                        onChange={(e) => setNewPromptTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Prompt Content</Label>
                      <Textarea
                        placeholder="Enter your prompt template..."
                        value={newPromptText}
                        onChange={(e) => setNewPromptText(e.target.value)}
                        rows={10}
                        className="font-mono text-xs"
                      />
                    </div>
                    <Button onClick={handleSavePrompt} className="w-full">
                      Save Prompt
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Center Panel - Quiz Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quiz Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Selection */}
                <div className="space-y-2">
                  <Label>Select Prompt Template</Label>
                  <Select value={selectedPromptId} onValueChange={handlePromptSelect}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Prompt</SelectItem>
                      {prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id.toString()}>
                          {prompt.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic Selection */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-all-topics"
                      checked={useAllTopics}
                      onCheckedChange={(checked) => {
                        setUseAllTopics(checked === true);
                      }}
                    />
                    <Label htmlFor="use-all-topics">Use all topics</Label>
                  </div>

                  {!useAllTopics && (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                      {topics.length === 0 ? (
                        <p className="text-sm text-gray-500">No topics available</p>
                      ) : (
                        topics.map((topic) => (
                          <div key={topic.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`topic-${topic.id}`}
                              checked={selectedTopics.includes(topic.name)}
                              onCheckedChange={() => handleToggleTopic(topic.name)}
                            />
                            <Label htmlFor={`topic-${topic.id}`} className="cursor-pointer">
                              {topic.name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Quiz Mode */}
                <div className="space-y-2">
                  <Label>Quiz Mode</Label>
                  <Select value={quizMode} onValueChange={setQuizMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="combined">Combined</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="selective">Selective</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {quizMode === 'combined' && 'Questions combine multiple topics'}
                    {quizMode === 'individual' && 'Questions for each topic separately'}
                    {quizMode === 'selective' && 'Questions only from selected topics'}
                  </p>
                </div>

                {/* Question Type */}
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={questionType} onValueChange={setQuestionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conceptual">Conceptual</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Questions */}
                <div className="space-y-2">
                  <Label>Number of Questions: {numQuestions}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateQuestions} 
                  className="w-full"
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
                      Generate Questions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Generated Questions + History */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Questions
                </CardTitle>
                <CardDescription>
                  Your AI-generated interview questions will appear here
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Current Output */}
                {generatedQuestions ? (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(generatedQuestions)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  <ScrollArea className="h-[300px]">
                    <div className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded-lg">
                      {generatedQuestions}
                    </div>
                  </ScrollArea>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <Brain className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No questions generated yet</p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t" />

                {/* History */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">History</h3>

                  <ScrollArea className="h-[250px] space-y-2">
                    {history.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No previous generations
                      </p>
                    ) : (
                      history.map((item) => (
                        <Card
                          key={item.id}
                          className="relative cursor-pointer hover:bg-gray-50"
                          onClick={async () => {
                            const res = await fetch(`/api/question-history/${item.id}`);
                            if (!res.ok) return;
                            const data = await res.json();
                            setGeneratedQuestions(data.record.output);
                          }}
                        >
                          <CardContent className="p-3 space-y-2">
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-3">
                              {/* Topics */}
                              <p
                                className="
                                  text-sm font-medium
                                  truncate
                                  max-w-[220px]
                                  sm:max-w-[260px]
                                  md:max-w-[300px]
                                "
                                title={item.topics.join(", ")}
                              >
                                {item.topics.join(", ")}
                              </p>

                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const res = await fetch(`/api/question-history/${item.id}`);
                                  if (!res.ok) return;
                                  const data = await res.json();
                                  handleCopy(data.record.output);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Copy
                              </button>


                              {/* Delete */}
                              <button
                                onClick={(e) => handleDeleteHistory(item.id, e)}
                                className="shrink-0 text-xs text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>

                            {/* Meta */}
                            <p className="text-xs text-gray-500 break-words">
                              {item.quizMode} · {item.questionType} · {item.numQuestions} Q
                            </p>

                            <p className="text-[10px] text-gray-400">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>

                      ))
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}
