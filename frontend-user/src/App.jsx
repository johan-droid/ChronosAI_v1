import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import PortalSelection from './pages/PortalSelection';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OAuthRedirect from './pages/OAuthRedirect';

// The Frontend Bouncer: Protects routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<PortalSelection />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Route */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />

            {/* OAuth callback handler from Google */}
            <Route path="/oauth2/redirect" element={<OAuthRedirect />} />

            {/* Catch-all: Redirect unknown URLs to the dashboard (which will redirect to login if needed) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}