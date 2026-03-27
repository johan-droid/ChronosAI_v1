import { useNavigate } from 'react-router-dom';
import LandingPage3D from './LandingPage3D';

export default function PortalSelection() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <div className="absolute inset-0">
                <LandingPage3D />
            </div>

            <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl bg-white/70 shadow-xl border border-gray-100 p-6 sm:p-8 backdrop-blur-sm">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center">ChronosAI</h1>
                    <p className="mt-2 text-sm text-gray-700 text-center">Choose your experience and start scheduling instantly in a 3D-powered interface.</p>

                    <div className="mt-8 space-y-4">
                        <button
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold shadow hover:bg-blue-700 transition"
                            onClick={() => navigate('/login')}
                        >
                            User Portal
                        </button>
                        <button
                            className="w-full rounded-lg border border-blue-400 px-4 py-3 text-blue-700 font-semibold bg-white hover:bg-blue-50 transition"
                            onClick={() => window.open('http://localhost:5174', '_blank')}
                        >
                            Organization Portal
                        </button>
                    </div>

                    <div className="mt-6 text-xs text-gray-500 text-center">
                        (Organization UI runs at 5174; user app runs at 5173)
                    </div>
                </div>
            </div>
        </div>
    );
}
