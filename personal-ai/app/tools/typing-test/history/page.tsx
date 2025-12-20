'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TrendingUp, Target, Clock, Code, Trophy, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

interface TestResult {
  id: number
  wpm: number
  accuracy: number
  timeTaken: number
  totalCharacters: number
  correctCharacters: number
  incorrectCharacters: number
  topic: string
  language: string
  difficulty: string
  completedAt: Date
}

export default function TypingHistoryPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    
    loadResults()
  }, [isLoaded, isSignedIn])

  const loadResults = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/typing/results')
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      } else {
        toast.error('Failed to load results')
      }
    } catch (error) {
      console.error('Error loading results:', error)
      toast.error('Error loading results')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredResults = filter === 'all' 
    ? results 
    : results.filter(r => r.difficulty === filter)

  const stats = {
    totalTests: results.length,
    averageWpm: results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.wpm, 0) / results.length)
      : 0,
    averageAccuracy: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / results.length)
      : 0,
    bestWpm: results.length > 0 
      ? Math.max(...results.map(r => r.wpm))
      : 0,
    bestAccuracy: results.length > 0
      ? Math.max(...results.map(r => r.accuracy))
      : 0,
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-300'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPerformanceGrade = (wpm: number, accuracy: number) => {
    const score = (wpm * 0.6) + (accuracy * 0.4)
    if (score >= 80) return { grade: 'A+', color: 'text-green-600' }
    if (score >= 70) return { grade: 'A', color: 'text-green-500' }
    if (score >= 60) return { grade: 'B+', color: 'text-blue-600' }
    if (score >= 50) return { grade: 'B', color: 'text-blue-500' }
    if (score >= 40) return { grade: 'C', color: 'text-yellow-600' }
    return { grade: 'D', color: 'text-orange-600' }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
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
              onClick={() => router.push('/typing-test')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
                Test History & Stats
              </h1>
              <p className="text-xs text-gray-600">Track your progress over time</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/typing-test')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Code className="h-4 w-4 mr-2" />
              New Test
            </Button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
                <p className="text-sm text-gray-600">Total Tests</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
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
                <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{stats.bestWpm}</p>
                <p className="text-sm text-gray-600">Best WPM</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{stats.bestAccuracy}%</p>
                <p className="text-sm text-gray-600">Best Accuracy</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All ({results.length})
              </Button>
              <Button
                variant={filter === 'beginner' ? 'default' : 'outline'}
                onClick={() => setFilter('beginner')}
                size="sm"
              >
                Beginner ({results.filter(r => r.difficulty === 'beginner').length})
              </Button>
              <Button
                variant={filter === 'intermediate' ? 'default' : 'outline'}
                onClick={() => setFilter('intermediate')}
                size="sm"
              >
                Intermediate ({results.filter(r => r.difficulty === 'intermediate').length})
              </Button>
              <Button
                variant={filter === 'advanced' ? 'default' : 'outline'}
                onClick={() => setFilter('advanced')}
                size="sm"
              >
                Advanced ({results.filter(r => r.difficulty === 'advanced').length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results List */}
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Code className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No test results yet</p>
                <p className="text-gray-400 text-sm mb-4">
                  Start practicing to see your progress here
                </p>
                <Button onClick={() => router.push('/typing-test')}>
                  Start Your First Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => {
              const { grade, color } = getPerformanceGrade(result.wpm, result.accuracy)
              
              return (
                <Card key={result.id} className="hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Grade */}
                      <div className="md:col-span-1 text-center">
                        <div className={`text-3xl font-bold ${color}`}>
                          {grade}
                        </div>
                      </div>

                      {/* Topic & Language */}
                      <div className="md:col-span-3">
                        <div className="font-semibold text-gray-900">{result.topic}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {result.language}
                          </Badge>
                          <Badge className={`text-xs ${getDifficultyColor(result.difficulty)}`}>
                            {result.difficulty}
                          </Badge>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="md:col-span-6 grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{result.wpm}</div>
                          <div className="text-xs text-gray-600">WPM</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{result.accuracy}%</div>
                          <div className="text-xs text-gray-600">Accuracy</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{result.timeTaken}s</div>
                          <div className="text-xs text-gray-600">Time</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{result.totalCharacters}</div>
                          <div className="text-xs text-gray-600">Chars</div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="md:col-span-2 text-right">
                        <div className="text-sm text-gray-600 flex items-center justify-end gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(result.completedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.completedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Correct: </span>
                        <span className="font-semibold text-green-600">{result.correctCharacters}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Incorrect: </span>
                        <span className="font-semibold text-red-600">{result.incorrectCharacters}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Error Rate: </span>
                        <span className="font-semibold text-orange-600">
                          {((result.incorrectCharacters / result.totalCharacters) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}