import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function AdminLayout({ children }) {
    const location = useLocation();
    const { logout } = useContext(AuthContext);
    const isActive = (path) => location.pathname === path;

    return (
        <div className="org-dashboard-outer">
            <aside className="org-sidebar">
                <div className="header">
                    ChronosAI Org
                </div>
                <nav>

                    <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}><LayoutDashboard size={20} />Dashboard</Link>
                    <Link to="/users" className={isActive('/users') ? 'active' : ''}><Users size={20} />Team Members</Link>
                    <Link to="/meetings" className={isActive('/meetings') ? 'active' : ''}><Calendar size={20} />All Meetings</Link>
                    <Link to="/settings" className={isActive('/settings') ? 'active' : ''}><Settings size={20} />Org Settings</Link>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>
            <main className="org-main">
                <header>
                    <h2>{location.pathname === '/dashboard' ? 'Overview' : location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2)}</h2>
                    <div className="user-pill">AD</div>
                </header>
                <div className="content">{children}</div>
            </main>
        </div>
    );
}
