import React, { act } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChronosLayout from '../components/ChronosDashboard/Layout'
import ChatInterface from '../components/ChronosDashboard/ChatInterface'
import CalendarView from '../components/ChronosDashboard/CalendarView'

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('ChronosDashboard components', () => {
  beforeAll(() => {
    vi.useFakeTimers('modern')
    vi.setSystemTime(new Date('2026-03-27T12:00:00Z'))
  })

  afterAll(() => vi.useRealTimers())

  test('Layout updates selected date and shows meeting details panel', () => {
    render(<ChronosLayout />)

    const meetingDateCell = screen.getAllByText('27').find((el) => el.closest('.day'))
    fireEvent.click(meetingDateCell)

    expect(screen.getByText(/Meetings on/)).toBeInTheDocument()
    expect(screen.getByText(/Team Standup/i)).toBeInTheDocument()
  })

  test('ChatInterface disables input and send while typing then re-enables', async () => {
    const onSend = vi.fn()
    const { rerender } = render(<ChatInterface messages={[]} onSend={onSend} typing />)

    const sendBtn = screen.getByRole('button', { name: /typing/i })
    const input = screen.getByLabelText('Message input')

    expect(sendBtn).toBeDisabled()
    expect(input).toBeDisabled()

    rerender(<ChatInterface messages={[]} onSend={onSend} typing={false} />)

    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
    expect(screen.getByLabelText('Message input')).not.toBeDisabled()
  })

  test('CalendarView highlight classes and navigation functionality', () => {
    const meetings = [{ id: 'm1', date: '2026-03-27', title: 'Test', time: '10:00', duration: '30m', participants: ['A'], link: '#' }]
    render(<CalendarView meetings={meetings} onDateClick={() => {}} selectedDate={null} />)

    expect(document.querySelector('.today')).toBeInTheDocument()
    expect(document.querySelector('.sunday')).toBeInTheDocument()
    expect(document.querySelector('.has-meeting')).toBeInTheDocument()

    const nextBtn = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextBtn)
    expect(screen.getByText(/April 2026/i)).toBeInTheDocument()

    const prevBtn = screen.getByRole('button', { name: /prev/i })
    fireEvent.click(prevBtn)
    fireEvent.click(prevBtn)
    expect(screen.getByText(/February 2026/i)).toBeInTheDocument()
  })
})
