'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Grip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'chatbot:size'
const DEFAULT_SIZE = { width: 360, height: 480 }
const MIN_WIDTH = 300
const MIN_HEIGHT = 360

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [size, setSize] = useState(DEFAULT_SIZE)

  const containerRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  /* ----------------------------- */
  /* Restore size                  */
  /* ----------------------------- */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setSize(JSON.parse(saved))
      } catch {}
    }
  }, [])

  /* ----------------------------- */
  /* Auto-scroll                   */
  /* ----------------------------- */
  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, loading])

  /* ----------------------------- */
  /* Resize handlers (TOP-LEFT)    */
  /* ----------------------------- */
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()

    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
    }

    window.addEventListener('mousemove', onResize)
    window.addEventListener('mouseup', stopResize)
  }

  const onResize = (e: MouseEvent) => {
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y

    setSize({
      width: Math.max(MIN_WIDTH, startRef.current.w - dx),
      height: Math.max(MIN_HEIGHT, startRef.current.h + dy),
    })
  }

  const stopResize = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(size))
    window.removeEventListener('mousemove', onResize)
    window.removeEventListener('mouseup', stopResize)
  }

  /* ----------------------------- */
  /* Send message                  */
  /* ----------------------------- */
  const sendMessage = async () => {
    if (!prompt.trim()) return

    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    setPrompt('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.answer },
      ])
    } catch {
      toast.error('Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700"
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          ref={containerRef}
          className="fixed bottom-20 right-6 z-50 flex flex-col rounded-lg border bg-white shadow-xl"
          style={{
            width: size.width,
            height: size.height,
          }}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between border-b px-4 py-2 text-sm font-semibold">
            AI Assistant

            {/* Resize Handle (TOP-LEFT) */}
            <div
              onMouseDown={startResize}
              className="absolute left-2 top-2 cursor-nwse-resize text-gray-400 hover:text-gray-700"
              title="Resize"
            >
              <Grip className="h-4 w-4 rotate-90" />
            </div>

            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4 text-gray-500 hover:text-gray-800" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto px-3 py-2 space-y-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[95%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'ml-auto bg-orange-100 text-right'
                    : 'mr-auto bg-gray-100'
                }`}
              >
                <div
                  className="
                    prose prose-sm max-w-none
                    whitespace-pre-wrap
                    break-words
                    overflow-hidden
                  "
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ children }) => (
                        <pre className="max-w-full overflow-x-auto rounded bg-gray-900 p-3 text-gray-100 text-xs">
                          {children}
                        </pre>
                      ),
                      code: ({ children }) => (
                        <code className="break-words whitespace-pre-wrap">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {loading && (
              <div className="mr-auto rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-2">
            <div className="flex items-end gap-2">
              <Textarea
                rows={1}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ask something..."
                className="resize-none max-h-32"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <Button size="icon" onClick={sendMessage} disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
