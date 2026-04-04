import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { Project, OrgMember } from '../../services/api';

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
    if (!orgId) return;
    try {
      const [proj, mem] = await Promise.all([
        api.getOrgProjects(orgId),
        api.getOrgMembers(orgId),
      ]);
      setProjects(proj);
      setMembers(mem);
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
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white tracking-tight">Settings</span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">{user?.organization_name ?? 'Organization'}</span>
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
        <div className="flex items-center gap-1 mb-8 p-1 bg-surface-container-low rounded-xl border border-white/5 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-base">{t.icon}</span>
              {t.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                tab === t.key ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-slate-500'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Projects Tab */}
        {tab === 'projects' && (
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Project</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Developers</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Created</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">No projects</td></tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="group hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{project.name}</p>
                          {project.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 max-w-xs">{project.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-highest rounded-lg w-fit">
                          <span className="material-symbols-outlined text-xs text-tertiary">code</span>
                          <span className="text-xs font-bold text-white">{project.developer_count}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">{formatDate(project.created_at)}</span>
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
                              className="text-[10px] font-bold text-slate-400 px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(project.id)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
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
          </div>
        )}

        {/* Managers Tab */}
        {tab === 'managers' && (
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Manager</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {managers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">No managers</td></tr>
                ) : (
                  managers.map((mgr) => (
                    <tr key={mgr.id} className="group hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary font-bold text-sm">
                            {mgr.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{mgr.full_name}</p>
                            <p className="text-[10px] text-slate-500">{mgr.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${mgr.is_active ? 'bg-secondary' : 'bg-slate-500'}`} />
                          <span className="text-xs text-slate-300">{mgr.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">{formatDate(mgr.created_at)}</span>
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
                                className="text-[10px] font-bold text-slate-400 px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(mgr.id)}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
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
          </div>
        )}

        {/* Developers Tab */}
        {tab === 'developers' && (
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Developer</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {developers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">No developers</td></tr>
                ) : (
                  developers.map((dev) => (
                    <tr key={dev.id} className="group hover:bg-surface-container-high transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary font-bold text-sm">
                            {dev.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{dev.full_name}</p>
                            <p className="text-[10px] text-slate-500">{dev.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${dev.is_active ? 'bg-secondary' : 'bg-slate-500'}`} />
                          <span className="text-xs text-slate-300">{dev.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">{formatDate(dev.created_at)}</span>
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
                                className="text-[10px] font-bold text-slate-400 px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(dev.id)}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
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
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSettingsPage;
