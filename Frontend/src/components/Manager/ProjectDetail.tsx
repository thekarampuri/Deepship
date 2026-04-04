import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

type TabType = 'developers' | 'apikeys' | 'logs';

const mockProjectInfo = {
  id: 'p-1',
  name: 'Auth Service v3',
  description: 'Authentication microservice with OAuth2 and SAML support. Handles login, registration, token refresh, and SSO flows.',
  status: 'active',
  createdAt: 'Jan 15, 2026',
  org: 'TraceHub Systems',
};

const mockDevs = [
  { id: 'd-1', name: 'Alex Kumar', email: 'alex@tracehub.io', logs: 12400, lastActive: '2m ago', status: 'online' },
  { id: 'd-2', name: 'Maria Santos', email: 'maria@tracehub.io', logs: 8900, lastActive: '15m ago', status: 'online' },
  { id: 'd-3', name: 'Liam Chen', email: 'liam@tracehub.io', logs: 15600, lastActive: '1h ago', status: 'offline' },
  { id: 'd-4', name: 'Emma Liu', email: 'emma@tracehub.io', logs: 6200, lastActive: '30m ago', status: 'online' },
  { id: 'd-5', name: 'Raj Patel', email: 'raj@tracehub.io', logs: 19800, lastActive: '3h ago', status: 'offline' },
];

const mockApiKeys = [
  { id: 'k-1', name: 'Production Key', key: 'th_prod_****************************a3f2', createdAt: 'Jan 20, 2026', lastUsed: '2m ago', status: 'active' },
  { id: 'k-2', name: 'Staging Key', key: 'th_stg_*****************************b1e4', createdAt: 'Feb 1, 2026', lastUsed: '1h ago', status: 'active' },
  { id: 'k-3', name: 'Dev Key', key: 'th_dev_*****************************c9d7', createdAt: 'Mar 5, 2026', lastUsed: '5d ago', status: 'active' },
];

const mockLogs = [
  { id: 'l-1', timestamp: '2026-04-04 14:32:01', level: 'ERROR', message: 'NullPointerException in AuthTokenValidator.validate()', service: 'auth-service', traceId: 'abc-123-def', hasRCA: true },
  { id: 'l-2', timestamp: '2026-04-04 14:31:45', level: 'WARN', message: 'Slow query detected: user_sessions lookup took 2.4s', service: 'session-manager', traceId: 'xyz-456-ghi', hasRCA: false },
  { id: 'l-3', timestamp: '2026-04-04 14:31:22', level: 'INFO', message: 'User login successful: user_id=82341', service: 'auth-service', traceId: 'jkl-789-mno', hasRCA: false },
  { id: 'l-4', timestamp: '2026-04-04 14:30:58', level: 'ERROR', message: 'Connection refused: Redis cluster node 3 unreachable', service: 'cache-layer', traceId: 'pqr-012-stu', hasRCA: true },
  { id: 'l-5', timestamp: '2026-04-04 14:30:15', level: 'FATAL', message: 'Out of memory: heap space exhausted in token-refresh worker', service: 'auth-worker', traceId: 'vwx-345-yz0', hasRCA: true },
  { id: 'l-6', timestamp: '2026-04-04 14:29:44', level: 'INFO', message: 'Health check passed: all endpoints responding', service: 'monitor', traceId: 'aaa-111-bbb', hasRCA: false },
  { id: 'l-7', timestamp: '2026-04-04 14:29:02', level: 'DEBUG', message: 'Token refresh initiated for batch: 142 tokens', service: 'auth-worker', traceId: 'ccc-222-ddd', hasRCA: false },
];

