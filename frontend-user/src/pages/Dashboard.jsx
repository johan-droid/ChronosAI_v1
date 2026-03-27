import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ChronosLayout from '../components/ChronosDashboard/Layout';

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Please log in to see the dashboard.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">ChronosAI Dashboard</h1>
                <p className="text-sm text-gray-500 mb-4">Welcome {user.name || 'user'}. This view combines chatbot, calendar, and detail panel.</p>
                <ChronosLayout />
            </div>
        </div>
    );

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const res = await fetch('/meetings');
                const data = await res.json();
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);

                const meetingsToday = data.filter((meeting) => {
                    const date = new Date(meeting.date);
                    return date.toDateString() === today.toDateString();
                }).length;

                const meetingsNext7 = data.filter((meeting) => {
                    const date = new Date(meeting.date);
                    return date > today && date <= nextWeek;
                }).length;

                const futureMeetings = data.filter((meeting) => new Date(meeting.date) > today).length;

                setMeetingStats({ today: meetingsToday, next7: meetingsNext7, upcoming: futureMeetings });
            } catch (err) {
                console.error('Could not load meeting stats:', err);
            }
        };
        fetchMeetings();
    }, []);

    const StatTower = ({ x, height, color }) => {
        const meshRef = useRef();

        useFrame(({ clock }) => {
            if (!meshRef.current) return;
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.2;
            meshRef.current.scale.y = 0.7 + Math.sin(clock.getElapsedTime() + x) * 0.2 + height * 0.15;
        });

        return (
            <mesh ref={meshRef} position={[x, height * 0.35, 0]}>
                <boxGeometry args={[0.6, 1.6, 0.6]} />
                <meshStandardMaterial color={color} metalness={0.4} roughness={0.2} />
            </mesh>
        );
    };

    const MeetingStats3D = () => {
        const stats = useMemo(() => [meetingStats.today || 1, meetingStats.next7 || 2, meetingStats.upcoming || 3], [meetingStats]);

        return (
            <div className="h-64 md:h-72 rounded-2xl overflow-hidden border border-blue-100 shadow-sm bg-white">
                <Canvas camera={{ position: [0, 1.5, 5], fov: 45 }}>
                    <color attach="background" args={[0.95, 0.97, 1]} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[1.5, 4, 3]} intensity={0.9} />
                    <StatTower x={-1.2} height={stats[0]} color="#1d4ed8" />
                    <StatTower x={0} height={stats[1]} color="#059669" />
                    <StatTower x={1.2} height={stats[2]} color="#8b5cf6" />
                    <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                </Canvas>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold text-blue-600">ChronosAI</h1>
                    <p className="text-sm text-gray-500 mt-1">Smart scheduling assistant for teams</p>
                </div>
                <button 
                    onClick={logout} 
                    className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                >
                    Sign Out
                </button>
            </nav>

            {/* Main Content Grid */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick Actions + Highlights */}
                <section className="lg:col-span-3 bg-white border border-blue-100 rounded-2xl shadow-sm p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Hello{user?.name ? `, ${user.name}` : ''}</h2>
                            <p className="text-sm text-gray-500">Kick off scheduling with AI prompts, quick meeting creation, or calendar checks.</p>
                        </div>
                        <div className="inline-flex rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                            Tip: try "book 30m with Maria tomorrow at 4pm" in assistant chat
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { title: 'Meetings Today', value: meetingStats.today, color: 'bg-blue-50', valueColor: 'text-blue-700' },
                            { title: 'Next 7 Days', value: meetingStats.next7, color: 'bg-emerald-50', valueColor: 'text-emerald-700' },
                            { title: 'Upcoming', value: meetingStats.upcoming, color: 'bg-purple-50', valueColor: 'text-purple-700' },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: index * 0.1 }}
                                className={`p-3 rounded-xl border border-gray-200 ${item.color}`}
                            >
                                <h3 className="text-xs uppercase text-slate-500">{item.title}</h3>
                                <p className={`text-2xl font-bold ${item.valueColor}`}>{item.value}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 3D Stats Panel */}
                <section className="lg:col-span-3 bg-white border border-blue-100 rounded-2xl shadow-sm p-4 sm:p-5">
                    <h3 className="text-base font-semibold text-slate-800 mb-3">3D Meeting Insights</h3>
                    <MeetingStats3D />
                </section>

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