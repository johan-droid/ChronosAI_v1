import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
            <p className="mt-4 text-gray-600">Your AI Scheduling Dashboard is ready.</p>
            <button 
                onClick={logout} 
                className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Logout
            </button>
        </div>
    );
}