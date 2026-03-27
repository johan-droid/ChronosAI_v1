import { useMemo, useState } from 'react'

function iso(d) {
  return d.toISOString().split('T')[0]
}

function monthName(d) {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

export default function CalendarView({ meetings = [], onDateClick, selectedDate }) {
  const [current, setCurrent] = useState(new Date())

  const days = useMemo(() => {
    const year = current.getFullYear()
    const month = current.getMonth()
    const start = new Date(year, month, 1)
    const startDay = start.getDay()
    const first = new Date(year, month, 1 - startDay)
    const list = []
    const d = new Date(first)
    for (let i = 0; i < 42; i++) {
      list.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }
    return list
  }, [current])

  function hasMeeting(date) {
    const key = iso(date)
    return meetings.some((m) => m.date === key)
  }

  const todayKey = iso(new Date())

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>{monthName(current)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>Prev</button>
          <button className="btn" onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>Next</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8, color: '#6b7280' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((h) => (
          <div key={h} style={{ textAlign: 'center', fontSize: 12 }}>{h}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((d) => {
          const key = iso(d)
          const isSunday = d.getDay() === 0
          const classes = ['day']
          if (isSunday) classes.push('sunday')
          if (hasMeeting(d)) classes.push('has-meeting')
          if (key === todayKey) classes.push('today')
          if (selectedDate === key) classes.push('selected')

          return (
            <div key={key} className={classes.join(' ')} onClick={() => onDateClick && onDateClick(key)}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
