import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER';

interface NavItem { name: string; icon: string; path: string; }

const roleNavItems: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { name: 'Dashboard',   icon: 'dashboard',           path: '/admin/dashboard' },
    { name: 'Manage Org',  icon: 'domain_verification', path: '/admin/manage-org' },
    { name: 'All Projects',icon: 'folder',              path: '/admin/projects' },
    { name: 'Settings',    icon: 'settings',            path: '/admin/settings' },
  ],
  MANAGER: [
    { name: 'Dashboard',     icon: 'dashboard',   path: '/manager/dashboard' },
    { name: 'My Projects',   icon: 'folder',      path: '/manager/projects' },
    { name: 'Join Requests', icon: 'person_add',  path: '/manager/requests' },
  ],
  DEVELOPER: [
    { name: 'Dashboard',   icon: 'dashboard', path: '/developer/dashboard' },
    { name: 'My Projects', icon: 'folder',    path: '/developer/projects' },
    { name: 'Invitations', icon: 'mail',      path: '/developer/invitations' },
    { name: 'My Profile',  icon: 'person',    path: '/developer/profile' },
  ],
};

const roleBadgeStyles: Record<UserRole, string> = {
  ADMIN:     'bg-primary/15 text-primary',
  MANAGER:   'bg-secondary/15 text-secondary',
  DEVELOPER: 'bg-tertiary/15 text-tertiary',
};

const roleBadgeLabels: Record<UserRole, string> = {
  ADMIN: 'Admin', MANAGER: 'Manager', DEVELOPER: 'Developer',
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const role = (user?.role || 'DEVELOPER') as UserRole;
  const navItems = roleNavItems[role];

  const isActive = (path: string) => {
    if (path === `/${role.toLowerCase()}/dashboard`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant/20 dark:border-outline-variant/10 shadow-sm z-[60] w-64 transition-colors duration-300">
      {/* Brand */}
      <div className="mb-10 px-2 flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
          <span className="material-symbols-outlined text-on-primary text-lg">lens_blur</span>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-primary">TraceHub</h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold leading-tight">Forensic Lens</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-in-out ${
              isActive(item.path)
                ? 'text-primary bg-primary/10 font-semibold border-l-2 border-primary pl-[10px]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high dark:hover:bg-surface-container-high'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="font-sans text-sm tracking-tight">{item.name}</span>
          </Link>
        ))}
      </div>

      {/* Bottom section */}
      <div className="mt-auto pt-5 border-t border-outline-variant/15 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high dark:hover:bg-surface-container-high w-full"
        >
          <span className="material-symbols-outlined text-[22px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
          <span className="font-sans text-sm tracking-tight">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
          {/* Toggle pill */}
          <div className={`ml-auto w-10 h-5 rounded-full transition-colors duration-300 flex items-center px-0.5 ${isDark ? 'bg-primary' : 'bg-outline-variant/50'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-on-surface-variant hover:text-error hover:bg-error/5 w-full"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span className="font-sans text-sm tracking-tight">Logout</span>
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 mt-1 rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/10">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface leading-none truncate">{user?.full_name || 'User'}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${roleBadgeStyles[role]}`}>
                {roleBadgeLabels[role]}
              </span>
              {user?.organization_name && (
                <span className="text-[10px] text-on-surface-variant truncate">{user.organization_name}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
