import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type { Project, Organization, JoinRequest } from '../../services/api';

const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── State ────────────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(true);

  // ── Data fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    api
      .getProjects()
      .then(setProjects)
      .catch((e: Error) => setProjectsError(e.message))
      .finally(() => setProjectsLoading(false));

    api
      .getOrganizations()
      .then(setOrgs)
      .catch(() => {})
      .finally(() => setOrgsLoading(false));

    api
      .getJoinRequests()
      .then(setJoinRequests)
      .catch(() => {})
      .finally(() => setJoinRequestsLoading(false));
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const pendingRequestCount = joinRequests.filter((r) => r.status === 'PENDING').length;
  const isLoading = projectsLoading || orgsLoading || joinRequestsLoading;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const previewProjects = projects.slice(0, 3);
  const previewOrgs = orgs.slice(0, 3);

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white tracking-tight">Developer Dashboard</span>
          <span className="text-slate-600 text-sm">
            / Welcome back, {user?.full_name?.split(' ')[0] || 'Developer'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">
            notifications
          </span>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Error banner */}
        {projectsError && (
          <div className="mb-6 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-sm">error</span>
            <span className="text-sm text-error">{projectsError}</span>
          </div>
        )}

        {/* API Key section */}
        <div className="bg-surface-container-low rounded-lg p-5 border border-white/5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">vpn_key</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                API Keys
              </p>
              <p className="text-sm text-slate-400">
                API keys are managed per-project. Select a project to view its logs.
              </p>
            </div>
          </div>
          <Link
            to="/developer/projects"
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-sm font-bold text-slate-300 hover:text-white rounded-lg transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">folder_open</span>
            My Projects
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Assigned Projects */}
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                Assigned Projects
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">
                  {projects.length}
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">folder</span>
            </div>
          </div>

          {/* Total Developers */}
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                Team Members
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">
                  {projects.reduce((sum, p) => sum + (p.developer_count ?? 0), 0)}
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">group</span>
            </div>
          </div>

          {/* Organizations */}
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                Organizations
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">
                  {new Set(projects.map((p) => p.organization_id).filter(Boolean)).size}
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">corporate_fare</span>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">
                Pending Requests
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">
                  {pendingRequestCount}
                </span>
                {pendingRequestCount > 0 && (
                  <span className="text-tertiary text-xs font-bold">awaiting</span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">person_add</span>
            </div>
          </div>
        </div>

        {/* My Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">My Projects</h3>
            {projects.length > 3 && (
              <Link
                to="/developer/projects"
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                View all {projects.length}
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </Link>
            )}
          </div>

          {projects.length === 0 && !projectsError && (
            <div className="bg-surface-container-low rounded-xl border border-white/5 p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">
                folder_open
              </span>
              <p className="text-sm text-slate-500 mb-3">No projects assigned yet.</p>
              <Link
                to="/developer/browse"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">explore</span>
                Browse Projects
              </Link>
            </div>
          )}

          {previewProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-surface-container-low p-5 rounded-lg border border-white/5 hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {project.name}
                    </h4>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                    {project.organization_name ?? 'Unknown Org'}
                  </p>

                  {project.description && (
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-1 mb-4 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">group</span>
                      <span>
                        {project.developer_count ?? 0} developer
                        {project.developer_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">calendar_today</span>
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <button
                      onClick={() => navigate(`/developer/projects/${project.id}/logs`)}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      View Logs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Browse Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Organizations
            </h3>
            <Link
              to="/developer/browse"
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Browse all
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </Link>
          </div>

          {orgsLoading && (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-slate-500">Loading organizations…</span>
            </div>
          )}

          {!orgsLoading && previewOrgs.length === 0 && (
            <div className="bg-surface-container-low rounded-xl border border-white/5 p-8 text-center">
              <span className="text-sm text-slate-500">No organizations found.</span>
            </div>
          )}

          {previewOrgs.length > 0 && (
            <div className="space-y-2">
              {previewOrgs.map((org) => (
                <Link
                  key={org.id}
                  to="/developer/browse"
                  className="block bg-surface-container-low rounded-lg border border-white/5 px-5 py-4 hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-surface-container-highest rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">
                        corporate_fare
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                        {org.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {org.member_count} member{org.member_count !== 1 ? 's' : ''} &middot;{' '}
                        {org.project_count} project{org.project_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-600 group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DeveloperDashboard;
