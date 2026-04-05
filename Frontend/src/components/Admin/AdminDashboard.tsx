import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import type {
  Project,
  ProjectDetail,
  OrgMember,
  JoinRequest,
  Log,
  DeveloperSearchResult,
  Member,
} from '../../services/api';
import ProjectDetailDrawer from '../shared/ProjectDetailDrawer';

// ─── Animation helpers ────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'projects' | 'team' | 'requests';
type TeamSubTab = 'developers' | 'managers';

interface FullDeveloper {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  role: string;
  skills: string[];
  project_count: number;
}

interface DeleteConfirm {
  type: 'project' | 'user';
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return ts;
  }
}

function statusDotClass(status?: string): string {
  switch (status) {
    case 'APPROVED': return 'bg-secondary';
    case 'PENDING':  return 'bg-tertiary';
    case 'REJECTED': return 'bg-error';
    default:         return 'bg-secondary';
  }
}

function statusLabel(status?: string): string {
  if (!status) return 'Active';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  // ── Existing state ──
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ── New state ──
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [devProfiles, setDevProfiles] = useState<DeveloperSearchResult[]>([]);

  // ── Tab navigation ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects');
  const [teamSubTab, setTeamSubTab] = useState<TeamSubTab>('developers');

  // ── Developer expand ──
  const [expandedDevId, setExpandedDevId] = useState<string | null>(null);
  const [devProjectsCache, setDevProjectsCache] = useState<Map<string, Project[]>>(new Map());
  const [devProjectsLoading, setDevProjectsLoading] = useState<string | null>(null);

  // ── Project drawer ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [drawerLogs, setDrawerLogs] = useState<Log[]>([]);

  // ── Delete modal ──
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Toast ──
  const [toast, setToast] = useState('');

  // ─── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    Promise.allSettled([
      api.getOrgProjects(orgId),
      api.getOrgMembers(),
      api.getOrgPendingRequests(),
      api.getMembers(),
      api.searchDevelopers(''),
    ]).then(([projResult, memResult, reqResult, allMembersResult, devProfilesResult]) => {
      if (projResult.status === 'fulfilled') setProjects(projResult.value);
      if (memResult.status === 'fulfilled') setMembers(memResult.value);
      if (reqResult.status === 'fulfilled') setPendingRequests(reqResult.value);
      if (allMembersResult.status === 'fulfilled') setAllMembers(allMembersResult.value);
      if (devProfilesResult.status === 'fulfilled') setDevProfiles(devProfilesResult.value);
    }).finally(() => setLoading(false));
  }, [orgId]);

  // ─── Derived / Memos ────────────────────────────────────────────────────────

  const managers = members.filter((m) => m.role === 'MANAGER');
  const developers = members.filter((m) => m.role === 'DEVELOPER');
  const q = searchQuery.toLowerCase();

  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(q));
  const filteredMembers = members.filter(
    (m) => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
  );

  const fullDevelopers: FullDeveloper[] = useMemo(() => {
    const orgDevs = members.filter((m) => m.role === 'DEVELOPER');
    return orgDevs.map((m) => {
      const profile = devProfiles.find((d) => d.id === m.id);
      const detail = allMembers.find((d) => d.id === m.id);
      return {
        id: m.id,
        email: m.email,
        full_name: m.full_name,
        is_active: m.is_active,
        created_at: m.created_at,
        role: m.role,
        skills: profile?.skills ?? [],
        project_count: Number(detail?.project_count ?? 0),
      };
    });
  }, [members, devProfiles, allMembers]);

  const filteredDevelopers = fullDevelopers.filter(
    (d) => d.full_name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q),
  );

  const filteredManagers = managers.filter(
    (m) => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
  );

  const devSkillsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    devProfiles.forEach((d) => { map[d.id] = d.skills; });
    return map;
  }, [devProfiles]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

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

  const toggleDevExpand = async (devId: string) => {
    if (expandedDevId === devId) {
      setExpandedDevId(null);
      return;
    }
    setExpandedDevId(devId);
    if (!devProjectsCache.has(devId)) {
      setDevProjectsLoading(devId);
      try {
        const projs = await api.getUserProjects(devId);
        setDevProjectsCache((prev) => new Map(prev).set(devId, projs));
      } catch {
        setDevProjectsCache((prev) => new Map(prev).set(devId, []));
      } finally {
        setDevProjectsLoading(null);
      }
    }
  };

  const confirmDelete = (type: 'project' | 'user', id: string, name: string) => {
    setDeleteError('');
    setDeleteConfirm({ type, id, name });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (deleteConfirm.type === 'project') {
        await api.deleteProject(deleteConfirm.id);
        setProjects((prev) => prev.filter((p) => p.id !== deleteConfirm.id));
        if (selectedProject?.id === deleteConfirm.id) {
          setDrawerOpen(false);
          setSelectedProject(null);
        }
      } else {
        await api.deactivateUser(deleteConfirm.id);
        setMembers((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
        setAllMembers((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      }
      setDeleteConfirm(null);
      showToast(
        deleteConfirm.type === 'project' ? 'Project deleted successfully' : 'User removed successfully',
      );
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.resolveJoinRequest(requestId, 'APPROVED');
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast('Request approved');
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.resolveJoinRequest(requestId, 'REJECTED');
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast('Request rejected');
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tabs: { key: ActiveTab; label: React.ReactNode }[] = [
    {
      key: 'projects',
      label: (
        <span className="flex items-center gap-1.5">
          Projects
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-current/10 opacity-70">
            {filteredProjects.length}
          </span>
        </span>
      ),
    },
    {
      key: 'team',
      label: (
        <span className="flex items-center gap-1.5">
          Team
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-current/10 opacity-70">
            {filteredMembers.length}
          </span>
        </span>
      ),
    },
    {
      key: 'requests',
      label: (
        <span className="flex items-center gap-1.5">
          Requests
          {pendingRequests.length > 0 ? (
            <span className="flex items-center gap-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-current/10 opacity-70">
                {pendingRequests.length}
              </span>
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-current/10 opacity-70">
              0
            </span>
          )}
        </span>
      ),
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="text-on-surface font-body overflow-x-hidden min-h-screen">

      {/* ── Top Bar ── */}
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

        {/* ── Greeting Section ── */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <h1 className="text-3xl font-black text-on-surface tracking-tight leading-tight">
            Hello, <span className="text-primary">{user?.full_name ?? 'Admin'}</span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {today}
            {user?.organization_id && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                {user.organization_id}
              </span>
            )}
          </p>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          {...staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Projects */}
          <motion.div
            {...staggerItem}
            className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 rounded-2xl relative overflow-hidden group border-l-4 border-primary border border-primary/10"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-primary/70 tracking-widest uppercase mb-2">Total Projects</p>
              <span className="text-4xl font-black text-primary tracking-tighter">{projects.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '5rem' }}>folder</span>
            </div>
            <span className="absolute top-4 right-4 material-symbols-outlined text-primary text-xl opacity-60">folder</span>
          </motion.div>

          {/* Managers */}
          <motion.div
            {...staggerItem}
            className="bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent p-6 rounded-2xl relative overflow-hidden group border-l-4 border-secondary border border-secondary/10"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-secondary/70 tracking-widest uppercase mb-2">Managers</p>
              <span className="text-4xl font-black text-secondary tracking-tighter">{managers.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '5rem' }}>assignment_ind</span>
            </div>
            <span className="absolute top-4 right-4 material-symbols-outlined text-secondary text-xl opacity-60">assignment_ind</span>
          </motion.div>

          {/* Developers */}
          <motion.div
            {...staggerItem}
            className="bg-gradient-to-br from-tertiary/20 via-tertiary/10 to-transparent p-6 rounded-2xl relative overflow-hidden group border-l-4 border-tertiary border border-tertiary/10"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-tertiary/70 tracking-widest uppercase mb-2">Developers</p>
              <span className="text-4xl font-black text-tertiary tracking-tighter">{developers.length}</span>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: '5rem' }}>code</span>
            </div>
            <span className="absolute top-4 right-4 material-symbols-outlined text-tertiary text-xl opacity-60">code</span>
          </motion.div>

          {/* Pending Requests */}
          <motion.div
            {...staggerItem}
            className="bg-gradient-to-br from-error/20 via-error/10 to-transparent p-6 rounded-2xl relative overflow-hidden group border-l-4 border-error border border-error/10"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-error/70 tracking-widest uppercase mb-2">Pending Requests</p>
              <span
                className={`text-4xl font-black tracking-tighter ${
                  pendingRequests.length > 0 ? 'text-amber-400 animate-pulse' : 'text-error'
                }`}
              >
                {pendingRequests.length}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-error" style={{ fontSize: '5rem' }}>pending_actions</span>
            </div>
            <span className="absolute top-4 right-4 material-symbols-outlined text-error text-xl opacity-60">pending_actions</span>
          </motion.div>
        </motion.div>

        {/* ── Tab Navigation ── */}
        <motion.div {...fadeUp(0.15)}>
          <div className="flex items-center gap-1 mb-6 bg-surface-container-low rounded-xl p-1 w-fit border border-outline-variant/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Projects Tab ── */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">folder_open</span>
                  <p className="text-sm text-on-surface-variant">No projects found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => openProjectDrawer(project.id)}
                      className="bg-surface-container-high rounded-xl border border-outline-variant/20 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                    >
                      {/* Top color strip */}
                      <div className="h-1 bg-gradient-to-r from-primary/60 to-secondary/40" />

                      <div className="p-4">
                        {/* Card header */}
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors leading-tight flex-1 min-w-0 pr-2">
                            {project.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete('project', project.id, project.name);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-error/10 text-error flex-shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>

                        {/* Description */}
                        {project.description && (
                          <p className="text-[10px] text-on-surface-variant mb-3 line-clamp-1">
                            {project.description}
                          </p>
                        )}

                        {/* Footer row */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-primary/60">person</span>
                              {project.developer_count} dev{project.developer_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusDotClass(project.status)}`} />
                            <span>{statusLabel(project.status)}</span>
                          </div>
                        </div>

                        {/* Created date */}
                        <p className="text-[9px] text-on-surface-variant/50 mt-2 font-mono">
                          {formatDate(project.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Team Tab ── */}
          {activeTab === 'team' && (
            <motion.div
              key="team-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Sub-tab pills */}
              <div className="flex gap-2 mb-5">
                {(['developers', 'managers'] as TeamSubTab[]).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setTeamSubTab(sub)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      teamSubTab === sub
                        ? 'bg-tertiary text-on-tertiary'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {sub === 'developers'
                      ? `Developers (${filteredDevelopers.length})`
                      : `Managers (${filteredManagers.length})`}
                  </button>
                ))}
              </div>

              {/* ── Developers section ── */}
              {teamSubTab === 'developers' && (
                <div className="space-y-3">
                  {filteredDevelopers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">code</span>
                      <p className="text-sm text-on-surface-variant">No developers found</p>
                    </div>
                  ) : (
                    filteredDevelopers.map((dev) => (
                      <div
                        key={dev.id}
                        className="bg-surface-container-high rounded-xl border border-outline-variant/20 overflow-hidden"
                      >
                        {/* Card header row */}
                        <div className="p-4 flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center font-black text-sm flex-shrink-0">
                            {dev.full_name.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-on-surface truncate">{dev.full_name}</span>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dev.is_active ? 'bg-secondary' : 'bg-outline-variant'}`} />
                            </div>
                            <p className="text-[10px] text-on-surface-variant truncate">{dev.email}</p>
                            {/* Skills chips */}
                            {dev.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {dev.skills.slice(0, 4).map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-1.5 py-0.5 bg-tertiary/10 text-tertiary text-[9px] font-bold rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {dev.skills.length > 4 && (
                                  <span className="px-1.5 py-0.5 bg-surface-container-highest text-on-surface-variant text-[9px] rounded-full">
                                    +{dev.skills.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: project count + expand + delete */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-full">
                              {dev.project_count} project{dev.project_count !== 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={() => toggleDevExpand(dev.id)}
                              className="p-1.5 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant"
                            >
                              <span
                                className={`material-symbols-outlined text-sm transition-transform ${
                                  expandedDevId === dev.id ? 'rotate-180' : ''
                                }`}
                              >
                                expand_more
                              </span>
                            </button>
                            <button
                              onClick={() => confirmDelete('user', dev.id, dev.full_name)}
                              className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">person_remove</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable projects section */}
                        <AnimatePresence>
                          {expandedDevId === dev.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-outline-variant/10 px-4 py-3 bg-surface-container-low">
                                {devProjectsLoading === dev.id ? (
                                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                    <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                                    Loading projects...
                                  </div>
                                ) : (devProjectsCache.get(dev.id) ?? []).length === 0 ? (
                                  <p className="text-xs text-on-surface-variant">No projects assigned</p>
                                ) : (
                                  <div className="space-y-2">
                                    {(devProjectsCache.get(dev.id) ?? []).map((p) => (
                                      <div
                                        key={p.id}
                                        onClick={() => openProjectDrawer(p.id)}
                                        className="flex items-center gap-2 text-xs cursor-pointer hover:text-primary transition-colors group/proj"
                                      >
                                        <span className="material-symbols-outlined text-sm text-primary/60 group-hover/proj:text-primary">
                                          folder
                                        </span>
                                        <span className="font-medium text-on-surface group-hover/proj:text-primary">
                                          {p.name}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary ml-auto flex-shrink-0" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── Managers section ── */}
              {teamSubTab === 'managers' && (
                <div className="space-y-3">
                  {filteredManagers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">assignment_ind</span>
                      <p className="text-sm text-on-surface-variant">No managers found</p>
                    </div>
                  ) : (
                    filteredManagers.map((mgr) => (
                      <div
                        key={mgr.id}
                        className="bg-surface-container-high rounded-xl border border-outline-variant/20 overflow-hidden"
                      >
                        <div className="p-4 flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-black text-sm flex-shrink-0">
                            {mgr.full_name.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-on-surface truncate">{mgr.full_name}</span>
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mgr.is_active ? 'bg-secondary' : 'bg-outline-variant'}`} />
                            </div>
                            <p className="text-[10px] text-on-surface-variant truncate">{mgr.email}</p>
                            <p className="text-[9px] text-on-surface-variant/50 mt-0.5 font-mono">
                              Joined {formatDate(mgr.created_at)}
                            </p>
                          </div>

                          {/* Right: role badge + delete */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-1 rounded-full uppercase tracking-wider">
                              Manager
                            </span>
                            <button
                              onClick={() => confirmDelete('user', mgr.id, mgr.full_name)}
                              className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">person_remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Pending Requests Tab ── */}
          {activeTab === 'requests' && (
            <motion.div
              key="requests-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">pending_actions</span>
                  <p className="text-sm text-on-surface-variant">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-surface-container-high rounded-xl border border-outline-variant/20 p-4 flex items-center gap-4"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center font-black text-sm flex-shrink-0">
                        {req.user_name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-on-surface truncate block">{req.user_name}</span>
                        <p className="text-[10px] text-on-surface-variant truncate">{req.user_email}</p>
                        {req.organization_name && (
                          <p className="text-[10px] text-primary/70 mt-0.5 font-medium">
                            Org: {req.organization_name}
                          </p>
                        )}
                        <p className="text-[9px] text-on-surface-variant/50 mt-0.5 font-mono">
                          {formatDate(req.requested_at)}
                        </p>
                      </div>

                      {/* Role badge */}
                      {req.user_role && (
                        <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                          {req.user_role}
                        </span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/15 text-secondary text-xs font-bold hover:bg-secondary/25 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-bold hover:bg-error/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* ── Project Detail Drawer ── */}
      <ProjectDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        project={selectedProject}
        loading={drawerLoading}
        logs={drawerLogs}
        devSkillsMap={devSkillsMap}
        onDelete={
          selectedProject
            ? () => confirmDelete('project', selectedProject.id, selectedProject.name)
            : undefined
        }
      />

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-container-high rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-outline-variant/20 mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Confirm Remove</h3>
                  <p className="text-xs text-on-surface-variant">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-on-surface mb-5">
                {deleteConfirm.type === 'project'
                  ? `Delete project "${deleteConfirm.name}"? All project data will be removed.`
                  : `Remove "${deleteConfirm.name}" from the organization?`}
              </p>
              {deleteError && (
                <p className="text-xs text-error mb-3 bg-error/10 px-3 py-2 rounded-lg">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteConfirm(null); setDeleteError(''); }}
                  className="flex-1 py-2.5 text-sm font-bold border border-outline-variant/30 text-on-surface-variant rounded-xl hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-sm font-bold bg-error text-on-error rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {deleting ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-[400] flex items-center gap-2.5 bg-surface-container-highest border border-outline-variant/20 text-on-surface text-sm font-semibold px-4 py-3 rounded-xl shadow-xl"
          >
            <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
