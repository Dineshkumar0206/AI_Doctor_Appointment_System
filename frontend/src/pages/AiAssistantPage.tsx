import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, Send, Sparkles, Calendar, Search, Bell, User, Loader2 } from 'lucide-react'
import { aiApi } from '../api/ai'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type AiMode = 'chat' | 'suggest' | 'search' | 'summary' | 'reminder'

const modeConfig: Record<AiMode, { label: string; icon: typeof Bot; placeholder: string; color: string }> = {
  chat:     { label: 'General Chat',     icon: Bot,       placeholder: 'Ask anything about appointments...', color: 'from-primary-600 to-primary-500' },
  suggest:  { label: 'Suggest Slots',    icon: Calendar,  placeholder: 'e.g. "I need a dentist appointment tomorrow morning"', color: 'from-emerald-600 to-emerald-500' },
  search:   { label: 'Find Doctor',      icon: Search,    placeholder: 'e.g. "Find me a cardiologist with 10+ years experience"', color: 'from-blue-600 to-blue-500' },
  summary:  { label: 'Apt Summary',      icon: Sparkles,  placeholder: 'Enter appointment ID to generate summary', color: 'from-accent-600 to-accent-500' },
  reminder: { label: 'Reminder',         icon: Bell,      placeholder: 'Enter appointment ID to generate reminder', color: 'from-amber-600 to-amber-500' },
}

const loadStoredMessages = (user: any): Record<AiMode, Message[]> => {
  const roleStr = user?.roles?.join('_') ?? 'anonymous'
  const emailStr = user?.email ?? ''
  const key = `ai_assistant_messages_${roleStr}_${emailStr}`
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const modes: AiMode[] = ['chat', 'suggest', 'search', 'summary', 'reminder']
      modes.forEach(mode => {
        if (Array.isArray(parsed[mode])) {
          parsed[mode] = parsed[mode].map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }
      })
      return parsed
    } catch (e) {
      console.error('Failed to parse stored chat messages', e)
    }
  }

  return {
    chat: [
      {
        id: 'chat-0',
        role: 'assistant',
        content: user?.roles?.includes('ROLE_DOCTOR')
          ? "👋 Hello Doctor! I'm your Clinical AI assistant. Ask me clinical questions, research drug interactions, or request medical reference information."
          : "👋 Hello! I'm your AI assistant. Ask me anything about appointments, our hospital, or medical specializations.",
        timestamp: new Date(),
      }
    ],
    suggest: [
      {
        id: 'suggest-0',
        role: 'assistant',
        content: '📅 Welcome to Suggest Slots! Describe your preferred time and medical need, and I will search available schedules to recommend the best slots for you.\n\n*Example: "I need a cardiologist next Monday morning"*',
        timestamp: new Date(),
      }
    ],
    search: [
      {
        id: 'search-0',
        role: 'assistant',
        content: '🔍 Welcome to Find Doctor! Tell me what specialist you are looking for (e.g. by specialization, experience, or fee), and I will recommend the best fit.\n\n*Example: "Find me a pediatrician with 5+ years experience"*',
        timestamp: new Date(),
      }
    ],
    summary: [
      {
        id: 'summary-0',
        role: 'assistant',
        content: '✨ Welcome to Appointment Summary! Enter an appointment ID below, and I will generate a professional medical summary including key points and follow-up recommendations.\n\n*Example: "5"*',
        timestamp: new Date(),
      }
    ],
    reminder: [
      {
        id: 'reminder-0',
        role: 'assistant',
        content: '🔔 Welcome to Reminder Generator! Enter an appointment ID, and I will generate a warm, professional reminder message suitable for the patient.\n\n*Example: "3"*',
        timestamp: new Date(),
      }
    ]
  }
}

