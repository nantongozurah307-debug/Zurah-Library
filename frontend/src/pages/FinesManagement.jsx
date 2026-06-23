import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Clock, 
  Info,
  CreditCard,
  XCircle,
  HelpCircle
} from 'lucide-react';

const FinesManagement = () => {
  const { isAdmin } = useAuth();
  const [fines, setFines] = useState([]);
  const [filter, setFilter] = useState(''); // '', 'pending', 'paid'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchFines = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (filter) queryParams.append('status', filter);
      
      const res = await api.get(`/circulation/fines?${queryParams.toString()}`);
      setFines(res.data.fines);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fine statements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [filter]);

  const handlePayFine = async (fineId, amount) => {
    if (!window.confirm(`Simulate payment process of ${amount.toLocaleString()} UGX?`)) return;
    
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/circulation/fines/pay/${fineId}`);
      setSuccess(res.data.message);
      fetchFines();
    } catch (err) {
      setError(err.response?.data?.error || 'Payment processing failed.');
    }
  };

  const handleWaiveFine = async (fineId) => {
    if (!window.confirm("Are you sure you want to waive this fine? This action is irreversible.")) return;
    
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/circulation/fines/waive/${fineId}`);
      setSuccess(res.data.message);
      fetchFines();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to waive fine.');
    }
  };

  // Compute stats
  const totalPendingFines = fines
    .filter(f => f.status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPaidFines = fines
    .filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Fines & Ledger</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {isAdmin 
            ? 'Track system penalties, handle collections, or waive fees' 
            : 'Review your outstanding balances and simulate payments'
          }
        </p>
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

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-danger-500">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              {isAdmin ? 'Total Unpaid Fines (System)' : 'My Pending Balance'}
            </span>
            <strong className="text-3xl font-extrabold text-danger-600 dark:text-danger-400 mt-1 block">
              {totalPendingFines.toLocaleString()} UGX
            </strong>
          </div>
          <AlertTriangle className="h-10 w-10 text-danger-500/20" />
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-accent-500">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              {isAdmin ? 'Total Collected Fines (System)' : 'My Paid Ledger'}
            </span>
            <strong className="text-3xl font-extrabold text-accent-600 dark:text-accent-400 mt-1 block">
              {totalPaidFines.toLocaleString()} UGX
            </strong>
          </div>
          <CheckCircle className="h-10 w-10 text-accent-500/20" />
        </div>
      </div>

      {/* Filter and Content table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
          <div className="flex gap-2">
            {[
              { id: '', name: 'All Statements' },
              { id: 'pending', name: 'Pending Fines' },
              { id: 'paid', name: 'Paid Ledger' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === tab.id 
                    ? 'bg-primary-600 text-white shadow' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : fines.length > 0 ? (
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Borrower</th>
                    <th className="px-6 py-4">Book Details</th>
                    <th className="px-6 py-4">Fined Period</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {fines.map(fine => {
                    const isPending = fine.status === 'pending';
                    return (
                      <tr key={fine.id} className="hover:bg-slate-100/40 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                          {fine.username}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{fine.book_title}</div>
                        </td>
                        <td className="px-6 py-4 space-y-1 text-slate-500 dark:text-slate-400">
                          <div>Due: {fine.due_date}</div>
                          {fine.return_date && <div>Returned: {fine.return_date}</div>}
                        </td>
                        <td className={`px-6 py-4 font-extrabold text-sm ${isPending ? 'text-danger-600 dark:text-danger-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {fine.amount.toLocaleString()} UGX
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            isPending 
                              ? 'bg-danger-500/10 text-danger-600 dark:text-danger-400 border border-danger-500/20' 
                              : 'bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20'
                          }`}>
                            {fine.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handlePayFine(fine.id, fine.amount)}
                                className="px-3 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-semibold text-[11px] flex inline-flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                              >
                                <CreditCard className="h-3 w-3" />
                                Pay fine
                              </button>
                              
                              {isAdmin && (
                                <button
                                  onClick={() => handleWaiveFine(fine.id)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-danger-500/20 dark:border-danger-500/10 hover:bg-danger-500/5 text-danger-600 dark:text-danger-400 font-semibold text-[11px] flex inline-flex items-center gap-1 active:scale-95 transition-all"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Waive
                                </button>
                              )}
                            </>
                          )}
                          {!isPending && (
                            <span className="text-slate-500 dark:text-slate-500 text-[10px] italic flex inline-flex items-center gap-1 justify-end">
                              <CheckCircle className="h-3.5 w-3.5 text-accent-600 dark:text-accent-500" />
                              Settled on {new Date(fine.paid_at).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
            No fines or receipts found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default FinesManagement;
