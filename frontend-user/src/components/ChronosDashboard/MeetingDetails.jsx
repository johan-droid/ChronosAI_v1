import React from 'react'

export default function MeetingDetails({ date, meetings = [] }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Meetings on {date}</div>

      {meetings.length === 0 && (
        <div className="meeting-card">No meetings scheduled for this date.</div>
      )}

      {meetings.map((m) => (
        <div key={m.id} className="meeting-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>{m.title}</div>
            <div style={{ color: '#6b7280' }}>{m.time}</div>
          </div>

          <div style={{ color: '#6b7280', marginBottom: 8 }}>Duration: {m.duration}</div>

          <div style={{ marginBottom: 8 }}>
            <strong>Participants:</strong>
            <div style={{ color: '#374151' }}>{m.participants.join(', ')}</div>
          </div>

          <div>
            <a href={m.link} target="_blank" rel="noreferrer">Join Meeting</a>
          </div>
        </div>
      ))}
    </div>
  )
}
