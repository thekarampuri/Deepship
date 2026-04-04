import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Project } from '../../services/api';

const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  useEffect(() => {
    api.getProjects().then(setProjects).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-64 p-8 flex items-center justify-center h-screen bg-surface">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  // Unique org names for filter dropdown
  const orgNames = Array.from(
    new Set(projects.map((p) => p.organization_name).filter(Boolean) as string[])
  ).sort();

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.organization_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesOrg = orgFilter ? p.organization_name === orgFilter : true;
    return matchesSearch && matchesOrg;
  });

  const avgDevs =
    projects.length > 0
      ? (projects.reduce((sum, p) => sum + p.developer_count, 0) / projects.length).toFixed(1)
      : '0';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white tracking-tight">All Projects</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">Admin View</span>
          <span className="ml-2 px-2 py-0.5 bg-surface-container-highest text-primary text-[10px] font-black rounded uppercase tracking-widest">
            {projects.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-base">search</span>
            <input
              className="bg-surface-container-lowest border-none rounded-lg py-1.5 pl-10 pr-4 w-72 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600 text-on-surface"
              placeholder="Search by name or organization..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-2 text-slate-400 hover:text-primary hover:bg-white/5 rounded-md transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-white/5 hover:border-primary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Projects</p>
              <span className="text-3xl font-black text-primary tracking-tighter">{projects.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-primary">folder</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-white/5 hover:border-secondary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Avg Developers / Project</p>
              <span className="text-3xl font-black text-secondary tracking-tighter">{avgDevs}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-secondary">code</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-white/5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Organization:</span>
            <select
              className="bg-transparent border-none text-xs font-medium text-slate-200 focus:ring-0 p-0 cursor-pointer"
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
            >
              <option value="">All Organizations</option>
              {orgNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {(search || orgFilter) && (
            <button
              onClick={() => { setSearch(''); setOrgFilter(''); }}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-primary transition-colors ml-auto"
            >
              <span className="material-symbols-outlined text-sm">filter_list_off</span>
              Clear Filters
            </button>
          )}

          <span className="ml-auto text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {filtered.length} of {projects.length} shown
          </span>
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-3xl text-slate-500">folder_off</span>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No projects match your filters</p>
            <button
              onClick={() => { setSearch(''); setOrgFilter(''); }}
              className="text-xs text-primary hover:underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Projects Table */
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Project Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Organization</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Developers</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Created</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="group hover:bg-surface-container-high transition-colors cursor-pointer relative"
                  >
                    {/* Left accent on hover */}
                    <td className="px-6 py-4 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                          {project.name}
                        </span>
                        {project.description && (
                          <span className="text-[10px] text-slate-500 line-clamp-1 max-w-xs">
                            {project.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {project.organization_name ? (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-slate-500">corporate_fare</span>
                          <span className="text-xs font-medium text-slate-200">{project.organization_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest rounded-lg">
                          <span className="material-symbols-outlined text-xs text-tertiary">code</span>
                          <span className="text-xs font-bold text-white">{project.developer_count}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {project.developer_count === 1 ? 'dev' : 'devs'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400">{formatDate(project.created_at)}</span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <span className="text-xs font-medium text-slate-300">Active</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="px-6 py-3 bg-surface-container-lowest/30 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Showing {filtered.length} project{filtered.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Avg {avgDevs} devs / project
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProjectsPage;
