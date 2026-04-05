import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { Project } from '../../services/api';

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

const AdminProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.organization_id) return;
    api.getOrgProjects(user.organization_id).then(setProjects).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, [user?.organization_id]);

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

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

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
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-white/80 backdrop-blur-md h-16 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-on-surface tracking-tight">All Projects</span>
          <span className="text-on-surface-variant/40">/</span>
          <span className="text-sm text-on-surface-variant">Admin View</span>
          <span className="ml-2 px-2 py-0.5 bg-surface-container-highest text-primary text-[10px] font-black rounded uppercase tracking-widest">
            {projects.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-base">search</span>
            <input
              className="bg-surface-container-lowest border-none rounded-lg py-1.5 pl-10 pr-4 w-72 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-on-surface-variant/40 text-on-surface"
              placeholder="Search by name or organization..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-gray-100 rounded-md transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Stats Row */}
        <motion.div {...fadeUp(0)} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-gray-200 hover:border-primary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Projects</p>
              <span className="text-3xl font-black text-primary tracking-tighter">{projects.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-primary">folder</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-gray-200 hover:border-secondary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Avg Developers / Project</p>
              <span className="text-3xl font-black text-secondary tracking-tighter">{avgDevs}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-secondary">code</span>
            </div>
          </div>
        </motion.div>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          {search && (
            <button
              onClick={() => setSearch('')}
              className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">filter_list_off</span>
              Clear Search
            </button>
          )}

          <span className="ml-auto text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            {filtered.length} of {projects.length} shown
          </span>
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center border border-gray-200">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">folder_off</span>
            </div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">No projects match your filters</p>
            <button
              onClick={() => setSearch('')}
              className="text-xs text-primary hover:underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Projects Table */
          <motion.div {...fadeUp(0.15)} className="bg-surface-container-low rounded-xl overflow-hidden border border-gray-200 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Project Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Developers</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Created</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="group hover:bg-surface-container-high transition-colors cursor-pointer relative"
                  >
                    {/* Left accent on hover */}
                    <td className="px-6 py-4 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {project.name}
                        </span>
                        {project.description && (
                          <span className="text-[10px] text-on-surface-variant line-clamp-1 max-w-xs">
                            {project.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest rounded-lg">
                          <span className="material-symbols-outlined text-xs text-tertiary">code</span>
                          <span className="text-xs font-bold text-on-surface">{project.developer_count}</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant">
                          {project.developer_count === 1 ? 'dev' : 'devs'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs text-on-surface-variant">{formatDate(project.created_at)}</span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <span className="text-xs font-medium text-on-surface-variant">Active</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="px-6 py-3 bg-surface-container-lowest/30 border-t border-gray-200 flex items-center justify-between">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Showing {filtered.length} project{filtered.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-wider">
                Avg {avgDevs} devs / project
              </span>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminProjectsPage;
