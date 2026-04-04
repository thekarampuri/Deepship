import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Project } from '../../services/api';

const MyProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .getProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
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

  // Aggregate stats
  const uniqueOrgs = new Set(projects.map((p) => p.organization_id).filter(Boolean)).size;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Assigned</p>
              <span className="text-3xl font-black text-white tracking-tighter">{projects.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">folder</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Developers</p>
              <span className="text-3xl font-black text-white tracking-tighter">
                {projects.reduce((sum, p) => sum + (p.developer_count ?? 0), 0)}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">group</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Organizations</p>
              <span className="text-3xl font-black text-white tracking-tighter">{uniqueOrgs}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">corporate_fare</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600"
            placeholder="Search by project or organization name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Empty state */}
        {!error && projects.length === 0 && (
          <div className="bg-surface-container-low rounded-xl border border-white/5 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">folder_open</span>
            <p className="text-white font-semibold mb-1">No projects assigned yet.</p>
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
            <p className="text-sm text-slate-500">No projects match "{search}"</p>
          </div>
        )}

        {/* Project Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="bg-surface-container-low p-5 rounded-xl border border-white/5 hover:border-primary/20 transition-all group flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors leading-snug">
                    {project.name}
                  </h3>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                  {project.organization_name ?? 'Unknown Org'}
                </p>

                {/* Description */}
                {project.description && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="mt-auto space-y-2 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">group</span>
                      <span>{project.developer_count ?? 0} developer{project.developer_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/developer/projects/${project.id}/logs`)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyProjectsPage;
