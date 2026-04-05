import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Log, LogLevel, ProjectDetail, ApiKey } from '../../services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

const levelStyles: Record<LogLevel, { badge: string; row: string }> = {
  DEBUG: { badge: 'bg-gray-200 text-gray-600', row: '' },
  INFO: { badge: 'bg-primary/10 text-primary', row: '' },
  WARN: { badge: 'bg-tertiary/15 text-tertiary', row: 'border-l-2 border-l-tertiary/30' },
  ERROR: { badge: 'bg-error/15 text-error', row: 'border-l-2 border-l-error/30' },
  FATAL: { badge: 'bg-error/30 text-error font-black', row: 'border-l-2 border-l-error bg-error/5' },
};

type FilterLevel = LogLevel | 'ALL';

// ── Root Cause Analysis helpers ───────────────────────────────────────────────

interface RcaContent {
  rootCause: string;
  fix: string;
}

function deriveRca(log: Log): RcaContent {
  const errorType = log.error_type ?? '';
  const message = log.message ?? '';

  if (errorType.includes('NullPointer') || errorType.includes('NullReference')) {
    return {
      rootCause:
        'A null reference was accessed. The code attempted to use an object that was never initialized or was already garbage-collected. This often occurs due to missing null checks, race conditions between initialization and usage, or an upstream call returning null unexpectedly.',
      fix:
        'Add null guards before accessing the object. Use optional chaining (?.) or null-safe operators, initialize objects eagerly where possible, and add unit tests for null/empty input paths.',
    };
  }

  if (
    errorType.includes('Connection') ||
    errorType.includes('Network') ||
    message.toLowerCase().includes('connection') ||
    message.toLowerCase().includes('unreachable') ||
    message.toLowerCase().includes('refused')
  ) {
    return {
      rootCause:
        'Network connectivity issue detected. A downstream service, database, or external dependency was unreachable. This may be caused by a service restart, network partition, firewall rule change, or connection pool exhaustion.',
      fix:
        'Implement retry logic with exponential back-off and jitter. Add a circuit breaker to prevent cascading failures. Verify network routes and firewall rules. Monitor connection pool metrics and set appropriate pool size limits.',
    };
  }

  if (errorType.includes('OutOfMemory') || errorType.includes('MemoryError') || errorType.includes('heap')) {
    return {
      rootCause:
        'Memory exhaustion detected. The process consumed all available heap space. Common causes include memory leaks (retained object references), unbounded caches, processing very large payloads in memory, or insufficient heap allocation for the current load.',
      fix:
        'Profile heap usage with a memory profiler to locate the leak. Reduce batch sizes when processing large datasets. Implement streaming or pagination instead of loading everything into memory. Consider increasing the JVM/runtime heap limit as a temporary measure while the root leak is fixed.',
    };
  }

  if (errorType.includes('Timeout') || message.toLowerCase().includes('timeout') || message.toLowerCase().includes('timed out')) {
    return {
      rootCause:
        'An operation exceeded its allowed time budget. This can be caused by slow database queries (missing indices, lock contention), slow external API responses, or overloaded downstream services.',
      fix:
        'Add query indices and analyze slow query logs. Set appropriate timeout values and implement fallback behavior. Use caching where idempotent reads are repeated. Consider async processing for long-running operations.',
    };
  }

  if (errorType.includes('Auth') || errorType.includes('Permission') || errorType.includes('Unauthorized') || errorType.includes('Forbidden')) {
    return {
      rootCause:
        'An authorization or authentication failure occurred. The caller lacked the required credentials or permissions, or a token/certificate has expired or been revoked.',
      fix:
        'Verify token expiry settings and refresh logic. Check service account permissions and role bindings. Implement automatic credential rotation. Add alerting for repeated auth failures to detect credential compromise early.',
    };
  }

  return {
    rootCause:
      'An unhandled error occurred. Review the stack trace for the full call chain and identify the first frame that originates from application code (rather than framework or library code).',
    fix:
      'Identify the outermost application frame in the stack trace and add error handling at that boundary. Log sufficient context (user ID, request payload, environment) to reproduce the issue. Add a regression test once the fix is confirmed.',
  };
}

// ── Animation helpers ────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

