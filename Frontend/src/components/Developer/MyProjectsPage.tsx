import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Project, ProjectDetail } from '../../services/api';

const MyProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectDetails, setProjectDetails] = useState<Record<string, ProjectDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const projList = await api.getProjects();
        setProjects(projList);

        // Load details for each project (for log summaries)
        const detailPromises = projList.map(async (p) => {
          try {
            const detail = await api.getProject(p.id);
            return { id: p.id, detail };
          } catch {
            return null;
          }
        });

        const results = await Promise.all(detailPromises);
        const detailMap: Record<string, ProjectDetail> = {};
        for (const r of results) {
          if (r) detailMap[r.id] = r.detail;
        }
        setProjectDetails(detailMap);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.organization_name ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  // Aggregate stats from loaded details
  let totalLogs = 0, totalErrors = 0, totalFatals = 0;
  for (const detail of Object.values(projectDetails)) {
    totalLogs += detail.logs_summary?.total_logs ?? 0;
    totalErrors += detail.logs_summary?.error_count ?? 0;
    totalFatals += detail.logs_summary?.fatal_count ?? 0;
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/developer/dashboard')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-lg font-bold text-white tracking-tight">My Projects</span>
          <span className="bg-primary/15 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
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

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-surface-container-high p-5 rounded-xl relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Assigned</p>
              <span className="text-3xl font-black text-white tracking-tighter">{projects.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">folder</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-5 rounded-xl relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Logs</p>
              <span className="text-3xl font-black text-white tracking-tighter">{totalLogs.toLocaleString()}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">receipt_long</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-5 rounded-xl relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Errors</p>
              <span className={`text-3xl font-black tracking-tighter ${totalErrors > 0 ? 'text-error' : 'text-white'}`}>
                {totalErrors.toLocaleString()}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">error</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-5 rounded-xl relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Fatal</p>
              <span className={`text-3xl font-black tracking-tighter ${totalFatals > 0 ? 'text-error' : 'text-white'}`}>
                {totalFatals.toLocaleString()}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-5xl">dangerous</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">
            search
          </span>
          <input
            className="w-full max-w-sm bg-surface-container-low border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600 focus:outline-none"
            placeholder="Search by project or organization name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Empty state */}
        {!error && projects.length === 0 && (
          <div className="bg-surface-container-low rounded-xl border border-white/5 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">folder_open</span>
            <p className="text-white font-semibold mb-1">No projects assigned yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Browse and request to join projects.
            </p>
            <Link
              to="/developer/browse"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">explore</span>
              Browse Projects
            </Link>
          </div>
        )}

        {/* No results from search */}
        {projects.length > 0 && filtered.length === 0 && (
          <div className="bg-surface-container-low rounded-xl border border-white/5 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">search_off</span>
            <p className="text-sm text-slate-500 mb-3">No projects match "{search}"</p>
            <button
              onClick={() => setSearch('')}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Search result count */}
        {search && filtered.length > 0 && (
          <p className="text-xs text-slate-500 font-medium mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
          </p>
        )}

        {/* Project Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const detail = projectDetails[project.id];
              const summary = detail?.logs_summary;
              const hasErrors = (summary?.error_count ?? 0) > 0;
              const hasFatals = (summary?.fatal_count ?? 0) > 0;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/developer/projects/${project.id}/logs`)}
                  className={`bg-surface-container-low p-5 rounded-xl border transition-all group flex flex-col cursor-pointer ${
                    hasFatals
                      ? 'border-l-2 border-l-error border-white/5 hover:border-error/20'
                      : hasErrors
                        ? 'border-l-2 border-l-tertiary border-white/5 hover:border-tertiary/20'
                        : 'border-white/5 hover:border-primary/20'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors leading-snug truncate flex-1">
                      {project.name}
                    </h3>
                    {hasFatals ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-error/15 rounded text-[9px] font-bold text-error uppercase tracking-wider flex-shrink-0 ml-2">
                        <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
                        Critical
                      </span>
                    ) : hasErrors ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-tertiary/15 rounded text-[9px] font-bold text-tertiary uppercase tracking-wider flex-shrink-0 ml-2">
                        Warning
                      </span>
                    ) : summary ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary/15 rounded text-[9px] font-bold text-secondary uppercase tracking-wider flex-shrink-0 ml-2">
                        Healthy
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                    {project.organization_name ?? 'Unknown Org'}
                  </p>

                  {/* Description */}
                  {project.description && (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* Log stats */}
                  {summary && (
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-1 px-2 py-1 bg-surface-container-highest rounded text-[10px]">
                        <span className="material-symbols-outlined text-xs text-on-surface-variant">receipt_long</span>
                        <span className="font-bold text-on-surface-variant">
                          {summary.total_logs.toLocaleString()}
                        </span>
                      </div>
                      {summary.error_count > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-error/10 rounded text-[10px]">
                          <span className="material-symbols-outlined text-xs text-error">error</span>
                          <span className="font-bold text-error">{summary.error_count.toLocaleString()}</span>
                        </div>
                      )}
                      {summary.fatal_count > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-error/20 rounded text-[10px]">
                          <span className="material-symbols-outlined text-xs text-error">dangerous</span>
                          <span className="font-bold text-error">{summary.fatal_count.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="mt-auto pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">group</span>
                          <span>{project.developer_count ?? 0} dev{project.developer_count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">calendar_today</span>
                          <span>{formatDate(project.created_at)}</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-primary font-bold uppercase tracking-widest group-hover:text-primary/80 transition-colors">
                        View Logs
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyProjectsPage;
