'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Newspaper, RefreshCw, Filter, ExternalLink, Calendar, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NewsCategory {
  id: number
  name: string
}

interface NewsArticle {
  id: number
  title: string
  summary: string
  url: string
  category: string
  publishedDate: string | null
  sourceName: string | null
  fetchedAt: Date
  isRead: boolean | null
  readAt: Date | null
}

interface LastFetch {
  id: number
  fetchedAt: Date
  categoriesCount: number
  articlesCount: number
}

export default function NewsPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [newCategory, setNewCategory] = useState('')
  
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [lastFetch, setLastFetch] = useState<LastFetch | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    
    loadData()
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    applyFilters()
  }, [articles, categoryFilter, readFilter, dateFilter])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [categoriesRes, articlesRes, lastFetchRes] = await Promise.all([
        fetch('/api/news/categories'),
        fetch('/api/news'),
        fetch('/api/news/last-fetch'),
      ])
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }
      
      if (articlesRes.ok) {
        const data = await articlesRes.json()
        setArticles(data.articles || [])
      }
      
      if (lastFetchRes.ok) {
        const data = await lastFetchRes.json()
        setLastFetch(data.lastFetch)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Please enter a category name')
      return
    }

    try {
      const response = await fetch('/api/news/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      })

      if (response.ok) {
        toast.success('Category added successfully')
        setNewCategory('')
        loadData()
      } else {
        toast.error('Failed to add category')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Error adding category')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      const response = await fetch(`/api/news/categories/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Category deleted')
        loadData()
      } else {
        toast.error('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error deleting category')
    }
  }

  const handleFetchNews = async () => {
    if (categories.length === 0) {
      toast.error('Please add at least one category first')
      return
    }

    try {
      setIsFetching(true)
      toast.loading('Fetching latest news from all categories...')
      
      const response = await fetch('/api/news/fetch', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully fetched ${data.count} articles from ${data.categories.length} categories!`)
        await loadData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to fetch news')
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      toast.error('Error fetching news')
    } finally {
      setIsFetching(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...articles]
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter)
    }
    
    if (readFilter === 'read') {
      filtered = filtered.filter(a => a.isRead === true)
    } else if (readFilter === 'unread') {
      filtered = filtered.filter(a => a.isRead !== true)
    }
    
    if (dateFilter !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      if (dateFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0)
      } else if (dateFilter === '7days') {
        cutoff.setDate(now.getDate() - 7)
      } else if (dateFilter === '30days') {
        cutoff.setDate(now.getDate() - 30)
      }
      
      filtered = filtered.filter(a => new Date(a.fetchedAt) >= cutoff)
    }
    
    setFilteredArticles(filtered)
  }

  const handleArticleClick = async (article: NewsArticle) => {
    setSelectedArticle(article)
    setIsDialogOpen(true)
    
    if (!article.isRead) {
      try {
        await fetch(`/api/news/${article.id}/read`, {
          method: 'POST',
        })
        
        setArticles(prev =>
          prev.map(a =>
            a.id === article.id ? { ...a, isRead: true, readAt: new Date() } : a
          )
        )
      } catch (error) {
        console.error('Error marking as read:', error)
      }
    }
  }

  const handleOpenArticle = (url: string, articleId: number) => {
    window.open(url, '_blank')
    
    // Mark as read
    fetch(`/api/news/${articleId}/read`, {
      method: 'POST',
    }).then(() => {
      setArticles(prev =>
        prev.map(a =>
          a.id === articleId ? { ...a, isRead: true, readAt: new Date() } : a
        )
      )
    })
  }

  const stats = {
    total: articles.length,
    unread: articles.filter(a => !a.isRead).length,
    read: articles.filter(a => a.isRead).length,
    byCategory: categories.map(c => ({
      name: c.name,
      count: articles.filter(a => a.category === c.name).length,
    })),
  }

  const canFetchToday = () => {
    if (!lastFetch) return true
    
    const lastFetchDate = new Date(lastFetch.fetchedAt)
    const today = new Date()
    
    return (
      lastFetchDate.getDate() !== today.getDate() ||
      lastFetchDate.getMonth() !== today.getMonth() ||
      lastFetchDate.getFullYear() !== today.getFullYear()
    )
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading news...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
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
                <Newspaper className="h-6 w-6 text-blue-600" />
                AI News Hub
              </h1>
              <p className="text-xs text-gray-600">Powered by Gemini Search</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleFetchNews}
              disabled={isFetching || categories.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isFetching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch Latest News
                </>
              )}
            </Button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Last Fetch Info */}
        {lastFetch && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Last fetched: {new Date(lastFetch.fetchedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-700">
                    {lastFetch.articlesCount} articles from {lastFetch.categoriesCount} categories
                  </p>
                </div>
                {canFetchToday() && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Ready to fetch today's news
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Articles</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
                <p className="text-sm text-gray-600">Unread</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.read}</p>
                <p className="text-sm text-gray-600">Read</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="categories" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
              </TabsList>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Category</CardTitle>
                    <CardDescription>Topics to fetch news about</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., AI, Technology"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <Button onClick={handleAddCategory} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No categories added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {categories.map((category) => (
                            <div 
                              key={category.id} 
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 border"
                            >
                              <div>
                                <span className="text-sm font-medium">{category.name}</span>
                                <p className="text-xs text-gray-500">
                                  {stats.byCategory.find(c => c.name === category.name)?.count || 0} articles
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCategory(category.id)}
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

              {/* Filters Tab */}
              <TabsContent value="filters" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filter News
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Read Status</label>
                      <Select value={readFilter} onValueChange={setReadFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Articles</SelectItem>
                          <SelectItem value="unread">Unread Only</SelectItem>
                          <SelectItem value="read">Read Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Date Range</label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="7days">Last 7 Days</SelectItem>
                          <SelectItem value="30days">Last 30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Content - News Grid */}
          <div className="lg:col-span-3">
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      {articles.length === 0
                        ? 'No news articles yet'
                        : 'No articles match your filters'}
                    </p>
                    {articles.length === 0 && categories.length === 0 && (
                      <p className="text-gray-400 text-sm mb-4">
                        Add categories and click "Fetch Latest News" to start
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      article.isRead
                        ? 'bg-gray-50 opacity-75'
                        : 'bg-white border-l-4 border-l-blue-500'
                    }`}
                    onClick={() => handleArticleClick(article)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">
                          {article.category}
                        </Badge>
                        
                        {article.isRead ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      
                      <CardTitle className="text-lg line-clamp-2">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-4">
                        {article.summary}
                      </CardDescription>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        {article.sourceName && (
                          <div className="flex items-center gap-1">
                            <Newspaper className="h-3 w-3" />
                            {article.sourceName}
                          </div>
                        )}
                        
                        {article.publishedDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(article.publishedDate).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            Fetched: {new Date(article.fetchedAt).toLocaleDateString()}
                          </span>
                          
                          {!article.isRead && (
                            <Badge variant="destructive" className="text-xs">
                              NEW
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenArticle(article.url, article.id)
                        }}
                        className="w-full mt-4"
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Read Full Article
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Article Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedArticle.category}
                  </Badge>
                  {selectedArticle.sourceName && (
                    <Badge variant="outline">
                      {selectedArticle.sourceName}
                    </Badge>
                  )}
                </div>
                
                <DialogTitle className="text-2xl leading-tight">
                  {selectedArticle.title}
                </DialogTitle>
                
                <DialogDescription className="flex items-center gap-4 text-sm">
                  {selectedArticle.publishedDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedArticle.publishedDate).toLocaleDateString()}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {selectedArticle.summary}
                </p>
                
                <Button
                  onClick={() => window.open(selectedArticle.url, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Read Full Article on Website
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}