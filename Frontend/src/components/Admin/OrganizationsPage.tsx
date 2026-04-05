import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Organization } from '../../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const OrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getOrganizations().then(setOrganizations).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
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

  const filtered = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = organizations.reduce((sum, o) => sum + o.member_count, 0);
  const totalProjects = organizations.reduce((sum, o) => sum + o.project_count, 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-surface-container-lowest/80 backdrop-blur-md h-16 border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-on-surface tracking-tight">Organizations</span>
          <span className="text-on-surface-variant/60">/</span>
          <span className="text-sm text-on-surface-variant">Platform Overview</span>
          <span className="ml-2 px-2 py-0.5 bg-surface-container-highest text-primary text-[10px] font-black rounded uppercase tracking-widest">
            {organizations.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-base">search</span>
            <input
              className="bg-surface-container-lowest border-none rounded-lg py-1.5 pl-10 pr-4 w-64 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-on-surface-variant/40 text-on-surface"
              placeholder="Search organizations..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-md transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Stats Row */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-outline-variant/20 hover:border-primary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Orgs</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-primary tracking-tighter">{organizations.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-primary">corporate_fare</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-outline-variant/20 hover:border-secondary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Members</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-secondary tracking-tighter">{totalMembers}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-secondary">group</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-outline-variant/20 hover:border-tertiary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Projects</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-tertiary tracking-tighter">{totalProjects}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-tertiary">folder</span>
            </div>
          </div>
        </motion.div>

        {/* Search result count */}
        {search && (
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
          </p>
        )}

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">corporate_fare</span>
            </div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
              {search ? 'No organizations match your search' : 'No organizations found'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-primary hover:underline underline-offset-4"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          /* Organizations Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((org) => (
              <div
                key={org.id}
                className="bg-surface-container-low rounded-xl border border-outline-variant/20 hover:border-primary/20 hover:bg-surface-container-high hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
              >
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-primary/60 to-secondary/40" />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                        <h3 className="text-base font-bold text-primary group-hover:text-primary transition-colors truncate">
                          {org.name}
                        </h3>
                      </div>
                      <span className="text-on-surface-variant text-xs font-mono">{org.slug}</span>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] font-black uppercase tracking-widest rounded">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {org.description && (
                    <p className="text-xs text-on-surface-variant mb-4 line-clamp-2 leading-relaxed">
                      {org.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/20">
                      <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Members</p>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">group</span>
                        <span className="text-lg font-black text-on-surface">{org.member_count}</span>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/20">
                      <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Projects</p>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-tertiary">folder</span>
                        <span className="text-lg font-black text-on-surface">{org.project_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      <span className="text-[10px] font-medium">{formatDate(org.created_at)}</span>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary hover:underline underline-offset-4 transition-all opacity-0 group-hover:opacity-100">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrganizationsPage;
