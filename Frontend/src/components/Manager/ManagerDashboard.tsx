import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { Project, ProjectDetail, JoinRequest, Log, DeveloperSearchResult } from '../../services/api';
import ProjectDetailDrawer from '../shared/ProjectDetailDrawer';

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

  // Project detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [drawerLogs, setDrawerLogs] = useState<Log[]>([]);
  const [devProfiles, setDevProfiles] = useState<DeveloperSearchResult[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback((isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    Promise.allSettled([api.getProjects(), api.getJoinRequests(), api.searchDevelopers('')])
      .then(([projectsRes, requestsRes, devsRes]) => {
        if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value);
        if (requestsRes.status === 'fulfilled') setJoinRequests(requestsRes.value);
        if (devsRes.status === 'fulfilled') setDevProfiles(devsRes.value);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  // Initial load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Auto-refresh every 30s to pick up approval changes
  useEffect(() => {
    const interval = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const devSkillsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    devProfiles.forEach(d => { map[d.id] = d.skills; });
    return map;
  }, [devProfiles]);

  const openProjectDrawer = async (projectId: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedProject(null);
    setDrawerLogs([]);
    const [detailRes, logsRes] = await Promise.allSettled([
      api.getProject(projectId),
      api.getProjectLogs(projectId, undefined, undefined, 30),
    ]);
    if (detailRes.status === 'fulfilled') setSelectedProject(detailRes.value);
    if (logsRes.status === 'fulfilled') setDrawerLogs(logsRes.value);
    setDrawerLoading(false);
  };

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
    <div className="text-on-surface font-body overflow-x-hidden min-h-screen">

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-surface-container-lowest/80 backdrop-blur-md h-16 border-b border-outline-variant/20">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-on-surface tracking-tight">Manager Dashboard</span>
          <span className="text-on-surface-variant text-sm">/ {user?.organization_name || 'Organization'}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-on-surface-variant hover:text-primary border border-outline-variant/20 hover:border-primary/20 text-sm font-bold rounded-lg transition-all disabled:opacity-50"
            title="Refresh dashboard"
          >
            <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
          </button>
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

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)]">

        {/* Greeting Section */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-on-surface">
            Hello, <span className="text-primary">{user?.full_name || 'Manager'}</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {user?.organization_name || 'Your Organization'} — Manager Dashboard
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div {...staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* My Projects */}
          <motion.div
            {...staggerItem}
            className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 rounded-xl relative overflow-hidden group border-l-4 border-primary border border-outline-variant/10"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">My Projects</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-primary tracking-tighter">{projects.length}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-primary">folder</span>
            </div>
          </motion.div>

          {/* Total Developers */}
          <motion.div
            {...staggerItem}
            className="bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent p-6 rounded-xl relative overflow-hidden group border-l-4 border-secondary border border-outline-variant/10"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Developers</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-secondary tracking-tighter">{totalDevelopers}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-secondary">group</span>
            </div>
          </motion.div>

          {/* Pending Requests */}
          <motion.div
            {...staggerItem}
            className="bg-gradient-to-br from-tertiary/20 via-tertiary/10 to-transparent p-6 rounded-xl relative overflow-hidden group border-l-4 border-tertiary border border-outline-variant/10"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Pending Requests</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-tertiary tracking-tighter">{pendingRequests.length}</span>
                {pendingRequests.length > 0 && (
                  <span className="text-tertiary text-xs font-bold">Awaiting review</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-tertiary">person_add</span>
            </div>
          </motion.div>

          {/* Active API Keys */}
          <motion.div
            {...staggerItem}
            className="bg-gradient-to-br from-error/20 via-error/10 to-transparent p-6 rounded-xl relative overflow-hidden group border-l-4 border-error border border-outline-variant/10"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Active API Keys</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-error tracking-tighter">0</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-error">vpn_key</span>
            </div>
          </motion.div>

        </motion.div>

        {/* Projects Grid */}
        <motion.div {...fadeUp(0.2)} className="mb-8">
          <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider mb-4">My Projects</h3>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
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
                  className={`bg-surface-container-low rounded-2xl overflow-hidden border transition-all group ${
                    project.status === 'PENDING'
                      ? 'border-tertiary/20 opacity-80'
                      : project.status === 'REJECTED'
                      ? 'border-error/20 opacity-75'
                      : 'border-outline-variant/20 hover:border-primary/30 cursor-pointer hover:shadow-lg hover:shadow-primary/5'
                  }`}
                  onClick={() => project.status === 'APPROVED' && openProjectDrawer(project.id)}
                >
                  {/* Colored top strip based on status */}
                  <div
                    className={`h-1.5 w-full ${
                      project.status === 'APPROVED'
                        ? 'bg-gradient-to-r from-secondary/60 to-primary/40'
                        : project.status === 'PENDING'
                        ? 'bg-gradient-to-r from-tertiary/60 to-tertiary/30'
                        : 'bg-gradient-to-r from-error/60 to-error/30'
                    }`}
                  />

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-sm font-bold transition-colors ${
                        project.status === 'PENDING'
                          ? 'text-on-surface-variant'
                          : project.status === 'REJECTED'
                          ? 'text-on-surface-variant'
                          : 'text-on-surface group-hover:text-primary'
                      }`}>{project.name}</h4>
                      <div className="flex items-center gap-1.5">
                        {project.status === 'PENDING' ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary">Pending</span>
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
                      <div className="flex items-center gap-2">
                        {/* Developer count badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          project.status === 'APPROVED'
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-xs">person</span>
                          {project.developer_count}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-outline-variant/20">
                      {project.status === 'PENDING' ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary/70">
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
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Join Requests */}
        <motion.div {...fadeUp(0.3)} className="bg-surface-container-low rounded-2xl border border-outline-variant/20 overflow-hidden">
          {/* Colorful header with tertiary color */}
          <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-gradient-to-r from-tertiary/10 via-tertiary/5 to-transparent">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-tertiary">person_add</span>
              <h3 className="text-sm font-semibold text-tertiary uppercase tracking-wider">Pending Join Requests</h3>
            </div>
            <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 border border-tertiary/20 px-2 py-1 rounded-full">
              {pendingRequests.length}
            </span>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/60 mb-2 block">inbox</span>
              <p className="text-sm text-on-surface-variant">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {pendingRequests.map((req) => (
                <div key={req.id} className="px-6 py-4 flex items-center justify-between hover:bg-surface-container-high/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tertiary/20 to-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary font-bold text-sm">
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
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-secondary/10 text-secondary border border-secondary/20 rounded-lg hover:bg-secondary/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleResolve(req.id, 'REJECTED')}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors"
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

      {/* Project Detail Drawer */}
      <ProjectDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        project={selectedProject}
        loading={drawerLoading}
        logs={drawerLogs}
        devSkillsMap={devSkillsMap}
        onManage={selectedProject ? () => navigate(`/manager/projects/${selectedProject.id}`) : undefined}
      />

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/30 p-8 w-full max-w-md shadow-2xl">
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
                  className="flex-1 py-2.5 text-sm font-bold text-on-surface-variant border border-outline-variant/30 rounded-lg hover:bg-surface-container-highest transition-colors"
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
