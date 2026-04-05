/**
 * Central API service — all backend calls go through here.
 */

const API_BASE = 'http://103.127.146.14';

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
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ProjectDetail extends Project {
  team_id: string;
  api_key_count: number;
  managers?: Array<{ id: string; email: string; full_name: string }>;
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
  api_key?: string;
  is_active: boolean;
  created_by?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
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
  pid?: number;
  thread_id?: string;
  sdk_version?: string;
  error_type?: string;
  error_message?: string;
  stack_trace?: string;
  trace_id?: string;
  extra?: Record<string, unknown>;
  ingested_at: string;
  developer_id?: string;
  developer_name?: string;
}

export interface JoinRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role?: string;
  project_id?: string;
  project_name?: string;
  organization_id?: string;
  organization_name?: string;
  request_type: 'ORG' | 'PROJECT' | 'PROJECT_INVITE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_at: string;
  resolved_at?: string;
  resolved_by?: string;
  invited_by?: string;
  invited_by_name?: string;
}

export interface DeveloperSearchResult {
  id: string;
  email: string;
  full_name: string;
  skills: string[];
  created_at: string;
}

export interface OrgMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
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

// Uses /admin/org-members — does not rely on the organizations sub-router
export const getOrgMembers = (_orgId?: string) =>
  apiFetch<OrgMember[]>('/api/v1/org-members');

// Uses the existing join-requests endpoint — ADMIN gets ORG-type requests for their org
export const getOrgPendingRequests = (_orgId?: string) =>
  apiFetch<JoinRequest[]>('/api/v1/join-requests?request_type=ORG&status=PENDING');

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

export const deleteProject = (projectId: string) =>
  apiFetch<void>(`/api/v1/projects/${projectId}`, { method: 'DELETE' });

export const updateProjectStatus = (projectId: string, newStatus: 'APPROVED' | 'REJECTED') =>
  apiFetch<{ id: string; name: string; status: string }>(`/api/v1/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus }),
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

export const generateApiKey = (projectId: string, label?: string, assignedTo?: string) =>
  apiFetch<GeneratedApiKey>(`/api/v1/projects/${projectId}/api-keys`, {
    method: 'POST',
    body: JSON.stringify({
      label: label ?? 'API Key',
      ...(assignedTo ? { assigned_to: assignedTo } : {}),
    }),
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

export const getJoinRequests = (params?: { request_type?: string; status?: string }) => {
  const qs = new URLSearchParams();
  if (params?.request_type) qs.set('request_type', params.request_type);
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString();
  return apiFetch<JoinRequest[]>(`/api/v1/join-requests${query ? '?' + query : ''}`);
};

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
  return apiFetch<Member[]>(`/api/v1/members${params}`);
};

export const deactivateUser = (userId: string) =>
  apiFetch<void>(`/api/v1/users/${userId}`, { method: 'DELETE' });

// ─── Developer Profile ───────────────────────────────────────────────────────

export const updateMySkills = (skills: string[]) =>
  apiFetch<{ skills: string[] }>('/auth/me/skills', {
    method: 'PUT',
    body: JSON.stringify({ skills }),
  });

// ─── Developer Search (for Managers) ─────────────────────────────────────────

export const searchDevelopers = (query: string) =>
  apiFetch<DeveloperSearchResult[]>(
    `/api/v1/developers/search?q=${encodeURIComponent(query)}`,
  );

// ─── Project Invitations ─────────────────────────────────────────────────────

export const inviteDeveloperToProject = (projectId: string, userId: string) =>
  apiFetch<{ id: string; status: string }>(
    `/api/v1/projects/${projectId}/invite`,
    {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    },
  );

export const getMyInvitations = () =>
  apiFetch<JoinRequest[]>(
    '/api/v1/join-requests?request_type=PROJECT_INVITE',
  );

// ─── User Projects (Admin/Manager) ───────────────────────────────────────────

export const getUserProjects = (userId: string) =>
  apiFetch<Project[]>(`/api/v1/users/${userId}/projects`);

// ─── AI Solution (OpenRouter) ───────────────────────────────────────────────

const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-001';

async function callOpenRouterWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  const body = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a concise senior software engineer. Give short, actionable answers. Use markdown headers (##) and bullet points. No filler text.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 700,
  });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
    }

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
      },
      body,
    });

    if (res.status === 429) {
      if (attempt < maxRetries - 1) continue;
      throw new Error('AI service is busy. Please wait a moment and try again.');
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message ?? `AI API error (${res.status})`);
    }

    const text = data.choices?.[0]?.message?.content;
    if (text) return text;
    throw new Error('No response generated. Please try again.');
  }

  throw new Error('AI service is busy. Please wait a moment and try again.');
}

export async function getGeminiSolution(log: Log): Promise<string> {
  const stackSnippet = log.stack_trace
    ? log.stack_trace.split('\n').slice(0, 6).join('\n')
    : 'N/A';

  const prompt = `Analyze this error log and give a concise fix.

Level: ${log.level}
Message: ${log.message}
Error Type: ${log.error_type || 'Unknown'}${log.error_message ? `\nError: ${log.error_message}` : ''}
Service: ${log.service || 'Unknown'} | Module: ${log.module || 'Unknown'}
Stack (top): ${stackSnippet}

Reply with EXACTLY these 3 sections (keep each short, 2-4 bullets max):

## Root Cause
(What went wrong in 1-2 sentences)

## Fix
(Step-by-step fix, 2-4 bullets, include a short code snippet if helpful)

## Prevention
(2-3 bullets to prevent recurrence)`;

  return callOpenRouterWithRetry(prompt);
}
