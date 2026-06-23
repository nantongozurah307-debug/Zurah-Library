import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  RefreshCw, 
  Users, 
  DollarSign, 
  LogOut, 
  Menu, 
  X,
  Library,
  Sun,
  Moon
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['member', 'librarian'] },
    { name: 'Books Inventory', path: '/books', icon: BookOpen, roles: ['member', 'librarian'] },
    { name: 'Circulation Portal', path: '/circulation', icon: RefreshCw, roles: ['librarian'] },
    { name: 'Members Directory', path: '/members', icon: Users, roles: ['librarian'] },
    { name: 'Fines & Payments', path: '/fines', icon: DollarSign, roles: ['member', 'librarian'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass-panel border-b border-slate-200 dark:border-white/5 z-50">
        <div className="flex items-center gap-3">
          <Library className="h-6 w-6 text-primary-500 dark:text-primary-400" />
          <span className="font-semibold text-lg tracking-wider text-slate-800 dark:text-slate-100 uppercase">Bibliotech</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-1"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-200 dark:border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Logo */}
        <div className="hidden md:flex items-center gap-3 px-8 py-8 border-b border-slate-200 dark:border-white/5">
          <Library className="h-8 w-8 text-primary-500 dark:text-primary-400" />
          <div>
            <span className="font-extrabold text-xl tracking-wider text-slate-800 dark:text-slate-100 uppercase">Bibliotech</span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase">Circulation Tracker</div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center font-bold text-slate-100 shadow-sm">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{user?.username}</h4>
              <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isAdmin ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20' : 'bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/10 border border-primary-500/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.03]'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle & Logout Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-1 bg-slate-50/30 dark:bg-white/[0.01]">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-all duration-200"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-5 w-5 text-slate-400" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-slate-500" />
                Dark Mode
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-500 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/5 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50/50 dark:bg-gradient-to-b dark:from-dark-900 dark:to-dark-950 p-6 md:p-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
