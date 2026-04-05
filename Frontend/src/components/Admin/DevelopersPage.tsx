import React, { useState, useEffect } from 'react';

import * as api from '../../services/api';
import type { Member } from '../../services/api';

type Tab = 'DEVELOPER' | 'MANAGER';

// Deterministic color from a string initial
const avatarColors: Record<string, string> = {
  A: 'bg-primary/20 text-primary',
  B: 'bg-secondary/20 text-secondary',
  C: 'bg-tertiary/20 text-tertiary',
  D: 'bg-primary/20 text-primary',
  E: 'bg-secondary/20 text-secondary',
  F: 'bg-tertiary/20 text-tertiary',
  G: 'bg-primary/20 text-primary',
  H: 'bg-secondary/20 text-secondary',
  I: 'bg-tertiary/20 text-tertiary',
  J: 'bg-primary/20 text-primary',
  K: 'bg-secondary/20 text-secondary',
  L: 'bg-tertiary/20 text-tertiary',
  M: 'bg-primary/20 text-primary',
  N: 'bg-secondary/20 text-secondary',
  O: 'bg-tertiary/20 text-tertiary',
  P: 'bg-primary/20 text-primary',
  Q: 'bg-secondary/20 text-secondary',
  R: 'bg-tertiary/20 text-tertiary',
  S: 'bg-primary/20 text-primary',
  T: 'bg-secondary/20 text-secondary',
  U: 'bg-tertiary/20 text-tertiary',
  V: 'bg-primary/20 text-primary',
  W: 'bg-secondary/20 text-secondary',
  X: 'bg-tertiary/20 text-tertiary',
  Y: 'bg-primary/20 text-primary',
  Z: 'bg-secondary/20 text-secondary',
};

function getAvatarColor(name: string): string {
  const letter = (name?.charAt(0) ?? 'A').toUpperCase();
  return avatarColors[letter] ?? 'bg-primary/20 text-primary';
}

const DevelopersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('DEVELOPER');
  const [developers, setDevelopers] = useState<Member[]>([]);
  const [managers, setManagers] = useState<Member[]>([]);
  const [devLoading, setDevLoading] = useState(true);
  const [mgrLoading, setMgrLoading] = useState(true);
  const [devError, setDevError] = useState('');
  const [mgrError, setMgrError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getMembers('DEVELOPER')
      .then(setDevelopers)
      .catch((e: Error) => setDevError(e.message))
      .finally(() => setDevLoading(false));

    api.getMembers('MANAGER')
      .then(setManagers)
      .catch((e: Error) => setMgrError(e.message))
      .finally(() => setMgrLoading(false));
  }, []);

  const loading = activeTab === 'DEVELOPER' ? devLoading : mgrLoading;
  const error = activeTab === 'DEVELOPER' ? devError : mgrError;

  const allData = activeTab === 'DEVELOPER' ? developers : managers;

  const filtered = allData.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    );
  });

  // Unique active orgs across both lists
  const activeOrgs = new Set(
    [...developers, ...managers]
      .map((m) => m.organization_name)
      .filter(Boolean)
  ).size;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isLoading = devLoading || mgrLoading;

  if (isLoading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (devError && mgrError) {
    return (
      <div className="ml-64 p-8 flex items-center justify-center h-screen bg-surface">
        <p className="text-error">{devError}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">


      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white tracking-tight">All Developers</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">Admin View</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-base">search</span>
            <input
              className="bg-surface-container-lowest border-none rounded-lg py-1.5 pl-10 pr-4 w-64 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600 text-on-surface"
              placeholder="Search by name or email..."
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-white/5 hover:border-tertiary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Developers</p>
              <span className="text-3xl font-black text-tertiary tracking-tighter">{developers.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-tertiary">code</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-white/5 hover:border-secondary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Managers</p>
              <span className="text-3xl font-black text-secondary tracking-tighter">{managers.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-secondary">assignment_ind</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden group border border-white/5 hover:border-primary/20 transition-all">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Active Orgs</p>
              <span className="text-3xl font-black text-primary tracking-tighter">{activeOrgs}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-7xl text-primary">corporate_fare</span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 mb-6 bg-surface-container-lowest p-1 rounded-lg w-fit border border-white/5">
          <button
            onClick={() => { setActiveTab('DEVELOPER'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'DEVELOPER'
                ? 'bg-surface-container-high text-tertiary shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-sm">code</span>
            Developers
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
              activeTab === 'DEVELOPER' ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container-high text-slate-500'
            }`}>
              {developers.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('MANAGER'); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'MANAGER'
                ? 'bg-surface-container-high text-secondary shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-sm">assignment_ind</span>
            Managers
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
              activeTab === 'MANAGER' ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-high text-slate-500'
            }`}>
              {managers.length}
            </span>
          </button>
        </div>

        {/* Per-tab error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-error text-xs font-medium">{error}</p>
          </div>
        )}

        {/* Per-tab loading */}
        {loading && !error ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-3xl text-slate-500">
                {activeTab === 'DEVELOPER' ? 'person_off' : 'manage_accounts'}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {search
                ? `No ${activeTab === 'DEVELOPER' ? 'developers' : 'managers'} match your search`
                : `No ${activeTab === 'DEVELOPER' ? 'developers' : 'managers'} found`}
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
          /* Member Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((member) => {
              const initial = member.full_name?.charAt(0)?.toUpperCase() ?? '?';
              const avatarClass = getAvatarColor(member.full_name);
              const isManager = member.role === 'MANAGER';

              return (
                <div
                  key={member.id}
                  className="bg-surface-container-low rounded-xl border border-white/5 hover:border-primary/20 hover:bg-surface-container-high hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  {/* Top accent */}
                  <div className={`h-1 w-full ${isManager ? 'bg-gradient-to-r from-secondary/60 to-primary/40' : 'bg-gradient-to-r from-tertiary/60 to-primary/40'}`} />

                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 border border-white/5 ${avatarClass}`}>
                        {initial}
                      </div>

                      {/* Name & email */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                          {member.full_name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                        {/* Role badge */}
                        <div className="mt-1.5">
                          {isManager ? (
                            <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[9px] font-black uppercase tracking-widest rounded">
                              Manager
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-tertiary/15 text-tertiary text-[9px] font-black uppercase tracking-widest rounded">
                              Developer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {member.organization_name && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="material-symbols-outlined text-xs text-slate-500">corporate_fare</span>
                          <span className="truncate">{member.organization_name}</span>
                        </div>
                      )}

                      {member.project_count !== undefined && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="material-symbols-outlined text-xs text-slate-500">folder</span>
                          <span>
                            <span className="text-white font-bold">{member.project_count}</span>
                            {' '}project{member.project_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-slate-600">calendar_today</span>
                        <span className="text-[10px] text-slate-500">Joined {formatDate(member.created_at)}</span>
                      </div>

                      {member.project_count !== undefined && member.project_count > 0 && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          isManager ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                        }`}>
                          {member.project_count} {member.project_count === 1 ? 'project' : 'projects'}
                        </span>
                      )}
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

export default DevelopersPage;
