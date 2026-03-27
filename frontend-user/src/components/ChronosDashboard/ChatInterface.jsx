import { useEffect, useRef, useState } from 'react'

export default function ChatInterface({ messages = [], onSend, typing }) {
  const [value, setValue] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, typing])

  function handleSubmit(e) {
    e && e.preventDefault()
    if (!value.trim()) return
    onSend && onSend(value.trim())
    setValue('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Assistant</div>
        <div style={{ color: '#6b7280', fontSize: 13 }}>AI • Online</div>
      </div>

      <div ref={listRef} className="chat-history" role="log">
        {messages.map((m) => (
          <div key={m.id} className={"bubble " + (m.role === 'user' ? 'user' : 'ai')}>
            {m.text}
          </div>
        ))}

        {typing && (
          <div className="bubble ai" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c7c9d9', animation: 'blink 1s infinite' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c7c9d9', animation: 'blink 1s 0.2s infinite' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c7c9d9', animation: 'blink 1s 0.4s infinite' }} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="input-row">
        <input
          className="input"
          placeholder="Type a message, e.g. 'Schedule meeting tomorrow'"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Message input"
          disabled={typing}
        />
        <button type="submit" className="btn" disabled={typing}>
          {typing ? 'Typing...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
