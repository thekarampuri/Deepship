import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate('/');
  };

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
    <div className="bg-surface-dim text-on-surface font-body selection:bg-primary/30 min-h-screen flex flex-col forensic-grid">
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Brand Anchor */}
          <div className="text-center mb-10">
            <div
              onClick={handleBack}
              className="inline-flex items-center justify-center p-3 rounded-xl bg-surface-container-low mb-4 transition-transform hover:scale-110 duration-300 cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-4xl">security</span>
            </div>
            <button
              onClick={handleBack}
              className="block w-full text-center hover:opacity-80 transition-opacity"
            >
              <h1 className="text-3xl font-extrabold tracking-tighter text-primary font-headline">TraceHub</h1>
            </button>
            <p className="text-on-surface-variant text-sm mt-2 tracking-tight">Forensic Log Aggregation & Analysis</p>
          </div>

          {/* Login Card */}
          <div className="glass-panel rounded-xl p-8 border border-outline-variant/15 shadow-[0px_24px_48px_-12px_rgba(6,14,32,0.5)]">
            {error && (
              <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-error-container/20 border border-error/20">
                <span className="material-symbols-outlined text-error text-lg">error</span>
                <span className="text-sm text-error">{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-sm group-focus-within:text-primary transition-colors">alternate_email</span>
                  </div>
                  <input
                    className="block w-full pl-10 py-4 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-outline/40 transition-all duration-200"
                    id="email"
                    name="email"
                    placeholder="forensic.analyst@organization.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <a className="text-[0.6875rem] font-semibold text-primary hover:text-primary-fixed-dim transition-colors" href="#">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-sm group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input
                    className="block w-full pl-10 py-4 bg-surface-container-lowest border-0 text-on-surface text-sm rounded-lg focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-outline/40 transition-all duration-200"
                    id="password"
                    name="password"
                    placeholder="••••••••••••"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  className="h-4 w-4 rounded border-outline-variant/30 bg-surface-container-lowest text-primary focus:ring-offset-surface-dim focus:ring-primary/40 cursor-pointer"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <label className="ml-2 block text-xs text-on-surface-variant cursor-pointer select-none" htmlFor="remember-me">
                  Remember this terminal for 30 days
                </label>
              </div>

              <button
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-primary-container hover:opacity-90 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 p-3 rounded-lg bg-surface-container-lowest/50 border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs text-on-surface-variant font-mono">
                <p>admin@tracehub.io / admin123</p>
                <p>manager@tracehub.io / manager123</p>
                <p>dev@tracehub.io / dev123</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant/15 text-center">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary font-semibold hover:text-primary-fixed-dim transition-colors">
                  Create one here
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

      {/* Footer */}
      <footer className="w-full border-t border-[#464555]/15 bg-[#0b1326]">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 max-w-7xl mx-auto">
          <div className="mb-6 md:mb-0">
            <span className="text-lg font-black text-[#c0c1ff] tracking-tighter">TraceHub</span>
            <p className="mt-2 text-[10px] text-slate-500 font-sans tracking-widest uppercase">&copy; {new Date().getFullYear()} TraceHub Forensic Systems. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="text-xs uppercase tracking-widest text-slate-500 hover:text-[#c0c1ff] transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="text-xs uppercase tracking-widest text-slate-500 hover:text-[#c0c1ff] transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
            <a className="text-xs uppercase tracking-widest text-slate-500 hover:text-[#c0c1ff] transition-colors opacity-80 hover:opacity-100" href="#">Security</a>
            <a className="text-xs uppercase tracking-widest text-slate-500 hover:text-[#c0c1ff] transition-colors opacity-80 hover:opacity-100" href="#">Status</a>
          </div>
        </div>
      </footer>

      {/* Background Decorative Element */}
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] pointer-events-none overflow-hidden opacity-10">
        <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 w-full h-full bg-primary rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
};

export default LoginPage;
