import { useState, useEffect } from 'react';
import { Users, CalendarCheck, Zap } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, meetingsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/meetings'),
                ]);
                setUsers(usersRes.data || []);
                setMeetings(meetingsRes.data || []);
            } catch (err) {
                console.error('Dashboard data fetch failed', err);
                setError('Unable to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = [
        { title: 'Total Team Members', value: users.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Meetings Scheduled', value: meetings.length.toString(), icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { title: 'Hours Saved by AI', value: '37', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Recent Organization Activity</h3>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
                            <th className="px-6 py-3 font-medium">User</th>
                            <th className="px-6 py-3 font-medium">Action</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                        {loading && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4">Loading activity...</td>
                            </tr>
                        )}
                        {error && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-red-500">{error}</td>
                            </tr>
                        )}
                        {!loading && !error && meetings.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4">No recent activity found.</td>
                            </tr>
                        )}
                        {!loading && !error && meetings.slice(0,5).map((meeting) => (
                            <tr key={meeting._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-800 font-medium">{meeting.organizer}</td>
                                <td className="px-6 py-4 text-slate-600">{meeting.title || 'Meeting'}</td>
                                <td className="px-6 py-4 text-slate-500">{meeting.date}</td>
                                <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold">{meeting.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
