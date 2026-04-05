import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';

/**
 * Persistent shell for all authenticated dashboard routes.
 * The Sidebar lives here — it never unmounts when navigating between pages.
 */
const DashboardLayout: React.FC = () => (
  <div className="min-h-screen bg-surface text-on-surface transition-colors duration-300">
    <Sidebar />
    <Outlet />
  </div>
);

export default DashboardLayout;
