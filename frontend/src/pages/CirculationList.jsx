import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  RefreshCw, 
  Search, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  BookMarked,
  UserCheck,
  User,
  Info,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, renderOption }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id.toString() === value?.toString());
  
  const filtered = options.filter(o => 
    renderOption(o).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="w-full px-4 py-3 rounded-xl glass-input flex justify-between items-center cursor-pointer border border-slate-200 dark:border-white/10"
        onClick={() => { setOpen(!open); setSearch(''); }}
      >
        <span className={selectedOption ? 'text-slate-800 dark:text-slate-200 truncate font-medium' : 'text-slate-400 dark:text-slate-400'}>
          {selectedOption ? renderOption(selectedOption) : placeholder}
        </span>
      </div>
      
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-200 dark:border-white/10">
            <input 
              type="text" 
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-primary-500 transition-colors"
              placeholder="Type to search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.map(opt => (
              <div 
                key={opt.id}
                className={`p-3 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-sm transition-colors ${
                  value?.toString() === opt.id.toString() ? 'bg-primary-500/10 text-primary-600 dark:text-primary-300' : 'text-slate-700 dark:text-slate-400'
                }`}
                onClick={() => { onChange(opt.id); setOpen(false); }}
              >
                {renderOption(opt)}
              </div>
            ))}
            {filtered.length === 0 && <div className="p-4 text-sm text-slate-500 text-center">No matches found</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const CirculationList = () => {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout form state
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/circulation/loans`, {
        params: {
          status: activeTab,
          page: page,
          per_page: 10,
          search: searchQuery
        }
      });
      setLoans(res.data.loans);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch circulation records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const membersRes = await api.get('/analytics/members');
      setMembers(membersRes.data.members || []);
      
      const booksRes = await api.get('/books?available_only=true');
      setBooks(booksRes.data.books || []);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  // Fetch loans when tab, page, or search query changes
  useEffect(() => {
    fetchLoans();
  }, [activeTab, page, searchQuery]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Initial load for dropdowns
  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  };
  
  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedBookId || !selectedUserId) {
      setError('Please select a member and a book.');
      return;
    }
    
    setSubmitLoading(true);
    try {
      const res = await api.post('/circulation/borrow', {
        book_id: parseInt(selectedBookId),
        user_id: parseInt(selectedUserId)
      });
      setSuccess(res.data.message);
      setSelectedBookId('');
      setSelectedUserId('');
      fetchLoans();
      fetchDropdownData(); // refresh books and members counts
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete checkout.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCheckIn = async (loanId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/circulation/return/${loanId}`);
      setSuccess(res.data.message);
      fetchLoans();
      fetchDropdownData();
    } catch (err) {
      setError(err.response?.data?.error || 'Check-in failed.');
    }
  };

  const handleRenewOverride = async (loanId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/circulation/renew/${loanId}`);
      setSuccess(res.data.message);
      fetchLoans();
    } catch (err) {
      setError(err.response?.data?.error || 'Renewal failed.');
    }
  };

  // Dynamic calculations for preview
  const selectedMember = members.find(m => m.id.toString() === selectedUserId?.toString());
  const expectedDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Circulation Portal</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage check-outs, returns, and renewal overrides</p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-600 dark:text-accent-300 text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-600 dark:text-danger-400 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Check-Out Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-4">
            <BookMarked className="h-5 w-5 text-primary-500 dark:text-primary-400" />
            Check-Out Desk
          </h3>
          
          <form onSubmit={handleCheckoutSubmit} className="space-y-5 text-sm">
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Library Member</label>
                {selectedMember?.outstanding_fines > 0 && (
                  <span className="text-[10px] font-bold text-danger-600 dark:text-danger-400 bg-danger-500/10 dark:bg-danger-400/10 px-2 py-0.5 rounded-full border border-danger-500/20 dark:border-danger-400/20">
                    Fines: {selectedMember.outstanding_fines.toLocaleString()} UGX
                  </span>
                )}
              </div>
              <SearchableSelect
                options={members}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="-- Search Member --"
                renderOption={(m) => `${m.username} (Active: ${m.active_loans_count})`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Catalog Book</label>
              <SearchableSelect
                options={books}
                value={selectedBookId}
                onChange={setSelectedBookId}
                placeholder="-- Search Available Book --"
                renderOption={(b) => `${b.title} (${b.author})`}
              />
              
              {selectedBookId && (
                <div className="mt-3 px-3 py-2 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                  <span className="text-xs text-primary-600 dark:text-primary-200">
                    Expected Due Date: <strong className="text-primary-600 dark:text-primary-400">{expectedDueDate}</strong>
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitLoading || !selectedUserId || !selectedBookId}
              className="w-full py-3 mt-2 rounded-xl btn-primary text-xs font-semibold flex justify-center items-center gap-2 disabled:opacity-50 transition-all"
            >
              <UserCheck className="h-4 w-4" />
              {submitLoading ? 'Registering...' : 'Complete Checkout'}
            </button>
          </form>
          
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary-500 dark:text-primary-400 shrink-0 mt-0.5" />
              <p>Checkouts grant a standard 14-day borrowing period. Users cannot exceed 5 active loans or have over 20,000 UGX in unpaid fines.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Circulation Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-2">
            <div className="flex">
              {[
                { id: 'active', name: 'Active Loans', icon: Clock },
                { id: 'overdue', name: 'Overdue Flags', icon: AlertTriangle },
                { id: 'returned', name: 'Return History', icon: CheckCircle }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all relative top-[3px]
                      ${activeTab === tab.id 
                        ? 'border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64 flex items-center mb-1">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-400 absolute left-3" />
              <input 
                type="text"
                placeholder="Search by book or user..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full py-2 pl-9 pr-8 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
              />
              {searchQuery && (
                <button type="button" onClick={clearSearch} className="absolute right-3 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              )}
            </form>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
            </div>
          ) : loans.length > 0 ? (
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Book Details</th>
                        <th className="px-6 py-4">Borrower</th>
                        <th className="px-6 py-4">Dates</th>
                        <th className="px-6 py-4">Fine Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {loans.map(loan => {
                        const isOverdue = loan.status === 'overdue';
                        return (
                          <tr key={loan.id} className="hover:bg-slate-100/40 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{loan.book.title}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">ISBN: {loan.book.isbn}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <User className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                {loan.user.username}
                              </div>
                            </td>
                            <td className="px-6 py-4 space-y-1">
                              <div className="text-slate-500 dark:text-slate-400">Out: <span className="text-slate-700 dark:text-slate-200 font-medium">{loan.borrow_date}</span></div>
                              <div className="text-slate-500 dark:text-slate-400">
                                {loan.return_date ? (
                                  <>In: <span className="text-slate-700 dark:text-slate-200 font-medium">{loan.return_date}</span></>
                                ) : (
                                  <>Due: <span className={isOverdue ? 'text-danger-600 dark:text-danger-400 font-bold' : 'text-slate-700 dark:text-slate-200'}>{loan.due_date}</span></>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {loan.fine ? (
                                <span className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                                  loan.fine.status === 'pending' 
                                    ? 'bg-danger-500/10 text-danger-600 dark:text-danger-400 border border-danger-500/20' 
                                    : 'bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20'
                                  }`}>
                                  {loan.fine.amount.toLocaleString()} UGX ({loan.fine.status})
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                              {!loan.return_date && (
                                <>
                                  <button
                                    onClick={() => handleCheckIn(loan.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-semibold text-[11px] shadow-sm active:scale-95 transition-all animate-none"
                                  >
                                    Return
                                  </button>
                                  <button
                                    onClick={() => handleRenewOverride(loan.id)}
                                    disabled={loan.renew_count >= 2}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/5 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] disabled:opacity-40 disabled:scale-100 active:scale-95 transition-all"
                                    title="Extend loan +14 days (Admin Override)"
                                  >
                                    Renew ({loan.renew_count}/2)
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-slate-100/50 dark:bg-dark-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 glass-panel rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
              {searchQuery ? 'No borrowing records match your search.' : 'No borrowing records found for this category.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CirculationList;