export default function AiAssistantPage() {
  const { user, hasRole } = useAuth()
  const isDoctor = hasRole('ROLE_DOCTOR')

  const roleStr = user?.roles?.join('_') ?? 'anonymous'
  const emailStr = user?.email ?? ''
  const storageKey = `ai_assistant_messages_${roleStr}_${emailStr}`

  const allowedModes: AiMode[] = isDoctor ? ['chat', 'summary', 'reminder'] : ['chat', 'suggest', 'search']

  const [mode, setMode] = useState<AiMode>('chat')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Record<AiMode, Message[]>>(() => loadStoredMessages(user))
  const bottomRef = useRef<HTMLDivElement>(null)

  // Update messages state when user/role changes
  useEffect(() => {
    setMessages(loadStoredMessages(user))
  }, [storageKey, user])

  // Reset to allowed mode if current mode is not allowed
  useEffect(() => {
    if (!allowedModes.includes(mode)) {
      setMode('chat')
    }
  }, [allowedModes, mode])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, mode])

  const addMessage = (currentMode: AiMode, role: Message['role'], content: string) => {
    setMessages(prev => ({
      ...prev,
      [currentMode]: [...prev[currentMode], {
        id: String(Date.now()), role, content, timestamp: new Date(),
      }]
    }))
  }

  const chatMut   = useMutation({ mutationFn: (m: string) => aiApi.chat(m) })
  const suggestMut = useMutation({ mutationFn: (m: string) => aiApi.suggestSlots(m) })
  const searchMut  = useMutation({ mutationFn: (m: string) => aiApi.searchDoctors(m) })
  const summaryMut = useMutation({ mutationFn: (id: number) => aiApi.generateSummary(id) })
  const reminderMut = useMutation({ mutationFn: (id: number) => aiApi.generateReminder(id) })

  const isLoading = chatMut.isPending || suggestMut.isPending || searchMut.isPending ||
                    summaryMut.isPending || reminderMut.isPending

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    addMessage(mode, 'user', text)

    try {
      let res: any
      if (mode === 'chat')    res = await chatMut.mutateAsync(text)
      else if (mode === 'suggest')  res = await suggestMut.mutateAsync(text)
      else if (mode === 'search')   res = await searchMut.mutateAsync(text)
      else if (mode === 'summary')  res = await summaryMut.mutateAsync(Number(text))
      else if (mode === 'reminder') res = await reminderMut.mutateAsync(Number(text))
      addMessage(mode, 'assistant', res?.data ?? 'No response received.')
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'AI service error. Check your API key.'
      toast.error(msg)
      addMessage(mode, 'assistant', `⚠️ ${msg}`)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const currentMode = {
    ...modeConfig[mode],
    label: mode === 'chat' && isDoctor ? 'Clinical Chat' : modeConfig[mode].label,
    placeholder: mode === 'chat' && isDoctor ? 'Ask clinical questions, drug interactions, or medical reference info...' : modeConfig[mode].placeholder,
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary-400" /> AI Assistant
          </h1>
          <p className="page-subtitle">
            {isDoctor 
              ? 'Powered by AI – Your medical clinical practice companion' 
              : 'Powered by AI – Your intelligent scheduling companion'}
          </p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allowedModes.map(m => {
          const cfg = {
            ...modeConfig[m],
            label: m === 'chat' && isDoctor ? 'Clinical Chat' : modeConfig[m].label,
          }
          const Icon = cfg.icon
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                         ${mode === m
                           ? `bg-gradient-to-r ${cfg.color} text-white shadow-lg`
                           : 'bg-dark-800 border border-dark-700 text-dark-400 hover:border-dark-600 hover:text-dark-200'}`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Chat Window */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages[mode].map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm
                               ${msg.role === 'assistant'
                                 ? `bg-gradient-to-br ${currentMode.color} text-white`
                                 : 'bg-dark-700 text-dark-300'}`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                               ${msg.role === 'assistant'
                                 ? 'bg-dark-800 border border-dark-700 text-dark-100 rounded-tl-sm'
                                 : 'bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-tr-sm'}`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1.5 ${msg.role === 'assistant' ? 'text-dark-500' : 'text-primary-200'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${currentMode.color} text-white`}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-dark-800 border border-dark-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-dark-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-dark-700 p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={currentMode.placeholder}
                rows={1}
                className="input-field resize-none pr-12 max-h-32 overflow-y-auto"
                style={{ lineHeight: '1.5rem' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${currentMode.color} text-white
                         flex items-center justify-center flex-shrink-0 transition-all
                         hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg`}
              aria-label="Send message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-dark-500 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line · Mode: <span className="text-primary-400">{currentMode.label}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
