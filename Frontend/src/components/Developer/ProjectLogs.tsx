import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  traceId: string;
  stackTrace?: string;
  extra?: Record<string, string>;
  rca?: {
    rootCause: string;
    impact: string;
    fix: string;
    fixCode: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

const mockProjectName = 'Auth Service v3';

const mockLogs: LogEntry[] = [
  {
    id: 'l-1',
    timestamp: '2026-04-04 14:32:01.482',
    level: 'FATAL',
    message: 'Out of memory: heap space exhausted in token-refresh worker pool',
    service: 'auth-worker',
    traceId: 'tr-8a2f-4b1c-9d3e',
    stackTrace: `java.lang.OutOfMemoryError: Java heap space
    at com.tracehub.auth.worker.TokenRefreshPool.allocateBuffer(TokenRefreshPool.java:248)
    at com.tracehub.auth.worker.TokenRefreshPool.processRefreshBatch(TokenRefreshPool.java:142)
    at com.tracehub.auth.worker.WorkerThread.run(WorkerThread.java:89)
    at java.lang.Thread.run(Thread.java:829)`,
    extra: { 'heap.used': '7.8GB / 8GB', 'active.threads': '2048', 'batch.size': '50000' },
    rca: {
      rootCause: 'The token refresh worker pool is processing batches of 50,000 tokens simultaneously without proper memory limits. Each token refresh allocates a 16KB buffer that is not released until the entire batch completes, causing heap exhaustion under high load.',
      impact: 'All token refresh operations are halted, causing approximately 12,000 active sessions to lose authentication within the next 15 minutes. Downstream services relying on token validation will begin returning 401 errors.',
      fix: 'Reduce batch size to 1,000 tokens, implement streaming buffer allocation, and add a circuit breaker pattern to prevent cascading memory failures.',
      fixCode: `// Replace bulk batch processing with streaming approach
public class TokenRefreshPool {
    private static final int SAFE_BATCH_SIZE = 1000;
    private final CircuitBreaker breaker = new CircuitBreaker(
        maxFailures: 3, resetTimeout: Duration.ofSeconds(30)
    );

    public void processRefreshBatch(List<Token> tokens) {
        Lists.partition(tokens, SAFE_BATCH_SIZE)
            .stream()
            .forEach(batch -> breaker.execute(() -> {
                try (BufferPool pool = BufferPool.scoped(batch.size())) {
                    batch.forEach(token -> refreshToken(token, pool));
                }
            }));
    }
}`,
      severity: 'critical',
    },
  },
  {
    id: 'l-2',
    timestamp: '2026-04-04 14:31:45.221',
    level: 'ERROR',
    message: 'NullPointerException in AuthTokenValidator.validate() - session expired',
    service: 'auth-service',
    traceId: 'tr-7c1e-3a4d-8f2b',
    stackTrace: `java.lang.NullPointerException: Cannot invoke "String.length()" on null reference
    at com.tracehub.auth.AuthTokenValidator.validate(AuthTokenValidator.java:84)
    at com.tracehub.auth.middleware.AuthMiddleware.process(AuthMiddleware.java:42)
    at com.tracehub.core.RequestPipeline.execute(RequestPipeline.java:156)`,
    extra: { 'user.id': '82341', 'session.age': '7201s', 'endpoint': '/api/v2/refresh' },
    rca: {
      rootCause: 'Race condition between session timeout handler and token validation. The session is invalidated by the timeout thread, setting auth_token to null, while the validation middleware simultaneously reads it without null-safety.',
      impact: 'Affects approximately 3% of active users during peak hours. Users experience unexpected logouts and must re-authenticate manually.',
      fix: 'Add null-safe token validation with automatic session refresh fallback.',
      fixCode: `public boolean validate(String token) {
    if (token == null || token.isEmpty()) {
        log.warn("Null token detected, attempting refresh");
        return attemptSessionRefresh();
    }
    return validateJwt(token);
}`,
      severity: 'high',
    },
  },
  {
    id: 'l-3',
    timestamp: '2026-04-04 14:31:22.198',
    level: 'WARN',
    message: 'Slow query detected: user_sessions lookup took 2,412ms (threshold: 500ms)',
    service: 'session-manager',
    traceId: 'tr-5d9a-2c7f-1e6b',
    extra: { 'query': 'SELECT * FROM user_sessions WHERE ...', 'rows_scanned': '2.4M', 'index_used': 'false' },
  },
  {
    id: 'l-4',
    timestamp: '2026-04-04 14:30:58.444',
    level: 'ERROR',
    message: 'Connection refused: Redis cluster node 3 unreachable after 3 retries',
    service: 'cache-layer',
    traceId: 'tr-4e8c-1b5a-7d3f',
    stackTrace: `redis.exceptions.ConnectionError: Connection refused (node: redis-cluster-03.internal:6379)
    at redis.client.StrictRedis.execute_command(client.py:924)
    at redis.client.StrictRedis.get(client.py:1643)
    at cache_layer.session_cache.get_session(session_cache.py:78)`,
    extra: { 'node': 'redis-cluster-03', 'retries': '3', 'fallback': 'database' },
    rca: {
      rootCause: 'Redis cluster node 3 ran out of file descriptors due to a connection leak in the health check module. The leaked connections accumulated over 48 hours until hitting the OS limit of 65,535 file descriptors.',
      impact: 'Session cache hit rate dropped from 99.2% to 67.8%, increasing database load by 3x and causing cascading latency across all authentication endpoints.',
      fix: 'Fix the connection leak in the health check module and add a file descriptor monitoring alert.',
      fixCode: `# Fix health check connection leak
class HealthChecker:
    def check_node(self, node):
        conn = None
        try:
            conn = redis.StrictRedis(host=node.host, port=node.port)
            return conn.ping()
        finally:
            if conn:
                conn.close()  # Always close the connection`,
      severity: 'high',
    },
  },
  {
    id: 'l-5',
    timestamp: '2026-04-04 14:30:15.891',
    level: 'INFO',
    message: 'User login successful: user_id=82341, method=OAuth2, provider=Google',
    service: 'auth-service',
    traceId: 'tr-3f7b-9d2e-4a1c',
    extra: { 'user.id': '82341', 'method': 'OAuth2', 'provider': 'Google', 'latency': '142ms' },
  },
  {
    id: 'l-6',
    timestamp: '2026-04-04 14:29:44.556',
    level: 'INFO',
    message: 'Health check passed: all 12 endpoints responding within SLA thresholds',
    service: 'monitor',
    traceId: 'tr-2a6e-8c4d-3f9b',
  },
  {
    id: 'l-7',
    timestamp: '2026-04-04 14:29:02.113',
    level: 'DEBUG',
    message: 'Token refresh initiated for batch: 142 tokens queued, pool utilization at 34%',
    service: 'auth-worker',
    traceId: 'tr-1d5c-7b3a-2e8f',
    extra: { 'batch.id': 'BR-8821', 'tokens.count': '142', 'pool.util': '34%' },
  },
  {
    id: 'l-8',
    timestamp: '2026-04-04 14:28:30.778',
    level: 'WARN',
    message: 'Rate limit approaching: IP 203.45.67.89 at 85% of quota (850/1000 req/min)',
    service: 'rate-limiter',
    traceId: 'tr-9e4f-6a1b-5c2d',
    extra: { 'ip': '203.45.67.89', 'current': '850', 'limit': '1000', 'window': '60s' },
  },
  {
    id: 'l-9',
    timestamp: '2026-04-04 14:27:55.334',
    level: 'ERROR',
    message: 'SAML assertion validation failed: signature mismatch for IdP cert fingerprint',
    service: 'sso-handler',
    traceId: 'tr-8b3d-5e2c-4f1a',
    stackTrace: `com.tracehub.sso.SAMLValidationException: Signature mismatch
    at com.tracehub.sso.SAMLHandler.validateAssertion(SAMLHandler.java:182)
    at com.tracehub.sso.SSOController.handleCallback(SSOController.java:95)`,
    extra: { 'idp': 'corporate-okta', 'cert.fp': 'SHA256:ab12...ef90', 'expected.fp': 'SHA256:cd34...gh78' },
    rca: {
      rootCause: 'The Identity Provider (Okta) rotated their signing certificate on April 3rd, but the certificate fingerprint in the TraceHub SSO configuration was not updated. All SAML assertions signed with the new certificate are rejected.',
      impact: 'All SSO logins for the corporate Okta integration are failing, affecting approximately 200 enterprise users who cannot authenticate.',
      fix: 'Update the IdP certificate fingerprint in SSO configuration and implement automatic certificate rotation detection.',
      fixCode: `// Add automatic cert rotation handling
@Scheduled(cron = "0 0 */6 * * *")
public void refreshIdPCertificates() {
    for (IdPConfig idp : idpConfigs) {
        X509Certificate newCert = fetchMetadata(idp.metadataUrl());
        if (!newCert.equals(idp.currentCert())) {
            log.info("IdP cert rotated for {}", idp.name());
            idp.updateCert(newCert);
            notifyAdmin(idp, newCert);
        }
    }
}`,
      severity: 'medium',
    },
  },
];

const levelStyles: Record<LogLevel, { badge: string; row: string }> = {
  DEBUG: { badge: 'bg-slate-700/50 text-slate-300', row: '' },
  INFO: { badge: 'bg-primary/10 text-primary', row: '' },
  WARN: { badge: 'bg-tertiary/15 text-tertiary', row: 'border-l-2 border-l-tertiary/30' },
  ERROR: { badge: 'bg-error/15 text-error', row: 'border-l-2 border-l-error/30' },
  FATAL: { badge: 'bg-error/30 text-error font-black', row: 'border-l-2 border-l-error bg-error/5' },
};

const severityColors: Record<string, string> = {
  low: 'bg-primary/10 text-primary',
  medium: 'bg-tertiary/15 text-tertiary',
  high: 'bg-error/15 text-error',
  critical: 'bg-error/30 text-error',
};

const ProjectLogs: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  void id;

  const filteredLogs = mockLogs.filter((log) => {
    if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase()) && !log.service.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const levels: (LogLevel | 'ALL')[] = ['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/developer/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-slate-500 text-sm">Developer</span>
          <span className="material-symbols-outlined text-slate-600 text-xs">chevron_right</span>
          <span className="text-slate-500 text-sm">Projects</span>
          <span className="material-symbols-outlined text-slate-600 text-xs">chevron_right</span>
          <span className="text-lg font-bold text-white tracking-tight">{mockProjectName}</span>
        </div>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* Filters */}
        <div className="bg-surface-container-low rounded-lg p-4 border border-white/5 mb-6 flex items-center gap-4 flex-wrap">
          {/* Level Filter */}
          <div className="flex gap-1 bg-surface-container-lowest rounded-lg p-1">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${
                  levelFilter === level
                    ? 'bg-surface-container-high text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">search</span>
            <input
              className="w-full bg-surface-container-lowest border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600"
              placeholder="Search log messages, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <span className="text-[10px] font-bold text-slate-500 bg-surface-container-highest px-2 py-1 rounded">
            {filteredLogs.length} logs
          </span>
        </div>

        {/* Logs List */}
        <div className="space-y-1.5">
          {filteredLogs.map((log) => (
            <div key={log.id}>
              {/* Log Row */}
              <div
                className={`bg-surface-container-low rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer ${
                  expandedLog === log.id ? 'border-primary/20' : ''
                } ${levelStyles[log.level].row}`}
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="px-5 py-3 flex items-center gap-4">
                  <span className="font-mono text-[10px] text-slate-500 w-44 flex-shrink-0">{log.timestamp}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight flex-shrink-0 w-14 text-center ${levelStyles[log.level].badge}`}>
                    {log.level}
                  </span>
                  <span className="text-sm text-white flex-1 truncate">{log.message}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex-shrink-0">{log.service}</span>
                  {log.rca && (
                    <span className="material-symbols-outlined text-primary text-sm flex-shrink-0" title="AI Analysis Available">psychology</span>
                  )}
                  <span className="material-symbols-outlined text-slate-500 text-sm flex-shrink-0">
                    {expandedLog === log.id ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </div>

              {/* Expanded Panel */}
              {expandedLog === log.id && (
                <div className="mt-1 bg-surface-container-high rounded-lg border border-primary/10 overflow-hidden">
                  {/* Basic Details */}
                  <div className="p-5 border-b border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${levelStyles[log.level].badge}`}>{log.level}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Timestamp</p>
                        <span className="font-mono text-on-surface-variant">{log.timestamp}</span>
                      </div>
                    </div>

                    {/* Extra Fields */}
                    {log.extra && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Extra Fields</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(log.extra).map(([key, value]) => (
                            <span key={key} className="px-2 py-1 bg-surface-container-lowest rounded text-[10px] font-mono text-on-surface-variant">
                              <span className="text-slate-500">{key}:</span> {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stack Trace */}
                  {log.stackTrace && (
                    <div className="p-5 border-b border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Stack Trace</p>
                      <pre className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs text-on-surface-variant overflow-x-auto leading-relaxed whitespace-pre-wrap">
                        {log.stackTrace}
                      </pre>
                    </div>
                  )}

                  {/* Root Cause Analysis Panel */}
                  {log.rca && (
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                        <span className="text-base font-bold text-white">AI Root Cause Analysis</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${severityColors[log.rca.severity]}`}>
                          {log.rca.severity} severity
                        </span>
                      </div>

                      {/* Identified Root Cause */}
                      <div className="bg-error/5 border border-error/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-error text-sm">target</span>
                          <span className="text-sm font-bold text-error">Identified Root Cause</span>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{log.rca.rootCause}</p>
                      </div>

                      {/* Impact Assessment */}
                      <div className="bg-tertiary/5 border border-tertiary/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-tertiary text-sm">warning</span>
                          <span className="text-sm font-bold text-tertiary">Impact Assessment</span>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{log.rca.impact}</p>
                      </div>

                      {/* Recommended Fix */}
                      <div className="bg-secondary/5 border border-secondary/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-secondary text-sm">build</span>
                          <span className="text-sm font-bold text-secondary">Recommended Fix</span>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{log.rca.fix}</p>
                        <pre className="bg-surface-container-lowest rounded-lg p-4 font-mono text-xs text-on-surface-variant overflow-x-auto leading-relaxed whitespace-pre-wrap">
                          {log.rca.fixCode}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="bg-surface-container-low rounded-lg border border-white/5 p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">filter_alt_off</span>
              <p className="text-sm text-slate-500">No logs match the current filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectLogs;
