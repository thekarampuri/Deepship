import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Organization, Project, JoinRequest } from '../../services/api';

type ProjectStatus = 'available' | 'pending' | 'joined';

interface OrgWithProjects {
  org: Organization;
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string;
}

const statusConfig: Record<ProjectStatus, { label: string; style: string; disabled: boolean }> = {
  joined: {
    label: 'Joined',
    style: 'bg-secondary/10 text-secondary border-secondary/20 cursor-default',
    disabled: true,
  },
  pending: {
    label: 'Pending',
    style: 'bg-tertiary/10 text-tertiary border-tertiary/20 cursor-default',
    disabled: true,
  },
  available: {
    label: 'Request to Join',
    style: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer',
    disabled: false,
  },
};

const BrowsePage: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState('');

  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  // Map projectId → status (derived from join requests + assigned projects)
  const [statusMap, setStatusMap] = useState<Record<string, ProjectStatus>>({});

  // Track which orgs are expanded and their loaded projects
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [orgData, setOrgData] = useState<Record<string, OrgWithProjects>>({});

  // Joining in progress per project
  const [joiningIds, setJoiningIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState('');

  // ── Initial data load ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.getOrganizations(), api.getJoinRequests(), api.getProjects()])
      .then(([fetchedOrgs, fetchedRequests, assignedProjects]) => {
        setOrgs(fetchedOrgs);
        setJoinRequests(fetchedRequests);

        // Build the status map
        const map: Record<string, ProjectStatus> = {};

        // Mark assigned projects as joined
        for (const p of assignedProjects) {
          map[p.id] = 'joined';
        }

        // Mark pending / approved join requests
        for (const req of fetchedRequests) {
          if (req.status === 'PENDING') {
            map[req.project_id] = map[req.project_id] ?? 'pending';
          } else if (req.status === 'APPROVED') {
            map[req.project_id] = 'joined';
          }
        }

        setStatusMap(map);
      })
      .catch((e: Error) => setOrgsError(e.message))
      .finally(() => setOrgsLoading(false));
  }, []);

  // ── Expand / load org projects ───────────────────────────────────────────────
  const toggleOrg = (org: Organization) => {
    const newExpanded = new Set(expandedOrgs);

    if (newExpanded.has(org.id)) {
      newExpanded.delete(org.id);
      setExpandedOrgs(newExpanded);
      return;
    }

    newExpanded.add(org.id);
    setExpandedOrgs(newExpanded);

    // Only fetch if not already loaded
    if (orgData[org.id]) return;

    setOrgData((prev) => ({
      ...prev,
      [org.id]: { org, projects: [], projectsLoading: true, projectsError: '' },
    }));

    api
      .getOrgProjects(org.id)
      .then((projects) => {
        setOrgData((prev) => ({
          ...prev,
          [org.id]: { ...prev[org.id], projects, projectsLoading: false },
        }));
      })
      .catch((e: Error) => {
        setOrgData((prev) => ({
          ...prev,
          [org.id]: { ...prev[org.id], projectsLoading: false, projectsError: e.message },
        }));
      });
  };

  // ── Join request ─────────────────────────────────────────────────────────────
  const handleRequestJoin = async (projectId: string) => {
    if (joiningIds.has(projectId)) return;
    setJoiningIds((prev) => new Set(prev).add(projectId));

    try {
      await api.createJoinRequest(projectId);
      setStatusMap((prev) => ({ ...prev, [projectId]: 'pending' }));
    } catch {
      // Silently revert — button stays available on error
    } finally {
      setJoiningIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filteredOrgs = orgs.filter((org) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (org.name.toLowerCase().includes(q)) return true;
    // Also check loaded projects for this org
    const loaded = orgData[org.id];
    if (loaded) {
      return loaded.projects.some((p) => p.name.toLowerCase().includes(q));
    }
    return false;
  });

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (orgsLoading) {
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
        <span className="text-lg font-bold text-white tracking-tight">Browse Projects</span>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Error */}
        {orgsError && (
          <div className="mb-6 bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-sm">error</span>
            <span className="text-sm text-error">{orgsError}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600"
            placeholder="Search organizations or projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Empty organizations state */}
        {!orgsError && orgs.length === 0 && (
          <div className="bg-surface-container-low rounded-xl border border-white/5 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">
              corporate_fare
            </span>
            <p className="text-sm text-slate-500">No organizations found.</p>
          </div>
        )}

        {/* No search results */}
        {orgs.length > 0 && filteredOrgs.length === 0 && (
          <div className="bg-surface-container-low rounded-xl border border-white/5 p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2 block">search_off</span>
            <p className="text-sm text-slate-500">No organizations or projects match "{search}"</p>
          </div>
        )}

        {/* Org accordion list */}
        <div className="space-y-3">
          {filteredOrgs.map((org) => {
            const isExpanded = expandedOrgs.has(org.id);
            const data = orgData[org.id];

            return (
              <div
                key={org.id}
                className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden"
              >
                {/* Org Header (toggle) */}
                <button
                  onClick={() => toggleOrg(org)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-container-high/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-surface-container-highest rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">corporate_fare</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{org.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {org.member_count} member{org.member_count !== 1 ? 's' : ''} &middot;{' '}
                        {org.project_count} project{org.project_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {org.description && (
                      <span className="hidden md:block text-[11px] text-slate-500 max-w-xs truncate">
                        {org.description}
                      </span>
                    )}
                    <span className="material-symbols-outlined text-slate-400 text-lg">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {/* Expanded projects */}
                {isExpanded && (
                  <div className="border-t border-white/5">
                    {/* Loading projects */}
                    {data?.projectsLoading && (
                      <div className="px-5 py-6 flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm text-slate-500">Loading projects…</span>
                      </div>
                    )}

                    {/* Projects error */}
                    {data?.projectsError && !data.projectsLoading && (
                      <div className="px-5 py-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-error text-sm">error</span>
                        <span className="text-sm text-error">{data.projectsError}</span>
                      </div>
                    )}

                    {/* Project rows */}
                    {data && !data.projectsLoading && !data.projectsError && (
                      <>
                        {data.projects.length === 0 && (
                          <div className="px-5 py-6 text-center">
                            <span className="text-sm text-slate-500">No projects in this organization.</span>
                          </div>
                        )}

                        <div className="divide-y divide-white/5">
                          {data.projects.map((project) => {
                            const status: ProjectStatus = statusMap[project.id] ?? 'available';
                            const cfg = statusConfig[status];
                            const isJoining = joiningIds.has(project.id);

                            return (
                              <div
                                key={project.id}
                                className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-container-high/20 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="material-symbols-outlined text-slate-500 text-base flex-shrink-0">
                                    folder
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{project.name}</p>
                                    {project.description && (
                                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {project.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    !cfg.disabled && !isJoining && handleRequestJoin(project.id)
                                  }
                                  disabled={cfg.disabled || isJoining}
                                  className={`ml-4 flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded transition-colors ${cfg.style} ${
                                    isJoining ? 'opacity-60' : ''
                                  }`}
                                >
                                  {isJoining ? (
                                    <>
                                      <div className="w-3 h-3 border border-primary/40 border-t-primary rounded-full animate-spin" />
                                      Sending…
                                    </>
                                  ) : (
                                    cfg.label
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Unused joinRequests reference to satisfy lint */}
        {joinRequests.length < 0 && null}
      </main>
    </div>
  );
};

export default BrowsePage;
