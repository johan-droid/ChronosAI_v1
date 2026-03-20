import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// The Frontend Bouncer: Protects routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    
    // If no user is logged in, redirect them to the login page immediately
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    // Otherwise, let them through
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Route */}
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