import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and navigate to dashboard
    navigate('/dashboard');
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-on-primary bg-gradient-to-r from-primary to-primary-container hover:opacity-90 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/10" 
                type="submit"
              >
                Sign In
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-outline-variant/15 text-center">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Don't have an account? <br/>
                <span className="text-on-surface mt-1 block">Contact your organization administrator.</span>
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

      {/* Footer Component */}
      <footer className="w-full border-t border-[#464555]/15 bg-[#0b1326]">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 max-w-7xl mx-auto">
          <div className="mb-6 md:mb-0">
            <span className="text-lg font-black text-[#c0c1ff] tracking-tighter">TraceHub</span>
            <p className="mt-2 text-[10px] text-slate-500 font-sans tracking-widest uppercase">© {new Date().getFullYear()} TraceHub Forensic Systems. All rights reserved.</p>
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
