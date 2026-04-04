import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';

const mockMyProjects = [
  { id: 'p-1', name: 'Auth Service v3', org: 'TraceHub Systems', totalLogs: 12400, errors: 142, warnings: 890, lastActivity: '2m ago' },
  { id: 'p-2', name: 'Payment Gateway', org: 'TraceHub Systems', totalLogs: 8900, errors: 38, warnings: 412, lastActivity: '15m ago' },
  { id: 'p-3', name: 'Search Indexer', org: 'NovaTech Industries', totalLogs: 21000, errors: 284, warnings: 1500, lastActivity: '5m ago' },
];

const mockBrowseOrgs = [
  {
    id: 'org-1',
    name: 'TraceHub Systems',
    projects: [
      { id: 'bp-1', name: 'Auth Service v3', status: 'joined' as const },
      { id: 'bp-2', name: 'Payment Gateway', status: 'joined' as const },
      { id: 'bp-3', name: 'User Profile API', status: 'available' as const },
      { id: 'bp-4', name: 'Notification Hub', status: 'available' as const },
    ],
  },
  {
    id: 'org-2',
    name: 'Acme Corp',
    projects: [
      { id: 'bp-5', name: 'E-Commerce Platform', status: 'available' as const },
      { id: 'bp-6', name: 'Inventory Manager', status: 'pending' as const },
    ],
  },
  {
    id: 'org-3',
    name: 'NovaTech Industries',
    projects: [
      { id: 'bp-7', name: 'Search Indexer', status: 'joined' as const },
      { id: 'bp-8', name: 'Data Warehouse', status: 'available' as const },
      { id: 'bp-9', name: 'ML Pipeline', status: 'available' as const },
    ],
  },
  {
    id: 'org-4',
    name: 'Quantum Labs',
    projects: [
      { id: 'bp-10', name: 'Quantum Simulator', status: 'available' as const },
    ],
  },
];

const statusButton: Record<string, { label: string; style: string }> = {
  joined: { label: 'Joined', style: 'bg-secondary/10 text-secondary border-secondary/20' },
  pending: { label: 'Pending', style: 'bg-tertiary/10 text-tertiary border-tertiary/20' },
  available: { label: 'Request to Join', style: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer' },
};

const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [projectStatuses, setProjectStatuses] = useState<Record<string, 'available' | 'pending' | 'joined'>>({});

  const mockApiKey = 'th_dev_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(mockApiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleRequestJoin = (projectId: string) => {
    setProjectStatuses((prev) => ({ ...prev, [projectId]: 'pending' }));
  };

  const getProjectStatus = (project: { id: string; status: 'available' | 'pending' | 'joined' }) => {
    return projectStatuses[project.id] || project.status;
  };

  const filteredOrgs = mockBrowseOrgs.filter(
    (org) =>
      org.name.toLowerCase().includes(browseSearch.toLowerCase()) ||
      org.projects.some((p) => p.name.toLowerCase().includes(browseSearch.toLowerCase()))
  );

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white tracking-tight">Developer Dashboard</span>
          <span className="text-slate-600 text-sm">/ Welcome back, {user?.full_name?.split(' ')[0] || 'Developer'}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="material-symbols-outlined cursor-pointer hover:text-[#c0c1ff] transition-colors">notifications</span>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* API Key Quick Copy */}
        <div className="bg-surface-container-low rounded-lg p-5 border border-white/5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">vpn_key</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Your API Key</p>
              <code className="font-mono text-xs text-on-surface-variant">th_dev_sk_****************************o5p6</code>
            </div>
          </div>
          <button
            onClick={handleCopyApiKey}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-sm font-bold text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{apiKeyCopied ? 'check' : 'content_copy'}</span>
            {apiKeyCopied ? 'Copied!' : 'Copy Key'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Assigned Projects</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">{mockMyProjects.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">folder</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Logs</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">42.3K</span>
                <span className="text-secondary text-xs font-bold">+1.2K today</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">receipt_long</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Error Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">1.1%</span>
                <span className="text-error text-xs font-bold">+0.2%</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">error</span>
            </div>
          </div>

          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Active Issues</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">7</span>
                <span className="text-tertiary text-xs font-bold">3 critical</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">bug_report</span>
            </div>
          </div>
        </div>

        {/* My Projects Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">My Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockMyProjects.map((project) => (
              <div
                key={project.id}
                className="bg-surface-container-low p-5 rounded-lg border border-white/5 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{project.name}</h4>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{project.org}</p>

                {/* Log stats bars */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 w-10">Total</span>
                    <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary/50 rounded-full" style={{ width: `${Math.min(100, (project.totalLogs / 25000) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 w-12 text-right">{(project.totalLogs / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 w-10">Errors</span>
                    <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-error/60 rounded-full" style={{ width: `${Math.min(100, (project.errors / 300) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-error w-12 text-right">{project.errors}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 w-10">Warns</span>
                    <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary/60 rounded-full" style={{ width: `${Math.min(100, (project.warnings / 2000) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-tertiary w-12 text-right">{project.warnings}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] text-slate-500">{project.lastActivity}</span>
                  <button
                    onClick={() => navigate(`/developer/projects/${project.id}/logs`)}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    View Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browse & Join Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Browse & Join Projects</h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">search</span>
              <input
                className="bg-surface-container-lowest border-none rounded-lg py-1.5 pl-9 pr-4 w-64 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600"
                placeholder="Search organizations..."
                value={browseSearch}
                onChange={(e) => setBrowseSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredOrgs.map((org) => (
              <div key={org.id} className="bg-surface-container-low rounded-lg border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-container-high/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-container-highest rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">corporate_fare</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{org.name}</p>
                      <p className="text-[10px] text-slate-500">{org.projects.length} projects</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">
                    {expandedOrg === org.id ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {expandedOrg === org.id && (
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {org.projects.map((project) => {
                      const currentStatus = getProjectStatus(project);
                      const btnConfig = statusButton[currentStatus];
                      return (
                        <div key={project.id} className="px-5 py-3 flex items-center justify-between hover:bg-surface-container-high/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-slate-500 text-sm">folder</span>
                            <span className="text-sm text-white">{project.name}</span>
                          </div>
                          <button
                            onClick={() => currentStatus === 'available' && handleRequestJoin(project.id)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded transition-colors ${btnConfig.style}`}
                            disabled={currentStatus !== 'available'}
                          >
                            {btnConfig.label}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeveloperDashboard;
