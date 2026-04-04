import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { JoinRequest, OrgMember } from '../../services/api';

const ManageOrgPage: React.FC = () => {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // Load independently so one failure doesn't block the other
      const [requests, membersList] = await Promise.allSettled([
        api.getOrgPendingRequests(),
        api.getOrgMembers(),
      ]);
      if (requests.status === 'fulfilled') setPendingRequests(requests.value);
      else console.warn('Failed to load pending requests:', requests.reason);
      if (membersList.status === 'fulfilled') setMembers(membersList.value);
      else console.warn('Failed to load members:', membersList.reason);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleResolve = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(requestId);
    try {
      await api.resolveJoinRequest(requestId, status);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (status === 'APPROVED') {
        // Refresh members list
        const updated = await api.getOrgMembers();
        setMembers(updated);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const managers = members.filter((m) => m.role === 'MANAGER');
  const developers = members.filter((m) => m.role === 'DEVELOPER');

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white tracking-tight">Manage Organization</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">{user?.organization_name ?? 'Organization'}</span>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-error/60 hover:text-error">dismiss</button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-white/5 hover:border-amber-500/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Pending Requests</p>
              <span className="text-3xl font-black text-amber-400 tracking-tighter">{pendingRequests.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-amber-400">pending_actions</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-white/5 hover:border-secondary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Managers</p>
              <span className="text-3xl font-black text-secondary tracking-tighter">{managers.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-secondary">assignment_ind</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-white/5 hover:border-tertiary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Developers</p>
              <span className="text-3xl font-black text-tertiary tracking-tighter">{developers.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-tertiary">code</span>
            </div>
          </div>
        </div>

        {/* Pending Join Requests */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-amber-400">pending_actions</span>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Pending Join Requests</h2>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-400/15 text-amber-400 text-[10px] font-black rounded uppercase tracking-widest">
                {pendingRequests.length} pending
              </span>
            )}
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-surface-container-low rounded-xl border border-white/5 p-12 flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-slate-600">check_circle</span>
              <p className="text-sm text-slate-500 font-medium">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-surface-container-low rounded-xl border border-white/5 p-5 flex items-center justify-between hover:border-amber-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {req.user_name?.charAt(0) ?? 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{req.user_name}</p>
                      <p className="text-xs text-slate-500">{req.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[9px] font-black rounded uppercase tracking-widest">
                        {req.user_role ?? 'MANAGER'}
                      </span>
                      <span className="px-2 py-0.5 bg-surface-container-highest text-slate-400 text-[9px] font-black rounded uppercase tracking-widest">
                        {req.request_type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">
                      {new Date(req.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => handleResolve(req.id, 'APPROVED')}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-secondary/15 text-secondary text-xs font-bold rounded-lg hover:bg-secondary/25 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Approve
                    </button>
                    <button
                      onClick={() => handleResolve(req.id, 'REJECTED')}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-error/10 text-error text-xs font-bold rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Members */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">groups</span>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Organization Members</h2>
            <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-black rounded uppercase tracking-widest">
              {members.length} total
            </span>
          </div>

          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Member</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((member) => (
                  <tr key={member.id} className="group hover:bg-surface-container-high transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm">
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{member.full_name}</p>
                          <p className="text-[10px] text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest ${
                        member.role === 'ADMIN' ? 'bg-primary/15 text-primary' :
                        member.role === 'MANAGER' ? 'bg-secondary/15 text-secondary' :
                        'bg-tertiary/15 text-tertiary'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-secondary' : 'bg-slate-500'}`} />
                        <span className="text-xs text-slate-300">{member.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400">
                        {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageOrgPage;
