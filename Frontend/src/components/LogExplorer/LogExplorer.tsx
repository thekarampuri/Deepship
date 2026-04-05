import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar/Sidebar';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const LogExplorer: React.FC = () => {
  const [isLogExpanded, setIsLogExpanded] = useState(true);

  return (
    <div className="bg-surface text-on-surface font-body overflow-hidden min-h-screen flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-h-screen h-screen">
        {/* TopAppBar */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-8 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-on-surface tracking-tight">Log Explorer</h2>
            <div className="h-4 w-px bg-outline-variant/30"></div>
            <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
              <span>Production</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">All Modules</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">search</span>
              </span>
              <input 
                className="bg-surface-container-lowest border-none rounded-lg pl-10 pr-4 py-1.5 text-sm w-80 focus:ring-1 focus:ring-primary/40 placeholder-on-surface-variant/40 transition-all" 
                placeholder="Search logs (e.g. NullPointerException)..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">notifications</button>
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">apps</button>
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">help</button>
              <div className="h-8 w-8 rounded-full bg-surface-container-highest border border-outline-variant/30 overflow-hidden ml-2 shadow-sm">
                <img alt="User Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTNAeTOmrkz8ckSkjKaweN5-1EVf0M9vqmMyq2Lyot453jtRHfWM9Zjhmg61U4jSBDRaHQcKOGS7c8xDpqfbftzKPNiadmIzuT-xu_8kGHK6b7WpM58-f1bPxQ6stCeMREOxgWFdcXLWe9DbqABt6hA78WYCpZe6XWmfhEOmm3eHbM76qJZgMCQzlN1ZicfRrVgfhp0gcaNab48IvRT7gCLAdsVbCnJfVWHeeDjnphfakJuV4dAWTm-TviXL5gcMhMhlkxwXdR0QA"/>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="bg-surface-container-low px-8 py-3 flex items-center gap-4 border-b border-outline-variant/20 shrink-0">
            <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">calendar_today</span>
              <select className="bg-transparent border-none text-xs font-medium focus:ring-0 py-0 cursor-pointer text-on-surface-variant">
                <option>Last 24 hours</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Custom Range</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">category</span>
              <select className="bg-transparent border-none text-xs font-medium focus:ring-0 py-0 cursor-pointer text-on-surface-variant">
                <option>All Modules</option>
                <option>Auth Service</option>
                <option>Payment Gateway</option>
                <option>Worker-A1</option>
              </select>
            </div>
            <div className="flex items-center gap-4 ml-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input defaultChecked className="rounded border-outline-variant/30 bg-surface-container-highest text-secondary focus:ring-0 focus:ring-offset-0 transition-colors" type="checkbox"/>
                <span className="text-[10px] font-black tracking-widest text-on-surface-variant group-hover:text-secondary transition-colors uppercase">INFO</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input defaultChecked className="rounded border-outline-variant/30 bg-surface-container-highest text-tertiary focus:ring-0 focus:ring-offset-0 transition-colors" type="checkbox"/>
                <span className="text-[10px] font-black tracking-widest text-on-surface-variant group-hover:text-tertiary transition-colors uppercase">WARN</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input defaultChecked className="rounded border-outline-variant/30 bg-surface-container-highest text-error focus:ring-0 focus:ring-offset-0 transition-colors" type="checkbox"/>
                <span className="text-[10px] font-black tracking-widest text-on-surface-variant group-hover:text-error transition-colors uppercase">ERROR</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input className="rounded border-outline-variant/30 bg-surface-container-highest text-error-container focus:ring-0 focus:ring-offset-0 transition-colors" type="checkbox"/>
                <span className="text-[10px] font-black tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors uppercase">FATAL</span>
              </label>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">refresh</span>
                Refresh
              </button>
              <button className="flex items-center gap-2 bg-surface-container-highest border border-outline-variant/20 text-on-surface px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-bright transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">download</span>
                Export CSV
              </button>
            </div>
          </div>

          {/* Log Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-[1400px] mx-auto space-y-4">
              {/* Summary Bento Grid */}
              <div className="grid grid-cols-12 gap-4 mb-8">
                <div className="col-span-3 p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 relative overflow-hidden group shadow-sm transition-all hover:bg-surface-container-high/50">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] mb-1 uppercase">TOTAL EVENTS</p>
                    <h3 className="text-2xl font-black text-on-surface tracking-tighter">1,284,012</h3>
                    <p className="text-[10px] text-secondary mt-2 flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-xs">trending_up</span> +12% from last hour
                    </p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-8xl">analytics</span>
                  </div>
                </div>
                <div className="col-span-3 p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 relative overflow-hidden group shadow-sm transition-all hover:bg-surface-container-high/50">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] mb-1 uppercase">ERROR RATE</p>
                    <h3 className="text-2xl font-black text-error tracking-tighter">0.42%</h3>
                    <p className="text-[10px] text-error mt-2 flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-xs">warning</span> 14 critical crashes
                    </p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-8xl">error</span>
                  </div>
                </div>
                <div className="col-span-6 p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between group transition-all hover:bg-surface-container-high/50">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] mb-1 uppercase">REAL-TIME THROUGHPUT</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                      <span className="text-[10px] text-secondary font-black tracking-widest uppercase">LIVE</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {[40, 60, 30, 50, 90, 100, 70, 45, 65, 35, 55, 85].map((height, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-sm transition-all duration-300 ${i === 5 ? 'bg-primary/60' : i === 11 ? 'bg-primary/50' : 'bg-primary/20'}`} 
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Log Table */}
              <div className="rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-low shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-surface-container-lowest text-on-surface-variant">
                      <th className="py-4 px-6 text-[10px] font-black tracking-[0.2em] uppercase">Timestamp (UTC)</th>
                      <th className="py-4 px-4 text-[10px] font-black tracking-[0.2em] uppercase">Module</th>
                      <th className="py-4 px-4 text-[10px] font-black tracking-[0.2em] uppercase text-center">Severity</th>
                      <th className="py-4 px-6 text-[10px] font-black tracking-[0.2em] uppercase">Message</th>
                      <th className="py-4 px-4 text-[10px] font-black tracking-[0.2em] uppercase">Host</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Log Row 1 (Error) */}
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer transition-colors border-l-2 border-error group"
                      onClick={() => setIsLogExpanded(!isLogExpanded)}
                    >
                      <td className="py-4 px-6 text-[11px] font-mono text-on-surface-variant">2023-10-27 14:22:01.442</td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 uppercase tracking-tight">AUTH_SVC</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-error-container/80 text-on-error-container uppercase tracking-tight border border-error/20">ERROR</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant font-mono truncate max-w-md group-hover:text-primary transition-colors">java.lang.NullPointerException: Cannot invoke "String.toLowerCase()" because "input" is null</td>
                      <td className="py-4 px-4 text-[11px] text-on-surface-variant font-mono">pod-auth-7f92</td>
                    </tr>
                    
                    {/* Expansion Row 1 */}
                    {isLogExpanded && (
                      <tr className="bg-surface-container-highest/20 transition-all">
                        <td className="p-0 border-l-2 border-error" colSpan={5}>
                          <div className="px-10 py-6 space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                              <div>
                                <h4 className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] mb-3 uppercase">Stack Trace</h4>
                                <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 font-mono text-xs text-error/80 leading-relaxed overflow-x-auto whitespace-pre custom-scrollbar max-h-48">
                                  at com.acme.auth.TokenValidator.process(TokenValidator.java:142)
                                  {"\n"}at com.acme.auth.AuthHandler.handle(AuthHandler.java:56)
                                  {"\n"}at io.netty.channel.AbstractChannelHandlerContext.invokeChannelRead(AbstractChannelHandlerContext.java:379)
                                  {"\n"}at io.netty.channel.DefaultChannelPipeline.fireChannelRead(DefaultChannelPipeline.java:910)
                                  {"\n"}... 12 more lines
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] mb-3 uppercase">Metadata Explorer</h4>
                                <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 font-mono text-xs text-secondary/90 leading-relaxed group">
                                  {[
                                    { key: 'request_id', value: 'req_9x2j4k1l' },
                                    { key: 'user_id', value: 'usr_8821' },
                                    { key: 'api_version', value: 'v2.4.0' },
                                    { key: 'region', value: 'us-east-1' }
                                  ].map((row, i) => (
                                    <div key={i} className={`flex justify-between py-1.5 ${i !== 3 ? 'border-b border-outline-variant/20' : ''}`}>
                                      <span className="text-on-surface-variant uppercase tracking-widest">{row.key}:</span>
                                      <span className="text-on-surface-variant">{row.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Log Row 2 (Info) */}
                    <tr className="hover:bg-gray-50 cursor-pointer transition-colors border-l-2 border-secondary group">
                      <td className="py-4 px-6 text-[11px] font-mono text-on-surface-variant">2023-10-27 14:21:58.910</td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 uppercase tracking-tight">PAY_GW</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-secondary-container/30 text-secondary uppercase tracking-tight border border-secondary/20">INFO</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant font-mono truncate max-w-md group-hover:text-primary transition-colors">Transaction completed successfully for order_id: 99281-XC</td>
                      <td className="py-4 px-4 text-[11px] text-on-surface-variant font-mono">pod-pay-22a1</td>
                    </tr>

                    {/* Log Row 3 (Warn) */}
                    <tr className="hover:bg-gray-50 cursor-pointer transition-colors border-l-2 border-tertiary group">
                      <td className="py-4 px-6 text-[11px] font-mono text-on-surface-variant">2023-10-27 14:21:55.002</td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 uppercase tracking-tight">DB_PROXY</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-tertiary-container/30 text-tertiary uppercase tracking-tight border border-tertiary/20">WARN</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant font-mono truncate max-w-md group-hover:text-primary transition-colors">Connection pool reaching 85% capacity (170/200)</td>
                      <td className="py-4 px-4 text-[11px] text-on-surface-variant font-mono">db-master-01</td>
                    </tr>

                    {/* Log Row 4 (Info) */}
                    <tr className="hover:bg-gray-50 cursor-pointer transition-colors border-l-2 border-secondary group">
                      <td className="py-4 px-6 text-[11px] font-mono text-on-surface-variant">2023-10-27 14:21:49.221</td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 uppercase tracking-tight">WORKER_A1</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-secondary-container/30 text-secondary uppercase tracking-tight border border-secondary/20">INFO</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant font-mono truncate max-w-md group-hover:text-primary transition-colors">Started batch processing job: cleanup_orphaned_sessions</td>
                      <td className="py-4 px-4 text-[11px] text-on-surface-variant font-mono">node-compute-09</td>
                    </tr>
                  </tbody>
                </table>
                
                {/* Table Footer / Pagination */}
                <div className="bg-surface-container-lowest px-6 py-4 flex items-center justify-between border-t border-outline-variant/20">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Showing 1-50 of 12,842 results</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-sm">first_page</span>
                    </button>
                    <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-black rounded border border-primary/20">1</span>
                    <span className="px-3 py-1 hover:bg-surface-container-high text-on-surface-variant text-xs font-bold rounded cursor-pointer transition-all border border-transparent hover:border-outline-variant/20">2</span>
                    <span className="px-3 py-1 hover:bg-surface-container-high text-on-surface-variant text-xs font-bold rounded cursor-pointer transition-all border border-transparent hover:border-outline-variant/20">3</span>
                    <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                    <button className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-sm">last_page</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Floating Help Button */}
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-full shadow-2xl flex items-center justify-center text-on-primary hover:scale-110 active:scale-90 transition-all group z-50 animate-bounce hover:animate-none">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          <span className="absolute right-16 bg-surface-container-highest px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 shadow-2xl border border-outline-variant/20">
            Expert Support Agent
          </span>
        </button>
      </div>
    </div>
  );
};

export default LogExplorer;
