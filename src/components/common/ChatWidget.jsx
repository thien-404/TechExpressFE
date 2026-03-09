import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, User, Phone, ChevronDown, Loader2, Paperclip, FileText } from 'lucide-react'
import { useAuth } from '../../store/authContext'
import { decodeToken } from '../../utils/jwt'
import { toast } from 'sonner'
import { apiService } from '../../config/axios'
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// SignalR hub sits at the server root, not under /api
const SIGNALR_URL = 'https://localhost:7194'

function formatTime(date) {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

// ─── Guest form ──────────────────────────────────────────────────────────────

function GuestForm({ onSubmit, loading }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên'
    if (!phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại'
    else if (!/^(0|\+84)[0-9]{9}$/.test(phone.trim())) newErrors.phone = 'Số điện thoại không hợp lệ'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ fullName: fullName.trim(), phone: phone.trim() })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0090D0] to-[#005580] px-4 py-4 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">TechExpress Support</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white/70 text-xs">Trực tuyến</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 p-5 overflow-y-auto">
        <p className="text-slate-600 text-sm mb-5 leading-relaxed">
          Vui lòng cung cấp thông tin để chúng tôi có thể hỗ trợ bạn tốt hơn.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm outline-none transition-colors
                  ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-[#0090D0]'}`}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm outline-none transition-colors
                  ${errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-[#0090D0]'}`}
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#0090D0] to-[#005580] text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Đang kết nối...' : 'Bắt đầu trò chuyện'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Typing dots indicator ────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0090D0] to-[#005580] flex items-center justify-center flex-shrink-0 mr-2 mt-auto">
        <MessageCircle size={13} className="text-white" />
      </div>
      <div className="flex items-center gap-1 px-3 py-2.5 bg-slate-100 rounded-2xl rounded-bl-sm">
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}

// ─── Chat area ────────────────────────────────────────────────────────────────

const MAX_FILES = 5

function getMediaType(file) {
  if (file.type.startsWith('image/')) return 'Image'
  if (file.type.startsWith('video/')) return 'Video'
  return 'File'
}

function ChatArea({ displayName, sessionId, phone, onMinimize }) {
  // Decode user ID directly from the current token in localStorage so it stays
  // accurate even after a silent token refresh (which updates localStorage but
  // may not immediately update the AuthContext user state).
  const currentUserId = decodeToken(localStorage.getItem('token'))?.id ?? null
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [pageIndex, setPageIndex] = useState(1)
  const [isMore, setIsMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [sending, setSending] = useState(false)
  // Each entry: { file: File, previewUrl: string|null, type: 'Image'|'Video'|'File' }
  const [selectedFiles, setSelectedFiles] = useState([])
  // Typing indicators
  const [botTyping, setBotTyping] = useState(false)
  const [staffTyping, setStaffTyping] = useState(false)

  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const connectionRef = useRef(null)
  // Stores scrollHeight captured before prepending older messages
  const prevScrollHeightRef = useRef(null)
  // Auto-hide timer for staff typing indicator
  const staffTypingTimerRef = useRef(null)
  // Debounce timer for outgoing UserTyping SignalR event
  const typingDebounceRef = useRef(null)

  // ── SignalR real-time connection ───────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return

    // cancelled flag prevents acting on a cleanup-stopped connection (React StrictMode safe)
    let cancelled = false
    const token = localStorage.getItem('token')

    const connection = new HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}/chatHub`, {
        // Only set accessTokenFactory when a token exists — passing an empty string
        // triggers JWT middleware to actively reject the negotiation request with 401
        ...(token ? { accessTokenFactory: () => token } : {}),
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()

    // Append incoming message, dedup by id in case sendMessage already optimistically added it
    connection.on('ReceiveChatMessage', (msg) => {
      if (cancelled) return
      // Clear any typing indicators when a reply arrives
      setBotTyping(false)
      setStaffTyping(false)
      clearTimeout(staffTypingTimerRef.current)
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })

    // Staff typing events
    connection.on('ShowTypingIndicator', () => {
      if (cancelled) return
      setStaffTyping(true)
      clearTimeout(staffTypingTimerRef.current)
      // Auto-hide after 3s in case HideTypingIndicator is missed
      staffTypingTimerRef.current = setTimeout(() => setStaffTyping(false), 3000)
    })

    connection.on('HideTypingIndicator', () => {
      if (cancelled) return
      clearTimeout(staffTypingTimerRef.current)
      setStaffTyping(false)
    })

    connection
      .start()
      .then(() => {
        if (cancelled) return
        // Ask the server to add this connection to the session group: chat-{sessionId}
        return connection.invoke('JoinSession', sessionId, phone ?? '')
      })
      .catch((err) => {
        if (!cancelled) console.error('[SignalR] Connection error:', err)
      })

    connectionRef.current = connection

    return () => {
      cancelled = true
      clearTimeout(staffTypingTimerRef.current)
      clearTimeout(typingDebounceRef.current)
      connection.stop()
      connectionRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // ── fetch a page of messages ───────────────────────────────────────────────
  const fetchMessages = async (page) => {
    try {
      const res = await apiService.get(`/Chat/sessions/${sessionId}/messages`, {
        phone, size: 20, pageIndex: page
      })
      const fetched = res.value?.chatMessages ?? []
      setIsMore(res.value?.isMore ?? false)

      if (page === 1) {
        setMessages(fetched)
      } else {
        // Capture current scrollHeight BEFORE the state update so
        // useLayoutEffect can restore visual position after prepend
        prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0
        setMessages((prev) => [...fetched, ...prev])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải tin nhắn')
    } finally {
      setLoadingMore(false)
      setInitialLoading(false)
    }
  }

  // Initial load → scroll to bottom once messages arrive
  useEffect(() => {
    fetchMessages(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    if (!initialLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [initialLoading])

  // ── restore scroll position after older messages are prepended ─────────────
  // useLayoutEffect fires synchronously after DOM mutation, before paint,
  // so the user never sees the jump.
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = null
    }
  }, [messages])

  // ── detect scroll-to-top → load older messages ─────────────────────────────
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || loadingMore || !isMore) return
    if (el.scrollTop < 50) {
      const nextPage = pageIndex + 1
      setPageIndex(nextPage)
      setLoadingMore(true)
      fetchMessages(nextPage)
    }
  }

  // ── file selection ─────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const incoming = Array.from(e.target.files)
    const canAdd = MAX_FILES - selectedFiles.length

    if (canAdd <= 0) {
      toast.error(`Tối đa ${MAX_FILES} tệp đính kèm`)
      e.target.value = ''
      return
    }

    const accepted = incoming.slice(0, canAdd)
    if (incoming.length > canAdd) {
      toast.warning(`Chỉ thêm được ${canAdd} tệp nữa, phần còn lại bị bỏ qua`)
    }

    const entries = accepted.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: getMediaType(file)
    }))

    setSelectedFiles((prev) => [...prev, ...entries])
    e.target.value = ''
  }

  const removeFile = (index) => {
    setSelectedFiles((prev) => {
      const next = [...prev]
      if (next[index].previewUrl) URL.revokeObjectURL(next[index].previewUrl)
      next.splice(index, 1)
      return next
    })
  }

  // ── upload a single file → { mediaUrl, type } ─────────────────────────────
  const uploadFile = async ({ file, type }) => {
    const fd = new FormData()
    fd.append('file', file, file.name)
    const res = await apiService.post('/Chat/upload', fd)
    return { mediaUrl: res.value.url, type }
  }

  // ── send a message ─────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim()
    if (!text && selectedFiles.length === 0) return

    // Capture connection state synchronously — before any awaits — so that
    // botTyping(true) is set first and cannot be overwritten by a fast AI reply
    // arriving via SignalR while we await the POST.
    const isConnected = connectionRef.current?.state === 'Connected'
    if (isConnected) setBotTyping(true)

    setSending(true)
    try {
      const uploadedMedias = await Promise.all(selectedFiles.map(uploadFile))

      const res = await apiService.post(`/Chat/sessions/${sessionId}/messages`, {
        phone,
        message: text,
        medias: uploadedMedias
      })

      if (!isConnected) {
        // SignalR not available — append directly and clear typing flag
        setBotTyping(false)
        setMessages((prev) => [...prev, res.value])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
      // else: ReceiveChatMessage will clear botTyping when the reply arrives
      setInput('')
      // Revoke object URLs to free memory then clear
      selectedFiles.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl) })
      setSelectedFiles([])
    } catch (err) {
      setBotTyping(false)
      toast.error(err.response?.data?.message || 'Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const canSend = (input.trim().length > 0 || selectedFiles.length > 0) && !sending

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0090D0] to-[#005580] px-4 py-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">TechExpress Support</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white/70 text-xs">Trực tuyến</span>
            </div>
          </div>
        </div>
        <button
          onClick={onMinimize}
          className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Greeting bar */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <p className="text-xs text-blue-600 font-medium">
          Xin chào, <span className="font-semibold">{displayName}</span>! 👋
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {/* "Load more" spinner at the top */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 size={18} className="animate-spin text-[#0090D0]" />
          </div>
        )}

        {/* "No more messages" hint */}
        {!isMore && messages.length > 0 && (
          <p className="text-center text-[11px] text-slate-300 py-1">Đây là tin nhắn đầu tiên</p>
        )}

        {initialLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={22} className="animate-spin text-[#0090D0]" />
          </div>
        ) : (
          messages.map((msg) => {
            // isAiMessage/sentByFullName marks AI; sentById null = guest customer;
            // sentById matches current user = logged-in customer; otherwise = staff
            const isAi = msg.isAiMessage || msg.sentByFullName === 'AI Assistant'
            const isUser = !isAi && (msg.sentById == null || msg.sentById === currentUserId)
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0090D0] to-[#005580] flex items-center justify-center flex-shrink-0 mr-2 mt-auto">
                    <MessageCircle size={13} className="text-white" />
                  </div>
                )}
                <div className={`flex flex-col gap-1 ${isUser ? 'items-end max-w-[75%]' : 'items-start w-full'}`}>
                  {/* Text bubble */}
                  {msg.message && (
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                        ${isUser
                          ? 'bg-gradient-to-br from-[#0090D0] to-[#005580] text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm w-full'}`}
                    >
                      {isUser ? msg.message : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
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
                          }}
                        >
                          {msg.message}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}
                  {/* Media attachments */}
                  {msg.medias?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {msg.medias.map((m, i) =>
                        m.type === 'Image' ? (
                          <a key={i} href={m.mediaUrl} target="_blank" rel="noreferrer">
                            <img
                              src={m.mediaUrl}
                              alt="attachment"
                              className="w-24 h-24 object-cover rounded-xl border border-slate-200"
                            />
                          </a>
                        ) : m.type === 'Video' ? (
                          <video
                            key={i}
                            src={m.mediaUrl}
                            controls
                            className="w-48 rounded-xl border border-slate-200"
                          />
                        ) : (
                          <a
                            key={i}
                            href={m.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-xs text-[#0090D0] hover:bg-slate-200 transition-colors"
                          >
                            <FileText size={13} />
                            <span className="truncate max-w-[120px]">Tải xuống</span>
                          </a>
                        )
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {formatTime(new Date(msg.createdAt ?? msg.time))}
                  </span>
                </div>
              </div>
            )
          })
        )}

        {/* Typing indicator dots */}
        {(botTyping || staffTyping) && <TypingDots />}

        <div ref={bottomRef} />
      </div>

      {/* Selected file previews */}
      {selectedFiles.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-2 border-t border-slate-100">
          {selectedFiles.map((item, i) => (
            <div key={i} className="relative group">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt="preview"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-14 h-14 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-1 px-1">
                  <FileText size={18} className="text-slate-400 flex-shrink-0" />
                  <span className="text-[9px] text-slate-500 text-center leading-tight truncate w-full px-0.5">
                    {item.file.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={9} className="text-white" />
              </button>
            </div>
          ))}
          <span className="self-end text-[10px] text-slate-400 ml-auto pb-1">
            {selectedFiles.length}/{MAX_FILES}
          </span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-100 p-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedFiles.length >= MAX_FILES || sending}
            title={selectedFiles.length >= MAX_FILES ? `Tối đa ${MAX_FILES} tệp` : 'Đính kèm tệp'}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors
              ${selectedFiles.length >= MAX_FILES || sending
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-400 hover:text-[#0090D0] hover:bg-blue-50'}`}
          >
            <Paperclip size={16} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Debounce outgoing "user is typing" event to the hub
              clearTimeout(typingDebounceRef.current)
              typingDebounceRef.current = setTimeout(() => {
                if (connectionRef.current?.state === 'Connected') {
                  connectionRef.current.invoke('UserTyping', sessionId).catch(() => {})
                }
              }, 400)
            }}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
          />

          <button
            onClick={sendMessage}
            disabled={!canSend}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-all
              ${canSend
                ? 'bg-gradient-to-br from-[#0090D0] to-[#005580] text-white hover:opacity-90'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Loading overlay (while session is being initialized for auth users) ──────

function SessionLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-[#0090D0] to-[#005580] px-4 py-4 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div className="text-white font-semibold text-sm">TechExpress Support</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin text-[#0090D0]" />
        <span className="text-sm">Đang kết nối...</span>
      </div>
    </div>
  )
}

// ─── Root widget ──────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const { isAuthenticated, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(false)

  // Display name / phone: from auth user or guest form
  const [guestName, setGuestName] = useState(null)
  const [guestPhone, setGuestPhone] = useState(null)
  const displayName = isAuthenticated
    ? (user?.fullName || user?.name || user?.email || 'Bạn')
    : guestName

  // Initialize (or resume) a session via the server
  const initSession = async (body = {}) => {
    setSessionLoading(true)
    try {
      const res = await apiService.post('/Chat/sessions', body)
      setSessionId(res.value.id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể kết nối, vui lòng thử lại')
    } finally {
      setSessionLoading(false)
    }
  }

  // Authenticated: call session API as soon as the widget is opened
  const handleOpen = () => {
    setOpen(true)
    if (isAuthenticated && !sessionId) {
      initSession() // token is sent automatically via apiService interceptor
    }
  }

  // Guest: call session API after form submission
  const handleGuestSubmit = ({ fullName, phone }) => {
    setGuestName(fullName)
    setGuestPhone(phone)
    initSession({ fullName, phone })
  }

  const handleClose = () => setOpen(false)

  // Decide what to render inside the panel
  const renderPanel = () => {
    if (isAuthenticated) {
      if (sessionLoading || !sessionId) return <SessionLoading />
      return <ChatArea displayName={displayName} sessionId={sessionId} phone={null} onMinimize={handleClose} />
    }

    // Guest: show form until session is ready
    if (!sessionId) {
      return (
        <div className="relative flex flex-col h-full">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
          <GuestForm onSubmit={handleGuestSubmit} loading={sessionLoading} />
        </div>
      )
    }

    return <ChatArea displayName={displayName} sessionId={sessionId} phone={guestPhone} onMinimize={handleClose} />
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[340px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
          >
            {renderPanel()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB toggle button */}
      <motion.button
        onClick={open ? handleClose : handleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-br from-[#0090D0] to-[#005580] rounded-full shadow-lg flex items-center justify-center text-white relative"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Notification dot */}
        {!open && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </div>
  )
}