const levelStyles: Record<string, string> = {
  DEBUG: 'bg-slate-700/50 text-slate-300',
  INFO: 'bg-primary/10 text-primary',
  WARN: 'bg-tertiary/15 text-tertiary',
  ERROR: 'bg-error/15 text-error',
  FATAL: 'bg-error/30 text-error font-black',
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('developers');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  void id; // Project ID available for API calls

  const handleCopy = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const tabs: { id: TabType; label: string; icon: string; count: number }[] = [
    { id: 'developers', label: 'Developers', icon: 'group', count: mockDevs.length },
    { id: 'apikeys', label: 'API Keys', icon: 'vpn_key', count: mockApiKeys.length },
    { id: 'logs', label: 'Logs', icon: 'receipt_long', count: mockLogs.length },
  ];

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/manager/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-lg font-bold text-white tracking-tight">{mockProjectInfo.name}</span>
          <div className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-slate-600 text-sm">{mockProjectInfo.org}</span>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Project Info Header */}
        <div className="bg-surface-container-low rounded-lg p-6 border border-white/5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{mockProjectInfo.name}</h2>
              <p className="text-sm text-on-surface-variant mb-3">{mockProjectInfo.description}</p>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Created {mockProjectInfo.createdAt}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>{mockDevs.length} Developers</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>{mockApiKeys.length} API Keys</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-container-lowest rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-surface-container-high text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
              <span className="text-[10px] bg-surface-container-highest px-1.5 py-0.5 rounded">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Developers Tab */}
        {activeTab === 'developers' && (
          <div className="bg-surface-container-low rounded-lg border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-surface-container-lowest/50">
                <tr>
                  <th className="px-6 py-4">Developer</th>
                  <th className="px-6 py-4">Total Logs</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockDevs.map((dev) => (
                  <tr key={dev.id} className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm">
                          {dev.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{dev.name}</p>
                          <p className="text-[10px] text-slate-500">{dev.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">{dev.logs.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{dev.lastActive}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dev.status === 'online' ? 'bg-secondary' : 'bg-slate-500'}`} />
                        <span className="text-xs text-slate-400 capitalize">{dev.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[10px] font-bold uppercase tracking-widest text-error/70 hover:text-error transition-colors">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'apikeys' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-container text-on-primary text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10">
                <span className="material-symbols-outlined text-sm">add</span>
                Generate New Key
              </button>
            </div>
            <div className="space-y-3">
              {mockApiKeys.map((apiKey) => (
                <div key={apiKey.id} className="bg-surface-container-low p-5 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">vpn_key</span>
                      <div>
                        <p className="text-sm font-bold text-white">{apiKey.name}</p>
                        <p className="text-[10px] text-slate-500">Created {apiKey.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{apiKey.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 px-4 py-2.5 bg-surface-container-lowest rounded-lg font-mono text-xs text-on-surface-variant">{apiKey.key}</code>
                    <button
                      onClick={() => handleCopy(apiKey.key, apiKey.id)}
                      className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">{copiedKey === apiKey.id ? 'check' : 'content_copy'}</span>
                      {copiedKey === apiKey.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Last used: {apiKey.lastUsed}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-2">
            {mockLogs.map((log) => (
              <div key={log.id}>
                <div
                  className={`bg-surface-container-low rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer ${
                    expandedLog === log.id ? 'border-primary/20' : ''
                  }`}
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="px-5 py-3 flex items-center gap-4">
                    <span className="font-mono text-[10px] text-slate-500 w-36 flex-shrink-0">{log.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight flex-shrink-0 ${levelStyles[log.level]}`}>
                      {log.level}
                    </span>
                    <span className="text-sm text-white flex-1 truncate">{log.message}</span>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">{log.service}</span>
                    {log.hasRCA && (
                      <span className="material-symbols-outlined text-primary text-sm flex-shrink-0">psychology</span>
                    )}
                    <span className="material-symbols-outlined text-slate-500 text-sm flex-shrink-0">
                      {expandedLog === log.id ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {/* Expanded RCA Panel */}
                {expandedLog === log.id && log.hasRCA && (
                  <div className="mt-1 bg-surface-container-high rounded-lg border border-primary/10 p-6 space-y-4">
                    {/* Stack Trace */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Stack Trace</p>
                      <pre className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs text-on-surface-variant overflow-x-auto leading-relaxed">
{`java.lang.NullPointerException: Cannot invoke method on null reference
    at com.tracehub.auth.AuthTokenValidator.validate(AuthTokenValidator.java:84)
    at com.tracehub.auth.middleware.AuthMiddleware.process(AuthMiddleware.java:42)
    at com.tracehub.core.RequestPipeline.execute(RequestPipeline.java:156)
    at com.tracehub.server.HttpHandler.handle(HttpHandler.java:73)`}
                      </pre>
                    </div>

                    {/* Root Cause Analysis */}
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                        <span className="text-sm font-bold text-primary">Root Cause Analysis</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider rounded">AI Generated</span>
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        The NullPointerException occurs because <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">AuthTokenValidator.validate()</code> receives
                        a null auth_token when the session has expired but the refresh token endpoint was not called. The root cause is a race condition
                        between the session timeout handler and the token validation middleware.
                      </p>
                    </div>

                    {/* Suggested Fix */}
                    <div className="bg-secondary/5 border border-secondary/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-secondary text-lg">build</span>
                        <span className="text-sm font-bold text-secondary">Suggested Fix</span>
                      </div>
                      <pre className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs text-on-surface-variant overflow-x-auto leading-relaxed">
{`// Add null check before validation
public boolean validate(String token) {
    if (token == null || token.isEmpty()) {
        log.warn("Null token received, triggering refresh");
        return triggerTokenRefresh();
    }
    // ... existing validation logic
}`}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Expanded details for non-RCA logs */}
                {expandedLog === log.id && !log.hasRCA && (
                  <div className="mt-1 bg-surface-container-high rounded-lg border border-white/5 p-5 space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Trace ID</p>
                        <code className="font-mono text-on-surface-variant">{log.traceId}</code>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Service</p>
                        <span className="text-on-surface-variant">{log.service}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Level</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${levelStyles[log.level]}`}>{log.level}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetail;
