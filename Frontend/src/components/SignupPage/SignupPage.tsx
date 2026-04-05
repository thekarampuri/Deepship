import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const API_BASE = 'http://103.127.146.14';

type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER';

interface OrgOption { id: string; name: string; }

interface RoleOption {
  role: UserRole;
  label: string;
  icon: string;
  accent: string;
  accentBg: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  { role: 'ADMIN',     label: 'Admin',           icon: 'shield',          accent: 'text-primary',   accentBg: 'bg-primary/10 border-primary/40',   description: 'Create & manage your org' },
  { role: 'MANAGER',   label: 'Project Manager', icon: 'assignment_ind',  accent: 'text-secondary', accentBg: 'bg-secondary/10 border-secondary/40', description: 'Manage projects & devs' },
  { role: 'DEVELOPER', label: 'Developer',        icon: 'code',            accent: 'text-tertiary',  accentBg: 'bg-tertiary/10 border-tertiary/40',   description: 'Ship code & track logs' },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [selectedRole, setSelectedRole] = useState<UserRole>('DEVELOPER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsError, setOrgsError] = useState('');

  useEffect(() => {
    setOrgsLoading(true);
    fetch(`${API_BASE}/api/v1/organizations`)
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) => setOrgs(data.map((o) => ({ id: o.id, name: o.name }))))
      .catch(() => setOrgsError('Could not load organizations'))
      .finally(() => setOrgsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signup({ full_name: fullName, email, password, role: selectedRole,
        organization_name: selectedRole === 'ADMIN' ? orgName : undefined,
        organization_id: selectedRole === 'MANAGER' ? orgId : undefined,
      });
      setSuccess(true);
      if (selectedRole !== 'MANAGER') setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    const isManager = selectedRole === 'MANAGER';
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`inline-flex items-center justify-center p-5 rounded-2xl mb-6 ${isManager ? 'bg-tertiary/10' : 'bg-secondary/10'}`}>
            <span className={`material-symbols-outlined text-5xl ${isManager ? 'text-tertiary' : 'text-secondary'}`}>
              {isManager ? 'hourglass_top' : 'check_circle'}
            </span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="text-2xl font-extrabold text-on-surface tracking-tight mb-3">
            {isManager ? 'Request Submitted' : 'Account Created'}
          </motion.h2>
          <p className="text-on-surface-variant text-sm mb-2">
            {isManager ? 'Your request to join the organization has been sent to the admin for approval.' : 'Your account has been registered successfully.'}
          </p>
          <p className="text-on-surface-variant/60 text-xs">
            {isManager ? 'You can log in once the admin approves your request.' : 'Redirecting to login...'}
          </p>
          {isManager ? (
            <div className="mt-6">
              <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-base">arrow_back</span>Back to Login
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <div className="w-32 h-1 bg-surface-container-highest rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ animation: 'expandWidth 2s ease-in-out forwards' }} />
              </div>
            </div>
          )}
        </div>
        <style>{`@keyframes expandWidth { from { width: 0%; } to { width: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between w-[40%] relative overflow-hidden bg-gradient-to-br from-[#002113] via-[#005236] to-[#00a572] p-12 text-white"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00a572]/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-white text-xl">lens_blur</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">TraceHub</span>
          </Link>
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Join the Platform</p>
          <h2 className="text-4xl font-black tracking-tighter leading-tight mb-6">
            Start monitoring<br />
            <span className="text-[#5ddbaa]">in minutes.</span>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Set up your team, connect your services, and get full-stack observability from day one — no configuration hell.
          </p>
          <div className="mt-10 space-y-3">
            {['Real-time log streaming', 'Role-based access control', 'Anomaly detection & alerts'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-xs">check</span>
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">© {new Date().getFullYear()} TraceHub Forensic Systems</p>
        </div>
      </motion.div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-surface-dim overflow-y-auto">
        {/* Top bar with theme toggle */}
        <div className="flex items-center justify-between px-8 py-4">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-base">lens_blur</span>
              </div>
              <span className="font-black text-lg tracking-tighter text-primary">TraceHub</span>
            </Link>
          </div>
          <div className="hidden lg:block" />
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/30 transition-all text-on-surface-variant hover:text-primary"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-outlined text-lg">{isDark ? 'light_mode' : 'dark_mode'}</span>
            <span className="text-xs font-semibold hidden sm:block">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="flex-1 flex items-start justify-center px-8 py-10">
          <div className="w-full max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">Create your account</h1>
              <p className="text-on-surface-variant text-sm">Get started with forensic log analysis</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-surface-container-lowest dark:bg-surface-container-low rounded-2xl border border-outline-variant/30 shadow-xl shadow-on-surface/5 p-8"
            >
              {/* Role Selector */}
              <div className="mb-7">
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Select Your Role
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setSelectedRole(opt.role)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        selectedRole === opt.role
                          ? `${opt.accentBg} shadow-sm`
                          : 'bg-surface-container-low dark:bg-surface-container border-outline-variant/20 hover:border-outline-variant/50'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-2xl ${selectedRole === opt.role ? opt.accent : 'text-on-surface-variant'}`}>
                        {opt.icon}
                      </span>
                      <span className={`text-xs font-bold tracking-tight ${selectedRole === opt.role ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[9px] text-on-surface-variant text-center leading-tight">{opt.description}</span>
                      {selectedRole === opt.role && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-on-primary text-[11px]">check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-3 p-3 rounded-xl bg-error-container/30 border border-error/30">
                  <span className="material-symbols-outlined text-error text-lg">error</span>
                  <span className="text-sm text-error">{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div>
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="fullName">Full Name</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">person</span>
                    </span>
                    <input
                      id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe"
                      className="block w-full pl-10 pr-4 py-3.5 bg-surface-container-low dark:bg-surface-container border border-outline-variant/40 dark:border-outline-variant/20 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/40 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="signupEmail">Email Address</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">alternate_email</span>
                    </span>
                    <input
                      id="signupEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.com"
                      className="block w-full pl-10 pr-4 py-3.5 bg-surface-container-low dark:bg-surface-container border border-outline-variant/40 dark:border-outline-variant/20 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/40 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="signupPassword">Password</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">lock</span>
                    </span>
                    <input
                      id="signupPassword" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters"
                      className="block w-full pl-10 pr-4 py-3.5 bg-surface-container-low dark:bg-surface-container border border-outline-variant/40 dark:border-outline-variant/20 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/40 transition-all"
                    />
                  </div>
                </div>

                {/* Org Name — ADMIN */}
                {selectedRole === 'ADMIN' && (
                  <div>
                    <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="orgName">Organization Name</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">corporate_fare</span>
                      </span>
                      <input
                        id="orgName" required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your Organization Inc."
                        className="block w-full pl-10 pr-4 py-3.5 bg-surface-container-low dark:bg-surface-container border border-outline-variant/40 dark:border-outline-variant/20 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/40 transition-all"
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-on-surface-variant">A new organization will be created with you as admin.</p>
                  </div>
                )}

                {/* Org Select — MANAGER */}
                {selectedRole === 'MANAGER' && (
                  <div>
                    <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="orgSelect">Select Organization</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        {orgsLoading
                          ? <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          : <span className="material-symbols-outlined text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">domain</span>}
                      </span>
                      <select
                        id="orgSelect" required value={orgId} onChange={(e) => setOrgId(e.target.value)} disabled={orgsLoading}
                        className="block w-full pl-10 pr-8 py-3.5 bg-surface-container-low dark:bg-surface-container border border-outline-variant/40 dark:border-outline-variant/20 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none appearance-none cursor-pointer transition-all disabled:opacity-50"
                      >
                        <option value="">{orgsLoading ? 'Loading...' : 'Choose an organization...'}</option>
                        {orgs.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">expand_more</span>
                      </span>
                    </div>
                    {orgsError && <p className="mt-1.5 text-[10px] text-error">{orgsError}</p>}
                    {!orgsError && <p className="mt-1.5 text-[10px] text-on-surface-variant">A join request will be sent to the organization admin.</p>}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-[#4a3bcc] hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />Creating Account...</>
                  ) : 'Create Account →'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-outline-variant/20 text-center">
                <p className="text-xs text-on-surface-variant">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:text-primary/70 transition-colors">Sign in</Link>
                </p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-[10px] font-mono uppercase text-on-surface-variant tracking-wider">Auth Node: Operational</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-outline-variant/40" />
              <span className="text-[10px] font-mono uppercase text-on-surface-variant tracking-wider">v2.4.0-Stable</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
