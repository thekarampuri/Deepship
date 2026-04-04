import React from 'react';
import { Link } from 'react-router-dom';

const IssuesPage: React.FC = () => {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#0b1326] text-[#dae2fd]">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full flex flex-col py-6 px-4 h-screen w-64 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl z-50">
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-[#c0c1ff]">TraceHub</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Forensic Lens</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/5 text-slate-400 hover:text-slate-100" to="/dashboard">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="font-sans text-sm tracking-tight Inter">Dashboard</span>
          </Link>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/5 text-slate-400 hover:text-slate-100" href="#">
            <span className="material-symbols-outlined text-lg">database</span>
            <span className="font-sans text-sm tracking-tight Inter">Log Explorer</span>
          </a>
          {/* Active State: Issues */}
          <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#c0c1ff] bg-[#222a3d] font-semibold border-l-2 border-[#c0c1ff] transition-all duration-200 ease-in-out" to="/issues">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            <span className="font-sans text-sm tracking-tight Inter">Issues</span>
          </Link>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/5 text-slate-400 hover:text-slate-100" href="#">
            <span className="material-symbols-outlined text-lg">folder</span>
            <span className="font-sans text-sm tracking-tight Inter">Projects</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/5 text-slate-400 hover:text-slate-100" href="#">
            <span className="material-symbols-outlined text-lg">groups</span>
            <span className="font-sans text-sm tracking-tight Inter">Teams</span>
          </a>
        </nav>
        <div className="mt-auto pt-6 border-t border-white/5">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/5 text-slate-400 hover:text-slate-100" href="#">
            <span className="material-symbols-outlined text-lg">settings</span>
            <span className="font-sans text-sm tracking-tight Inter">Settings</span>
          </a>
          <div className="mt-4 flex items-center gap-3 px-3 py-2">
            <img alt="User Profile" className="w-8 h-8 rounded-full border border-white/10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfRZfzVmJWhfMTVK06h_TpIL15x--Wr3gGOW6NrfJx2X8gcj-sce73qVleVpPogOdYgKe63y7bOBaVTOmx5BqK9viXoo1krzILhZr_uW1qw13S_oLiXUltUqy9n7DMX9vcuIFT7Yr3h4Lx-l7auTIYjVYefIzSWSL_G5gTixigKDMYjqcRtMynHipegO7FMFcVl6yPHKkboSO7PVl_cJ84jDtw3SpWq0ORatqeX_PgmlsKiY5XJBOlzV6tM00Gcl1TipEZRwVc-jU"/>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Alex Chen</p>
              <p className="text-[10px] text-slate-500 truncate">Lead Developer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-8 h-16 w-full bg-[#0b1326]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white Inter">Issue Tracker</h2>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-medium text-slate-400">Acme Corp.</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
              <input className="w-full bg-surface-container-lowest border-none rounded-lg py-2 pl-10 pr-4 text-xs text-slate-300 focus:ring-1 focus:ring-primary/40 placeholder-slate-600 transition-all" placeholder="Search issues, traces, or users (Cmd+K)" type="text"/>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-[#c0c1ff] hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>
              <button className="p-2 text-slate-400 hover:text-[#c0c1ff] hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-xl">apps</span>
              </button>
              <button className="p-2 text-slate-400 hover:text-[#c0c1ff] hover:bg-white/5 rounded-md cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-xl">help</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-8 max-w-7xl mx-auto w-full">
          {/* Stats / Editorial Header */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="col-span-1 p-6 rounded-xl bg-surface-container-low border border-white/5 relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Total Open</p>
                <h3 className="text-4xl font-black text-primary tracking-tighter">142</h3>
                <p className="text-[10px] text-secondary font-medium mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_down</span> 12% from last week
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">error</span>
              </div>
            </div>
            <div className="col-span-1 p-6 rounded-xl bg-surface-container-low border border-white/5">
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Mean Time to Resolve</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">4.2<span className="text-lg font-normal text-slate-500 ml-1">hrs</span></h3>
              <p className="text-[10px] text-error font-medium mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span> 0.5hr increase
              </p>
            </div>
            <div className="col-span-2 p-6 rounded-xl bg-surface-container-low border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Active Incidents</p>
                <div className="flex -space-x-2 mt-3">
                  <img alt="Architect" className="w-8 h-8 rounded-full border-2 border-surface-container-low" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDky3rz6sEEnwpc0mzeiwOI32sQXz92Mgk32VNbxHQDVtn7rLIsW90DD8g7c-qkS3px1xqF7o73HMt6IdpPZ8Ugymcmx_qtjKcG1pFrpx2ud5BQINz3BxjHN1eRf1FhW5GFThyBBn2kifR4yNmSiJv_fyVWOeuOPpm2DOrv_Vv8kvly2L34kIVtgbh2gtAuewiIYwFxLMKi1AePwqU9a-WpoCco4FdUj6FCGGlzkTx5bsivsKr6P2mZ_-XxDdqtJVa-gLSL5cbaWS8"/>
                  <img alt="Senior Dev" className="w-8 h-8 rounded-full border-2 border-surface-container-low" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFmr4TUBAH_2klxnTuvwBuHFwyooiYOP47Gyv2nUqnHFjiXD3axgtuByYkeh5_-Ya58_TmSOfpI-lobQh1og-E7clW7Spc9J53LjeMztHuDU8bnVxUL3sNS07SCfIBwUswTsW5K1bmmsJl28RLM5hgtakXpRzIpMyf5OnJTnArJfrriNYr06yKO73oSXsSohpJOtJYAA-wN9HTpWMRcnB2wtERCwPFraCa-mPZwJYKNDtaCbvcUIMRhEwQ1n13y8KX6YG2x8eUvus"/>
                  <img alt="Dev" className="w-8 h-8 rounded-full border-2 border-surface-container-low" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCm_CxvNbD20BP6oqnNYimBdiCtSyhVHsTZNuA7_J6JSjElAGD8nrmUU8LBuBAHcoA6gKqxbSLGcAxO4mPeZEL-yP5CIiSme4HhD513JOqUdRdF0UzuKz-Kl1lbgLFN-wzp9VFf3ouULoXNKSPXpXvDfggGsi_m4zh7Tz47fGFnRlP9D9C3EJ5ii56aFZC_9mUvjs6mNMHCD_eRZ5mQVm9A3bY_nthQOmK5zHJFSH0JcYZGcL8RHQ0EhriDvkI5XqrIDu7ffFphaTs"/>
                  <div className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-slate-300">+4</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold rounded shadow-lg active:scale-95 transition-transform">
                CREATE INCIDENT
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
              <select className="bg-transparent border-none text-xs font-medium text-slate-200 focus:ring-0 p-0 cursor-pointer">
                <option>All Statuses</option>
                <option selected>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Project:</span>
              <select className="bg-transparent border-none text-xs font-medium text-slate-200 focus:ring-0 p-0 cursor-pointer">
                <option>All Projects</option>
                <option>PaymentGateway</option>
                <option>AuthService</option>
                <option>UserDashboard</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Severity:</span>
              <select className="bg-transparent border-none text-xs font-medium text-slate-200 focus:ring-0 p-0 cursor-pointer">
                <option>All Severities</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Assignee:</span>
              <select className="bg-transparent border-none text-xs font-medium text-slate-200 focus:ring-0 p-0 cursor-pointer">
                <option>Everyone</option>
                <option>Me</option>
                <option>Unassigned</option>
              </select>
            </div>
            <button className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Clear Filters
            </button>
          </div>

          {/* Issues Table */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Issue Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Context</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Severity</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Assigned To</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Created</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Row 1 */}
                <tr className="group hover:bg-white/[0.02] transition-colors relative">
                  <td className="px-6 py-5">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-error"></div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] text-slate-500">TRC-4821</span>
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">OutOfMemoryError: Java heap space</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-200">PaymentGateway</span>
                      <span className="text-[10px] text-slate-500">checkout-service</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 rounded-[4px] bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-tight">Critical</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></div>
                      <span className="text-xs font-medium text-slate-300">Open</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <img alt="Marcus" className="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6uYaQ57X8yGPry8rY_UjVrnb1FwbR8Ya1Q0p3VY54Fjd_c80yK6l3INASPjEFBSoSbcnBZeIzWNpLUnM7bBBtG5rXIy6ZRiiulT7jex54rRmVyXNXy8E7JqdEI6IAFhrkb4ZSRt2vhiSR2KjMmm7lTtEGh0AIH4mmI-Ca33EtOPtt4fGYqrMY2RwtswQ5EtyTWTh3GkoZHW5HDI8SchSYqhLN-NCJJ79GFk4yYycjEB3bOOKp56BDg6x4dLGPR2pODxWQ4PEIx68"/>
                      <span className="text-xs text-slate-300">Marcus Wright</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-slate-500">2h ago</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-primary" title="Comment"><span className="material-symbols-outlined text-lg">chat_bubble</span></button>
                      <button className="p-1.5 text-slate-400 hover:text-secondary" title="Mark as Resolved"><span className="material-symbols-outlined text-lg">check_circle</span></button>
                    </div>
                  </td>
                </tr>
                {/* Row 2 */}
                <tr className="group hover:bg-white/[0.02] transition-colors relative">
                  <td className="px-6 py-5">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-tertiary"></div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] text-slate-500">TRC-4819</span>
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">NullPointerException in DiscountCalculator</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-200">InventorySync</span>
                      <span className="text-[10px] text-slate-500">pricing-engine</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 rounded-[4px] bg-tertiary-container text-on-tertiary-container text-[10px] font-black uppercase tracking-tight">Medium</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-tertiary"></div>
                      <span className="text-xs font-medium text-slate-300">In Progress</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <img alt="Sarah" className="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfSra2uT7D21-ABA7kt6HvYulHslIThKuBiwGKQJ3nQzHKwjDWLQVohSlR9ioonKDTUnfKI3X_2vEDScRuyce1uUkck2tf5J-Q502AtTx7qZMwEQ94cdSfBFqxW2BYaXUJw4T_AWbco23O20ehXFs2CxsB5jI9MjnTJlnk5p9OSFSLnirUYTrEt8p0Nx7EYnBRBiqRMkAYB-e03R6bju2d8Bnb4QKdRNyCLmqxLIJ-2H7lE4ztsfTorEqfN0blxvyiuwhIWbHGrMI"/>
                      <span className="text-xs text-slate-300">Sarah Jenkins</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-slate-500">5h ago</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-primary" title="Comment"><span className="material-symbols-outlined text-lg">chat_bubble</span></button>
                      <button className="p-1.5 text-slate-400 hover:text-secondary" title="Mark as Resolved"><span className="material-symbols-outlined text-lg">check_circle</span></button>
                    </div>
                  </td>
                </tr>
                {/* Row 3 */}
                <tr className="group hover:bg-white/[0.02] transition-colors relative">
                  <td className="px-6 py-5">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-error"></div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] text-slate-500">TRC-4815</span>
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Deadlock detected in DB connection pool</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-200">AuthService</span>
                      <span className="text-[10px] text-slate-500">core-api</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 rounded-[4px] bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-tight">High</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                      <span className="text-xs font-medium text-slate-300">Open</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button className="px-3 py-1 bg-surface-container-highest border border-white/10 rounded text-[10px] font-bold text-primary hover:bg-primary hover:text-on-primary transition-colors">
                      ASSIGN TO ME
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-slate-500">Yesterday</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-primary" title="Comment"><span className="material-symbols-outlined text-lg">chat_bubble</span></button>
                      <button className="p-1.5 text-slate-400 hover:text-secondary" title="Mark as Resolved"><span className="material-symbols-outlined text-lg">check_circle</span></button>
                    </div>
                  </td>
                </tr>
                {/* Row 4 */}
                <tr className="group hover:bg-white/[0.02] transition-colors relative">
                  <td className="px-6 py-5">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-secondary"></div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] text-slate-500">TRC-4792</span>
                      <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">Incorrect total amount on PDF invoices</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-200">BillingApp</span>
                      <span className="text-[10px] text-slate-500">invoice-renderer</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2 py-0.5 rounded-[4px] bg-secondary-container text-on-secondary-container text-[10px] font-black uppercase tracking-tight">Low</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                      <span className="text-xs font-medium text-slate-300">Resolved</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <img alt="David" className="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7pEwwWqxjgQDYx_fpAGAYJar2-CW_iEE6pfP_K_grENP0W9SohsEUDhz_qHeO9Zc66R0p4nepv4XPUbOlZYVFTQb9RzwpRHGYZLXi3erwe2-aaHx5wVWZL_2ml_WFVkcdZgbs7pi5RBYUsPoSoUx6_CvmmXxAV8yi4tiJ1vjrnXaQ0h8DtYbtPVtwZ08MUfYrZ5UaDkdGpL1kjB593t_qhRzsXu7vk7LYc1IhZ0PSgp0FMZaI2Vore32SxamaWqAN9OjN7lKXKi0"/>
                      <span className="text-xs text-slate-300">David Low</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-slate-500">2 days ago</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-primary" title="Comment"><span className="material-symbols-outlined text-lg">chat_bubble</span></button>
                      <button className="p-1.5 text-slate-400 hover:text-error" title="Reopen"><span className="material-symbols-outlined text-lg">history</span></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            {/* Table Footer */}
            <div className="px-6 py-4 bg-surface-container-low border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Showing 1-10 of 142 issues</span>
              <div className="flex gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded border border-white/5 text-slate-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-bold text-[10px]">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-white/5 text-slate-500 hover:text-white transition-colors text-[10px]">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-white/5 text-slate-500 hover:text-white transition-colors text-[10px]">3</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-white/5 text-slate-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Log Detail (Forensic Style) */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-surface-container-low rounded-xl border border-white/5 p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                  Active Trace: TRC-4821
                </h4>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-surface-container-highest text-[9px] text-slate-400 font-bold rounded">RAW LOG</span>
                  <span className="px-2 py-0.5 bg-surface-container-highest text-[9px] text-primary font-bold rounded">FORMATTED</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-4 font-mono text-[11px] leading-relaxed text-slate-400 custom-scrollbar max-h-[240px] overflow-y-auto">
                <div className="flex gap-4 mb-1">
                  <span className="text-slate-600">09:14:22.451</span>
                  <span className="text-error font-bold">[ERROR]</span>
                  <span className="text-slate-300">java.lang.OutOfMemoryError: Java heap space</span>
                </div>
                <div className="flex gap-4 mb-1 pl-4 opacity-75">
                  <span className="text-slate-600">at com.acme.gateway.CheckoutService.processLargePayload(CheckoutService.java:142)</span>
                </div>
                <div className="flex gap-4 mb-1 pl-4 opacity-75">
                  <span className="text-slate-600">at com.acme.gateway.CheckoutService.handleRequest(CheckoutService.java:89)</span>
                </div>
                <div className="flex gap-4 mb-1 pl-4 opacity-75">
                  <span className="text-slate-600">at com.acme.gateway.CheckoutController.checkout(CheckoutController.java:45)</span>
                </div>
                <div className="flex gap-4 mb-1">
                  <span className="text-slate-600">09:14:22.453</span>
                  <span className="text-tertiary font-bold">[WARN]</span>
                  <span className="text-slate-400">Connection pool exhausted. Waiting for available connection...</span>
                </div>
                <div className="flex gap-4 mb-1">
                  <span className="text-slate-600">09:14:23.102</span>
                  <span className="text-error font-bold">[FATAL]</span>
                  <span className="text-slate-200">System termination signal received. Dumping core...</span>
                </div>
              </div>
            </div>
            <div className="col-span-1 bg-surface-container-low rounded-xl border border-white/5 p-6">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4">Affected Assets</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-surface-container-highest rounded-lg">
                  <div className="p-2 bg-secondary/10 rounded">
                    <span className="material-symbols-outlined text-secondary text-sm">cloud</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">aws-us-east-1a</p>
                    <p className="text-[10px] text-slate-500">EC2 Instance i-04d2a...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container-highest rounded-lg">
                  <div className="p-2 bg-primary/10 rounded">
                    <span className="material-symbols-outlined text-primary text-sm">database</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">rds-prod-primary</p>
                    <p className="text-[10px] text-slate-500">PostgreSQL 14.2</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container-highest rounded-lg">
                  <div className="p-2 bg-error/10 rounded">
                    <span className="material-symbols-outlined text-error text-sm">storage</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">redis-cache-main</p>
                    <p className="text-[10px] text-slate-500">Cache Overflow Detected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IssuesPage;
