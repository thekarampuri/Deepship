import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER';

interface RoleOption {
  role: UserRole;
  label: string;
  icon: string;
  accent: string;
  accentBg: string;
  description: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'ADMIN',
    label: 'Admin',
    icon: 'shield',
    accent: 'text-primary',
    accentBg: 'bg-primary/10 border-primary/30',
    description: 'Create & manage your organization',
  },
  {
    role: 'MANAGER',
    label: 'Project Manager',
    icon: 'assignment_ind',
    accent: 'text-secondary',
    accentBg: 'bg-secondary/10 border-secondary/30',
    description: 'Manage projects & developers',
  },
  {
    role: 'DEVELOPER',
    label: 'Developer',
    icon: 'code',
    accent: 'text-tertiary',
    accentBg: 'bg-tertiary/10 border-tertiary/30',
    description: 'Ship code & track logs',
  },
];

const MOCK_ORGANIZATIONS = [
  { id: 'org-1', name: 'TraceHub Systems' },
  { id: 'org-2', name: 'Acme Corp' },
  { id: 'org-3', name: 'NovaTech Industries' },
  { id: 'org-4', name: 'Quantum Labs' },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('DEVELOPER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signup({
        full_name: fullName,
        email,
        password,
        role: selectedRole,
        organization_name: selectedRole === 'ADMIN' ? orgName : undefined,
        organization_id: selectedRole === 'MANAGER' ? orgId : undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-surface-dim text-on-surface font-body selection:bg-primary/30 min-h-screen flex items-center justify-center forensic-grid">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-xl bg-secondary/10 mb-6">
            <span className="material-symbols-outlined text-secondary text-5xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">Account Created</h2>
          <p className="text-on-surface-variant text-sm mb-2">Your account has been registered successfully.</p>
          <p className="text-on-surface-variant/60 text-xs">Redirecting to login...</p>
          <div className="mt-6">
            <div className="w-32 h-1 bg-surface-container-highest rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-secondary rounded-full animate-[expandWidth_2s_ease-in-out_forwards]" style={{ animation: 'expandWidth 2s ease-in-out forwards' }} />
            </div>
          </div>
        </div>
        <style>{`@keyframes expandWidth { from { width: 0%; } to { width: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div className="bg-surface-dim text-on-surface font-body selection:bg-primary/30 min-h-screen flex flex-col forensic-grid">
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Brand Anchor */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center p-3 rounded-xl bg-surface-container-low mb-4 transition-transform hover:scale-110 duration-300">
              <span className="material-symbols-outlined text-primary text-4xl">security</span>
            </Link>
            <Link to="/" className="block hover:opacity-80 transition-opacity">
              <h1 className="text-3xl font-extrabold tracking-tighter text-primary font-headline">TraceHub</h1>
            </Link>
            <p className="text-on-surface-variant text-sm mt-2 tracking-tight">Create your forensic analyst account</p>
          </div>

          {/* Signup Card */}
          <div className="glass-panel rounded-xl p-8 border border-outline-variant/15 shadow-[0px_24px_48px_-12px_rgba(6,14,32,0.5)]">
            {/* Role Selector */}
            <div className="mb-8">
              <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setSelectedRole(opt.role)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedRole === opt.role
                        ? `${opt.accentBg} ring-1 ring-offset-0`
                        : 'bg-surface-container-lowest border-white/5 hover:border-white/10'
                    }`}
                    style={selectedRole === opt.role ? { ringColor: opt.accent } : {}}
                  >
                    <span className={`material-symbols-outlined text-2xl ${selectedRole === opt.role ? opt.accent : 'text-slate-500'}`}>
                      {opt.icon}
                    </span>
                    <span className={`text-xs font-bold tracking-tight ${selectedRole === opt.role ? 'text-white' : 'text-slate-400'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[9px] text-slate-500 text-center leading-tight">{opt.description}</span>
                    {selectedRole === opt.role && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary text-[10px]">check</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-error-container/20 border border-error/20">
                <span className="material-symbols-outlined text-error text-lg">error</span>
                <span className="text-sm text-error">{error}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="fullName">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-sm group-focus-within:text-primary transition-colors">person</span>
                  </div>
                  <input
                    className="block w-full pl-10 py-3.5 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-outline/40 transition-all duration-200"
                    id="fullName"
                    placeholder="Jane Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="signupEmail">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-sm group-focus-within:text-primary transition-colors">alternate_email</span>
                  </div>
                  <input
                    className="block w-full pl-10 py-3.5 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-outline/40 transition-all duration-200"
                    id="signupEmail"
                    type="email"
                    placeholder="you@organization.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="signupPassword">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-sm group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input
                    className="block w-full pl-10 py-3.5 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-outline/40 transition-all duration-200"
                    id="signupPassword"
                    type="password"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Organization Name - ADMIN only */}
              {selectedRole === 'ADMIN' && (
                <div>
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="orgName">
                    Organization Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-sm group-focus-within:text-primary transition-colors">corporate_fare</span>
                    </div>
                    <input
                      className="block w-full pl-10 py-3.5 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-outline/40 transition-all duration-200"
                      id="orgName"
                      placeholder="Your Organization Inc."
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500">A new organization will be created with you as admin.</p>
                </div>
              )}

              {/* Organization Select - MANAGER only */}
              {selectedRole === 'MANAGER' && (
                <div>
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="orgSelect">
                    Select Organization
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-sm group-focus-within:text-primary transition-colors">domain</span>
                    </div>
                    <select
                      className="block w-full pl-10 py-3.5 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none appearance-none cursor-pointer transition-all duration-200"
                      id="orgSelect"
                      required
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                    >
                      <option value="" className="bg-surface-container-lowest">Choose an organization...</option>
                      {MOCK_ORGANIZATIONS.map((org) => (
                        <option key={org.id} value={org.id} className="bg-surface-container-lowest">{org.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-sm">expand_more</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500">You will be assigned as a project manager in this organization.</p>
                </div>
              )}

              <button
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-primary-container hover:opacity-90 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-outline-variant/15 text-center">
              <p className="text-xs text-on-surface-variant">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:text-primary-fixed-dim transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Operational Status */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="text-[10px] font-mono uppercase text-on-surface-variant tracking-wider">Auth Node: Operational</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-outline-variant/30"></div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant tracking-wider">v2.4.0-Stable</span>
            </div>
          </div>
        </div>
      </main>

      {/* Background Decorative Element */}
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] pointer-events-none overflow-hidden opacity-10">
        <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 w-full h-full bg-primary rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
};

export default SignupPage;
