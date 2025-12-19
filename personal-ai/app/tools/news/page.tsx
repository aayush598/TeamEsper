'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Newspaper, RefreshCw, Filter, ExternalLink, Calendar, Globe } from 'lucide-react'
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

interface NewsArticle {
  id: number
  title: string
  description: string | null
  content: string | null
  url: string
  imageUrl: string | null
  category: string
  source: string
  author: string | null
  publishedAt: Date | null
  scrapedAt: Date
  isRead: boolean | null
}

export default function NewsPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScraping, setIsScraping] = useState(false)
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<string>('all')
  
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    
    loadNews()
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    applyFilters()
  }, [articles, categoryFilter, sourceFilter, readFilter])

  const loadNews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/news')
      
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      } else {
        toast.error('Failed to load news')
      }
    } catch (error) {
      console.error('Error loading news:', error)
      toast.error('Error loading news')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScrapeNews = async () => {
    try {
      setIsScraping(true)
      toast.loading('Scraping latest news...')
      
      const response = await fetch('/api/news/scrape', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully scraped ${data.count} articles!`)
        await loadNews()
      } else {
        toast.error('Failed to scrape news')
      }
    } catch (error) {
      console.error('Error scraping news:', error)
      toast.error('Error scraping news')
    } finally {
      setIsScraping(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...articles]
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter)
    }
    
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(a => a.source === sourceFilter)
    }
    
    if (readFilter === 'read') {
      filtered = filtered.filter(a => a.isRead === true)
    } else if (readFilter === 'unread') {
      filtered = filtered.filter(a => a.isRead !== true)
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
            a.id === article.id ? { ...a, isRead: true } : a
          )
        )
      } catch (error) {
        console.error('Error marking as read:', error)
      }
    }
  }

  const stats = {
    total: articles.length,
    tech: articles.filter(a => a.category === 'tech').length,
    general: articles.filter(a => a.category === 'general').length,
    unread: articles.filter(a => !a.isRead).length,
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading news...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                <Newspaper className="h-6 w-6 text-blue-600" />
                News Hub
              </h1>
              <p className="text-xs text-gray-600">Stay updated with latest tech & general news</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleScrapeNews}
              disabled={isScraping}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isScraping ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scraping...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Get Latest News
                </>
              )}
            </Button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Articles</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.tech}</p>
                <p className="text-sm text-gray-600">Tech News</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.general}</p>
                <p className="text-sm text-gray-600">General News</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
                <p className="text-sm text-gray-600">Unread</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Source</label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="techcrunch">TechCrunch</SelectItem>
                    <SelectItem value="wired">Wired</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* News Grid */}
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {articles.length === 0
                    ? 'No news articles yet. Click "Get Latest News" to start!'
                    : 'No articles match your filters'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {article.imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant={article.category === 'tech' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {article.category}
                    </Badge>
                    
                    <Badge variant="outline" className="capitalize text-xs">
                      {article.source}
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-lg line-clamp-2">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <CardDescription className="line-clamp-3 mb-4">
                    {article.description || 'No description available'}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(article.scrapedAt).toLocaleDateString()}
                    </div>
                    
                    {!article.isRead && (
                      <Badge variant="destructive" className="text-xs">
                        NEW
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Article Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={selectedArticle.category === 'tech' ? 'default' : 'secondary'}>
                    {selectedArticle.category}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedArticle.source}
                  </Badge>
                </div>
                
                <DialogTitle className="text-2xl leading-tight">
                  {selectedArticle.title}
                </DialogTitle>
                
                <DialogDescription className="flex items-center gap-4 text-sm">
                  {selectedArticle.author && (
                    <span>By {selectedArticle.author}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedArticle.scrapedAt).toLocaleDateString()}
                  </span>
                </DialogDescription>
              </DialogHeader>
              
              {selectedArticle.imageUrl && (
                <div className="relative h-64 w-full overflow-hidden rounded-lg">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {selectedArticle.description || selectedArticle.content || 'No content available'}
                </p>
                
                <Button
                  onClick={() => window.open(selectedArticle.url, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Read Full Article
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}