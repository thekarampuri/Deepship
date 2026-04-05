import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { Project, OrgMember } from '../../services/api';

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

type Tab = 'projects' | 'managers' | 'developers';

const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  const [tab, setTab] = useState<Tab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [proj, mem] = await Promise.allSettled([
        orgId ? api.getOrgProjects(orgId) : Promise.resolve([]),
        api.getOrgMembers(),
      ]);
      if (proj.status === 'fulfilled') setProjects(proj.value);
      else console.warn('Failed to load projects:', proj.reason);
      if (mem.status === 'fulfilled') setMembers(mem.value);
      else console.warn('Failed to load members:', mem.reason);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [orgId]);

  const handleDeleteProject = async (projectId: string) => {
    setActionLoading(projectId);
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setConfirmDelete(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete project');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api.deactivateUser(userId);
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, is_active: false } : m));
      setConfirmDelete(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to deactivate user');
    } finally {
      setActionLoading(null);
    }
  };

  const managers = members.filter((m) => m.role === 'MANAGER');
  const developers = members.filter((m) => m.role === 'DEVELOPER');

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: 'projects', label: 'Projects', icon: 'folder', count: projects.length },
    { key: 'managers', label: 'Managers', icon: 'assignment_ind', count: managers.length },
    { key: 'developers', label: 'Developers', icon: 'code', count: developers.length },
  ];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

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
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-on-surface tracking-tight">Settings</span>
          <span className="text-on-surface-variant/40">/</span>
          <span className="text-sm text-on-surface-variant">{user?.organization_name ?? 'Organization'}</span>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-error/60 hover:text-error">dismiss</button>
          </div>
        )}

        {/* Tab Switcher */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-1 mb-8 p-1 bg-surface-container-low rounded-xl border border-outline-variant/20 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                tab === t.key ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-on-surface-variant'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Projects Tab */}
        {tab === 'projects' && (
          <motion.div {...fadeUp(0.1)} className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Project</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Developers</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Created</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-on-surface-variant">No projects</td></tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="group hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{project.name}</p>
                          {project.description && (
                            <p className="text-[10px] text-on-surface-variant line-clamp-1 max-w-xs">{project.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest rounded-lg w-fit">
                          <span className="material-symbols-outlined text-xs text-tertiary">code</span>
                          <span className="text-xs font-bold text-on-surface">{project.developer_count}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-on-surface-variant">{formatDate(project.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {confirmDelete === project.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              disabled={actionLoading === project.id}
                              className="text-[10px] font-bold text-error bg-error/10 px-3 py-1.5 rounded hover:bg-error/20 transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-[10px] font-bold text-on-surface-variant px-3 py-1.5 rounded hover:bg-surface-container-high transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(project.id)}
                            className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Managers Tab */}
        {tab === 'managers' && (
          <motion.div {...fadeUp(0.1)} className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Manager</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {managers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-on-surface-variant">No managers</td></tr>
                ) : (
                  managers.map((mgr) => (
                    <tr key={mgr.id} className="group hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary font-bold text-sm">
                            {mgr.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{mgr.full_name}</p>
                            <p className="text-[10px] text-on-surface-variant">{mgr.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${mgr.is_active ? 'bg-secondary' : 'bg-gray-400'}`} />
                          <span className="text-xs text-on-surface-variant">{mgr.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-on-surface-variant">{formatDate(mgr.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {mgr.is_active && (
                          confirmDelete === mgr.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeactivateUser(mgr.id)}
                                disabled={actionLoading === mgr.id}
                                className="text-[10px] font-bold text-error bg-error/10 px-3 py-1.5 rounded hover:bg-error/20 transition-colors disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-[10px] font-bold text-on-surface-variant px-3 py-1.5 rounded hover:bg-surface-container-high transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(mgr.id)}
                              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-sm">person_remove</span>
                              Deactivate
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Developers Tab */}
        {tab === 'developers' && (
          <motion.div {...fadeUp(0.1)} className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/20 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Developer</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {developers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-on-surface-variant">No developers</td></tr>
                ) : (
                  developers.map((dev) => (
                    <tr key={dev.id} className="group hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary font-bold text-sm">
                            {dev.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{dev.full_name}</p>
                            <p className="text-[10px] text-on-surface-variant">{dev.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${dev.is_active ? 'bg-secondary' : 'bg-gray-400'}`} />
                          <span className="text-xs text-on-surface-variant">{dev.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-on-surface-variant">{formatDate(dev.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {dev.is_active && (
                          confirmDelete === dev.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeactivateUser(dev.id)}
                                disabled={actionLoading === dev.id}
                                className="text-[10px] font-bold text-error bg-error/10 px-3 py-1.5 rounded hover:bg-error/20 transition-colors disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-[10px] font-bold text-on-surface-variant px-3 py-1.5 rounded hover:bg-surface-container-high transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(dev.id)}
                              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-sm">person_remove</span>
                              Deactivate
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminSettingsPage;