const ProjectLogs: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Project info state ────────────────────────────────────────────────────
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState('');

  // ── Logs state ────────────────────────────────────────────────────────────
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');

  // ── API Keys state ────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // ── UI state ──────────────────────────────────────────────────────────────
  const [levelFilter, setLevelFilter] = useState<FilterLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // ── Fetch project info ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setProjectLoading(true);
    api
      .getProject(id)
      .then(setProject)
      .catch((e: Error) => setProjectError(e.message))
      .finally(() => setProjectLoading(false));
  }, [id]);

  // ── Fetch API keys assigned to this developer ─────────────────────────────
  useEffect(() => {
    if (!id) return;
    api
      .getProjectApiKeys(id)
      .then(setApiKeys)
      .catch(() => {})
      .finally(() => setApiKeysLoading(false));
  }, [id]);

  const handleCopyKey = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text).catch(() => null);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId); else next.add(keyId);
      return next;
    });
  };

  const hideKey = (key: string) => key.slice(0, 6) + '•'.repeat(Math.max(0, key.length - 10)) + key.slice(-4);

  // ── Fetch logs (re-run when filter or search changes) ─────────────────────
  const fetchLogs = useCallback(() => {
    if (!id) return;
    setLogsLoading(true);
    setLogsError('');
    api
      .getProjectLogs(id, levelFilter === 'ALL' ? undefined : levelFilter, searchQuery || undefined)
      .then(setLogs)
      .catch((e: Error) => setLogsError(e.message))
      .finally(() => setLogsLoading(false));
  }, [id, levelFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const levels: FilterLevel[] = ['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

  const projectName = project?.name ?? (projectLoading ? '…' : 'Project');

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-white/80 backdrop-blur-md h-16 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/developer/projects')}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-on-surface-variant text-sm">Developer</span>
          <span className="material-symbols-outlined text-on-surface-variant/60 text-xs">chevron_right</span>
          <span className="text-on-surface-variant text-sm">Projects</span>
          <span className="material-symbols-outlined text-on-surface-variant/60 text-xs">chevron_right</span>
          <span className="text-lg font-bold text-on-surface tracking-tight">
            {projectError ? 'Unknown Project' : projectName}
          </span>
        </div>
        {project && (
          <div className="flex items-center gap-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs">receipt_long</span>
              {project.logs_summary.total_logs.toLocaleString()} logs
            </span>
            {project.logs_summary.error_count > 0 && (
              <span className="flex items-center gap-1.5 text-error">
                <span className="material-symbols-outlined text-xs">error</span>
                {project.logs_summary.error_count} errors
              </span>
            )}
          </div>
        )}
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Project error */}
        {projectError && (
          <div className="mb-4 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-sm">error</span>
            <span className="text-sm text-error">Failed to load project: {projectError}</span>
          </div>
        )}

        {/* API Keys Section */}
        {!apiKeysLoading && apiKeys.length > 0 && (
          <motion.div {...fadeUp(0)} className="mb-6">
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="w-full bg-surface-container-low rounded-xl border border-gray-200 hover:border-primary/15 transition-all"
            >
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">vpn_key</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-surface">
                      API Keys
                      <span className="ml-2 text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                        {apiKeys.length}
                      </span>
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      Keys assigned to you for this project
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">
                  {showApiKeys ? 'expand_less' : 'expand_more'}
                </span>
              </div>
            </button>

            {showApiKeys && (
              <div className="mt-2 space-y-2">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="bg-surface-container-low rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary text-base">vpn_key</span>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{key.label || 'API Key'}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            Created {new Date(key.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-secondary' : 'bg-gray-400'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          {key.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    {key.api_key && (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-2.5 bg-surface-container-highest rounded-lg font-mono text-xs text-on-surface-variant truncate select-all">
                          {visibleKeys.has(key.id) ? key.api_key : hideKey(key.api_key)}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleKeyVisibility(key.id);
                          }}
                          className="px-2.5 py-2.5 text-on-surface-variant hover:text-on-surface transition-colors rounded-lg bg-surface-container-lowest flex-shrink-0"
                          title={visibleKeys.has(key.id) ? 'Hide key' : 'Show key'}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {visibleKeys.has(key.id) ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyKey(key.api_key!, key.id);
                          }}
                          className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1 flex-shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copiedKey === key.id ? 'check' : 'content_copy'}
                          </span>
                          {copiedKey === key.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div {...fadeUp(0.05)} className="bg-surface-container-low rounded-lg p-4 border border-gray-200 mb-6 flex items-center gap-4 flex-wrap">
          {/* Level filter pills */}
          <div className="flex gap-1 bg-surface-container-lowest rounded-lg p-1">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${
                  levelFilter === level
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-sm">
              search
            </span>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-on-surface-variant/40"
              placeholder="Search log messages, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">
            {logsLoading ? '…' : `${logs.length} logs`}
          </span>
        </motion.div>

        {/* Logs error */}
        {logsError && (
          <div className="mb-4 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-sm">error</span>
            <span className="text-sm text-error">{logsError}</span>
            <button
              onClick={fetchLogs}
              className="ml-auto text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading logs */}
        {logsLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Logs List */}
        {!logsLoading && !logsError && (
          <motion.div {...fadeUp(0.1)} className="space-y-1.5">
            {logs.map((log) => {
              const style = levelStyles[log.level] ?? levelStyles['INFO'];
              const isExpanded = expandedLog === log.id;
              const isErrorOrFatal = log.level === 'ERROR' || log.level === 'FATAL';
              const rca = isErrorOrFatal ? deriveRca(log) : null;

              return (
                <div key={log.id}>
                  {/* Log Row */}
                  <div
                    className={`bg-surface-container-low rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer ${
                      isExpanded ? 'border-primary/20' : ''
                    } ${style.row}`}
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <div className="px-5 py-3 flex items-center gap-4">
                      <span className="font-mono text-[10px] text-on-surface-variant w-44 flex-shrink-0">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight flex-shrink-0 w-14 text-center ${style.badge}`}
                      >
                        {log.level}
                      </span>
                      <span className="text-sm text-on-surface flex-1 truncate">{log.message}</span>
                      {log.service && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex-shrink-0">
                          {log.service}
                        </span>
                      )}
                      {isErrorOrFatal && (
                        <span
                          className="material-symbols-outlined text-primary text-sm flex-shrink-0"
                          title="Root Cause Analysis available"
                        >
                          psychology
                        </span>
                      )}
                      <span className="material-symbols-outlined text-on-surface-variant text-sm flex-shrink-0">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Panel */}
                  {isExpanded && (
                    <div className="mt-1 bg-surface-container-high rounded-lg border border-primary/10 overflow-hidden">
                      {/* Basic Details Grid */}
                      <div className="p-5 border-b border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                              Trace ID
                            </p>
                            <code className="font-mono text-on-surface-variant">
                              {log.trace_id ?? '—'}
                            </code>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                              Service
                            </p>
                            <span className="text-on-surface-variant">{log.service ?? '—'}</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                              Level
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${style.badge}`}
                            >
                              {log.level}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                              Timestamp
                            </p>
                            <span className="font-mono text-on-surface-variant">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Environment / host row */}
                        {(log.environment || log.host || log.error_type) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-4 pt-4 border-t border-gray-200">
                            {log.environment && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                                  Environment
                                </p>
                                <span className="text-on-surface-variant">{log.environment}</span>
                              </div>
                            )}
                            {log.host && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                                  Host
                                </p>
                                <span className="text-on-surface-variant">{log.host}</span>
                              </div>
                            )}
                            {log.error_type && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                                  Error Type
                                </p>
                                <span className="font-mono text-error text-[11px]">
                                  {log.error_type}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Extra Fields */}
                        {log.extra && Object.keys(log.extra).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                              Extra Fields
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(log.extra).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="px-2 py-1 bg-surface-container-lowest rounded text-[10px] font-mono text-on-surface-variant"
                                >
                                  <span className="text-on-surface-variant">{key}:</span>{' '}
                                  {String(value)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stack Trace */}
                      {log.stack_trace && (
                        <div className="p-5 border-b border-gray-200">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                            Stack Trace
                          </p>
                          <pre className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs text-on-surface-variant overflow-x-auto leading-relaxed whitespace-pre-wrap">
                            {log.stack_trace}
                          </pre>
                        </div>
                      )}

                      {/* Root Cause Analysis — always shown for ERROR / FATAL */}
                      {isErrorOrFatal && rca && (
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-primary text-xl">
                              psychology
                            </span>
                            <span className="text-base font-bold text-on-surface">
                              Root Cause Analysis
                            </span>
                          </div>

                          {/* Root Cause */}
                          <div className="bg-error/5 border border-error/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-error text-sm">
                                target
                              </span>
                              <span className="text-sm font-bold text-error">
                                Identified Root Cause
                              </span>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                              {rca.rootCause}
                            </p>
                          </div>

                          {/* Recommended Fix */}
                          <div className="bg-secondary/5 border border-secondary/10 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-secondary text-sm">
                                build
                              </span>
                              <span className="text-sm font-bold text-secondary">
                                Recommended Fix
                              </span>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                              {rca.fix}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {logs.length === 0 && (
              <div className="bg-surface-container-low rounded-lg border border-gray-200 p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/60 mb-2 block">
                  filter_alt_off
                </span>
                <p className="text-sm text-on-surface-variant">No logs match the current filters.</p>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ProjectLogs;
