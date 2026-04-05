import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjectDetail, Log } from '../../services/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail | null;
  loading: boolean;
  logs: Log[];
  devSkillsMap: Record<string, string[]>;
  onDelete?: () => void;
  onManage?: () => void;
}

type LogLevel = 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

const LOG_LEVELS: LogLevel[] = ['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return ts; }
}

function fmtDate(ts: string) {
  try {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ts; }
}

const levelBadge: Record<string, string> = {
  FATAL: 'bg-error/30 text-error',
  ERROR: 'bg-error/15 text-error',
  WARN: 'bg-tertiary/15 text-tertiary',
  INFO: 'bg-secondary/15 text-secondary',
  DEBUG: 'bg-outline-variant/20 text-on-surface-variant',
};

const statusColor: Record<string, string> = {
  APPROVED: 'bg-secondary/20 text-secondary border-secondary/30',
  PENDING: 'bg-tertiary/20 text-tertiary border-tertiary/30',
  REJECTED: 'bg-error/20 text-error border-error/30',
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({
  open, onClose, project, loading, logs, devSkillsMap, onDelete, onManage,
}) => {
  const [logLevel, setLogLevel] = useState<LogLevel>('ALL');

  const filteredLogs = logLevel === 'ALL' ? logs : logs.filter(l => l.level === logLevel);
  const managers = project?.managers ?? [];
  const developers = project?.developers ?? [];
  const summary = project?.logs_summary;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="project-page"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] bg-surface overflow-y-auto"
        >
          {/* ── Sticky header ─────────────────────────────────────────────────── */}
          <div className="sticky top-0 z-10 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/20 px-6 py-4 flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface group"
            >
              <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-base">folder</span>
              </div>
              {loading ? (
                <div className="h-5 w-48 bg-surface-container-high rounded animate-pulse" />
              ) : (
                <>
                  <h1 className="text-base font-bold text-on-surface truncate">{project?.name}</h1>
                  {project?.status && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 ${statusColor[project.status] ?? 'bg-outline-variant/20 text-on-surface-variant border-outline-variant/30'}`}>
                      {project.status}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onManage && (
                <button onClick={onManage}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-primary/20">
                  <span className="material-symbols-outlined text-sm">settings</span>
                  Manage Project
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete}
                  className="flex items-center gap-1.5 px-3 py-2 text-error border border-error/30 bg-error/5 hover:bg-error/10 rounded-xl text-sm font-bold transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* ── Loading ───────────────────────────────────────────────────────── */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-on-surface-variant">Loading project details…</p>
              </div>
            </div>
          )}

          {/* ── Content ───────────────────────────────────────────────────────── */}
          {!loading && project && (
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

              {/* ── Row 1: Overview cards ─────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Developers count */}
                <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl p-5 border-l-4 border-primary border border-primary/10 relative overflow-hidden group">
                  <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1">Developers</p>
                  <p className="text-4xl font-black text-primary">{developers.length}</p>
                  <span className="absolute bottom-2 right-3 material-symbols-outlined text-primary opacity-10 group-hover:opacity-20 transition-opacity" style={{ fontSize: '3rem' }}>group</span>
                </div>
                {/* API Keys */}
                <div className="bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent rounded-2xl p-5 border-l-4 border-secondary border border-secondary/10 relative overflow-hidden group">
                  <p className="text-[10px] font-bold text-secondary/70 uppercase tracking-widest mb-1">API Keys</p>
                  <p className="text-4xl font-black text-secondary">{project.api_key_count}</p>
                  <span className="absolute bottom-2 right-3 material-symbols-outlined text-secondary opacity-10 group-hover:opacity-20 transition-opacity" style={{ fontSize: '3rem' }}>vpn_key</span>
                </div>
                {/* Total Logs */}
                <div className="bg-gradient-to-br from-tertiary/20 via-tertiary/10 to-transparent rounded-2xl p-5 border-l-4 border-tertiary border border-tertiary/10 relative overflow-hidden group">
                  <p className="text-[10px] font-bold text-tertiary/70 uppercase tracking-widest mb-1">Total Logs</p>
                  <p className="text-4xl font-black text-tertiary">{summary?.total_logs?.toLocaleString() ?? 0}</p>
                  <span className="absolute bottom-2 right-3 material-symbols-outlined text-tertiary opacity-10 group-hover:opacity-20 transition-opacity" style={{ fontSize: '3rem' }}>receipt_long</span>
                </div>
                {/* Errors */}
                <div className="bg-gradient-to-br from-error/20 via-error/10 to-transparent rounded-2xl p-5 border-l-4 border-error border border-error/10 relative overflow-hidden group">
                  <p className="text-[10px] font-bold text-error/70 uppercase tracking-widest mb-1">Errors</p>
                  <p className={`text-4xl font-black ${(summary?.error_count ?? 0) > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {summary?.error_count?.toLocaleString() ?? 0}
                  </p>
                  {(summary?.fatal_count ?? 0) > 0 && (
                    <p className="text-[10px] text-error/70 font-bold mt-1">{summary!.fatal_count} fatal</p>
                  )}
                  <span className="absolute bottom-2 right-3 material-symbols-outlined text-error opacity-10 group-hover:opacity-20 transition-opacity" style={{ fontSize: '3rem' }}>bug_report</span>
                </div>
              </div>

              {/* ── Row 2: About + Managers + Developers ──────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* About */}
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">info</span>
                    About
                  </h2>
                  <p className="text-sm text-on-surface leading-relaxed mb-4">
                    {project.description || <span className="text-on-surface-variant/60 italic">No description provided.</span>}
                  </p>
                  <div className="space-y-2 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      Created {fmtDate(project.created_at)}
                    </div>
                    {project.organization_name && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">corporate_fare</span>
                        {project.organization_name}
                      </div>
                    )}
                    {summary?.latest_log_at && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Last log {fmtDate(summary.latest_log_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Managers */}
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">assignment_ind</span>
                    Project Manager{managers.length !== 1 ? 's' : ''}
                  </h2>
                  {managers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-3xl">person_off</span>
                      <p className="text-xs">No manager assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {managers.map(mgr => (
                        <div key={mgr.id} className="flex items-center gap-3 p-3 bg-surface-container-high rounded-xl border border-primary/10">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
                            {(mgr.full_name || mgr.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-on-surface truncate">{mgr.full_name}</p>
                            <p className="text-[10px] text-on-surface-variant truncate">{mgr.email}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full flex-shrink-0">MGR</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Developers */}
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 p-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">group</span>
                    Developers ({developers.length})
                  </h2>
                  {developers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-3xl">group_off</span>
                      <p className="text-xs">No developers assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {developers.map(dev => {
                        const skills = devSkillsMap[dev.id] ?? [];
                        return (
                          <div key={dev.id} className="p-3 bg-surface-container-high rounded-xl border border-secondary/10">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-tertiary/30 to-tertiary/10 flex items-center justify-center font-black text-tertiary text-sm flex-shrink-0">
                                {(dev.full_name || dev.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-on-surface truncate">{dev.full_name}</p>
                                <p className="text-[10px] text-on-surface-variant truncate">{dev.email}</p>
                              </div>
                            </div>
                            {skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-12">
                                {skills.map(s => (
                                  <span key={s} className="px-1.5 py-0.5 bg-tertiary/10 text-tertiary text-[9px] font-bold rounded-full">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Row 3: Logs ───────────────────────────────────────────────── */}
              <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 overflow-hidden">
                {/* Logs header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-gradient-to-r from-error/5 to-transparent">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-base">receipt_long</span>
                    <h2 className="text-sm font-semibold text-on-surface">Recent Logs</h2>
                    <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded-full">
                      {filteredLogs.length}
                    </span>
                  </div>
                  {/* Level filter */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {LOG_LEVELS.map(lvl => (
                      <button key={lvl} onClick={() => setLogLevel(lvl)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          logLevel === lvl
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}>
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log rows */}
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-4xl">inbox</span>
                    <p className="text-sm">No logs for this filter</p>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/10">
                    {filteredLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-surface-container-high/40 transition-colors">
                        <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${levelBadge[log.level] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}>
                          {log.level}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface">{log.message}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {log.service && (
                              <span className="text-[10px] text-on-surface-variant">{log.service}</span>
                            )}
                            {log.module && (
                              <span className="text-[10px] text-on-surface-variant">{log.module}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-on-surface-variant flex-shrink-0 mt-0.5">
                          {fmt(log.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectDetailDrawer;
