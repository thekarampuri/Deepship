import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import * as api from '../../services/api';
import type { Project } from '../../services/api';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => (
  <div
    className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all animate-fade-in ${
      type === 'success'
        ? 'bg-surface-container-high border-secondary/30 text-secondary'
        : 'bg-surface-container-high border-error/30 text-error'
    }`}
  >
    <span className="material-symbols-outlined text-base">
      {type === 'success' ? 'check_circle' : 'error'}
    </span>
    {message}
    <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
      <span className="material-symbols-outlined text-sm">close</span>
    </button>
  </div>
);

// ─── Create Project Modal ─────────────────────────────────────────────────────

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await api.createProject({ name: name.trim(), description: description.trim() || undefined });
      onCreated(created);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-high rounded-xl border border-white/10 p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Create New Project</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Project Name
            </label>
            <input
              className="block w-full py-3 px-4 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-slate-600"
              placeholder="My New Project"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Description <span className="normal-case tracking-normal text-slate-600">(optional)</span>
            </label>
            <textarea
              className="block w-full py-3 px-4 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-slate-600 resize-none"
              placeholder="Brief description of the project..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold text-slate-400 border border-white/10 rounded-lg hover:bg-surface-container-highest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 py-2.5 text-sm font-bold text-[#0b1326] bg-primary rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0b1326]/30 border-t-[#0b1326] rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="bg-surface-container-low rounded-xl border border-white/5 hover:border-primary/20 transition-all cursor-pointer group flex flex-col"
      onClick={onClick}
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* Card header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-3">
            <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
              {project.name}
            </h4>
            {project.organization_name && (
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                {project.organization_name}
              </p>
            )}
          </div>
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-surface-container-highest rounded text-[10px] font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-xs">person</span>
            {project.developer_count}
          </span>
        </div>

        {/* Description */}
        {project.description ? (
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 flex-1 mb-4">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-slate-600 italic flex-1 mb-4">No description provided</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-highest rounded-lg">
            <span className="material-symbols-outlined text-xs text-on-surface-variant">receipt_long</span>
            <span className="text-[10px] font-bold text-on-surface-variant">
              {(project as Project & { logs_summary?: { total_logs: number } }).logs_summary?.total_logs?.toLocaleString() ?? '—'} logs
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-error/10 rounded-lg">
            <span className="material-symbols-outlined text-xs text-error">error</span>
            <span className="text-[10px] font-bold text-error">
              {(project as Project & { logs_summary?: { error_count: number } }).logs_summary?.error_count?.toLocaleString() ?? '—'} errors
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-[10px] text-slate-600 font-medium">
            Created {formatDate(project.created_at)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            View Details
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api
      .getProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    setShowCreateModal(false);
    showToast(`Project "${project.name}" created successfully`, 'success');
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading ──
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

      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-lg font-bold text-white tracking-tight">My Projects</span>
          <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-xs font-bold rounded-full">
            {projects.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-[#0b1326] text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Project
        </button>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-semibold">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Search bar */}
        <div className="mb-6 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm pl-11 pr-4 py-2.5 bg-surface-container-low border border-white/5 rounded-lg text-sm text-on-surface placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-[calc(100%-max(100%-24rem,0rem)-2rem)] top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Grid or empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-white/5 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-600">folder_open</span>
            </div>
            {search ? (
              <>
                <p className="text-white font-semibold mb-1">No projects match "{search}"</p>
                <p className="text-sm text-slate-500 mb-4">Try a different search term</p>
                <button
                  onClick={() => setSearch('')}
                  className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-white font-semibold mb-1">No projects yet</p>
                <p className="text-sm text-slate-500 mb-4">Create your first project to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-[#0b1326] text-sm font-bold rounded-lg hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  New Project
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {search && (
              <p className="text-xs text-slate-500 font-medium mb-4">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/manager/projects/${project.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create project modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleProjectCreated}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProjectsListPage;
