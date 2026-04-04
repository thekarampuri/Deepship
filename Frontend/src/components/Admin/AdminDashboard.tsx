import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';

// Mock data
const mockOrgs = [
  { id: 'org-1', name: 'TraceHub Systems', members: 24, projects: 8, status: 'active' },
  { id: 'org-2', name: 'Acme Corp', members: 18, projects: 5, status: 'active' },
  { id: 'org-3', name: 'NovaTech Industries', members: 42, projects: 12, status: 'active' },
  { id: 'org-4', name: 'Quantum Labs', members: 9, projects: 3, status: 'trial' },
  { id: 'org-5', name: 'PixelForge Studio', members: 15, projects: 6, status: 'active' },
];

const mockProjects = [
  { id: 'p-1', name: 'Auth Service v3', org: 'TraceHub Systems', status: 'active', logs: '1.2M', devs: 5 },
  { id: 'p-2', name: 'Payment Gateway', org: 'Acme Corp', status: 'active', logs: '890K', devs: 3 },
  { id: 'p-3', name: 'Search Indexer', org: 'NovaTech Industries', status: 'warning', logs: '2.1M', devs: 8 },
  { id: 'p-4', name: 'User Profile API', org: 'TraceHub Systems', status: 'active', logs: '456K', devs: 4 },
  { id: 'p-5', name: 'ML Pipeline', org: 'Quantum Labs', status: 'error', logs: '340K', devs: 2 },
  { id: 'p-6', name: 'Mobile Backend', org: 'PixelForge Studio', status: 'active', logs: '678K', devs: 6 },
  { id: 'p-7', name: 'Data Warehouse', org: 'NovaTech Industries', status: 'active', logs: '3.4M', devs: 7 },
];

const mockDevelopers = [
  { id: 'd-1', name: 'Alex Kumar', email: 'alex@tracehub.io', projects: 3, logs: '45K', status: 'online' },
  { id: 'd-2', name: 'Maria Santos', email: 'maria@acme.com', projects: 2, logs: '32K', status: 'online' },
  { id: 'd-3', name: 'Liam Chen', email: 'liam@novatech.io', projects: 4, logs: '78K', status: 'offline' },
  { id: 'd-4', name: 'Sophie Weber', email: 'sophie@quantum.dev', projects: 1, logs: '12K', status: 'online' },
  { id: 'd-5', name: 'Omar Hassan', email: 'omar@pixelforge.co', projects: 2, logs: '29K', status: 'away' },
  { id: 'd-6', name: 'Nina Park', email: 'nina@tracehub.io', projects: 3, logs: '56K', status: 'online' },
  { id: 'd-7', name: 'Raj Patel', email: 'raj@novatech.io', projects: 5, logs: '91K', status: 'offline' },
  { id: 'd-8', name: 'Emma Liu', email: 'emma@acme.com', projects: 2, logs: '41K', status: 'online' },
];

const statusColors: Record<string, string> = {
  active: 'bg-secondary',
  warning: 'bg-tertiary',
  error: 'bg-error',
  trial: 'bg-primary',
  online: 'bg-secondary',
  offline: 'bg-slate-500',
  away: 'bg-tertiary',
};

const AdminDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrgs = mockOrgs.filter((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredProjects = mockProjects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.org.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDevs = mockDevelopers.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.email.toLowerCase().includes(searchQuery.toLowerCase()));

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
                <span className="text-3xl font-black text-white tracking-tighter">{mockOrgs.length}</span>
                <span className="text-secondary text-xs font-bold">+2 this month</span>
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
                <span className="text-3xl font-black text-white tracking-tighter">{mockProjects.length}</span>
                <span className="text-secondary text-xs font-bold">+3 this week</span>
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
                <span className="text-3xl font-black text-white tracking-tighter">{mockDevelopers.length}</span>
                <span className="text-secondary text-xs font-bold">+5 this month</span>
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
                <span className="text-3xl font-black text-white tracking-tighter">12</span>
                <span className="text-tertiary text-xs font-bold">Stable</span>
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
              {filteredOrgs.map((org) => (
                <div key={org.id} className="bg-surface-container-high p-4 rounded-lg border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusColors[org.status]}`} />
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{org.name}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-surface-container-lowest px-1.5 py-0.5 rounded">{org.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">group</span>
                      {org.members} members
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">folder</span>
                      {org.projects} projects
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Column */}
          <div className="bg-surface-container-low rounded-lg border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Projects</h3>
              <span className="text-[10px] font-bold text-slate-500 bg-surface-container-highest px-2 py-1 rounded">{filteredProjects.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-surface-container-high p-4 rounded-lg border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{project.name}</span>
                    <div className={`w-2 h-2 rounded-full ${statusColors[project.status]}`} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{project.org}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">receipt_long</span>
                      {project.logs} logs
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">person</span>
                      {project.devs} devs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Developers Column */}
          <div className="bg-surface-container-low rounded-lg border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Developers</h3>
              <span className="text-[10px] font-bold text-slate-500 bg-surface-container-highest px-2 py-1 rounded">{filteredDevs.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto">
              {filteredDevs.map((dev) => (
                <div key={dev.id} className="bg-surface-container-high p-4 rounded-lg border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary font-bold text-sm">
                      {dev.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">{dev.name}</span>
                        <div className={`w-2 h-2 rounded-full ${statusColors[dev.status]} flex-shrink-0`} />
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{dev.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">folder</span>
                      {dev.projects} projects
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">receipt_long</span>
                      {dev.logs} logs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
