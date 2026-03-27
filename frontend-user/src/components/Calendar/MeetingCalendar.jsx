import { useState, useEffect, useCallback, useContext } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import default calendar styles
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function MeetingCalendar() {
    const [date, setDate] = useState(new Date());
    const [meetings, setMeetings] = useState([]);
    const [selectedDayMeetings, setSelectedDayMeetings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        duration: 30,
        participants: ''
    });
    const [availability, setAvailability] = useState(null);
    const [activeJitsiRoom, setActiveJitsiRoom] = useState(null);
    const [pendingRequests, setPendingRequests] = useState({});
    const [approvedRequests, setApprovedRequests] = useState({});

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

            if (user?.email) {
                const pendingStates = {};
                for (const m of response.data) {
                    if (m.organizerEmail === user.email && m.waitingRoomEnabled) {
                        try {
                            const pendingResp = await api.get(`/meetings/${m._id}/pending-requests`);
                            pendingStates[m._id] = pendingResp.data.pendingRequests || [];
                        } catch (pendingError) {
                            console.error('Failed to load pending requests for meeting', m._id, pendingError);
                        }
                    }
                }
                setPendingRequests(pendingStates);
            }

        } catch (error) {
            console.error('Failed to refresh meetings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkAvailability = async () => {
        try {
            setAvailability(null);
            const participants = form.participants.split(',').map(p => p.trim()).filter(Boolean);
            const response = await api.post('/meetings/availability', {
                date: form.date,
                time: form.time,
                duration: form.duration,
                participants
            });
            setAvailability(response.data);
            if (!response.data.available) {
                alert('Conflict: ' + (response.data.conflictWith?.title || 'Conflict detected.'));
            } else {
                alert('Slot is available.');
            }
        } catch (error) {
            console.error('Availability check failed:', error);
            alert('Unable to check availability.');
        }
    };

    const scheduleMeeting = async () => {
        try {
            const participants = form.participants.split(',').map(p => p.trim()).filter(Boolean);
            if (!participants.length) {
                alert('Add at least one participant email.');
                return;
            }

            const response = await api.post('/meetings', {
                title: form.title || `Meeting with ${participants.join(', ')}`,
                date: form.date,
                time: form.time,
                duration: form.duration,
                participants
            });

            alert('Meeting scheduled!');
            setForm({ ...form, title: '', participants: '' });
            await refreshMeetings();
            setAvailability(null);
        } catch (error) {
            console.error('Schedule failed:', error);
            const message = error.response?.data?.message || 'Unable to schedule meeting.';
            alert(message);
        }
    };

    const requestJoinMeeting = async (meeting) => {
        if (!user?.email) {
            alert('Please sign in to request access.');
            return;
        }

        try {
            const response = await api.post(`/meetings/${meeting._id}/request-access`);
            if (!response.data.message) {
                alert('Failed to send request.');
                return;
            }

            if (!meeting.waitingRoomEnabled) {
                await getJoinTokenAndNavigate(meeting);
                return;
            }

            // Refresh pending requests from server for organizer and user experience.
            if (meeting.organizerEmail === user.email) {
                const pending = await api.get(`/meetings/${meeting._id}/pending-requests`);
                setPendingRequests(prev => ({ ...prev, [meeting._id]: pending.data.pendingRequests }));
            }

            alert(response.data.message);
        } catch (error) {
            console.error('Request user entrance error:', error);
            alert(error.response?.data?.message || 'Unable to request entry.');
        }
    };

    const approveRequest = async (meeting, participantEmail) => {
        try {
            const response = await api.post(`/meetings/${meeting._id}/approve-access`, { email: participantEmail });
            setPendingRequests(prev => ({
                ...prev,
                [meeting._id]: response.data.pendingRequests
            }));
            setApprovedRequests(prev => ({
                ...prev,
                [meeting._id]: [...new Set([...(prev[meeting._id] || []), participantEmail])]
            }));
        } catch (error) {
            console.error('Approve request failed:', error);
            alert(error.response?.data?.message || 'Unable to approve request.');
        }
    };

    const declineRequest = async (meeting, participantEmail) => {
        try {
            const response = await api.post(`/meetings/${meeting._id}/decline-access`, { email: participantEmail });
            setPendingRequests(prev => ({
                ...prev,
                [meeting._id]: response.data.pendingRequests
            }));
        } catch (error) {
            console.error('Decline request failed:', error);
            alert(error.response?.data?.message || 'Unable to decline request.');
        }
    };

    const getJoinTokenAndNavigate = async (meeting) => {
        try {
            const tokenRes = await api.get(`/meetings/${meeting._id}/join-token`);
            const token = tokenRes.data.token;
            const room = meeting.meetingRoom;
            navigate(`/jitsi/${room}?token=${token}&meetingId=${meeting._id}`);
        } catch (error) {
            console.error('Token retrieval failed:', error);
            alert(error.response?.data?.message || 'Unable to get join token.');
        }
    };

    const joinMeeting = async (meeting) => {
        if (!meeting.meetingRoom) {
            alert('No meeting room specified.');
            return;
        }

        const isOrganizer = user?.email === meeting.organizerEmail;
        const isApproved = (approvedRequests[meeting._id] || []).includes(user?.email);
        const isRequested = (pendingRequests[meeting._id] || []).includes(user?.email);

        if (meeting.waitingRoomEnabled && !isOrganizer && !isApproved) {
            if (!isRequested) {
                await requestJoinMeeting(meeting);
            } else {
                alert('Waiting room request pending.');
            }
            return;
        }

        await getJoinTokenAndNavigate(meeting);
    };

    const copyMeetingLink = async (meeting) => {
        try {
            await navigator.clipboard.writeText(meeting.meetingLink || '');
            alert('Meeting link copied to clipboard.');
        } catch (error) {
            console.error('Copy failed', error);
            alert('Unable to copy link.');
        }
    };

    const toggleWaitingRoom = (meetingId) => {
        setMeetings(prev => prev.map(m => m._id === meetingId ? { ...m, waitingRoomEnabled: !m.waitingRoomEnabled } : m));
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
            
            {/* Left Side: The Interactive Calendar + Schedule Form */}
            <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Schedule</h2>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <h3 className="font-semibold mb-2 text-gray-700">Quick Schedule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            value={form.title}
                            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Meeting Title"
                            className="border px-3 py-2 rounded-md w-full"
                        />
                        <input
                            value={form.date}
                            onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                            type="date"
                            className="border px-3 py-2 rounded-md w-full"
                        />
                        <input
                            value={form.time}
                            onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))}
                            type="time"
                            className="border px-3 py-2 rounded-md w-full"
                        />
                        <input
                            value={form.duration}
                            onChange={(e) => setForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                            type="number"
                            min={1}
                            max={720}
                            placeholder="Duration (minutes)"
                            className="border px-3 py-2 rounded-md w-full"
                        />
                        <textarea
                            value={form.participants}
                            onChange={(e) => setForm(prev => ({ ...prev, participants: e.target.value }))}
                            placeholder="Participants (comma-separated emails)"
                            className="border px-3 py-2 rounded-md w-full col-span-1 md:col-span-2"
                        />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={checkAvailability} className="bg-blue-500 text-white px-3 py-2 rounded-md">Check Availability</button>
                        <button onClick={scheduleMeeting} className="bg-green-500 text-white px-3 py-2 rounded-md">Schedule Meeting</button>
                        {availability && (
                            <span className={`px-2 py-1 rounded-md ${availability.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {availability.available ? 'Slot available' : 'Conflict detected'}
                            </span>
                        )}
                    </div>
                </div>

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
                {activeJitsiRoom && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Video Meeting: {activeJitsiRoom}</h4>
                            <button onClick={() => setActiveJitsiRoom(null)} className="text-xs px-2 py-1 bg-gray-200 rounded">Close</button>
                        </div>
                        <iframe
                            title="Jitsi Meeting"
                            src={`https://meet.jit.si/${activeJitsiRoom}#config.startWithAudioMuted=true&config.startWithVideoMuted=true`}
                            style={{ width: '100%', height: '320px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            allow="camera; microphone; fullscreen; display-capture"
                        />
                    </div>
                )}
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
                                        🔐 Password: {meeting.meetingPassword || 'None'}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        🌐 {meeting.timezone}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        🔗 Link: <button onClick={() => copyMeetingLink(meeting)} className="text-blue-600 underline">Copy meeting link</button>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        🎧 Waiting Room: {meeting.waitingRoomEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
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
                                    <button
                                        onClick={() => joinMeeting(meeting)}
                                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                                    >
                                        Join Video
                                    </button>
                                    <button
                                        onClick={() => toggleWaitingRoom(meeting._id)}
                                        className="text-xs px-2 py-1 bg-purple-200 text-purple-900 rounded-md hover:bg-purple-300 transition"
                                    >
                                        {meeting.waitingRoomEnabled ? 'Disable' : 'Enable'} Waiting Room
                                    </button>
                                </div>
                                {meeting.waitingRoomEnabled && user?.email === meeting.organizerEmail && (
                                    <div className="mt-3 p-2 bg-gray-100 rounded border border-gray-200">
                                        <h5 className="text-xs font-semibold text-gray-700">Pending requests</h5>
                                        { (pendingRequests[meeting._id] || []).length === 0 ? (
                                            <p className="text-xs text-gray-600">No requests yet.</p>
                                        ) : (
                                            (pendingRequests[meeting._id] || []).map(email => (
                                                <div key={email} className="flex justify-between items-center gap-2 mt-1">
                                                    <span className="text-xs">{email}</span>
                                                    <div className="flex gap-1">
                                                        <button className="text-green-700 text-xs px-1 rounded bg-green-100" onClick={() => approveRequest(meeting, email)}>Approve</button>
                                                        <button className="text-red-700 text-xs px-1 rounded bg-red-100" onClick={() => declineRequest(meeting, email)}>Decline</button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
