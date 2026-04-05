import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { JoinRequest } from '../../services/api';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const InvitationsPage: React.FC = () => {
  const [invitations, setInvitations] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    api
      .getMyInvitations()
      .then(setInvitations)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setResolving(id);
    try {
      await api.resolveJoinRequest(id, status);
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status, resolved_at: new Date().toISOString() } : inv,
        ),
      );
      showToast(
        status === 'APPROVED' ? 'Invitation accepted! You now have access to the project.' : 'Invitation declined.',
        status === 'APPROVED' ? 'success' : 'error',
      );
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setResolving(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const pending = invitations.filter((inv) => inv.status === 'PENDING');
  const resolved = invitations.filter((inv) => inv.status !== 'PENDING');

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
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-surface-container-lowest/80 backdrop-blur-md h-16 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-on-surface tracking-tight">Invitations</span>
          {pending.length > 0 && (
            <span className="bg-tertiary/15 text-tertiary text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Error */}
        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-sm">error</span>
            <span className="text-sm text-error">{error}</span>
          </div>
        )}

        {/* Empty state */}
        {invitations.length === 0 && !error && (
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/60 mb-4 block">mail</span>
            <p className="text-on-surface font-semibold mb-1">No invitations yet</p>
            <p className="text-sm text-on-surface-variant">
              When a manager invites you to a project, it will appear here.
            </p>
          </div>
        )}

        {/* Pending Invitations */}
        {pending.length > 0 && (
          <motion.div {...fadeUp(0)} className="mb-8">
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-base">hourglass_top</span>
              Pending Invitations
            </h3>

            <div className="space-y-3">
              {pending.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-surface-container-low rounded-xl border border-tertiary/15 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-tertiary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-tertiary text-lg">folder</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-on-surface">
                          {inv.project_name || 'Unknown Project'}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {inv.organization_name || 'Unknown Organization'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">person</span>
                            Invited by {inv.invited_by_name || 'Manager'}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {formatDate(inv.requested_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleResolve(inv.id, 'REJECTED')}
                        disabled={resolving === inv.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-error/70 border border-error/20 rounded-lg hover:bg-error/10 hover:text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                        Decline
                      </button>
                      <button
                        onClick={() => handleResolve(inv.id, 'APPROVED')}
                        disabled={resolving === inv.id}
                        className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resolving === inv.id ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-xs">check</span>
                        )}
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resolved Invitations */}
        {resolved.length > 0 && (
          <motion.div {...fadeUp(0.15)}>
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-base">history</span>
              Past Invitations
            </h3>

            <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {resolved.map((inv) => (
                  <div key={inv.id} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        inv.status === 'APPROVED' ? 'bg-secondary/10' : 'bg-error/10'
                      }`}>
                        <span className={`material-symbols-outlined text-sm ${
                          inv.status === 'APPROVED' ? 'text-secondary' : 'text-error'
                        }`}>
                          {inv.status === 'APPROVED' ? 'check_circle' : 'cancel'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {inv.project_name || 'Unknown Project'}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {inv.organization_name}
                          {inv.invited_by_name && ` · Invited by ${inv.invited_by_name}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                        inv.status === 'APPROVED'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-error/10 text-error'
                      }`}>
                        {inv.status === 'APPROVED' ? 'Accepted' : 'Declined'}
                      </span>
                      {inv.resolved_at && (
                        <span className="text-[10px] text-on-surface-variant">
                          {formatDate(inv.resolved_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold ${
            toast.type === 'success'
              ? 'bg-surface-container-high border-secondary/30 text-secondary'
              : 'bg-surface-container-high border-error/30 text-error'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default InvitationsPage;
