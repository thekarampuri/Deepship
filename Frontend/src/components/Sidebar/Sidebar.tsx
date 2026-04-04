import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Log Explorer', icon: 'database', path: '/logs' },
    { name: 'Issues', icon: 'error', path: '/issues' },
    { name: 'Projects', icon: 'folder', path: '/projects' },
    { name: 'Teams', icon: 'groups', path: '/teams' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 bg-slate-900/50 backdrop-blur-xl h-screen w-64 border-r border-white/5 shadow-2xl z-[60]">
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-base">lens_blur</span>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-[#c0c1ff]">TraceHub</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Forensic Lens</p>
        </div>
      </div>
      <div className="space-y-1 flex-1">
        {navItems.map((item) => (
          item.path === '#' ? (
            <a
              key={item.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 ease-in-out text-slate-400 hover:text-slate-100 hover:bg-[#131b2e] scale-[0.98] active:scale-95"
              href="#"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-sans text-sm tracking-tight">{item.name}</span>
            </a>
          ) : (
            <Link
              key={item.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 ease-in-out scale-[0.98] active:scale-95 ${
                isActive(item.path)
                  ? 'text-[#c0c1ff] bg-[#222a3d] font-semibold border-l-2 border-[#c0c1ff]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#131b2e]'
              }`}
              to={item.path}
            >
              <span className={`material-symbols-outlined ${isActive(item.path) ? 'fill-1' : ''}`} style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-sans text-sm tracking-tight">{item.name}</span>
            </Link>
          )
        ))}
      </div>
      <div className="mt-auto pt-6 border-t border-white/5 space-y-1">
        <a className="flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 ease-in-out text-slate-400 hover:text-slate-100 hover:bg-[#131b2e] scale-[0.98] active:scale-95" href="#">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-sans text-sm tracking-tight text-slate-400">Settings</span>
        </a>
        <div className="flex items-center gap-3 px-3 py-4 mt-2">
          <img
            alt="Organization Logo"
            className="w-8 h-8 rounded-lg bg-surface-container-highest object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm5mUFjaXuqhHMk4G3bvzouXS7e_Zf8Z-Q3MFaAIPwAatC8fNfm4METcvED6wa8UK9ONXhKTQ1efUFozBZJUGjdKIaK1ox8vyT6wjlv4vDO7ycYCosu5Orr8GP7oG8blv-iOJt304ckgxxZmsd8oYbI3jZ3NkA3RJA7tOLo1Zp6p_px4jEIdxMzuUEMvSafnNp6JdBHrY92Sa__oYPpBWEHhSeywl49aRKR9ha2oUx0vkbZbA1KS87rb7ijpoA2sUQI6SVv1uw1W8"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white leading-none truncate">Acme Corp.</p>
            <p className="text-[10px] text-slate-500 truncate">Enterprise Admin</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
