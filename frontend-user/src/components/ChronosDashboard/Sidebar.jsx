import React from 'react'
import { Home, Calendar, Clock, User } from 'lucide-react'

function Item({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px' }}>
      <Icon size={18} />
      <div style={{ fontWeight: 600 }}>{label}</div>
    </div>
  )
}

export default function Sidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Chronos</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Item icon={Home} label="Dashboard" />
        <Item icon={Calendar} label="Calendar" />
        <Item icon={Clock} label="Meetings" />
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #f1f3f5' }}>
        <Item icon={User} label="Profile" />
      </div>
    </div>
  )
}
