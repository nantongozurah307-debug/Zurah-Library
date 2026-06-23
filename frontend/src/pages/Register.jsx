import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Library, AlertCircle, Sun, Moon } from 'lucide-react';

const Register = () => {
  const { register, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    const res = await register(username, email, password, role);
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Create an Account</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Register for library circulation access</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger-500/5 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 text-danger-700 dark:text-danger-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              placeholder="username (no spaces)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              placeholder="name@example.com"
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
              placeholder="•••••••• (min 6 chars)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="member">Library Member (Borrower)</option>
              <option value="librarian">Librarian (Administrator)</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-xl btn-primary text-sm font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">Already have an account? </span>
          <Link to="/login" className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
