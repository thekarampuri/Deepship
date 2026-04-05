import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { Project, ProjectDetail, JoinRequest, Log } from '../../services/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProjectHealth {
  project: ProjectDetail;
  recentErrors: Log[];
}

// ── Component ────────────────────────────────────────────────────────────────

const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Aggregated stats
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalFatals, setTotalFatals] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [fetchedProjects, fetchedRequests] = await Promise.allSettled([
          api.getProjects(),
          api.getJoinRequests(),
        ]);

        const projList =
          fetchedProjects.status === 'fulfilled' ? fetchedProjects.value : [];
        const reqList =
          fetchedRequests.status === 'fulfilled' ? fetchedRequests.value : [];

        setProjects(projList);
        setJoinRequests(reqList);

        // Load project details + recent errors for each project (max 6)
        const detailPromises = projList.slice(0, 6).map(async (p): Promise<ProjectHealth | null> => {
          try {
            const [detail, errors] = await Promise.allSettled([
              api.getProject(p.id),
              api.getProjectLogs(p.id, 'ERROR', undefined, 5),
            ]);
            return {
              project: detail.status === 'fulfilled' ? detail.value : {
                ...p,
                team_id: '',
                api_key_count: 0,
                developers: [],
                logs_summary: { total_logs: 0, error_count: 0, fatal_count: 0 },
              } as ProjectDetail,
              recentErrors: errors.status === 'fulfilled' ? errors.value : [],
            };
          } catch {
            return null;
          }
        });

        const healthResults = (await Promise.all(detailPromises)).filter(
          (h): h is ProjectHealth => h !== null
        );

        setProjectHealth(healthResults);

        // Aggregate stats
        let logs = 0, errs = 0, fatals = 0;
        for (const h of healthResults) {
          logs += h.project.logs_summary?.total_logs ?? 0;
          errs += h.project.logs_summary?.error_count ?? 0;
          fatals += h.project.logs_summary?.fatal_count ?? 0;
        }
        setTotalLogs(logs);
        setTotalErrors(errs);
        setTotalFatals(fatals);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const pendingRequests = joinRequests.filter((r) => r.status === 'PENDING');
  const approvedRequests = joinRequests.filter((r) => r.status === 'APPROVED');

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

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Collect all recent errors across projects for the "Recent Issues" panel
  const allRecentErrors = projectHealth
    .flatMap((h) =>
      h.recentErrors.map((log) => ({ ...log, projectName: h.project.name, projectId: h.project.id }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white tracking-tight">Developer Dashboard</span>
          <span className="text-slate-600 text-sm">
            / Welcome back, {user?.full_name?.split(' ')[0] || 'Developer'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {pendingRequests.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase tracking-widest rounded-lg border border-tertiary/20">
              <span className="material-symbols-outlined text-xs">hourglass_top</span>
              {pendingRequests.length} pending
            </span>
          )}
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-sm">error</span>
            <span className="text-sm text-error">{error}</span>
          </div>
        )}

        {/* ── Stats Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Assigned Projects */}
          <div className="bg-surface-container-high p-5 rounded-xl relative overflow-hidden group border border-white/5 hover:border-primary/15 transition-colors">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                My Projects
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">
                  {projects.length}
                </span>
                <span className="text-xs text-slate-500">assigned</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">folder</span>
            </div>
          </div>

          {/* Total Logs */}
          <div className="bg-surface-container-high p-5 rounded-xl relative overflow-hidden group border border-white/5 hover:border-primary/15 transition-colors">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                Total Logs
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">
                  {totalLogs.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">ingested</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">receipt_long</span>
            </div>
          </div>

          {/* Errors */}
          <div className="bg-surface-container-high p-5 rounded-xl relative overflow-hidden group border border-white/5 hover:border-error/15 transition-colors">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                Errors
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black tracking-tighter ${totalErrors > 0 ? 'text-error' : 'text-white'}`}>
                  {totalErrors.toLocaleString()}
                </span>
                {totalFatals > 0 && (
                  <span className="text-xs font-bold text-error/70">
                    ({totalFatals} fatal)
                  </span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">bug_report</span>
            </div>
          </div>

          {/* Join Requests */}
          <div className="bg-surface-container-high p-5 rounded-xl relative overflow-hidden group border border-white/5 hover:border-tertiary/15 transition-colors">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                Join Requests
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">
                  {pendingRequests.length}
                </span>
                <span className="text-xs text-slate-500">pending</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">person_add</span>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Project Health (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Health Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">monitor_heart</span>
                  Project Health
                </h3>
                {projects.length > 0 && (
                  <Link
                    to="/developer/projects"
                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    View all
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </Link>
                )}
              </div>

              {projects.length === 0 ? (
                <div className="bg-surface-container-low rounded-xl border border-white/5 p-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">
                    folder_open
                  </span>
                  <p className="text-sm text-slate-400 mb-1 font-semibold">No projects assigned yet</p>
                  <p className="text-xs text-slate-600 mb-4">Browse available projects and request to join one.</p>
                  <Link
                    to="/developer/browse"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">explore</span>
                    Browse Projects
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectHealth.map((ph) => {
                    const summary = ph.project.logs_summary;
                    const hasErrors = (summary?.error_count ?? 0) > 0;
                    const hasFatals = (summary?.fatal_count ?? 0) > 0;
                    const healthColor = hasFatals
                      ? 'border-l-error'
                      : hasErrors
                        ? 'border-l-tertiary'
                        : 'border-l-secondary';

                    return (
                      <div
                        key={ph.project.id}
                        onClick={() => navigate(`/developer/projects/${ph.project.id}/logs`)}
                        className={`bg-surface-container-low rounded-xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group border-l-2 ${healthColor}`}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                                {ph.project.name}
                              </h4>
                              {ph.project.organization_name && (
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                                  {ph.project.organization_name}
                                </p>
                              )}
                            </div>

                            {/* Health indicator */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {hasFatals ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-error/15 rounded text-[9px] font-bold text-error uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
                                  Critical
                                </span>
                              ) : hasErrors ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-tertiary/15 rounded text-[9px] font-bold text-tertiary uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 bg-tertiary rounded-full" />
                                  Warning
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-secondary/15 rounded text-[9px] font-bold text-secondary uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
                                  Healthy
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Metrics bar */}
                          <div className="flex items-center gap-4 text-[10px]">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-highest rounded-lg">
                              <span className="material-symbols-outlined text-xs text-on-surface-variant">receipt_long</span>
                              <span className="font-bold text-on-surface-variant">
                                {(summary?.total_logs ?? 0).toLocaleString()} logs
                              </span>
                            </div>
                            {(summary?.error_count ?? 0) > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-error/10 rounded-lg">
                                <span className="material-symbols-outlined text-xs text-error">error</span>
                                <span className="font-bold text-error">
                                  {summary!.error_count.toLocaleString()} errors
                                </span>
                              </div>
                            )}
                            {(summary?.fatal_count ?? 0) > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-error/20 rounded-lg">
                                <span className="material-symbols-outlined text-xs text-error">dangerous</span>
                                <span className="font-bold text-error">
                                  {summary!.fatal_count.toLocaleString()} fatal
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-highest rounded-lg">
                              <span className="material-symbols-outlined text-xs text-on-surface-variant">group</span>
                              <span className="font-bold text-on-surface-variant">
                                {ph.project.developers?.length ?? ph.project.developer_count ?? 0} devs
                              </span>
                            </div>
                          </div>

                          {/* Latest error preview */}
                          {ph.recentErrors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                Latest Error
                              </p>
                              <div className="flex items-center gap-3">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-error/15 text-error flex-shrink-0">
                                  {ph.recentErrors[0].level}
                                </span>
                                <span className="text-xs text-slate-300 truncate flex-1">
                                  {ph.recentErrors[0].message}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                                  {formatTimestamp(ph.recentErrors[0].timestamp)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Issues across all projects */}
            {allRecentErrors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-base">bug_report</span>
                    Recent Issues
                  </h3>
                </div>

                <div className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {allRecentErrors.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => navigate(`/developer/projects/${log.projectId}/logs`)}
                        className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-container-high/30 transition-colors cursor-pointer"
                      >
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase flex-shrink-0 ${
                          log.level === 'FATAL'
                            ? 'bg-error/30 text-error'
                            : 'bg-error/15 text-error'
                        }`}>
                          {log.level}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{log.message}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {log.projectName}
                            {log.service && <span> &middot; {log.service}</span>}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar (1 col) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">bolt</span>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  to="/developer/projects"
                  className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl border border-white/5 hover:border-primary/20 transition-all group"
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">folder_open</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">My Projects</p>
                    <p className="text-[10px] text-slate-500">View assigned projects & logs</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors text-sm">
                    chevron_right
                  </span>
                </Link>

                <Link
                  to="/developer/browse"
                  className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl border border-white/5 hover:border-primary/20 transition-all group"
                >
                  <div className="w-9 h-9 bg-tertiary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-tertiary text-lg">explore</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">Browse Projects</p>
                    <p className="text-[10px] text-slate-500">Discover & request to join</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors text-sm">
                    chevron_right
                  </span>
                </Link>
              </div>
            </div>

            {/* Pending Join Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">hourglass_top</span>
                  Pending Requests
                </h3>
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-surface-container-low rounded-xl border border-tertiary/10 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-tertiary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-tertiary text-sm">folder</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {req.project_name || 'Project'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Requested {formatDate(req.requested_at)}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-tertiary/10 rounded text-[9px] font-bold text-tertiary uppercase tracking-wider flex-shrink-0">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Approved */}
            {approvedRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                  Recently Approved
                </h3>
                <div className="space-y-2">
                  {approvedRequests.slice(0, 5).map((req) => (
                    <div
                      key={req.id}
                      className="bg-surface-container-low rounded-xl border border-secondary/10 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-secondary text-sm">folder</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {req.project_name || 'Project'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Approved {req.resolved_at ? formatDate(req.resolved_at) : ''}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-secondary/10 rounded text-[9px] font-bold text-secondary uppercase tracking-wider flex-shrink-0">
                          Joined
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* API Key info */}
            <div className="bg-surface-container-low rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">vpn_key</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">API Keys</p>
                  <p className="text-[10px] text-slate-500">Managed per project by managers</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                API keys are created and managed by project managers. Select a project to view its logs and integration details.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeveloperDashboard;
