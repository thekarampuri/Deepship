import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { Project, JoinRequest } from '../../services/api';

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

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([api.getProjects(), api.getJoinRequests()])
      .then(([projectsData, requestsData]) => {
        setProjects(projectsData);
        setJoinRequests(requestsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingRequests = joinRequests.filter((r) => r.status === 'PENDING');

  const totalDevelopers = projects.reduce((sum, p) => sum + (p.developer_count ?? 0), 0);

  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');
    api
      .createProject({ name: newProjectName.trim(), description: newProjectDesc.trim() || undefined })
      .then((created) => {
        setProjects((prev) => [created, ...prev]);
        setShowCreateModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        setCreateSuccess('Project created! Waiting for admin approval.');
        setTimeout(() => setCreateSuccess(''), 5000);
      })
      .catch((err: Error) => setCreateError(err.message))
      .finally(() => setCreating(false));
  };

  const handleResolve = (id: string, status: 'APPROVED' | 'REJECTED') => {
    api
      .resolveJoinRequest(id, status)
      .then(() => {
        setJoinRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r)),
        );
      })
      .catch(console.error);
  };

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
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-white/80 backdrop-blur-md h-16 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-on-surface tracking-tight">Manager Dashboard</span>
          <span className="text-on-surface-variant text-sm">/ {user?.organization_name || 'Organization'}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-container text-on-primary text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Project
          </button>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">notifications</span>
          </div>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Stats Row */}
        <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div {...staggerItem} className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-gray-200">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">My Projects</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-on-surface tracking-tighter">{projects.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">folder</span>
            </div>
          </motion.div>

          <motion.div {...staggerItem} className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-gray-200">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Developers</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-on-surface tracking-tighter">{totalDevelopers}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">group</span>
            </div>
          </motion.div>

          <motion.div {...staggerItem} className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-gray-200">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Pending Requests</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-on-surface tracking-tighter">{pendingRequests.length}</span>
                {pendingRequests.length > 0 && (
                  <span className="text-tertiary text-xs font-bold">Awaiting review</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">person_add</span>
            </div>
          </motion.div>

          <motion.div {...staggerItem} className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-gray-200">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Active API Keys</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-on-surface tracking-tighter">0</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">vpn_key</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Projects Grid */}
        <motion.div {...fadeUp(0.2)} className="mb-8">
          <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider mb-4">My Projects</h3>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface-container-low rounded-lg border border-gray-200">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/60">folder_open</span>
              <p className="text-sm text-on-surface-variant">No projects yet. Create your first project.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                New Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`bg-surface-container-low p-5 rounded-lg border transition-all group ${
                    project.status === 'PENDING'
                      ? 'border-amber-500/20 opacity-75'
                      : 'border-gray-200 hover:border-primary/20 cursor-pointer'
                  }`}
                  onClick={() => project.status === 'APPROVED' && navigate(`/manager/projects/${project.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-bold transition-colors ${
                      project.status === 'PENDING' ? 'text-on-surface-variant' : 'text-on-surface group-hover:text-primary'
                    }`}>{project.name}</h4>
                    <div className="flex items-center gap-1.5">
                      {project.status === 'PENDING' ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">Pending</span>
                        </>
                      ) : project.status === 'REJECTED' ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-error" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-error">Rejected</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-secondary" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Active</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        {project.developer_count}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {project.status === 'PENDING' ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60">
                        Awaiting Admin Approval
                      </span>
                    ) : project.status === 'REJECTED' ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-error/60">
                        Project Rejected
                      </span>
                    ) : (
                      <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-fixed-dim transition-colors">
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Join Requests */}
        <motion.div {...fadeUp(0.3)} className="bg-surface-container-low rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Pending Join Requests</h3>
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">{pendingRequests.length}</span>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/60 mb-2 block">inbox</span>
              <p className="text-sm text-on-surface-variant">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingRequests.map((req) => (
                <div key={req.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-container-high/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-bold">
                      {req.user_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{req.user_name}</p>
                      <p className="text-[10px] text-on-surface-variant">{req.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant mr-4">
                      Wants to join <span className="font-semibold text-on-surface">{req.project_name}</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant mr-4">
                      {new Date(req.requested_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleResolve(req.id, 'APPROVED')}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-secondary/10 text-secondary border border-secondary/20 rounded hover:bg-secondary/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleResolve(req.id, 'REJECTED')}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-error/10 text-error border border-error/20 rounded hover:bg-error/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Success Toast */}
      {createSuccess && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border bg-surface-container-high border-secondary/30 text-secondary text-sm font-semibold animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {createSuccess}
          <button onClick={() => setCreateSuccess('')} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-surface-container-high rounded-xl border border-gray-300 p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Create New Project</h3>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 -mt-2">Project will be sent to admin for approval.</p>
            {createError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-semibold">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Project Name
                </label>
                <input
                  className="block w-full py-3 px-4 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-outline/40"
                  placeholder="My New Project"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Description
                </label>
                <textarea
                  className="block w-full py-3 px-4 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-outline/40 resize-none"
                  placeholder="Brief description of the project..."
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-on-surface-variant border border-gray-300 rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-primary-container rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
