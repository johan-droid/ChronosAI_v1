function iso(d) {
  return d.toISOString().split('T')[0]
}

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)

const meetings = [
  {
    id: 'm-1',
    date: iso(today),
    title: 'Team Standup',
    time: '09:00 AM',
    duration: '15m',
    participants: ['Product', 'Eng'],
    link: 'https://meet.example/team-standup'
  },
  {
    id: 'm-2',
    date: iso(tomorrow),
    title: 'Sync with Product',
    time: '10:00 AM',
    duration: '30m',
    participants: ['Alice', 'Bob'],
    link: 'https://meet.example/sync'
  },
  {
    id: 'm-3',
    date: iso(dayAfter),
    title: 'Client Review',
    time: '02:00 PM',
    duration: '1h',
    participants: ['Client', 'PM'],
    link: 'https://meet.example/client'
  }
]

export default meetings
