import { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import default calendar styles
import api from '../../services/api';

export default function MeetingCalendar() {
    const [date, setDate] = useState(new Date());
    const [meetings, setMeetings] = useState([]);
    const [selectedDayMeetings, setSelectedDayMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to format a JS Date object into "YYYY-MM-DD" to match our MongoDB string format
    const formatDateString = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Filter the meetings array for the specifically clicked date
    const filterMeetingsForDate = useCallback((selectedDate, allMeetings = meetings) => {
        const formattedDate = formatDateString(selectedDate);
        const filtered = allMeetings.filter(m => m.date === formattedDate);
        setSelectedDayMeetings(filtered);
    }, [meetings]);

    // Fetch meetings when the component loads
    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const response = await api.get('/meetings');
                setMeetings(response.data);
                
                // Set initial meetings for today's date
                filterMeetingsForDate(new Date(), response.data);
            } catch (error) {
                console.error("Failed to fetch meetings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMeetings();
    }, [filterMeetingsForDate]);

    // Handle clicking a day on the calendar
    const handleDayClick = (value) => {
        setDate(value);
        filterMeetingsForDate(value);
    };

    const refreshMeetings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/meetings');
            setMeetings(response.data);
            filterMeetingsForDate(date, response.data);
        } catch (error) {
            console.error('Failed to refresh meetings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const cancelMeeting = async (meetingId) => {
        try {
            await api.post(`/meetings/${meetingId}/cancel`);
            await refreshMeetings();
            alert('Meeting cancelled successfully.');
        } catch (error) {
            console.error('Cancel failed:', error);
            alert('Unable to cancel meeting.');
        }
    };

    const rescheduleMeeting = async (meeting) => {
        const date = prompt('New date (YYYY-MM-DD):', meeting.date);
        const time = prompt('New time (HH:MM or 3pm):', meeting.startTime);
        const duration = prompt('New duration (minutes):', meeting.duration);

        if (!date && !time && !duration) {
            return;
        }

        try {
            await api.post(`/meetings/${meeting._id}/reschedule`, { date, time, duration });
            await refreshMeetings();
            alert('Meeting rescheduled successfully.');
        } catch (error) {
            console.error('Reschedule failed:', error);
            alert('Unable to reschedule meeting.');
        }
    };

    // Dynamically inject Tailwind classes into specific calendar tiles
    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const formattedDate = formatDateString(date);
            const hasMeeting = meetings.some(m => m.date === formattedDate);
            
            let classes = "rounded-lg font-medium transition-all duration-200 ";
            
            if (hasMeeting) {
                // If the day has a meeting, give it a soft blue background
                classes += "bg-blue-100 text-blue-800 font-bold shadow-sm ";
            }
            
            // If it's Sunday, make the text red (as per your SDS requirement)
            if (date.getDay() === 0) {
                classes += "text-red-500 ";
            }
            
            return classes;
        }
        return null;
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading your calendar...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            
            {/* Left Side: The Interactive Calendar */}
            <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Schedule</h2>
                <div className="calendar-container shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                    <Calendar 
                        onChange={handleDayClick} 
                        value={date}
                        tileClassName={tileClassName}
                        className="w-full border-none p-4"
                    />
                </div>
            </div>

            {/* Right Side: Meeting Details for the Selected Day */}
            <div className="w-full lg:w-1/3 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                    Events for {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                
                {selectedDayMeetings.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No meetings scheduled for this day.</p>
                ) : (
                    <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
                        {selectedDayMeetings.map((meeting) => (
                            <div key={meeting._id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                                <h4 className="font-bold text-gray-800">{meeting.title}</h4>
                                <div className="mt-2 text-sm text-gray-600 flex flex-col gap-1">
                                    <span className="flex items-center gap-2">
                                        🕒 {meeting.startTime} ({meeting.duration} mins)
                                    </span>
                                    <span className="flex items-center gap-2">
                                        👥 {meeting.participants.join(', ')}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        🌐 {meeting.timezone}
                                    </span>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => rescheduleMeeting(meeting)}
                                        className="text-xs px-2 py-1 bg-yellow-200 text-yellow-900 rounded-md hover:bg-yellow-300 transition"
                                    >
                                        Reschedule
                                    </button>
                                    <button
                                        onClick={() => cancelMeeting(meeting._id)}
                                        className="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-md hover:bg-red-300 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
