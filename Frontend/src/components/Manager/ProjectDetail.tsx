import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Log, Member, ApiKey, ProjectDetail as ProjectDetailType } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'developers' | 'apikeys' | 'logs';
type LogLevel = 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

// ─── Constants ────────────────────────────────────────────────────────────────

const levelStyles: Record<string, { badge: string }> = {
  DEBUG: { badge: 'bg-slate-700/50 text-slate-300' },
  INFO:  { badge: 'bg-primary/10 text-primary' },
  WARN:  { badge: 'bg-[#ffb95f]/15 text-[#ffb95f]' },
  ERROR: { badge: 'bg-[#ffb4ab]/15 text-[#ffb4ab]' },
  FATAL: { badge: 'bg-[#ffb4ab]/30 text-[#ffb4ab] font-black' },
};

const LOG_LEVELS: LogLevel[] = ['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

// ─── Root Cause Analysis helper ───────────────────────────────────────────────

function getRCAContent(log: Log): { rootCause: string; suggestedFix: string } | null {
  if (log.level !== 'ERROR' && log.level !== 'FATAL') return null;

  const et = (log.error_type || '').toLowerCase();
  const msg = (log.message || '').toLowerCase();
  const combined = et + ' ' + msg;

  if (combined.includes('nullpointer') || combined.includes('null reference') || combined.includes('cannot invoke') || combined.includes('null')) {
    return {
      rootCause:
        'A NullPointerException indicates a null reference was accessed where an object was expected. ' +
        'This typically occurs when an optional field, uninitialized variable, or expired session token is used ' +
        'without a prior null-check.',
      suggestedFix:
        'Add a null guard before the operation. Verify that upstream data sources (auth tokens, session state, ' +
        'database results) are validated before being passed into methods that dereference them. ' +
        'Consider using Optional<T> or equivalent defensive wrappers.',
    };
  }

  if (combined.includes('outofmemory') || combined.includes('heap') || combined.includes('memory')) {
    return {
      rootCause:
        'An OutOfMemoryError means the JVM heap (or equivalent runtime heap) is exhausted. ' +
        'This is often caused by a memory leak — objects being retained in collections, caches, or listeners ' +
        'that are never released.',
      suggestedFix:
        'Profile heap usage with a tool such as VisualVM or async-profiler. Check for unbounded caches, ' +
        'forgotten event listeners, or large object graphs. Consider increasing heap size as a short-term fix, ' +
        'and implement proper eviction policies for caches.',
    };
  }

  if (combined.includes('connection refused') || combined.includes('unreachable') || combined.includes('timeout') || combined.includes('connect')) {
    return {
      rootCause:
        'A connection refused / timeout error means the client could not establish a TCP connection to the ' +
        'target service. The target may be down, overloaded, or blocked by a firewall rule.',
      suggestedFix:
        'Verify the target service is running and listening on the expected port. Implement retry logic with ' +
        'exponential back-off. Add circuit-breaker patterns to prevent cascading failures, and ensure health ' +
        'checks are configured for dependent services.',
    };
  }

  if (combined.includes('permission') || combined.includes('access denied') || combined.includes('forbidden') || combined.includes('unauthorized')) {
    return {
      rootCause:
        'An access-denied / permission error indicates the calling principal does not have the required ' +
        'privileges for the requested resource or operation.',
      suggestedFix:
        'Review IAM roles, ACLs, and file/resource permissions. Ensure the service account used at runtime ' +
        'has the minimum necessary permissions. Audit recent permission changes and check that credentials ' +
        'have not expired.',
    };
  }

  if (combined.includes('classnotfound') || combined.includes('nosuchmethod') || combined.includes('nosuchfield')) {
    return {
      rootCause:
        'A ClassNotFoundException or NoSuchMethodError points to a classpath or dependency version mismatch. ' +
        'A class or method that was available at compile time is missing at runtime.',
      suggestedFix:
        'Check dependency versions in your build descriptor (pom.xml, build.gradle, package.json). Look for ' +
        'conflicting transitive dependencies and pin versions explicitly. Verify the deployed artifact includes ' +
        'all required dependencies.',
    };
  }

  if (combined.includes('database') || combined.includes('sql') || combined.includes('query') || combined.includes('constraint')) {
    return {
      rootCause:
        'A database error typically signals a constraint violation, a slow query, a connection pool exhaustion, ' +
        'or a schema mismatch between the application and the database.',
      suggestedFix:
        'Inspect the full SQL statement and associated parameters. Check database server logs for lock contention ' +
        'or constraint violations. Ensure connection pool settings are tuned for the expected load and that ' +
        'database migrations have been applied.',
    };
  }

  // Generic fallback for unknown error types
  return {
    rootCause:
      `The error "${log.error_type || log.level}" was detected in service "${log.service || 'unknown'}". ` +
      'Inspect the stack trace for the exact call site where the exception originated. ' +
      'Cross-reference recent deployments and configuration changes around the time of this log entry.',
    suggestedFix:
      'Enable verbose logging for the affected service and reproduce the error in a staging environment. ' +
      'Add structured error handling and alerting around this code path to catch future occurrences early.',
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  } catch {
    return ts;
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps { message: string; type: 'success' | 'error'; onDismiss: () => void; }

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => (
  <div
    className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold ${
      type === 'success'
        ? 'bg-surface-container-high border-[#4edea3]/30 text-[#4edea3]'
        : 'bg-surface-container-high border-[#ffb4ab]/30 text-[#ffb4ab]'
    }`}
  >
    <span className="material-symbols-outlined text-base">{type === 'success' ? 'check_circle' : 'error'}</span>
    {message}
    <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
      <span className="material-symbols-outlined text-sm">close</span>
    </button>
  </div>
);

// ─── Developers Tab ───────────────────────────────────────────────────────────

interface DevelopersTabProps {
  projectId: string;
  developers: Member[];
  onDevelopersChange: (devs: Member[]) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const DevelopersTab: React.FC<DevelopersTabProps> = ({ projectId, developers, onDevelopersChange, showToast }) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allDevs, setAllDevs] = useState<Member[]>([]);
  const [allDevsLoading, setAllDevsLoading] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const openAssignModal = async () => {
    setShowAssignModal(true);
    setAllDevsLoading(true);
    setAssignSearch('');
    try {
      const members = await api.getMembers('DEVELOPER');
      setAllDevs(members);
    } catch (e) {
      showToast((e as Error).message, 'error');
      setShowAssignModal(false);
    } finally {
      setAllDevsLoading(false);
    }
  };

  const handleAssign = async (dev: Member) => {
    setAssigning(dev.id);
    try {
      await api.assignDeveloper(projectId, dev.id);
      onDevelopersChange([...developers, dev]);
      showToast(`${dev.full_name} assigned to project`, 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setAssigning(null);
    }
  };

  const handleRemove = async (dev: Member) => {
    setRemoving(dev.id);
    try {
      await api.removeDeveloperFromProject(projectId, dev.id);
      onDevelopersChange(developers.filter((d) => d.id !== dev.id));
      showToast(`${dev.full_name} removed from project`, 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setRemoving(null);
    }
  };

  const existingIds = new Set(developers.map((d) => d.id));
  const availableDevs = allDevs.filter(
    (d) =>
      !existingIds.has(d.id) &&
      (d.full_name.toLowerCase().includes(assignSearch.toLowerCase()) ||
        d.email.toLowerCase().includes(assignSearch.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={openAssignModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-[#0b1326] text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Assign Developer
          </button>
        </div>

        <div className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden">
          {developers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">group</span>
              <p className="text-white font-semibold mb-1">No developers assigned</p>
              <p className="text-sm text-slate-500">Assign developers to get started</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-surface-container-lowest/50">
                <tr>
                  <th className="px-6 py-4">Developer</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {developers.map((dev) => (
                  <tr key={dev.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm">
                          {dev.full_name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-white">{dev.full_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{dev.email}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemove(dev)}
                        disabled={removing === dev.id}
                        className="flex items-center gap-1 ml-auto text-[10px] font-bold uppercase tracking-widest text-[#ffb4ab]/60 hover:text-[#ffb4ab] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removing === dev.id ? (
                          <div className="w-3 h-3 border border-[#ffb4ab]/30 border-t-[#ffb4ab] rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-xs">person_remove</span>
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Assign Developer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-high rounded-xl border border-white/10 p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Assign Developer</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none">search</span>
              <input
                type="text"
                placeholder="Search developers..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border-0 rounded-lg text-sm text-on-surface placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/40"
                autoFocus
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {allDevsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : availableDevs.length === 0 ? (
                <div className="text-center py-10">
                  <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">person_search</span>
                  <p className="text-sm text-slate-500">
                    {assignSearch ? 'No developers match your search' : 'All developers are already assigned'}
                  </p>
                </div>
              ) : (
                availableDevs.map((dev) => (
                  <div
                    key={dev.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-container-low hover:bg-surface-container-highest transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm">
                        {dev.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{dev.full_name}</p>
                        <p className="text-[10px] text-slate-500">{dev.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssign(dev)}
                      disabled={assigning === dev.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assigning === dev.id ? (
                        <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-xs">add</span>
                      )}
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

interface ApiKeysTabProps {
  projectId: string;
  apiKeys: ApiKey[];
  onApiKeysChange: (keys: ApiKey[]) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const ApiKeysTab: React.FC<ApiKeysTabProps> = ({ projectId, apiKeys, onApiKeysChange, showToast }) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await api.generateApiKey(projectId, labelInput.trim() || undefined);
      setGeneratedKey(result.api_key);
      // Add masked version to the list
      const newKey: ApiKey = {
        id: result.id,
        label: result.label,
        key_masked: result.api_key.slice(0, 8) + '••••••••••••••••••••' + result.api_key.slice(-4),
        is_active: true,
        created_at: result.created_at,
      };
      onApiKeysChange([newKey, ...apiKeys]);
    } catch (e) {
      showToast((e as Error).message, 'error');
      setShowGenerateModal(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => null);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const closeGenerateModal = () => {
    setShowGenerateModal(false);
    setLabelInput('');
    setGeneratedKey(null);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-[#0b1326] text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Generate New Key
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-xl border border-white/5 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">vpn_key</span>
            <p className="text-white font-semibold mb-1">No API keys yet</p>
            <p className="text-sm text-slate-500">Generate a key to allow access to this project</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="bg-surface-container-low p-5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">vpn_key</span>
                    <div>
                      <p className="text-sm font-bold text-white">{key.label || 'Unnamed Key'}</p>
                      <p className="text-[10px] text-slate-500">Created {formatDate(key.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-[#4edea3]' : 'bg-slate-600'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {key.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-2.5 bg-surface-container-lowest rounded-lg font-mono text-xs text-on-surface-variant truncate">
                    {key.key_masked}
                  </code>
                  <button
                    onClick={() => handleCopy(key.key_masked, key.id)}
                    className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedKey === key.id ? 'check' : 'content_copy'}
                    </span>
                    {copiedKey === key.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-high rounded-xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Generate API Key</h3>
              <button onClick={closeGenerateModal} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {generatedKey ? (
              /* ── Show the newly generated key ── */
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-[#ffb95f]/10 border border-[#ffb95f]/20 rounded-xl">
                  <span className="material-symbols-outlined text-[#ffb95f] flex-shrink-0">warning</span>
                  <p className="text-xs font-semibold text-[#ffb95f] leading-relaxed">
                    Save this key now. It will not be shown again.
                  </p>
                </div>
                <div>
                  <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Your New API Key
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-surface-container-lowest rounded-lg font-mono text-xs text-on-surface break-all">
                      {generatedKey}
                    </code>
                    <button
                      onClick={() => handleCopy(generatedKey, 'new')}
                      className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest bg-primary text-[#0b1326] rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copiedKey === 'new' ? 'check' : 'content_copy'}
                      </span>
                      {copiedKey === 'new' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={closeGenerateModal}
                  className="w-full py-2.5 text-sm font-bold text-on-surface border border-white/10 rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  I've saved it — Close
                </button>
              </div>
            ) : (
              /* ── Label form ── */
              <div className="space-y-5">
                <div>
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Key Label <span className="normal-case tracking-normal text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Production, Staging, CI/CD"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    className="block w-full py-3 px-4 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-slate-600"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeGenerateModal}
                    className="flex-1 py-2.5 text-sm font-bold text-slate-400 border border-white/10 rounded-lg hover:bg-surface-container-highest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 py-2.5 text-sm font-bold text-[#0b1326] bg-primary rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#0b1326]/30 border-t-[#0b1326] rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Key'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

interface LogsTabProps {
  projectId: string;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const LogsTab: React.FC<LogsTabProps> = ({ projectId, showToast }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LogLevel>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(
    (level: LogLevel, searchTerm: string) => {
      setLoading(true);
      api
        .getProjectLogs(projectId, level === 'ALL' ? undefined : level, searchTerm || undefined, 200)
        .then(setLogs)
        .catch((e: Error) => showToast(e.message, 'error'))
        .finally(() => setLoading(false));
    },
    [projectId, showToast]
  );

  useEffect(() => {
    fetchLogs(levelFilter, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleLevelChange = (level: LogLevel) => {
    setLevelFilter(level);
    fetchLogs(level, search);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  // Debounced search submit on Enter or blur
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') fetchLogs(levelFilter, search);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Level filter */}
        <div className="flex gap-1 bg-surface-container-lowest rounded-xl p-1 w-fit flex-wrap">
          {LOG_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => handleLevelChange(level)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                levelFilter === level
                  ? level === 'ALL'
                    ? 'bg-surface-container-high text-white'
                    : `${levelStyles[level]?.badge ?? 'bg-surface-container-high text-white'} ring-1 ring-inset ring-white/10`
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Search logs... (press Enter)"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-white/5 rounded-lg text-sm text-on-surface placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
          />
        </div>
      </div>

      {/* Logs list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-xl border border-white/5 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">receipt_long</span>
          <p className="text-white font-semibold mb-1">No logs found</p>
          <p className="text-sm text-slate-500">Try adjusting the filters</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            const rca = getRCAContent(log);

            return (
              <div key={log.id}>
                {/* Log row */}
                <div
                  className={`bg-surface-container-low rounded-xl border transition-all cursor-pointer ${
                    isExpanded
                      ? 'border-primary/20 rounded-b-none'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="px-5 py-3 flex items-center gap-4">
                    <span className="font-mono text-[10px] text-slate-500 w-36 flex-shrink-0 hidden md:block">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight flex-shrink-0 ${levelStyles[log.level]?.badge ?? ''}`}
                    >
                      {log.level}
                    </span>
                    <span className="text-sm text-white flex-1 truncate">{log.message}</span>
                    {log.service && (
                      <span className="text-[10px] text-slate-500 flex-shrink-0 hidden lg:block">{log.service}</span>
                    )}
                    {rca && (
                      <span className="material-symbols-outlined text-primary text-sm flex-shrink-0" title="Root Cause Analysis available">
                        psychology
                      </span>
                    )}
                    <span className="material-symbols-outlined text-slate-500 text-sm flex-shrink-0">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="bg-surface-container-high rounded-b-xl border border-t-0 border-primary/10 p-6 space-y-5">
                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Trace ID', value: log.trace_id || '—', mono: true },
                        { label: 'Service',  value: log.service  || '—', mono: false },
                        { label: 'Level',    value: log.level,            mono: false, isLevel: true },
                        { label: 'Timestamp', value: formatTimestamp(log.timestamp), mono: true },
                      ].map(({ label, value, mono, isLevel }) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                          {isLevel ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${levelStyles[value]?.badge ?? ''}`}>
                              {value}
                            </span>
                          ) : (
                            <p className={`text-xs text-on-surface-variant ${mono ? 'font-mono' : ''}`}>{value}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Extra fields */}
                    {log.extra && Object.keys(log.extra).length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Extra Fields</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(log.extra).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2.5 py-1 bg-surface-container-highest rounded-lg text-[10px] font-mono text-on-surface-variant"
                            >
                              <span className="text-primary">{k}</span>
                              <span className="text-slate-600">:</span>{' '}
                              <span>{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stack trace */}
                    {log.stack_trace && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Stack Trace</p>
                        <pre className="bg-surface-container-lowest rounded-xl p-4 font-mono text-xs text-on-surface-variant overflow-x-auto leading-relaxed whitespace-pre-wrap">
                          {log.stack_trace}
                        </pre>
                      </div>
                    )}

                    {/* Root Cause Analysis */}
                    {rca && (
                      <div className="space-y-3">
                        {/* Root cause */}
                        <div className="bg-[#ffb4ab]/5 border border-[#ffb4ab]/15 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[#ffb4ab] text-lg">error</span>
                            <span className="text-sm font-bold text-[#ffb4ab]">Identified Root Cause</span>
                          </div>
                          <p className="text-sm text-on-surface-variant leading-relaxed">{rca.rootCause}</p>
                        </div>

                        {/* Suggested fix */}
                        <div className="bg-[#4edea3]/5 border border-[#4edea3]/15 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[#4edea3] text-lg">build</span>
                            <span className="text-sm font-bold text-[#4edea3]">Recommended Fix</span>
                          </div>
                          <p className="text-sm text-on-surface-variant leading-relaxed">{rca.suggestedFix}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState('');

  const [developers, setDevelopers] = useState<Member[]>([]);
  const [devsLoading, setDevsLoading] = useState(true);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('developers');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load project detail
  useEffect(() => {
    if (!id) return;
    api
      .getProject(id)
      .then(setProject)
      .catch((e: Error) => setProjectError(e.message))
      .finally(() => setProjectLoading(false));
  }, [id]);

  // Load developers on mount
  useEffect(() => {
    if (!id) return;
    api
      .getProjectDevelopers(id)
      .then(setDevelopers)
      .catch((e: Error) => showToast(e.message, 'error'))
      .finally(() => setDevsLoading(false));
  }, [id, showToast]);

  // Load API keys on mount
  useEffect(() => {
    if (!id) return;
    api
      .getProjectApiKeys(id)
      .then(setApiKeys)
      .catch((e: Error) => showToast(e.message, 'error'))
      .finally(() => setKeysLoading(false));
  }, [id, showToast]);

  // ── Loading state ──
  if (projectLoading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error state ──
  if (projectError || !project) {
    return (
      <div className="bg-surface text-on-surface min-h-screen">
        <Sidebar />
        <div className="ml-64 flex flex-col items-center justify-center h-screen gap-4">
          <span className="material-symbols-outlined text-5xl text-[#ffb4ab]">error</span>
          <p className="text-white font-semibold">{projectError || 'Project not found'}</p>
          <button
            onClick={() => navigate('/manager/projects')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const tabDefs: { id: TabType; label: string; icon: string; count: number | null }[] = [
    { id: 'developers', label: 'Developers', icon: 'group',        count: devsLoading ? null : developers.length },
    { id: 'apikeys',   label: 'API Keys',   icon: 'vpn_key',      count: keysLoading ? null : apiKeys.length   },
    { id: 'logs',      label: 'Logs',       icon: 'receipt_long', count: project.logs_summary?.total_logs ?? null },
  ];

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/manager/projects')}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-lg font-bold text-white tracking-tight truncate">{project.name}</span>
          {project.organization_name && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
              <span className="text-slate-500 text-sm truncate hidden sm:block">{project.organization_name}</span>
            </>
          )}
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Project info header */}
        <div className="bg-surface-container-low rounded-xl p-6 border border-white/5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1.5">{project.name}</h2>
              {project.description && (
                <p className="text-sm text-on-surface-variant mb-3 leading-relaxed">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Created {formatDate(project.created_at)}</span>
                {project.organization_name && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span>{project.organization_name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Stats chips */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-highest rounded-xl">
                <span className="material-symbols-outlined text-sm text-primary">group</span>
                <span className="text-xs font-bold text-white">{devsLoading ? '…' : developers.length}</span>
                <span className="text-[10px] text-slate-500">devs</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-highest rounded-xl">
                <span className="material-symbols-outlined text-sm text-primary">vpn_key</span>
                <span className="text-xs font-bold text-white">{keysLoading ? '…' : apiKeys.length}</span>
                <span className="text-[10px] text-slate-500">keys</span>
              </div>
              {project.logs_summary && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-highest rounded-xl">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">receipt_long</span>
                    <span className="text-xs font-bold text-white">{project.logs_summary.total_logs.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">logs</span>
                  </div>
                  {project.logs_summary.error_count > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#ffb4ab]/10 rounded-xl">
                      <span className="material-symbols-outlined text-sm text-[#ffb4ab]">error</span>
                      <span className="text-xs font-bold text-[#ffb4ab]">{project.logs_summary.error_count.toLocaleString()}</span>
                      <span className="text-[10px] text-[#ffb4ab]/60">errors</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-surface-container-lowest rounded-xl p-1 w-fit">
          {tabDefs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-surface-container-high text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
              {tab.count !== null && (
                <span className="text-[10px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded-full font-black">
                  {tab.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'developers' && (
          <DevelopersTab
            projectId={id!}
            developers={developers}
            onDevelopersChange={setDevelopers}
            showToast={showToast}
          />
        )}
        {activeTab === 'apikeys' && (
          <ApiKeysTab
            projectId={id!}
            apiKeys={apiKeys}
            onApiKeysChange={setApiKeys}
            showToast={showToast}
          />
        )}
        {activeTab === 'logs' && (
          <LogsTab
            projectId={id!}
            showToast={showToast}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
};

export default ProjectDetail;
