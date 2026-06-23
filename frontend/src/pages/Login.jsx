import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Library, AlertCircle, Shield, User, Sun, Moon } from 'lucide-react';

const Login = () => {
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
    if (searchParams.get('expired') === 'true') {
      setExpiredMsg(true);
    }
  }, [user, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExpiredMsg(false);
    setLoading(true);

    const res = await login(usernameOrEmail, password);
    setLoading(false);
    
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setExpiredMsg(false);
    setLoading(true);
    
    const credentials = role === 'librarian' 
      ? { username: 'librarian1', pass: 'password' }
      : { username: 'sarah_jones', pass: 'password' };
      
    const res = await login(credentials.username, credentials.pass);
    setLoading(false);
    
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-200">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 shadow-xl dark:shadow-none">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center mb-4 shadow-sm">
            <Library className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Welcome to Bibliotech</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to manage library rentals</p>
        </div>

        {expiredMsg && (
          <div className="mb-6 p-4 rounded-xl bg-primary-500/5 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Your session has expired. Please log in again.</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger-500/5 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 text-danger-700 dark:text-danger-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Username or Email</label>
            <input 
              type="text" 
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              placeholder="e.g. librarian1 or sarah_jones"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl btn-primary text-sm font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">Don't have an account? </span>
          <Link to="/register" className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold">Register</Link>
        </div>

        {/* Demo Fast Login Panel */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 text-center">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Quick Demo Logins</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => handleQuickLogin('librarian')}
              className="px-3.5 py-2 text-xs rounded-lg glass-panel hover:bg-slate-100 dark:hover:bg-white/[0.04] text-primary-600 dark:text-primary-300 flex items-center gap-1.5 border border-primary-200 dark:border-primary-500/10 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Librarian Role
            </button>
            <button 
              onClick={() => handleQuickLogin('member')}
              className="px-3.5 py-2 text-xs rounded-lg glass-panel hover:bg-slate-100 dark:hover:bg-white/[0.04] text-accent-600 dark:text-accent-300 flex items-center gap-1.5 border border-accent-200 dark:border-accent-500/10 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              Member Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
