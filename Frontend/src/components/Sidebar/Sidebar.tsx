import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER';

interface NavItem {
  name: string;
  icon: string;
  path: string;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    { name: 'Organizations', icon: 'corporate_fare', path: '/admin/organizations' },
    { name: 'All Projects', icon: 'folder', path: '/admin/projects' },
    { name: 'All Developers', icon: 'group', path: '/admin/developers' },
    { name: 'Settings', icon: 'settings', path: '/admin/settings' },
  ],
  MANAGER: [
    { name: 'Dashboard', icon: 'dashboard', path: '/manager/dashboard' },
    { name: 'My Projects', icon: 'folder', path: '/manager/projects' },
    { name: 'Join Requests', icon: 'person_add', path: '/manager/requests' },
    { name: 'Team', icon: 'groups', path: '/manager/team' },
    { name: 'Settings', icon: 'settings', path: '/manager/settings' },
  ],
  DEVELOPER: [
    { name: 'Dashboard', icon: 'dashboard', path: '/developer/dashboard' },
    { name: 'My Projects', icon: 'folder', path: '/developer/projects' },
    { name: 'Browse Projects', icon: 'explore', path: '/developer/browse' },
    { name: 'My Logs', icon: 'receipt_long', path: '/developer/logs' },
    { name: 'Settings', icon: 'settings', path: '/developer/settings' },
  ],
};

const roleBadgeStyles: Record<UserRole, string> = {
  ADMIN: 'bg-primary/15 text-primary',
  MANAGER: 'bg-secondary/15 text-secondary',
  DEVELOPER: 'bg-tertiary/15 text-tertiary',
};

const roleBadgeLabels: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  DEVELOPER: 'Developer',
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = user?.role || 'DEVELOPER';
  const navItems = roleNavItems[role];

  const isActive = (path: string) => {
    if (path === `/${role.toLowerCase()}/dashboard`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 bg-slate-900/50 backdrop-blur-xl h-screen w-64 border-r border-white/5 shadow-2xl z-[60]">
      {/* Brand */}
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-base">lens_blur</span>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-[#c0c1ff]">TraceHub</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Forensic Lens</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 ease-in-out scale-[0.98] active:scale-95 ${
              isActive(item.path)
                ? 'text-[#c0c1ff] bg-[#222a3d] font-semibold border-l-2 border-[#c0c1ff]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-[#131b2e]'
            }`}
            to={item.path}
          >
            <span
              className={`material-symbols-outlined ${isActive(item.path) ? 'fill-1' : ''}`}
              style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="font-sans text-sm tracking-tight">{item.name}</span>
          </Link>
        ))}
      </div>

      {/* Bottom section */}
      <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 ease-in-out text-slate-400 hover:text-error hover:bg-error/5 w-full scale-[0.98] active:scale-95"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-sans text-sm tracking-tight">Logout</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-surface-container-low/50">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white leading-none truncate">{user?.full_name || 'User'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${roleBadgeStyles[role]}`}>
                {roleBadgeLabels[role]}
              </span>
              {user?.organization_name && (
                <span className="text-[10px] text-slate-500 truncate">{user.organization_name}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
