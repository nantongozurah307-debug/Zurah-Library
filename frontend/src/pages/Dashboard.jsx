import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { 
  BookOpen, 
  Users, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renewMsg, setRenewMsg] = useState({ type: '', text: '' });

  const isDark = theme === 'dark';
  
  // Adaptive chart styles
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const tooltipTextColor = isDark ? '#f8fafc' : '#0f172a';
  const primaryChartColor = '#6366f1'; // Electric Indigo (primary-500)

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get dashboard metrics
      const statsRes = await api.get('/analytics/dashboard');
      setStats(statsRes.data);
      
      // Get loans
      const loansRes = await api.get('/circulation/loans?status=active');
      setActiveLoans(loansRes.data.loans);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRenew = async (loanId) => {
    setRenewMsg({ type: '', text: '' });
    try {
      const res = await api.post(`/circulation/renew/${loanId}`);
      setRenewMsg({ type: 'success', text: res.data.message });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      setRenewMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to renew book.' 
      });
    }
  };

  const handleReturn = async (loanId) => {
    setRenewMsg({ type: '', text: '' });
    try {
      const res = await api.post(`/circulation/return/${loanId}`);
      setRenewMsg({ type: 'success', text: 'Book returned successfully!' });
      fetchDashboardData();
    } catch (err) {
      setRenewMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to return book.' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-danger-500/20 text-danger-400 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="mt-4 btn-primary text-xs">Retry</button>
      </div>
    );
  }

  // 1. LIBRARIAN VIEW
  if (isAdmin) {
    const summary = stats?.summary || {};
    const borrowTrends = stats?.borrow_trends || [];
    const popularBooks = stats?.popular_books || [];
    const statusDistribution = stats?.status_distribution || [];
    const genreDistribution = stats?.genre_distribution || [];

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Library Control Panel</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time circulation overview and system metrics</p>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20 text-primary-600 dark:text-primary-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Catalog</span>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.total_books}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Members</span>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.total_members}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-accent-500/10 rounded-xl border border-accent-500/20 text-accent-600 dark:text-accent-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Loans</span>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.active_loans}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 relative">
            <div className={`p-3 rounded-xl border ${
              summary.overdue_loans > 0 
                ? 'bg-danger-500/15 border-danger-500/30 text-danger-600 dark:text-danger-400 overdue-pulse' 
                : 'bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400'
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overdue Loans</span>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.overdue_loans}</h3>
            </div>
          </div>
        </div>

        {/* Fines and Collections Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-danger-500">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Outstanding Unpaid Fines</span>
                <h3 className="text-3xl font-extrabold text-danger-600 dark:text-danger-400 mt-1">{summary.outstanding_fines ? summary.outstanding_fines.toLocaleString() : 0} UGX</h3>
              </div>
              <DollarSign className="h-10 w-10 text-danger-500/20" />
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-accent-500">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Fines Paid / Collected</span>
                <h3 className="text-3xl font-extrabold text-accent-600 dark:text-accent-400 mt-1">{summary.fines_collected ? summary.fines_collected.toLocaleString() : 0} UGX</h3>
              </div>
              <DollarSign className="h-10 w-10 text-accent-500/20" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Borrowing Trend Line Chart */}
          <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                Borrowing Activities (Last 6 Months)
              </h4>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={borrowTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={axisColor} fontSize={12} />
                  <YAxis stroke={axisColor} fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
                    labelStyle={{ color: axisColor }}
                    itemStyle={{ color: tooltipTextColor }}
                  />
                  <Line type="monotone" dataKey="borrows" stroke={primaryChartColor} strokeWidth={3} dot={{ fill: primaryChartColor, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Borrow Status Distribution */}
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              Active Borrow Statuses
            </h4>
            <div className="h-60 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
                    itemStyle={{ color: tooltipTextColor }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Total Active</span>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{summary.active_loans}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs mt-2">
              {statusDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-500 dark:text-slate-400">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Borrowed Books Bar Chart */}
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Most Borrowed Books (Top 5)
            </h4>
            {popularBooks.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularBooks} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" stroke={axisColor} fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="title" type="category" stroke={axisColor} fontSize={10} width={120} />
                    <Tooltip 
                      contentStyle={{ background: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
                      itemStyle={{ color: tooltipTextColor }}
                    />
                    <Bar dataKey="borrows" fill={primaryChartColor} radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-20">No borrowing records available.</p>
            )}
          </div>

          {/* Genre Distribution */}
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              Books Genre Distribution
            </h4>
            {genreDistribution.length > 0 ? (
              <div className="h-64 flex items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genreDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="value"
                      >
                        {genreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
                        itemStyle={{ color: tooltipTextColor }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2 overflow-y-auto max-h-56 pr-2">
                  {genreDistribution.map((item, idx) => (
                    <div key={item.genre} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.genre}</span>
                      </div>
                      <span className="font-bold text-slate-500 dark:text-slate-400">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-20">No catalog books found.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. MEMBER VIEW
  const summary = stats?.summary || {};
  const borrowTrends = stats?.borrow_trends || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Welcome Back, {user?.username}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your active loans and search catalog books</p>
        </div>
        <Link to="/books" className="btn-primary flex items-center gap-2 self-start md:self-auto text-sm">
          Browse Library Catalog
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {renewMsg.text && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          renewMsg.type === 'success' 
            ? 'bg-accent-500/10 border-accent-500/20 text-accent-600 dark:text-accent-300'
            : 'bg-danger-500/10 border-danger-500/20 text-danger-600 dark:text-danger-400'
        }`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{renewMsg.text}</span>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20 text-primary-600 dark:text-primary-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Currently Borrowed</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.active_loans}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-accent-500/10 rounded-xl border border-accent-500/20 text-accent-600 dark:text-accent-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Reads</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.total_borrows}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${
            summary.overdue_loans > 0 
              ? 'bg-danger-500/15 border-danger-500/30 text-danger-600 dark:text-danger-400 overdue-pulse' 
              : 'bg-slate-500/10 border-slate-500/20 text-slate-500 dark:text-slate-400'
          }`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overdue Books</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{summary.overdue_loans}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-danger-500">
          <div className="p-3 bg-danger-500/10 rounded-xl border border-danger-500/20 text-danger-600 dark:text-danger-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Outstanding Fines</span>
            <h3 className="text-2xl font-bold text-danger-600 dark:text-danger-400 mt-1">{summary.outstanding_fines ? summary.outstanding_fines.toLocaleString() : 0} UGX</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Active Borrowings & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-500 dark:text-primary-400" />
              Active Borrowings
            </h3>
            {activeLoans.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-white/5">
                {activeLoans.map((loan) => {
                  const isOverdue = loan.status === 'overdue';
                  const fine = loan.fine;
                  return (
                    <div key={loan.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex gap-4">
                        <img 
                          src={loan.book.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=120'} 
                          alt={loan.book.title} 
                          className="h-16 w-12 object-cover rounded bg-slate-100 dark:bg-slate-800"
                        />
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{loan.book.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">by {loan.book.author}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isOverdue ? 'bg-danger-500/10 text-danger-600 dark:bg-danger-500/20 dark:text-danger-300 border border-danger-500/20 dark:border-danger-500/30' : 'bg-primary-500/10 text-primary-600 dark:text-primary-300'
                            }`}>
                              Due: {loan.due_date}
                            </span>
                            {fine && fine.amount > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-danger-500/10 text-danger-600 dark:bg-danger-500/20 dark:text-danger-400">
                                Fine: {fine.amount.toLocaleString()} UGX
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRenew(loan.id)}
                          disabled={loan.renew_count >= 2 || isOverdue}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={loan.renew_count >= 2 ? "Max renewals reached" : isOverdue ? "Cannot renew overdue" : "Extend loan by 14 days"}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Renew ({loan.renew_count}/2)
                        </button>
                        
                        {/* simulated return kiosk button */}
                        <button
                          onClick={() => handleReturn(loan.id)}
                          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white border-0 shadow-sm"
                        >
                          Check In (Self)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                You are not currently borrowing any books.
                <div className="mt-4">
                  <Link to="/books" className="btn-primary text-xs">Explore Catalog</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Personal Stats & Trends */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500 dark:text-primary-400" />
              Reading Trends
            </h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={borrowTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={axisColor} fontSize={11} />
                  <YAxis stroke={axisColor} fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: tooltipBg, borderColor: tooltipBorder, borderRadius: 8 }}
                    labelStyle={{ color: axisColor }}
                    itemStyle={{ color: tooltipTextColor }}
                  />
                  <Line type="monotone" dataKey="borrows" stroke={primaryChartColor} strokeWidth={2} dot={{ fill: primaryChartColor, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-4 text-center">Books borrowed per month in the last 6 months.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
