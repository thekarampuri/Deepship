import React from 'react';
import Sidebar from '../Sidebar/Sidebar';

const Dashboard: React.FC = () => {
  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-[#0b1326]/80 backdrop-blur-md h-16 border-b border-white/5 no-shadows">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white tracking-tight">Dashboard</span>
          <span className="text-slate-600 text-sm">/ Overview</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">search</span>
            <input className="bg-surface-container-lowest border-none rounded-lg py-1.5 pl-10 pr-4 w-64 text-sm focus:ring-1 focus:ring-primary/40 transition-all placeholder-slate-600" placeholder="Global search telemetry..." type="text"/>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#c0c1ff] transition-colors">notifications</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#c0c1ff] transition-colors">apps</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#c0c1ff] transition-colors">help</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <img alt="User Profile" className="w-8 h-8 rounded-full border border-white/10 group-hover:border-primary transition-colors" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6ib7GayVbaiGyEc40_sBCKaKkDm4cOuD-sz0kWs_dHFH62KPnqzvCrh0ciF40Ch4WvIUkfNUxYIHKZ0-_56eB5OfLuVKYc7o2mlteMmfJmHi0hA0D9UPS5AFtp3p07-OF-GZX_m12zkjzF_BKmLoJclLCzoQjRbhh8eYR02Ss6KAoS8wklXvDwAtl9u65gOiysz-ZnNC3SJaIQNEAUTxGg0YHSHe-VxrYE_fplVrapoaz381FG9xj0kl6w4LqxdwjqIym_acrEsY"/>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        {/* (1) Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Logs */}
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Total Logs (7d)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">4.2M</span>
                <span className="text-secondary text-xs font-bold">+12%</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">analytics</span>
            </div>
          </div>
          {/* New Issues */}
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">New Issues</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">142</span>
                <span className="text-error text-xs font-bold">+2.4%</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">warning</span>
            </div>
          </div>
          {/* Avg Response Time */}
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Avg Response</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">248ms</span>
                <span className="text-secondary text-xs font-bold">-18ms</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">timer</span>
            </div>
          </div>
          {/* Error Rate */}
          <div className="bg-surface-container-high p-6 rounded-lg relative overflow-hidden group border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Error Rate %</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tighter">0.08%</span>
                <span className="text-tertiary text-xs font-bold">Stable</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">monitoring</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* (2) Logs vs. Time Area Chart */}
          <div className="lg:col-span-2 bg-surface-container-low rounded-lg p-6 border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Log Density Stream</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Info</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Warn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-error"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Error</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end gap-1 overflow-hidden">
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[40%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[50%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[45%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-tertiary/20 to-tertiary/5 h-[30%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-error/40 to-error/10 h-[80%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[60%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[55%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[70%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-tertiary/20 to-tertiary/5 h-[40%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[45%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-error/40 to-error/10 h-[65%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[50%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[42%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[38%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[55%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-error/40 to-error/10 h-[90%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[45%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[30%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[50%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-secondary/20 to-secondary/5 h-[60%] rounded-t-sm transition-all duration-500"></div>
              <div className="flex-1 bg-gradient-to-t from-tertiary/20 to-tertiary/5 h-[40%] rounded-t-sm transition-all duration-500"></div>
            </div>
            <div className="mt-4 flex justify-between px-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>12:00 PM</span>
              <span>03:00 PM</span>
              <span>06:00 PM</span>
              <span>09:00 PM</span>
              <span>12:00 AM</span>
            </div>
          </div>
          {/* (4) Top Error-Prone Sub-modules Bar Chart */}
          <div className="bg-surface-container-low rounded-lg p-6 border border-white/5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-8">Volatility by Module</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-slate-400">auth-service</span>
                  <span className="text-error">2,482 errors</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full w-[85%] transition-all duration-1000"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-slate-400">payment-gateway</span>
                  <span className="text-error">1,102 errors</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full w-[45%] opacity-80 transition-all duration-1000"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-slate-400">search-indexer</span>
                  <span className="text-tertiary">842 errors</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full rounded-full w-[35%] transition-all duration-1000"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-slate-400">user-profile-api</span>
                  <span className="text-tertiary">315 errors</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full rounded-full w-[15%] opacity-70 transition-all duration-1000"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wide">
                  <span className="text-slate-400">media-resizer</span>
                  <span className="text-secondary">92 errors</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full w-[8%] transition-all duration-1000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* (3) Recent Critical Issues List */}
        <div className="bg-surface-container-low rounded-lg overflow-hidden border border-white/5">
          <div className="px-8 py-6 flex justify-between items-center bg-surface-container-lowest/30">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Critical Incidents</h3>
            <button className="text-[10px] font-bold text-primary uppercase border border-primary/20 px-3 py-1.5 rounded hover:bg-primary/5 transition-colors">Export Report</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-surface-container-low">
                <tr>
                  <th className="px-8 py-4">Incident Identity</th>
                  <th className="px-8 py-4">Project / Module</th>
                  <th className="px-8 py-4">Severity</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {/* Row 1 */}
                <tr className="group hover:bg-surface-container-high transition-colors severity-bar-error">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold group-hover:text-primary transition-colors">NullPointerException: User.auth_token</span>
                      <span className="text-slate-500 text-xs font-mono uppercase mt-1 tracking-tight">ID: #INC-8821</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium tracking-tight">Acme-Auth-Pro</span>
                      <span className="text-slate-500 text-xs uppercase mt-1 tracking-tight">auth-service / main-cluster</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-tight">Fatal</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                      <span className="text-white font-medium">Unresolved</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-slate-500 text-xs">2m ago</span>
                  </td>
                </tr>
                {/* Row 2 */}
                <tr className="group hover:bg-surface-container-high transition-colors severity-bar-error">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold group-hover:text-primary transition-colors">ConnectionTimeout: DB_READ_REPLICA_02</span>
                      <span className="text-slate-500 text-xs font-mono uppercase mt-1 tracking-tight">ID: #INC-8819</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium tracking-tight">Inventory-Core</span>
                      <span className="text-slate-500 text-xs uppercase mt-1 tracking-tight">db-proxy / primary</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-tight">Error</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-tertiary">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      <span className="font-medium">In Progress</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-slate-500 text-xs">14m ago</span>
                  </td>
                </tr>
                {/* Row 3 */}
                <tr className="group hover:bg-surface-container-high transition-colors severity-bar-warn">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold group-hover:text-primary transition-colors">SlowQueryWarning: product_search_aggregate</span>
                      <span className="text-slate-500 text-xs font-mono uppercase mt-1 tracking-tight">ID: #INC-8815</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium tracking-tight">Acme-Storefront</span>
                      <span className="text-slate-500 text-xs uppercase mt-1 tracking-tight">search-api / us-east-1</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container text-[10px] font-black uppercase tracking-tight">Warning</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      <span className="font-medium">Identified</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-slate-500 text-xs">45m ago</span>
                  </td>
                </tr>
                {/* Row 4 */}
                <tr className="group hover:bg-surface-container-high transition-colors severity-bar-error">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-white font-semibold group-hover:text-primary transition-colors">502 Bad Gateway: edge-proxy-ingress</span>
                      <span className="text-slate-500 text-xs font-mono uppercase mt-1 tracking-tight">ID: #INC-8812</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium tracking-tight">Network-Infrastructure</span>
                      <span className="text-slate-500 text-xs uppercase mt-1 tracking-tight">gateway-v2 / global</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-tight">Error</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      <span className="text-white font-medium">Unresolved</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-slate-500 text-xs">1h ago</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-8 py-4 text-center border-t border-white/5">
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">View All Incidents (142)</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
