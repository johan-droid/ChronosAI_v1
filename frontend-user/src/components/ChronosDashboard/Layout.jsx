import { useState } from 'react'
import Sidebar from './Sidebar'
import ChatInterface from './ChatInterface'
import CalendarView from './CalendarView'
import MeetingDetails from './MeetingDetails'
import meetings from '../../data/meetings'

export default function Layout() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedMeetings, setSelectedMeetings] = useState([])
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: 'Hi — I can help schedule meetings. Ask me to schedule one.' },
  ])
  const [typing, setTyping] = useState(false)

  function handleSend(text) {
    if (!text || !text.trim()) return
    const userMsg = { id: Date.now(), role: 'user', text }
    setMessages((s) => [...s, userMsg])
    setTyping(true)
    setTimeout(() => {
      setMessages((s) => [...s, { id: Date.now() + 1, role: 'ai', text: 'With whom and at what time?' }])
      setTyping(false)
    }, 900)
  }

  function onDateClick(dateStr) {
    setSelectedDate(dateStr)
    const list = meetings.filter((m) => m.date === dateStr)
    setSelectedMeetings(list)
  }

  return (
    <div className="app">
      <div className="sidebar panel">
        <Sidebar />
      </div>

      <div className="main">
        <div className="panel chat-top">
          <ChatInterface messages={messages} onSend={handleSend} typing={typing} />
        </div>

        <div className="panel calendar-panel">
          <CalendarView meetings={meetings} onDateClick={onDateClick} selectedDate={selectedDate} />
        </div>
      </div>

      {selectedDate && (
        <div className="details-panel">
          <MeetingDetails date={selectedDate} meetings={selectedMeetings} />
        </div>
      )}
    </div>
  )
}
