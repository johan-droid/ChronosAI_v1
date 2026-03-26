import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function JitsiRoom() {
    const { room } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const meetingId = searchParams.get('meetingId');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const validate = async () => {
            if (!meetingId || !token) {
                setError('Missing meeting ID or token.');
                return;
            }
            try {
                await api.post(`/meetings/${meetingId}/validate-token`, { token });
            } catch (err) {
                setError(err.response?.data?.message || 'Invalid or expired token.');
            }
        };
        validate();
    }, [meetingId, token]);

    const iframeUrl = `https://meet.jit.si/${room}?jwt=none#config.startWithAudioMuted=true&config.startWithVideoMuted=true${password ? `&config.password=${encodeURIComponent(password)}` : ''}`;

    if (error) {
        return (
            <div className="h-screen bg-gray-100 p-4 flex flex-col justify-center items-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-blue-500 text-white rounded">Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-100 p-4">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Jitsi Room: {room}</h2>
                <button onClick={() => navigate('/dashboard')} className="px-3 py-1 bg-blue-500 text-white rounded">Back to Dashboard</button>
            </div>

            <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                    <label className="font-medium">Room Password (optional):</label>
                    <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter room password"
                        className="border rounded px-2 py-1 w-full"
                    />
                </div>
            </div>

            <div className="rounded-lg overflow-hidden shadow-xl" style={{ height: 'calc(100vh - 160px)' }}>
                <iframe
                    title="Jitsi Room"
                    src={iframeUrl}
                    allow="camera; microphone; fullscreen; display-capture"
                    style={{ width: '100%', height: '100%', border: 0 }}
                />
            </div>
        </div>
    );
}
