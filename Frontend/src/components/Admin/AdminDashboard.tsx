import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { Project, OrgMember, JoinRequest } from '../../services/api';

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

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    Promise.allSettled([
      api.getOrgProjects(orgId),
      api.getOrgMembers(),
      api.getOrgPendingRequests(),
    ])
      .then(([projResult, memResult, reqResult]) => {
        if (projResult.status === 'fulfilled') setProjects(projResult.value);
        if (memResult.status === 'fulfilled') setMembers(memResult.value);
        if (reqResult.status === 'fulfilled') setPendingRequests(reqResult.value);
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  const managers = members.filter((m) => m.role === 'MANAGER');
  const developers = members.filter((m) => m.role === 'DEVELOPER');
  const q = searchQuery.toLowerCase();

  const filteredProjects = projects.filter(
    (p) => p.name.toLowerCase().includes(q),
  );

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q),
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
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-surface-container-lowest/80 backdrop-blur-md h-16 border-b border-outline-variant/20">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-on-surface tracking-tight">Admin Dashboard</span>
          <span className="text-on-surface-variant text-sm">/ Platform Overview</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              className="bg-surface-container-lowest border-none rounded-lg py-1.5 pl-10 pr-4 w-64 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-on-surface-variant/40"
              placeholder="Search orgs, projects, devs..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">notifications</span>
          </div>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Stats Row */}
        <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div {...staggerItem} className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-outline-variant/20">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Projects</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-on-surface tracking-tighter">{projects.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">folder</span>
            </div>
          </motion.div>

          <motion.div {...staggerItem} className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-outline-variant/20">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Managers</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-on-surface tracking-tighter">{managers.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">assignment_ind</span>
            </div>
          </motion.div>

          <motion.div {...staggerItem} className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-outline-variant/20">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Developers</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-on-surface tracking-tighter">{developers.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">code</span>
            </div>
          </motion.div>

          <motion.div {...staggerItem} className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-outline-variant/20">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Pending Requests</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black tracking-tighter ${pendingRequests.length > 0 ? 'text-amber-400' : 'text-on-surface'}`}>{pendingRequests.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">pending_actions</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Two Column Layout */}
        <motion.div {...fadeUp(0.2)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects Column */}
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Projects</h3>
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">{filteredProjects.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">folder_open</span>
                  <p className="text-sm text-on-surface-variant">No projects found</p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div key={project.id} className="bg-surface-container-high p-4 rounded-lg border border-outline-variant/20 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{project.name}</span>
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                    </div>
                    {project.description && (
                      <p className="text-[10px] text-on-surface-variant mb-2 line-clamp-1">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
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

          {/* Members Column */}
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Team Members</h3>
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">{filteredMembers.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">group</span>
                  <p className="text-sm text-on-surface-variant">No members found</p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div key={member.id} className="bg-surface-container-high p-4 rounded-lg border border-outline-variant/20 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary font-bold text-sm">
                        {member.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{member.full_name}</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-widest ${
                            member.role === 'ADMIN' ? 'bg-primary/15 text-primary' :
                            member.role === 'MANAGER' ? 'bg-secondary/15 text-secondary' :
                            'bg-tertiary/15 text-tertiary'
                          }`}>{member.role}</span>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${member.is_active ? 'bg-secondary' : 'bg-gray-400'}`} />
                        </div>
                        <p className="text-[10px] text-on-surface-variant truncate">{member.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
