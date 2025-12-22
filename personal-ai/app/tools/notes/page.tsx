'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Search, Star, Pin, Folder, Trash2, Edit2, Save, X, MoreVertical, FolderPlus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

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

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📝 Quick Notes
              </h1>
              <p className="text-xs text-gray-600">{notes.length} notes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={createNote} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          {/* Sidebar - Folders */}
          <div className="col-span-2 space-y-2">
            <Card className="p-2">
              <Button
                variant={selectedFolder === null ? 'default' : 'ghost'}
                className="w-full justify-start"
                size="sm"
                onClick={() => setSelectedFolder(null)}
              >
                <Folder className="h-4 w-4 mr-2" />
                All Notes
                <Badge variant="secondary" className="ml-auto">
                  {notes.length}
                </Badge>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start mt-1"
                size="sm"
                onClick={() => setShowFolderDialog(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </Card>

            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-1">
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <span className="mr-2">{folder.icon}</span>
                    {folder.name}
                    <Badge variant="secondary" className="ml-auto">
                      {notes.filter(n => n.folderId === folder.id).length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Notes List */}
          <div className="col-span-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {filteredNotes.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500 mb-4">No notes yet</p>
                    <Button onClick={createNote} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Note
                    </Button>
                  </Card>
                ) : (
                  filteredNotes.map(note => (
                    <Card
                      key={note.id}
                      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                        selectedNote?.id === note.id ? 'ring-2 ring-indigo-500' : ''
                      }`}
                      onClick={() => loadNote(note.id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1">{note.title}</h3>
                        <div className="flex items-center gap-1">
                          {note.isPinned && <Pin className="h-3 w-3 text-indigo-600" />}
                          {note.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{note.preview}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Note Editor */}
          <div className="col-span-7">
            {selectedNote ? (
              <Card className="h-full flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                  {isEditing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-semibold border-none focus:ring-0 px-0"
                      placeholder="Note title..."
                    />
                  ) : (
                    <h2 className="text-lg font-semibold">{selectedNote.title}</h2>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePin(selectedNote.id, selectedNote.isPinned)}
                    >
                      <Pin className={`h-4 w-4 ${selectedNote.isPinned ? 'text-indigo-600' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(selectedNote.id, selectedNote.isFavorite)}
                    >
                      <Star className={`h-4 w-4 ${selectedNote.isFavorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    </Button>
                    
                    {isEditing ? (
                      <>
                        <Button onClick={saveNote} size="sm" disabled={isSaving}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => setIsEditing(true)} size="sm">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => deleteNote(selectedNote.id)}
                          variant="ghost"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                  {isEditing ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[500px] resize-none border-none focus:ring-0 text-base leading-relaxed"
                      placeholder="Start writing..."
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
                        {selectedNote.content || editContent || 'Empty note'}
                      </pre>
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t text-xs text-gray-500">
                  Last edited: {new Date(selectedNote.updatedAt).toLocaleString()}
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
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
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>Organize your notes with folders</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <Button onClick={createFolder} className="w-full">
              Create Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}