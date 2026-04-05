import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import * as api from '../../services/api';
import type { JoinRequest } from '../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<JoinRequest['status'], { bg: string; text: string; label: string }> = {
  PENDING:  { bg: 'bg-[#ffb95f]/10', text: 'text-[#ffb95f]',  label: 'Pending'  },
  APPROVED: { bg: 'bg-[#4edea3]/10', text: 'text-[#4edea3]',  label: 'Approved' },
  REJECTED: { bg: 'bg-[#ffb4ab]/10', text: 'text-[#ffb4ab]',  label: 'Rejected' },
};

const StatusBadge: React.FC<{ status: JoinRequest['status'] }> = ({ status }) => {
  const s = statusStyles[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

// ─── Request Row ──────────────────────────────────────────────────────────────

interface RequestRowProps {
  request: JoinRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
}

const RequestRow: React.FC<RequestRowProps> = ({ request, onApprove, onReject, actionLoading }) => {
  const isActing = actionLoading === request.id;
  const initial = request.user_name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-surface-container-high/40 transition-colors">
      {/* Avatar + user info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{request.user_name}</p>
          <p className="text-[10px] text-on-surface-variant truncate">{request.user_email}</p>
        </div>
      </div>

      {/* Project info */}
      <div className="flex-1 min-w-0 sm:text-center">
        <p className="text-xs text-on-surface-variant">
          wants to join{' '}
          <span className="font-bold text-on-surface">{request.project_name}</span>
        </p>
      </div>

      {/* Right: time + badge + actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] text-on-surface-variant font-medium hidden md:block">
          {timeAgo(request.requested_at)}
        </span>

        <StatusBadge status={request.status} />

        {request.status === 'PENDING' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove(request.id)}
              disabled={isActing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 rounded-lg hover:bg-[#4edea3]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActing ? (
                <div className="w-3 h-3 border border-[#4edea3]/30 border-t-[#4edea3] rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-xs">check</span>
              )}
              Approve
            </button>
            <button
              onClick={() => onReject(request.id)}
              disabled={isActing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20 rounded-lg hover:bg-[#ffb4ab]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActing ? (
                <div className="w-3 h-3 border border-[#ffb4ab]/30 border-t-[#ffb4ab] rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-xs">close</span>
              )}
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabKey = 'PENDING' | 'APPROVED' | 'REJECTED';

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'PENDING',  label: 'Pending',  icon: 'schedule'      },
  { key: 'APPROVED', label: 'Approved', icon: 'check_circle'  },
  { key: 'REJECTED', label: 'Rejected', icon: 'cancel'        },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

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

const JoinRequestsPage: React.FC = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    api
      .getJoinRequests()
      .then(setRequests)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(id);
    setActionError('');
    try {
      await api.resolveJoinRequest(id, status);
      // Update status in place rather than removing so the row moves to the correct tab
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      // Switch to the resolved tab so the user sees the outcome
      setActiveTab(status);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const countFor = (tab: TabKey) => requests.filter((r) => r.status === tab).length;
  const filtered = requests.filter((r) => r.status === activeTab);

  // ── Loading ──
  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">


      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-surface-container-lowest/80 backdrop-blur-md h-16 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-lg font-bold text-on-surface tracking-tight">Join Requests</span>

          {/* Count badges */}
          <div className="flex items-center gap-2 ml-1">
            <span className="px-2 py-0.5 bg-[#ffb95f]/15 text-[#ffb95f] text-[10px] font-bold rounded-full">
              {countFor('PENDING')} pending
            </span>
            <span className="px-2 py-0.5 bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-bold rounded-full">
              {countFor('APPROVED')} approved
            </span>
            <span className="px-2 py-0.5 bg-[#ffb4ab]/15 text-[#ffb4ab] text-[10px] font-bold rounded-full">
              {countFor('REJECTED')} rejected
            </span>
          </div>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {actionError && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
            <span className="material-symbols-outlined">error</span>
            {actionError}
            <button onClick={() => setActionError('')} className="ml-auto opacity-60 hover:opacity-100">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Tab bar */}
        <motion.div {...fadeUp(0)} className="flex gap-1 mb-6 bg-surface-container-lowest rounded-xl p-1 w-fit">
          {tabs.map((tab) => {
            const count = countFor(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/50'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-surface-container-highest text-on-surface-variant'
                      : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Request list */}
        <motion.div {...fadeUp(0.1)} className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">
                  {activeTab === 'PENDING' ? 'inbox' : activeTab === 'APPROVED' ? 'check_circle' : 'cancel'}
                </span>
              </div>
              <p className="text-on-surface font-semibold mb-1">
                No {activeTab.toLowerCase()} requests
              </p>
              <p className="text-sm text-on-surface-variant">
                {activeTab === 'PENDING'
                  ? 'All requests have been handled'
                  : activeTab === 'APPROVED'
                  ? 'No requests have been approved yet'
                  : 'No requests have been rejected'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  onApprove={(id) => handleResolve(id, 'APPROVED')}
                  onReject={(id) => handleResolve(id, 'REJECTED')}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Summary footer */}
        {filtered.length > 0 && (
          <p className="mt-4 text-[10px] text-on-surface-variant/60 font-medium text-right">
            Showing {filtered.length} {activeTab.toLowerCase()} request{filtered.length !== 1 ? 's' : ''}
            {' '}· {requests.length} total
          </p>
        )}
      </main>
    </div>
  );
};

export default JoinRequestsPage;
