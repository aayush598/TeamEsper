'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Code, Zap, Trophy, Clock, Target, TrendingUp, RotateCcw, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Progress } from '@/components/ui/progress'

interface CodeSnippet {
  id: number
  topic: string
  language: string
  title: string
  description: string
  code: string
  difficulty: string
  lineCount: number
  characterCount: number
}

interface TestStats {
  totalTests: number
  averageWpm: number
  averageAccuracy: number
  bestWpm: number
  totalTime: number
}

export default function TypingTestPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Topic and settings
  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate')
  
  // Test state
  const [currentSnippet, setCurrentSnippet] = useState<CodeSnippet | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTestActive, setIsTestActive] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [typedCharacters, setTypedCharacters] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  
  // Results
  const [testResults, setTestResults] = useState<any>(null)
  const [stats, setStats] = useState<TestStats | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    
    loadTopics()
    loadStats()
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    if (isTestActive) {
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isTestActive, currentIndex, currentSnippet])

  useEffect(() => {
    if (isTestActive && currentSnippet && currentIndex >= currentSnippet.code.length) {
      handleTestComplete()
    }
  }, [currentIndex, isTestActive, currentSnippet])

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/topics')
      if (response.ok) {
        const data = await response.json()
        const topicNames = data.topics.map((t: any) => t.name)
        setTopics(topicNames)
        if (topicNames.length > 0) {
          setSelectedTopic(topicNames[0])
        }
      }
    } catch (error) {
      console.error('Error loading topics:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/typing/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleGenerateCode = async () => {
    if (!selectedTopic) {
      toast.error('Please select a topic')
      return
    }

    try {
      setIsGenerating(true)
      toast.loading('Generating production-ready code...')
      
      const response = await fetch('/api/typing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          language: selectedLanguage,
          difficulty: selectedDifficulty,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSnippet(data.snippet)
        setCurrentIndex(0)
        setTypedCharacters([])
        setMistakes(0)
        setTestResults(null)
        setIsTestActive(false)
        setStartTime(null)
        toast.success('Code generated! Click "Start Test" to begin.')
      } else {
        toast.error('Failed to generate code')
      }
    } catch (error) {
      console.error('Error generating code:', error)
      toast.error('Error generating code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartTest = () => {
    if (!currentSnippet) {
      toast.error('Please generate code first')
      return
    }
    
    setIsTestActive(true)
    setStartTime(Date.now())
    setCurrentIndex(0)
    setTypedCharacters([])
    setMistakes(0)
    toast.success('Test started! Start typing...')
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!isTestActive || !currentSnippet) return

    // Prevent default for special keys
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab') {
      e.preventDefault()
      return
    }

    // Ignore modifier keys alone
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
      return
    }

    e.preventDefault()

    const expectedChar = currentSnippet.code[currentIndex]
    const typedChar = e.key

    // Handle special characters
    let actualTypedChar = typedChar
    if (typedChar === 'Enter') actualTypedChar = '\n'
    if (typedChar === ' ') actualTypedChar = ' '

    const isCorrect = actualTypedChar === expectedChar

    if (!isCorrect) {
      setMistakes(prev => prev + 1)
    }

    setTypedCharacters(prev => [...prev, actualTypedChar])
    setCurrentIndex(prev => prev + 1)
  }

  const handleTestComplete = async () => {
    if (!currentSnippet || !startTime) return

    setIsTestActive(false)
    const endTime = Date.now()
    const timeTaken = (endTime - startTime) / 1000 // seconds
    
    // Calculate metrics
    const totalChars = currentSnippet.code.length
    const correctChars = typedCharacters.filter((char, i) => char === currentSnippet.code[i]).length
    const incorrectChars = totalChars - correctChars
    const accuracy = Math.round((correctChars / totalChars) * 100)
    
    // WPM calculation (standard: 5 chars = 1 word)
    const words = totalChars / 5
    const minutes = timeTaken / 60
    const wpm = Math.round(words / minutes)
    
    const results = {
      snippetId: currentSnippet.id,
      wpm,
      accuracy,
      timeTaken: Math.round(timeTaken),
      totalCharacters: totalChars,
      correctCharacters: correctChars,
      incorrectCharacters: incorrectChars,
      topic: currentSnippet.topic,
      language: currentSnippet.language,
      difficulty: currentSnippet.difficulty,
    }
    
    setTestResults(results)
    
    // Save results
    try {
      await fetch('/api/typing/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      })
      
      loadStats()
      toast.success('Test completed! Results saved.')
    } catch (error) {
      console.error('Error saving results:', error)
    }
  }

  const handleReset = () => {
    setCurrentSnippet(null)
    setCurrentIndex(0)
    setTypedCharacters([])
    setMistakes(0)
    setIsTestActive(false)
    setStartTime(null)
    setTestResults(null)
  }

  const getCharacterColor = (index: number) => {
    if (index > currentIndex) {
      return 'text-gray-400' // Not yet typed
    } else if (index === currentIndex && isTestActive) {
      return 'bg-blue-500 text-white' // Current character
    } else if (index < currentIndex) {
      // Already typed - check if correct
      const isCorrect = typedCharacters[index] === currentSnippet?.code[index]
      return isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }
    return 'text-gray-400'
  }

  const progress = currentSnippet 
    ? (currentIndex / currentSnippet.code.length) * 100 
    : 0

  const currentWpm = startTime && currentIndex > 0
    ? Math.round(((currentIndex / 5) / ((Date.now() - startTime) / 60000)))
    : 0

  const currentAccuracy = currentIndex > 0
    ? Math.round(((currentIndex - mistakes) / currentIndex) * 100)
    : 100

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
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
                <Code className="h-6 w-6 text-indigo-600" />
                Code Typing Master
              </h1>
              <p className="text-xs text-gray-600">Learn while you type production-ready code</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/tools/typing-test/history')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View History
            </Button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Live Stats During Test */}
        {isTestActive && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{currentWpm}</p>
                  <p className="text-sm text-gray-600">Current WPM</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{currentAccuracy}%</p>
                  <p className="text-sm text-gray-600">Accuracy</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s
                  </p>
                  <p className="text-sm text-gray-600">Time</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{mistakes}</p>
                  <p className="text-sm text-gray-600">Mistakes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overall Stats */}
        {!isTestActive && stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
                  <p className="text-sm text-gray-600">Tests Completed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{stats.averageWpm}</p>
                  <p className="text-sm text-gray-600">Avg WPM</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats.averageAccuracy}%</p>
                  <p className="text-sm text-gray-600">Avg Accuracy</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{stats.bestWpm}</p>
                  <p className="text-sm text-gray-600">Best WPM</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">{Math.round(stats.totalTime / 60)}</p>
                  <p className="text-sm text-gray-600">Minutes Practiced</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Test Settings</CardTitle>
                <CardDescription>Configure your typing test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Topic</label>
                  <Select 
                    value={selectedTopic} 
                    onValueChange={setSelectedTopic}
                    disabled={isTestActive}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
                  <Select 
                    value={selectedLanguage} 
                    onValueChange={setSelectedLanguage}
                    disabled={isTestActive}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="go">Go</SelectItem>
                      <SelectItem value="rust">Rust</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select 
                    value={selectedDifficulty} 
                    onValueChange={setSelectedDifficulty}
                    disabled={isTestActive}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (15-25 lines)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (25-40 lines)</SelectItem>
                      <SelectItem value="advanced">Advanced (40-60 lines)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateCode}
                  disabled={isGenerating || isTestActive || !selectedTopic}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4 mr-2" />
                      Generate New Code
                    </>
                  )}
                </Button>

                {currentSnippet && !isTestActive && !testResults && (
                  <Button 
                    onClick={handleStartTest}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Test
                  </Button>
                )}

                {(isTestActive || testResults) && (
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Test
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Results Card */}
            {testResults && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">{testResults.wpm}</p>
                      <p className="text-xs text-gray-600">WPM</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">{testResults.accuracy}%</p>
                      <p className="text-xs text-gray-600">Accuracy</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Taken:</span>
                      <span className="font-semibold">{testResults.timeTaken}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Characters:</span>
                      <span className="font-semibold">{testResults.totalCharacters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Correct:</span>
                      <span className="font-semibold text-green-600">{testResults.correctCharacters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Incorrect:</span>
                      <span className="font-semibold text-red-600">{testResults.incorrectCharacters}</span>
                    </div>
                  </div>

                  {stats && testResults.wpm > stats.bestWpm && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        New Personal Best!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Code Display */}
          <div className="lg:col-span-3">
            {currentSnippet ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{currentSnippet.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {currentSnippet.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {currentSnippet.language}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {currentSnippet.difficulty}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        Progress: {currentIndex} / {currentSnippet.code.length} characters
                      </span>
                      {isTestActive && (
                        <Badge variant="secondary" className="animate-pulse">
                          <Clock className="h-3 w-3 mr-1" />
                          Test Active
                        </Badge>
                      )}
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Code Display Area */}
                  <div 
                    ref={containerRef}
                    className="bg-gray-900 rounded-lg p-6 overflow-x-auto min-h-[500px]"
                  >
                    <pre className="text-lg font-mono leading-relaxed select-none">
                      <code>
                        {currentSnippet.code.split('').map((char, index) => (
                          <span
                            key={index}
                            className={`${getCharacterColor(index)} transition-all duration-100 ${
                              index === currentIndex && isTestActive ? 'animate-pulse' : ''
                            }`}
                            style={{
                              padding: '2px 1px',
                              borderRadius: '2px',
                            }}
                          >
                            {char === '\n' ? '\n' : char === ' ' ? '\u00A0' : char}
                          </span>
                        ))}
                      </code>
                    </pre>
                  </div>

                  {!isTestActive && !testResults && currentSnippet && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 text-center">
                        💡 Click &quot;Start Test&quot; and start typing! Each character will be highlighted as you type.
                      </p>
                    </div>
                  )}

                  {isTestActive && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 text-center font-medium">
                        ⌨️ Keep typing! Green = Correct, Red = Wrong, Blue = Current character
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-24">
                  <div className="text-center">
                    <Code className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2 text-lg font-medium">
                      No code generated yet
                    </p>
                    <p className="text-gray-400 text-sm mb-6">
                      Select a topic, language, and difficulty, then click &quot;Generate New Code&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}