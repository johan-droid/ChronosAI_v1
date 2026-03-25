import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
    // Toggle between Login and Register modes
    const [isLogin, setIsLogin] = useState(true);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Auto-detect user's timezone!
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Handle input changes dynamically
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page reload
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin 
                ? { email: formData.email, password: formData.password }
                : formData;

            // Send request to our Node.js backend
            const response = await api.post(endpoint, payload);

            // Extract user data and token from the backend response
            const { token, ...userData } = response.data;

            // Save to our global AuthContext
            login(userData, token);

            // Redirect to the protected dashboard
            navigate('/dashboard');

        } catch (err) {
            // Display the error message sent from our Node.js controller
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
                
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-blue-600">ChronosAI</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        {isLogin ? 'Sign in to manage your meetings' : 'Create an account to get started'}
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input 
                                type="text" name="name" required={!isLogin}
                                value={formData.name} onChange={handleChange}
                                className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input 
                            type="email" name="email" required
                            value={formData.email} onChange={handleChange}
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input 
                            type="password" name="password" required
                            value={formData.password} onChange={handleChange}
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <button 
                        type="submit" disabled={loading}
                        className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="flex items-center justify-center gap-2 py-2">
                    <span className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400">or</span>
                    <span className="h-px flex-1 bg-gray-200" />
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        try {
                            setError('');
                            setGoogleLoading(true);
                            const response = await api.get('/auth/google-url');
                            window.location.href = response.data.url;
                        } catch (err) {
                            setError('Unable to start Google sign-in. Try again.');
                            setGoogleLoading(false);
                        }
                    }}
                    disabled={googleLoading}
                    className="w-full px-4 py-2 font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none transition-colors"
                >
                    {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
                </button>

                <div className="text-center">
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}