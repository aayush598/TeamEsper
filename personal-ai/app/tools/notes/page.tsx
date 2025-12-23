'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Star, 
  Pin, 
  Folder, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  MoreVertical, 
  FolderPlus,
  Menu,
  ChevronLeft,
  List,
  Grid
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NoteFolder {
  id: number
  name: string
  color: string
  icon: string
  position: number
}

interface Note {
  id: number
  title: string
  preview: string
  folderId: number | null
  isPinned: boolean
  isFavorite: boolean
  color: string | null
  tags: string[]
  updatedAt: Date
  createdAt: Date
  content?: string
}

type ViewMode = 'list' | 'grid'
type MobileView = 'folders' | 'notes' | 'editor'

export default function NotesPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  
  const [folders, setFolders] = useState<NoteFolder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  // Mobile states
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [mobileView, setMobileView] = useState<MobileView>('notes')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }
    loadData()
  }, [isLoaded, isSignedIn])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [foldersRes, notesRes] = await Promise.all([
        fetch('/api/notes/folders'),
        fetch('/api/notes'),
      ])
      
      if (foldersRes.ok) {
        const data = await foldersRes.json()
        setFolders(data.folders || [])
      }
      
      if (notesRes.ok) {
        const data = await notesRes.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }

  const loadNote = async (noteId: number) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedNote(data.note)
        setEditTitle(data.note.title)
        setEditContent(data.note.content || '')
        setIsEditing(false)
        setMobileView('editor')
      }
    } catch (error) {
      console.error('Error loading note:', error)
      toast.error('Failed to load note')
    }
  }

  const createNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
          folderId: selectedFolder,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNotes(prev => [data.note, ...prev])
        setSelectedNote(data.note)
        setEditTitle(data.note.title)
        setEditContent('')
        setIsEditing(true)
        setMobileView('editor')
        toast.success('Note created')
      }
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error('Failed to create note')
    }
  }

  const saveNote = async () => {
    if (!selectedNote) return

    try {
      setIsSaving(true)
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNotes(prev => prev.map(n => n.id === data.note.id ? data.note : n))
        setSelectedNote(data.note)
        setIsEditing(false)
        toast.success('Note saved')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteNote = async (noteId: number) => {
    if (!confirm('Delete this note?')) return

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId))
        if (selectedNote?.id === noteId) {
          setSelectedNote(null)
          setMobileView('notes')
        }
        toast.success('Note deleted')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const togglePin = async (noteId: number, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned }),
      })

      if (res.ok) {
        const data = await res.json()
        setNotes(prev => prev.map(n => n.id === noteId ? data.note : n))
        if (selectedNote?.id === noteId) {
          setSelectedNote(data.note)
        }
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const toggleFavorite = async (noteId: number, isFavorite: boolean) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      })

      if (res.ok) {
        const data = await res.json()
        setNotes(prev => prev.map(n => n.id === noteId ? data.note : n))
        if (selectedNote?.id === noteId) {
          setSelectedNote(data.note)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const res = await fetch('/api/notes/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setFolders(prev => [...prev, data.folder])
        setNewFolderName('')
        setShowFolderDialog(false)
        toast.success('Folder created')
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Failed to create folder')
    }
  }

  const filteredNotes = useMemo(() => {
    let filtered = notes

    if (selectedFolder !== null) {
      filtered = filtered.filter(n => n.folderId === selectedFolder)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.preview.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [notes, selectedFolder, searchQuery])

  const selectedFolderName = useMemo(() => {
    if (selectedFolder === null) return 'All Notes'
    return folders.find(f => f.id === selectedFolder)?.name || 'All Notes'
  }, [selectedFolder, folders])

  // Sidebar component for reuse
  const SidebarContent = () => (
    <div className="space-y-2">
      <Button
        variant={selectedFolder === null ? 'default' : 'ghost'}
        className="w-full justify-start"
        size="sm"
        onClick={() => {
          setSelectedFolder(null)
          setShowMobileSidebar(false)
          setMobileView('notes')
        }}
      >
        <Folder className="h-4 w-4 mr-2" />
        All Notes
        <Badge variant="secondary" className="ml-auto">
          {notes.length}
        </Badge>
      </Button>

      <Button
        variant="ghost"
        className="w-full justify-start"
        size="sm"
        onClick={() => {
          setShowFolderDialog(true)
          setShowMobileSidebar(false)
        }}
      >
        <FolderPlus className="h-4 w-4 mr-2" />
        New Folder
      </Button>

      <div className="pt-2">
        <p className="text-xs font-semibold text-gray-500 px-2 mb-2">FOLDERS</p>
        <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-280px)]">
          <div className="space-y-1">
            {folders.map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                size="sm"
                onClick={() => {
                  setSelectedFolder(folder.id)
                  setShowMobileSidebar(false)
                  setMobileView('notes')
                }}
              >
                <span className="mr-2">{folder.icon}</span>
                <span className="truncate">{folder.name}</span>
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {notes.filter(n => n.folderId === folder.id).length}
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )

  // Notes list component
  const NotesList = () => (
    <>
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] md:h-[calc(100vh-200px)]">
        {filteredNotes.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            {!searchQuery && (
              <Button onClick={createNote} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create First Note
              </Button>
            )}
          </Card>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' 
              : 'space-y-2'
          }`}>
            {filteredNotes.map(note => (
              <Card
                key={note.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                  selectedNote?.id === note.id ? 'ring-2 ring-indigo-500 shadow-lg' : ''
                }`}
                onClick={() => loadNote(note.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm line-clamp-2 flex-1">{note.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    {note.isPinned && <Pin className="h-3 w-3 text-indigo-600 fill-indigo-600" />}
                    {note.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">{note.preview}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {new Date(note.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  )

  // Editor component
  const EditorView = useMemo(() => {
    if (!selectedNote) return null;

      return (
      <Card className="h-full flex flex-col shadow-xl">
        <div className="p-3 md:p-4 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setMobileView('notes')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 text-base md:text-lg font-semibold bg-transparent border-none outline-none focus:outline-none px-0 h-auto min-w-0"
                placeholder="Note title..."
                autoFocus
              />
            ) : (
              <h2 className="text-base md:text-lg font-semibold truncate">{selectedNote.title}</h2>
            )}
          </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => selectedNote && togglePin(selectedNote.id, selectedNote.isPinned)}
          >
            <Pin className={`h-4 w-4 ${selectedNote?.isPinned ? 'text-indigo-600 fill-indigo-600' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => selectedNote && toggleFavorite(selectedNote.id, selectedNote.isFavorite)}
          >
            <Star className={`h-4 w-4 ${selectedNote?.isFavorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
          </Button>
          
          {isEditing ? (
            <>
              <Button onClick={saveNote} size="sm" disabled={isSaving} className="hidden md:flex">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={saveNote} size="icon" disabled={isSaving} className="md:hidden h-8 w-8">
                <Save className="h-4 w-4" />
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} size="sm" className="hidden md:flex">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={() => setIsEditing(true)} size="icon" className="md:hidden h-8 w-8">
                <Edit2 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => selectedNote && deleteNote(selectedNote.id)}>
                    <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[calc(100vh-250px)] md:min-h-[500px] resize-none border-none outline-none focus:outline-none text-base leading-relaxed bg-transparent"
              placeholder="Start writing..."
            />
          ) : (
            <div className="prose prose-sm md:prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed">
                {selectedNote?.content || editContent || 'Empty note'}
              </pre>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 md:p-4 border-t text-xs text-gray-500 bg-gray-50">
        Last edited: {selectedNote && new Date(selectedNote.updatedAt).toLocaleString()}
      </div>
    </Card>
  )}, [selectedNote, isEditing, editTitle, editContent, isSaving])

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-3 md:px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/dashboard')}
              className="hidden md:flex shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                📝 <span className="hidden sm:inline">Quick Notes</span>
                <span className="sm:hidden">Notes</span>
              </h1>
              <p className="text-xs text-gray-600 hidden md:block">
                {filteredNotes.length} {selectedFolder !== null && `in ${selectedFolderName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              onClick={createNote} 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 h-8 md:h-9"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">New Note</span>
            </Button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="left" className="w-[280px] p-4">
          <SheetHeader className="mb-4">
            <SheetTitle>Folders</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Layout */}
      <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
        <div className="hidden md:grid md:grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          {/* Desktop Sidebar */}
          <div className="col-span-2 lg:col-span-2">
            <Card className="p-2 h-full">
              <SidebarContent />
            </Card>
          </div>

          {/* Desktop Notes List */}
          <div className="col-span-3 lg:col-span-3">
            <div className="h-full flex flex-col">
              <NotesList />
            </div>
          </div>

          {/* Desktop Editor */}
          <div className="col-span-7 lg:col-span-7">
            {selectedNote ? (
              EditorView
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <Edit2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Select a note to view or edit</p>
                  <Button onClick={createNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Note
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-[calc(100vh-100px)]">
          {mobileView === 'notes' && (
            <div className="h-full">
              <NotesList />
            </div>
          )}

          {mobileView === 'editor' && selectedNote && (
            <div className="h-full">
              {EditorView}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Organize your notes with folders</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={createFolder} className="flex-1">
                Create Folder
              </Button>
              <Button variant="outline" onClick={() => setShowFolderDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile FAB for creating notes */}
      <Button
        onClick={createNote}
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 z-30"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}