import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Search, 
  Mail, 
  Calendar, 
  BookOpen, 
  AlertTriangle, 
  DollarSign, 
  UserPlus,
  ArrowRight
} from 'lucide-react';

const MembersList = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/analytics/members');
      setMembers(res.data.members);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch library members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => 
    member.username.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Members Directory</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Monitor registered borrowers, active loans, and fine balances</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-600 dark:text-danger-400 text-xs">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
            placeholder="Search members by username or email..."
          />
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => {
            const hasOverdue = member.overdue_loans_count > 0;
            const hasFines = member.outstanding_fines > 0;
            
            return (
              <div 
                key={member.id} 
                className="glass-panel p-5 rounded-2xl glass-panel-hover flex flex-col justify-between h-[230px]"
              >
                {/* Top User Info */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm border border-primary-500/10">
                      {member.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{member.username}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-4">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Member since: {new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Bottom Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.005]">
                  <div className="text-center p-2 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Active</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 flex justify-center items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      {member.active_loans_count}
                    </div>
                  </div>

                  <div className={`text-center p-2 rounded-lg ${hasOverdue ? 'bg-danger-500/5' : ''}`}>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Overdue</span>
                    <div className={`text-sm font-extrabold mt-1 flex justify-center items-center gap-1 ${hasOverdue ? 'text-danger-600 dark:text-danger-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      <AlertTriangle className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      {member.overdue_loans_count}
                    </div>
                  </div>

                  <div className={`text-center p-2 rounded-lg ${hasFines ? 'bg-danger-500/5 dark:bg-danger-500/10 border border-danger-500/10' : ''}`}>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Fines</span>
                    <div className={`text-[11px] font-extrabold mt-1 flex justify-center items-center gap-0.5 ${hasFines ? 'text-danger-600 dark:text-danger-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {member.outstanding_fines.toLocaleString()} UGX
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-2xl">
          <Users className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No members found matching search query.</p>
        </div>
      )}
    </div>
  );
};

export default MembersList;
