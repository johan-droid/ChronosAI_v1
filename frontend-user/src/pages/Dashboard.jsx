import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ChatInterface from '../components/ChatInterface/ChatInterface';
import MeetingCalendar from '../components/Calendar/MeetingCalendar'; // Add this line!

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold text-blue-600">ChronosAI</h1>
                <button 
                    onClick={logout} 
                    className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                    Sign Out
                </button>
            </nav>

            {/* Main Content Grid */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Chat Interface */}
                <div className="lg:col-span-1">
                    {user ? (
                        <ChatInterface />
                    ) : (
                        <div className="p-8 border border-dashed border-gray-300 rounded-xl bg-white text-gray-500">Loading chat interface...</div>
                    )}
                </div>

                {/* Right Column: Interactive Calendar */}
                <div className="lg:col-span-2">
                    <MeetingCalendar />
                </div>

            </main>
        </div>
    );
}