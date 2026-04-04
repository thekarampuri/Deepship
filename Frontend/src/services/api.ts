/**
 * Central API service — all backend calls go through here.
 * Base URL: http://localhost:8000
 */

const API_BASE = 'http://localhost:8000';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  member_count: number;
  project_count: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organization_id?: string;
  organization_name?: string;
  developer_count: number;
  created_at: string;
}

export interface ProjectDetail extends Project {
  team_id: string;
  api_key_count: number;
  developers: Array<{ id: string; email: string; full_name: string }>;
  logs_summary: {
    total_logs: number;
    error_count: number;
    fatal_count: number;
    latest_log_at?: string;
  };
}

export interface Member {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active?: boolean;
  organization_name?: string;
  project_count?: number;
  created_at: string;
}

export interface ApiKey {
  id: string;
  label?: string;
  key_masked: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface GeneratedApiKey {
  id: string;
  project_id: string;
  api_key: string;
  label?: string;
  created_at: string;
  message: string;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface Log {
  id: string;
  module?: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  environment?: string;
  host?: string;
  error_type?: string;
  stack_trace?: string;
  trace_id?: string;
  extra?: Record<string, unknown>;
  ingested_at: string;
}

export interface JoinRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  project_id: string;
  project_name: string;
  organization_id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail ?? `Request failed with status ${res.status}`);
  }

  return data as T;
}

// ─── Organizations ────────────────────────────────────────────────────────────

export const getOrganizations = () =>
  apiFetch<Organization[]>('/api/v1/organizations');

export const getOrganization = (orgId: string) =>
  apiFetch<Organization>(`/api/v1/organizations/${orgId}`);

export const getOrgProjects = (orgId: string) =>
  apiFetch<Project[]>(`/api/v1/organizations/${orgId}/projects`);

export const getOrgDevelopers = (orgId: string) =>
  apiFetch<Member[]>(`/api/v1/organizations/${orgId}/developers`);

// ─── Projects ─────────────────────────────────────────────────────────────────

export const getProjects = () =>
  apiFetch<Project[]>('/api/v1/projects');

export const getProject = (projectId: string) =>
  apiFetch<ProjectDetail>(`/api/v1/projects/${projectId}`);

export const createProject = (data: { name: string; description?: string }) =>
  apiFetch<Project>('/api/v1/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getProjectDevelopers = (projectId: string) =>
  apiFetch<Member[]>(`/api/v1/projects/${projectId}/developers`);

export const assignDeveloper = (projectId: string, userId: string) =>
  apiFetch<{ status: string }>(`/api/v1/projects/${projectId}/developers`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });

export const removeDeveloperFromProject = (projectId: string, userId: string) =>
  apiFetch<{ status: string }>(
    `/api/v1/projects/${projectId}/developers/${userId}`,
    { method: 'DELETE' },
  );

export const getProjectApiKeys = (projectId: string) =>
  apiFetch<ApiKey[]>(`/api/v1/projects/${projectId}/api-keys`);

export const generateApiKey = (projectId: string, label?: string) =>
  apiFetch<GeneratedApiKey>(`/api/v1/projects/${projectId}/api-keys`, {
    method: 'POST',
    body: JSON.stringify({ label: label ?? 'API Key' }),
  });

export const getProjectLogs = (
  projectId: string,
  level?: string,
  search?: string,
  limit = 100,
) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (level && level !== 'ALL') params.set('level', level);
  if (search) params.set('search', search);
  return apiFetch<Log[]>(`/api/v1/projects/${projectId}/logs?${params}`);
};

// ─── Join Requests ────────────────────────────────────────────────────────────

export const getJoinRequests = () =>
  apiFetch<JoinRequest[]>('/api/v1/join-requests');

export const createJoinRequest = (projectId: string) =>
  apiFetch<JoinRequest>('/api/v1/join-requests', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  });

export const resolveJoinRequest = (
  requestId: string,
  newStatus: 'APPROVED' | 'REJECTED',
) =>
  apiFetch<{ id: string; status: string }>(`/api/v1/join-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus }),
  });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getMembers = (role?: string) => {
  const params = role ? `?role=${role}` : '';
  return apiFetch<Member[]>(`/api/v1/admin/members${params}`);
};
