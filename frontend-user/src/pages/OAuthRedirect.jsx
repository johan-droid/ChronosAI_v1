import { useEffect, useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function OAuthRedirect() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useContext(AuthContext);
    const [message, setMessage] = useState('Connecting to ChronosAI...');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setMessage('Missing token, redirecting to login...');
            setTimeout(() => navigate('/login', { replace: true }), 1300);
            return;
        }

        const satisfy = async () => {
            try {
                const response = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                login(response.data, token);
                navigate('/dashboard', { replace: true });
            } catch (err) {
                console.error('OAuth token login failed:', err);
                setMessage('Could not verify Google login. Redirecting to login...');
                setTimeout(() => navigate('/login', { replace: true }), 1800);
            }
        };

        satisfy();
    }, [searchParams, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm p-8 text-center bg-white rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Google sign-in</h2>
                <p className="mt-3 text-sm text-gray-600">{message}</p>
            </div>
        </div>
    );
}
