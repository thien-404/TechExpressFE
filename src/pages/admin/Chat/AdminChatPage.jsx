import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr'
import { apiService } from '../../../config/axios'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle, Send, Loader2, Clock,
  CheckCircle2, RefreshCw, Search, Inbox, FileText
} from 'lucide-react'
import Breadcrumb from '../../../components/ui/Breadcrumb'
import Pagination from '../../../components/common/Pagination'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SIGNALR_URL = 'https://localhost:7194'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return 'Vừa xong'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`
  if (diff < 86_400_000) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function formatClock(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Typing dots ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0090D0] to-[#005580] flex items-center justify-center flex-shrink-0 mr-2 mt-auto">
        <MessageCircle size={13} className="text-white" />
      </div>
      <div className="flex items-center gap-1 px-3 py-2.5 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}

// ── Markdown component map (reused for AI/bot messages) ───────────────────────

const MD = {
  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-slate-200">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#0090D0]/10">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1.5 text-left font-semibold border-b border-slate-200 whitespace-nowrap">{children}</th>,
  td: ({ children }) => <td className="px-2 py-1.5 border-b border-slate-100 last:border-b-0">{children}</td>,
  tr: ({ children }) => <tr className="even:bg-slate-50">{children}</tr>,
  code: ({ children }) => <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-[#0090D0] pl-2 my-1 text-slate-600">{children}</blockquote>,
}

// ── Session list card ─────────────────────────────────────────────────────────

function SessionCard({ session, active, onClick }) {
  const name = session.fullName || session.phone || 'Khách'
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors
        ${active
          ? 'bg-blue-50 border-l-[3px] border-l-[#0090D0]'
          : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
          ${active ? 'bg-[#0090D0] text-white' : 'bg-slate-200 text-slate-600'}`}>
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-medium text-slate-800 truncate">{name}</span>
            <span className="text-[10px] text-slate-400 flex-shrink-0">{formatRelative(session.createdAt)}</span>
          </div>
          {session.phone && (
            <div className="text-xs text-slate-500 mt-0.5 truncate">{session.phone}</div>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Staff chat panel ──────────────────────────────────────────────────────────

function StaffChatPanel({ session, onSessionClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [pageIndex, setPageIndex] = useState(1)
  const [isMore, setIsMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [customerTyping, setCustomerTyping] = useState(false)
  const [closing, setClosing] = useState(false)

  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const prevScrollHeightRef = useRef(null)
  const customerTypingTimerRef = useRef(null)
  const connectionRef = useRef(null)
  const typingDebounceRef = useRef(null)

  const sessionId = session.id
  const sessionName = session.fullName || session.phone || 'Khách'

  // ── Dedicated SignalR connection for this session ───────────────────────────
  // Owns its own connection (same pattern as ChatArea in ChatWidget) so it does
  // not depend on the parent's shared connection timing.
  useEffect(() => {
    let cancelled = false
    const token = localStorage.getItem('token')

    const connection = new HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}/chatHub`, {
        ...(token ? { accessTokenFactory: () => token } : {}),
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('ReceiveChatMessage', (msg) => {
      if (cancelled) return
      // Ignore messages that belong to a different session (staff receives all
      // session messages via the "staff" group broadcast).
      if (msg.sessionId && msg.sessionId !== sessionId) return
      setCustomerTyping(false)
      clearTimeout(customerTypingTimerRef.current)
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })

    connection.on('ShowTypingIndicator', (incomingSessionId) => {
      if (cancelled) return
      if (incomingSessionId && incomingSessionId !== sessionId) return
      setCustomerTyping(true)
      clearTimeout(customerTypingTimerRef.current)
      customerTypingTimerRef.current = setTimeout(() => setCustomerTyping(false), 3000)
    })

    connection.on('HideTypingIndicator', (incomingSessionId) => {
      if (cancelled) return
      if (incomingSessionId && incomingSessionId !== sessionId) return
      clearTimeout(customerTypingTimerRef.current)
      setCustomerTyping(false)
    })

    connectionRef.current = connection

    connection
      .start()
      .then(() => {
        if (cancelled) return
        return connection.invoke('JoinSession', sessionId, '')
      })
      .then(() => {
        // Re-fetch page 1 after joining the group to catch any messages that
        // were broadcast during the connection setup window (race condition).
        if (cancelled) return
        return fetchMessages(1)
      })
      .catch(() => {
      })

    // Re-join the session group after an automatic reconnect so we keep
    // receiving messages after a brief network interruption.
    connection.onreconnected(() => {
      if (!cancelled) {
        connection.invoke('JoinSession', sessionId, '').catch(() => {})
        fetchMessages(1)
      }
    })

    return () => {
      cancelled = true
      clearTimeout(customerTypingTimerRef.current)
      clearTimeout(typingDebounceRef.current)
      connection.stop()
      connectionRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // ── Fetch messages ──────────────────────────────────────────────────────────
  const fetchMessages = async (page) => {
    try {
      const res = await apiService.get(`/Chat/sessions/${sessionId}/messages`, { size: 20, pageIndex: page })
      const fetched = res.value?.chatMessages ?? []
      setIsMore(res.value?.isMore ?? false)
      if (page === 1) {
        setMessages(fetched)
      } else {
        prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0
        setMessages((prev) => [...fetched, ...prev])
      }
    } catch {
      toast.error('Không thể tải tin nhắn')
    } finally {
      setLoadingMore(false)
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    if (!initialLoading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [initialLoading])

  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = null
    }
  }, [messages])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || loadingMore || !isMore) return
    if (el.scrollTop < 50) {
      const next = pageIndex + 1
      setPageIndex(next)
      setLoadingMore(true)
      fetchMessages(next)
    }
  }

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const res = await apiService.post(`/Chat/sessions/${sessionId}/messages`, { message: text, medias: [] })
      setInput('')
      // Append directly so it shows immediately; SignalR echo is deduped by id
      if (res.value) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.value.id)) return prev
          return [...prev, res.value]
        })
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    } catch {
      toast.error('Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  // ── Close session ───────────────────────────────────────────────────────────
  const handleCloseSession = async () => {
    if (!window.confirm('Bạn có chắc muốn đóng phiên hỗ trợ này không?')) return
    setClosing(true)
    try {
      const res = await apiService.patch(`/Chat/sessions/${sessionId}/close`)
      if (res.succeeded !== false) {
        toast.success('Đã đóng phiên hỗ trợ')
        onSessionClose(sessionId)
      } else {
        toast.error(res.message || 'Không thể đóng phiên')
      }
    } catch {
      toast.error('Không thể đóng phiên')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0090D0] to-[#005580] text-white flex items-center justify-center text-xs font-semibold">
            {getInitials(sessionName)}
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{sessionName}</div>
            <div className="flex items-center gap-3 mt-0.5">
              {session.phone && (
                <span className="text-xs text-slate-500">{session.phone}</span>
              )}
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} />
                {formatClock(session.createdAt)}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium
                ${session.isClosed
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-green-50 text-green-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${session.isClosed ? 'bg-slate-400' : 'bg-green-400'}`} />
                {session.isClosed ? 'Đã đóng' : 'Đang mở'}
              </span>
            </div>
          </div>
        </div>

        {!session.isClosed && (
          <button
            onClick={handleCloseSession}
            disabled={closing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
              bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
          >
            {closing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Đóng phiên
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={18} className="animate-spin text-[#0090D0]" />
          </div>
        )}
        {!isMore && messages.length > 0 && (
          <p className="text-center text-[11px] text-slate-300 py-1">Đây là tin nhắn đầu tiên</p>
        )}

        {initialLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={22} className="animate-spin text-[#0090D0]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <MessageCircle size={32} className="text-slate-200" />
            <span className="text-sm">Chưa có tin nhắn</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isAi = msg.isAiMessage || msg.sentByFullName === 'AI Assistant'
            // Staff messages have sentById set and are not AI
            const isStaff = !isAi && msg.sentById != null
            const alignRight = isStaff

            return (
              <div key={msg.id} className={`flex ${alignRight ? 'justify-end' : 'justify-start'}`}>
                {!alignRight && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-auto text-white text-[10px] font-semibold
                    ${isAi
                      ? 'bg-gradient-to-br from-[#0090D0] to-[#005580]'
                      : 'bg-slate-400'}`}>
                    {isAi ? <MessageCircle size={13} /> : getInitials(msg.sentByFullName)}
                  </div>
                )}
                <div className={`flex flex-col gap-1 max-w-[70%] ${alignRight ? 'items-end' : 'items-start'}`}>
                  {!alignRight && (
                    <span className="text-[10px] text-slate-500 px-1">
                      {isAi ? 'AI Assistant' : msg.sentByFullName}
                    </span>
                  )}
                  {msg.message && (
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                      ${alignRight
                        ? 'bg-gradient-to-br from-[#0090D0] to-[#005580] text-white rounded-br-sm'
                        : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200 shadow-sm'}`}>
                      {alignRight ? msg.message : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                          {msg.message}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                  {msg.medias?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.medias.map((m, i) =>
                        m.type === 'Image' ? (
                          <a key={i} href={m.mediaUrl} target="_blank" rel="noreferrer">
                            <img src={m.mediaUrl} alt="attachment"
                              className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                          </a>
                        ) : m.type === 'Video' ? (
                          <video key={i} src={m.mediaUrl} controls
                            className="w-48 rounded-xl border border-slate-200" />
                        ) : (
                          <a key={i} href={m.mediaUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-xs text-[#0090D0] hover:bg-slate-200 transition-colors">
                            <FileText size={13} />
                            <span>Tải xuống</span>
                          </a>
                        )
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {formatClock(msg.createdAt ?? msg.time)}
                  </span>
                </div>
              </div>
            )
          })
        )}

        {customerTyping && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input — hidden when session is closed */}
      {!session.isClosed && (
        <div className="border-t border-slate-200 p-3 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                clearTimeout(typingDebounceRef.current)
                typingDebounceRef.current = setTimeout(() => {
                  if (connectionRef.current?.state === 'Connected') {
                    connectionRef.current.invoke('StaffTyping', sessionId).catch(() => {})
                  }
                }, 400)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              }}
              disabled={sending}
              placeholder="Nhập tin nhắn hỗ trợ..."
              className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-all
                ${input.trim() && !sending
                  ? 'bg-gradient-to-br from-[#0090D0] to-[#005580] text-white hover:opacity-90'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function AdminChatPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('open')         // 'open' | 'closed'
  const [selectedSession, setSelectedSession] = useState(null)
  const [search, setSearch] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const PAGE_SIZE = 20
  const connectionRef = useRef(null)

  // Fetch session list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-chat-sessions', tab, pageNumber],
    queryFn: async () => {
      const res = await apiService.get('/Chat/sessions', {
        isClosed: tab === 'closed',
        pageNumber,
        pageSize: PAGE_SIZE,
      })
      const value = res.value
      return value ?? { items: [], pageNumber: 0, pageSize: PAGE_SIZE, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }
    },
    staleTime: 30_000,
  })

  const sessions = data?.items ?? []
  const totalItems = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  // Shared SignalR connection (listens for NewChatSession)
  useEffect(() => {
    // React StrictMode mounts effects twice; the cancelled flag prevents the
    // first (cleanup-stopped) connection from updating state or throwing errors.
    let cancelled = false
    const token = localStorage.getItem('token')
    const connection = new HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}/chatHub`, {
        ...(token ? { accessTokenFactory: () => token } : {}),
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()

    connection.on('NewChatSession', () => {
      if (cancelled) return
      queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions', 'open'] })
      toast.info('Có phiên hỗ trợ mới', { duration: 3000 })
      setPageNumber(0)
    })

    connection
      .start()
      .catch((err) => { if (!cancelled) console.error('[SignalR] Admin connection error:', err) })

    connectionRef.current = connection

    return () => {
      cancelled = true
      connection.stop()
      connectionRef.current = null
    }
  }, [queryClient])

  const handleSessionClose = (closedId) => {
    queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] })
    if (selectedSession?.id === closedId) {
      setSelectedSession((prev) => ({ ...prev, isClosed: true }))
    }
  }

  const handleSelectSession = (s) => {
    setSelectedSession(s)
  }

  const handleTabChange = (key) => {
    setTab(key)
    setSelectedSession(null)
    setPageNumber(0)
  }

  const filtered = sessions.filter((s) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const name = (s.fullName || '').toLowerCase()
    const phone = (s.phone || '').toLowerCase()
    return name.includes(q) || phone.includes(q)
  })

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex-shrink-0">
        <Breadcrumb items={[{ label: 'Trang chủ', href: '/admin' }, { label: 'Hỗ trợ khách hàng' }]} />

        <div className="mt-3 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#334155]">Hỗ trợ khách hàng</h1>
            <p className="text-sm text-slate-500 mt-1">
              <span className="font-semibold text-blue-600">{totalItems}</span> phiên {tab === 'open' ? 'đang mở' : 'đã đóng'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-0">

        {/* Left — session list */}
        <div className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 flex-shrink-0">
            {[
              { key: 'open', label: 'Đang mở' },
              { key: 'closed', label: 'Đã đóng' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`flex-1 py-3 text-sm font-medium transition-colors
                  ${tab === key
                    ? 'text-[#0090D0] border-b-2 border-[#0090D0]'
                    : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-100 flex-shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, số điện thoại..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-[#0090D0] bg-slate-50"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 size={20} className="animate-spin text-[#0090D0]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-slate-400 gap-2">
                <Inbox size={24} />
                <span className="text-xs">Không có phiên nào</span>
              </div>
            ) : (
              filtered.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  active={selectedSession?.id === s.id}
                  onClick={() => handleSelectSession(s)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-slate-100">
              <Pagination
                pageNumber={pageNumber}
                pageSize={PAGE_SIZE}
                totalItems={totalItems}
                totalPages={totalPages}
                loading={isLoading}
                onPageChange={setPageNumber}
              />
            </div>
          )}
        </div>

        {/* Right — chat panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedSession ? (
            <StaffChatPanel
              key={selectedSession.id}
              session={selectedSession}
              onSessionClose={handleSessionClose}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <MessageCircle size={28} className="text-slate-300" />
              </div>
              <div className="text-center">
                <div className="font-medium text-slate-500 text-sm">Chọn một phiên để xem tin nhắn</div>
                <div className="text-xs text-slate-400 mt-1">Danh sách phiên ở bên trái</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
