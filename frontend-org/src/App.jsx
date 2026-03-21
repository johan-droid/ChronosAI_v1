import { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import { AuthContext } from './context/AuthContext';
import './App.css';

function AdminLogin() {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="org-login-screen">
            <form onSubmit={handleSubmit} className="org-login-card">
                <h1>ChronosAI Org Login</h1>
                <p>Welcome back! Please sign in to continue.</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" />
                {error && <p className="error">{error}</p>}
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
}

function PlaceholderPage({ title }) {
    return <div className="text-slate-500">The {title} feature is currently under construction.</div>;
}

function ProtectedRoute({ children }) {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<AdminLogin />} />

                <Route path="/dashboard" element={<ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><AdminLayout><PlaceholderPage title="Team Members" /></AdminLayout></ProtectedRoute>} />
                <Route path="/meetings" element={<ProtectedRoute><AdminLayout><PlaceholderPage title="All Meetings" /></AdminLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AdminLayout><PlaceholderPage title="Org Settings" /></AdminLayout></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}
