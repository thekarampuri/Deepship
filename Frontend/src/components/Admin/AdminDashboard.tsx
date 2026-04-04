import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Organization, Project, Member } from '../../services/api';

const AdminDashboard: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [devs, setDevs] = useState<Member[]>([]);
  const [managers, setManagers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.getOrganizations(),
      api.getProjects(),
      api.getMembers('DEVELOPER'),
      api.getMembers('MANAGER'),
    ])
      .then(([orgsData, projectsData, devsData, managersData]) => {
        setOrgs(orgsData);
        setProjects(projectsData);
        setDevs(devsData);
        setManagers(managersData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const q = searchQuery.toLowerCase();

  const filteredOrgs = orgs.filter((o) =>
    o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q),
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.organization_name ?? '').toLowerCase().includes(q),
  );

  const filteredDevs = devs.filter(
    (d) =>
      d.full_name.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q),
  );

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white tracking-tight">Admin Dashboard</span>
          <span className="text-slate-600 text-sm">/ Platform Overview</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">search</span>
            <input
              className="bg-surface-container-lowest border-none rounded-lg py-1.5 pl-10 pr-4 w-64 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600"
              placeholder="Search orgs, projects, devs..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#c0c1ff] transition-colors">notifications</span>
          </div>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Organizations</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">{orgs.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">corporate_fare</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Projects</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">{projects.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">folder</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Developers</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">{devs.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">code</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Managers</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">{managers.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">assignment_ind</span>
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organizations Column */}
          <div className="bg-surface-container-low rounded-lg border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Organizations</h3>
              <span className="text-[10px] font-bold text-slate-500 bg-surface-container-highest px-2 py-1 rounded">{filteredOrgs.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto">
              {filteredOrgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-600">corporate_fare</span>
                  <p className="text-sm text-slate-500">No organizations found</p>
                </div>
              ) : (
                filteredOrgs.map((org) => (
                  <div key={org.id} className="bg-surface-container-high p-4 rounded-lg border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-secondary" />
                        <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{org.name}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-surface-container-lowest px-1.5 py-0.5 rounded">active</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">group</span>
                        {org.member_count} members
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">folder</span>
                        {org.project_count} projects
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Projects Column */}
          <div className="bg-surface-container-low rounded-lg border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Projects</h3>
              <span className="text-[10px] font-bold text-slate-500 bg-surface-container-highest px-2 py-1 rounded">{filteredProjects.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-600">folder_open</span>
                  <p className="text-sm text-slate-500">No projects found</p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div key={project.id} className="bg-surface-container-high p-4 rounded-lg border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{project.name}</span>
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                      {project.organization_name ?? '—'}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        {project.developer_count} devs
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Developers Column */}
          <div className="bg-surface-container-low rounded-lg border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Developers</h3>
              <span className="text-[10px] font-bold text-slate-500 bg-surface-container-highest px-2 py-1 rounded">{filteredDevs.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto">
              {filteredDevs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-600">group</span>
                  <p className="text-sm text-slate-500">No developers found</p>
                </div>
              ) : (
                filteredDevs.map((dev) => (
                  <div key={dev.id} className="bg-surface-container-high p-4 rounded-lg border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary font-bold text-sm">
                        {dev.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">{dev.full_name}</span>
                          <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{dev.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">folder</span>
                        {dev.project_count ?? 0} projects
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
