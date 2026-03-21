/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the Context
export const AuthContext = createContext();

// Create the Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // Prevents rendering until we check localStorage

    // Run once when the app loads
    useEffect(() => {
        try {
            // Check if a user session exists in the browser's local storage
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');

            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
                // Automatically attach the token to all future Axios requests!
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (error) {
            // LocalStorage can throw in restricted environments; avoid locking the app in white-screen
            console.error('AuthContext error reading localStorage:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};