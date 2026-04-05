import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => navigate('/');

  const roleRedirects: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    MANAGER: '/manager/dashboard',
    DEVELOPER: '/developer/dashboard',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        navigate(roleRedirects[user.role] || '/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden bg-gradient-to-br from-[#1a0066] via-[#2d1b8e] to-[#4a3bcc] p-12 text-white"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#6C63FF]/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Top: logo */}
        <div className="relative z-10">
          <button onClick={handleBack} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-white text-xl">lens_blur</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">TraceHub</span>
          </button>
        </div>

        {/* Middle: headline */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Forensic Log Intelligence</p>
            <h2 className="text-4xl font-black tracking-tighter leading-tight mb-6">
              Detect. Trace.<br />
              <span className="text-[#c0b9ff]">Resolve.</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Real-time log aggregation and anomaly detection across all your services — in one unified forensic lens.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex gap-8"
          >
            {[
              { label: '4.2M', sub: 'Logs / day' },
              { label: '99.9%', sub: 'Uptime' },
              { label: '<2ms', sub: 'Ingest latency' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white tracking-tighter">{s.label}</p>
                <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold mt-0.5">{s.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom: social proof */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['SC', 'JR', 'AK'].map((initials) => (
              <div key={initials} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-[9px] font-bold text-white">
                {initials}
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs">Trusted by <span className="text-white font-semibold">2,400+</span> engineers</p>
        </div>
      </motion.div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-surface-dim dark:bg-surface-dim">
        {/* Top bar with theme toggle */}
        <div className="flex items-center justify-between px-8 py-4">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={handleBack} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-base">lens_blur</span>
              </div>
              <span className="font-black text-lg tracking-tighter text-primary">TraceHub</span>
            </button>
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

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">Welcome back</h1>
              <p className="text-on-surface-variant text-sm">Sign in to your TraceHub account</p>
            </motion.div>

            {/* Form card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-surface-container-lowest dark:bg-surface-container-low rounded-2xl border border-outline-variant/30 shadow-xl shadow-on-surface/5 p-8"
            >
              {error && (
                <div className="mb-6 flex items-center gap-3 p-3 rounded-xl bg-error-container/30 border border-error/30">
                  <span className="material-symbols-outlined text-error text-lg">error</span>
                  <span className="text-sm text-error">{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div>
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">alternate_email</span>
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analyst@organization.com"
                      className="block w-full pl-10 pr-4 py-3.5 bg-surface-container-low dark:bg-surface-container border border-outline-variant/40 dark:border-outline-variant/20 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/40 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                      Password
                    </label>
                    <a className="text-[0.6875rem] font-semibold text-primary hover:text-primary/70 transition-colors" href="#">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-on-surface-variant text-sm group-focus-within:text-primary transition-colors">lock</span>
                    </span>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full pl-10 pr-4 py-3.5 bg-surface-container-low dark:bg-surface-container border border-outline-variant/40 dark:border-outline-variant/20 text-on-surface text-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:outline-none placeholder:text-on-surface-variant/40 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-outline-variant/40 bg-surface-container-low text-primary focus:ring-primary/40 cursor-pointer"
                  />
                  <label className="text-xs text-on-surface-variant cursor-pointer select-none" htmlFor="remember-me">
                    Remember this device for 30 days
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-[#4a3bcc] hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In →'
                  )}
                </button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 p-4 rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-primary">info</span>
                  Demo Credentials
                </p>
                <div className="space-y-1.5 text-xs text-on-surface-variant font-mono">
                  <p className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-bold">ADMIN</span> admin@tracehub.io / admin123</p>
                  <p className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-secondary/10 text-secondary rounded text-[9px] font-bold">MGR</span> manager@tracehub.io / manager123</p>
                  <p className="flex items-center gap-2"><span className="px-1.5 py-0.5 bg-tertiary/10 text-tertiary rounded text-[9px] font-bold">DEV</span> dev@tracehub.io / dev123</p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-outline-variant/20 text-center">
                <p className="text-xs text-on-surface-variant">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary font-semibold hover:text-primary/70 transition-colors">
                    Create one here
                  </Link>
                </p>
              </div>
            </motion.div>

            {/* Status indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 flex items-center justify-center gap-4"
            >
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

export default LoginPage;
