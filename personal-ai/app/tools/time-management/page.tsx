'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, Clock, Edit2, Trash2, Calendar, CheckCircle2, PlayCircle, XCircle, Circle, GripVertical } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/sonner'
import { toast as sonnerToast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Task {
  id: number
  title: string
  description: string
  duration: number
  status: 'pending' | 'started' | 'finished' | 'quit'
  date: string
  createdAt: string
  updatedAt: string
}

interface TaskFormData {
  title: string
  description: string
  duration: string
  date: string
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Circle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300'
  },
  started: {
    label: 'Started',
    icon: PlayCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300'
  },
  finished: {
    label: 'Finished',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300'
  },
  quit: {
    label: 'Quit',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300'
  }
}

// Draggable Task Card Component
function DraggableTaskCard({ task, onEdit, onDelete }: { 
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="hover:shadow-md transition-shadow cursor-move">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing mt-1"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <h4 className="font-semibold text-sm leading-tight flex-1">
                  {task.title}
                </h4>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(task)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-700"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2 ml-6">
                {task.description}
              </p>
            )}

            <div className="flex items-center ml-6">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(task.duration)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({ 
  status, 
  tasks, 
  onEdit, 
  onDelete 
}: { 
  status: keyof typeof STATUS_CONFIG
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}) {
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon
  const { setNodeRef } = useDroppable({
    id: status, // 👈 status string is intentional
  })

  const getTotalDuration = (tasks: Task[]) => {
    return tasks.reduce((sum, task) => sum + task.duration, 0)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const totalDuration = getTotalDuration(tasks)

  return (
    <div className="flex flex-col">
      <Card ref={setNodeRef} className={`border-2 ${config.borderColor} flex-1`}>
        <CardHeader className={`${config.bgColor} pb-3`}>
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
              {config.label}
            </span>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            {formatDuration(totalDuration)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Drop tasks here
                </div>
              ) : (
                tasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TimeManagementTool() {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    duration: '30',
    date: new Date().toISOString().split('T')[0]
  })

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return

    loadTasks(selectedDate)
  }, [isLoaded, isSignedIn, selectedDate])

  const loadTasks = async (date: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      sonnerToast.error('Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      sonnerToast.error('Please enter a task title')
      return
    }

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          duration: parseInt(formData.duration) || 30,
          date: formData.date
        })
      })

      if (response.ok) {
        sonnerToast.success(editingTask ? 'Task updated!' : 'Task created!')
        setIsDialogOpen(false)
        resetForm()
        loadTasks(selectedDate)
      } else {
        const error = await response.json()
        sonnerToast.error(error.error || 'Failed to save task')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      sonnerToast.error('Error saving task')
    }
  }

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Optimistic update
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        )
        sonnerToast.success('Status updated!')
      } else {
        sonnerToast.error('Failed to update status')
        loadTasks(selectedDate) // Reload on error
      }
    } catch (error) {
      console.error('Error updating status:', error)
      sonnerToast.error('Error updating status')
      loadTasks(selectedDate)
    }
  }

  const handleDelete = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        sonnerToast.success('Task deleted!')
        loadTasks(selectedDate)
      } else {
        sonnerToast.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      sonnerToast.error('Error deleting task')
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      duration: task.duration.toString(),
      date: task.date
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration: '30',
      date: new Date().toISOString().split('T')[0]
    })
    setEditingTask(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = Number(active.id)
    const newStatus = over.id as Task['status']

    if (Number.isNaN(taskId)) {
        console.error('Invalid task id:', active.id)
        return
    }

    // Find the task
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Update status
    handleStatusChange(taskId, newStatus)
  }

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status)
  }

  const getStats = () => {
    const total = tasks.length
    const finished = tasks.filter(t => t.status === 'finished').length
    const started = tasks.filter(t => t.status === 'started').length
    const pending = tasks.filter(t => t.status === 'pending').length
    const quit = tasks.filter(t => t.status === 'quit').length
    const totalTime = tasks.reduce((sum, task) => sum + task.duration, 0)
    const finishedTime = tasks.filter(t => t.status === 'finished').reduce((sum, task) => sum + task.duration, 0)
    
    return { total, finished, started, pending, quit, totalTime, finishedTime }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const stats = getStats()

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
                  <Clock className="h-6 w-6 text-orange-600" />
                  Time Management
                </h1>
                <p className="text-xs text-gray-600">Drag and drop tasks to organize your day</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>

          {/* Date Selector & Stats */}
          <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <div className="flex gap-3 text-sm">
              <Badge variant="outline" className="bg-white">
                Total: {stats.total} tasks
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Finished: {stats.finished}
              </Badge>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Time: {formatDuration(stats.finishedTime)} / {formatDuration(stats.totalTime)}
              </Badge>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                  <DialogDescription>
                    Add task details and set the estimated duration
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Complete project documentation"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Add more details about this task..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration (minutes) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="5"
                        step="5"
                        placeholder="30"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => (
              <div key={status} id={status}>
                <DroppableColumn
                  status={status}
                  tasks={getTasksByStatus(status)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <Card className="shadow-2xl rotate-3 opacity-90 cursor-grabbing">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                      <h4 className="font-semibold text-sm leading-tight flex-1">
                        {activeTask.title}
                      </h4>
                    </div>
                    {activeTask.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 ml-6">
                        {activeTask.description}
                      </p>
                    )}
                    <div className="ml-6">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(activeTask.duration)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  )
}