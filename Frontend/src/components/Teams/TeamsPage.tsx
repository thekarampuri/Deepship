import React from 'react';


const TeamsPage: React.FC = () => {
  const auditLogs = [
    { user: 'alex_rivera', action: 'granted', permission: 'WRITE_ACCESS', target: 'team_beta', resource: 'telemetry_ingest_pipe', time: '2 minutes ago', id: '99421-AX', statusColor: 'secondary' },
    { user: 'admin_sys', action: 'revoked', permission: 'ADMIN_PRIVILEGES', target: 'user:marcus_t', time: '1 hour ago', id: '99418-AX', statusColor: 'tertiary' },
    { user: 'chen_sarah', action: 'created', permission: 'new team', target: 'Security-Operations', time: '4 hours ago', id: '99405-AX', statusColor: 'outline-variant' },
  ];

  const teams = [
    { 
      name: 'Alpha', 
      type: 'Core Services', 
      members: 12, 
      color: 'primary',
      lead: { name: 'Alex Rivera', role: 'Team Lead', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBulgLZJdLTEXweKUtHcAWEM1-v44i5RemBGpfn---OHKaWYOjhQG2MLwD1km_vQo_P7R6OG1L8fCBg4GRliD2kj01O9bFNQt0OtYkFnltPHjVyavcuxyOhqSDFcJ-Rq-okfq_Nk8IidQftRkueqwqBUMDz9RjVTyZH5k0Vx_iH_PN5bmKCUUdoAdIWGUqaCjNvqUc7UBYwe9lzAK_eWt03lik5BOA4BTo6SAYPa0TIzJwSM9gt9n2qCoY18NmUyUK-CF2y-7by4Dg' },
      membersList: [
        { name: 'Sarah Chen', role: 'Sr. Backend Eng', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkcvss2T2HqLPj0gYsChkPGlZV1VDmUlIEaH3qnK-akhd_Ul8u_4m-KHPJx16E4k3oTz75X1rkbhy8gfj7MmFj1511QvCeX-TQqB21sl83toiH2dPyYI9aZo86N5wqwRAaxMkwoY4XiJD36T22m-DXcLKPuxwBZLwJmea3LcLruN-Cu7Pwl6D_dQ0NIzzN9cP10JM34cJ3DlIlY_QkG3pgRE2T2Vwdr2fM5PrInUgsPqVfzxxe89RJHWnL0Yf0HcEqM-QmyNAaeSg' },
        { name: 'Marcus Thorne', role: 'Systems Architect', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKgaUQdFnT4PWwQ7NVhuzG4FZdJzmjY5geFtm1kxsplztA1EqYBQ_afTdAfSJypUuXqwOAnHZIfJFkbPPiEs5Hyg52SjeTVHMjEfz3I3CJBGkN71ys4DEkHiNLiGdBZCGUsoIB4BfqkpfgVgZH16_S_1T9GzZast6khshCLd01dhsvV_hCqzc66ILFCs7GNSweF9nak3UdqIFn_EVcYVpri-fcNX65fNS4VE68Td0cxoK3gPdH8yyVSLJ7pUKhfNvTq3pNJ0xMl9A' }
      ],
      modules: ['auth-srv', 'api-gateway', 'user-registry']
    },
    { 
      name: 'Beta', 
      type: 'Infrastructure', 
      members: 8, 
      color: 'secondary',
      lead: { name: 'Jordan Smythe', role: 'SRE Lead', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTLdKj-x1b_P2Me3PTW3ubmFwMsgzoOKKtTPDi2EU6aAZJRenIFHdpJJMcrfJT5wWGZ9vOBfoO4AHcHixlDUTXS14pu7etA-56T-EKrZabH-DZBoeQ7F4N-ZBeRPankqr6HTZ3qF1yQsnY6g3jOsQsr0na2Vcf8r7sJwLg-MZ3JjgDZImijrbUzyvsPqz53Eh3kdg8SBOIwc-doeiNM9yRrmv3CoYta8t6wLl-4bLGEspI_Is_hhnhlqRfzq20vqia7WG3c6GqXbs' },
      membersList: [
        { name: 'Elena Rodriguez', role: 'Cloud Engineer', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC27E3U9AgWuFEs8B_0kY3t7BZ_y1X5hRm3CXaHA_H9u7Qhh7kkKlnS3mGY8nJNLk6mA6HtU8dOIPMirPPTCongjQdQ359GfKpEzsklZ_PRefICTHS96D5ESuJJtNTRSHGTYEdx76nO1Btp8TgoRVHIt3nhKTHWPRtvv6Qlayrtnzb7dWcjtgTFX60AWK355DsRd22SsSallWT7NlMTldf6BYTG4avU4UU1T4IkH0clVa5R80v8Vi7q5UOFB0t7ZoyYGDuBV4wg1Ps' }
      ],
      modules: ['k8s-provisioner', 'ingress-ctl'],
      extra: 6
    },
    { 
      name: 'Gamma', 
      type: 'Data Pipelines', 
      members: 15, 
      color: 'tertiary',
      lead: { name: 'Dr. Lisa Wu', role: 'Principal Data Eng', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2TFus09I986d3Y0OiWrCFNVGrie3MPCb0Cm69_7uBJfXm-DqOauD4yFEaGljHZtwcRyqarKmqfg1nuTCcVY0bUqAAk5y5M1TgvO1JM7kzDnz7GKiPpJQXjA-fmaBshtiVOyfROsP1mSxJHkYid9qWG6dkRbqBuZkqeHj8rwLM2KDw6pQ7807QWQQmr1HT1PGwhxipnaInSCg-DCj_UHUKQoknk-HIg9aKJW_HQfX6cDjyxGoAWHnfE_eoy_n-2L9a2fI4XxaLfms' },
      membersList: [
        { name: 'Samir Gupta', role: 'Analytic Specialist', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_zFki6WnAok1rEL_8Hx9WOOG3dn7uUXSzD1JYLPykqcn5o48u2j_MQ2e_4Dp6SZnUhXE3vLBys3mPWVo34NeVKSic5Bm8NyB1_IlPFZb0oXhgqhv2GhFOav4SUy30S1uifPqAM6Ru80q_bVIct_c4SaCLFqQH6wm18IyeRLrQxmhy0L08-fFqB8z--ud_bRYPJLNsZnjk4NEGc8ClzWXUFOzPuEyjZCIe27Fu7cg66guJLvknCG1yktNt6X61v9QPO6LPLe16ipI' }
      ],
      modules: ['spark-ingest', 'schema-registry', 'bigquery-adapter']
    }
  ];

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary selection:text-on-primary min-h-screen">


      <main className="ml-64 min-h-screen flex flex-col">
        {/* Top App Bar */}
        <header className="flex justify-between items-center px-8 py-4 w-full bg-[#0b1326] border-b border-[#464555]/15 sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="relative flex items-center group">
              <span className="material-symbols-outlined absolute left-3 text-slate-500 text-sm group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="bg-surface-container-lowest border-none text-xs py-2 pl-9 pr-4 w-64 rounded-lg focus:ring-1 focus:ring-primary/40 text-on-surface transition-all placeholder:text-slate-600" 
                placeholder="Filter teams or members..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">notifications</button>
            <button className="material-symbols-outlined text-slate-400 hover:text-white transition-colors">help_outline</button>
            <div className="h-8 w-[1px] bg-outline-variant/20 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-[10px] font-bold text-primary uppercase tracking-tighter leading-none">Account</p>
                <p className="text-[11px] text-slate-500 leading-tight">Super Admin</p>
              </div>
              <img 
                alt="User profile avatar" 
                className="w-8 h-8 rounded-full border border-primary/20 hover:border-primary transition-colors" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbKJxKjwf8hDulqFM6sBByIPWvX-nYyl2TrQpbK9SWC47Ck9cEl-hnUm0NR4qgk-r_0PD7NMzBI7oIh8CIHJJng1ROYRhx6qzPLe5g7WbX577nNmumWhK3iuEIfd885BhyTnEjXPhjvGnXHhb5hnyUMfrnt5jcv3i1nu0CAlEa-obqWBnCpyhzNY94I_DjrY7CroiC_0f6W0KBWjUC8wIDc91OvQ1B0OabDC_thHj-fO6LSe_nyX51m6Tk0Xn27xe8JvOHKPX6M78" 
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-8 max-w-7xl">
          {/* Header Section */}
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface">Access Management</h2>
              <p className="text-slate-500 text-sm font-mono mt-1 opacity-70">RBAC_VERSION: 2.4.0-STABLE</p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-surface-container-highest text-primary font-bold text-xs uppercase tracking-widest rounded transition-all hover:bg-surface-bright shadow-sm active:scale-95">
                Invite User
              </button>
              <button className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs uppercase tracking-widest rounded shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95">
                Create Team
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Access Scoping Visualization */}
            <div className="col-span-12 bg-surface-container-low rounded-xl overflow-hidden border border-white/5 shadow-sm">
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Team Scoping Matrix</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Write</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Read Only</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">No Access</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <th className="p-6 border-b border-outline-variant/10">Module / Cluster</th>
                      <th className="p-6 text-center text-primary border-b border-outline-variant/10">Alpha (Core)</th>
                      <th className="p-6 text-center text-primary border-b border-outline-variant/10">Beta (Infra)</th>
                      <th className="p-6 text-center text-primary border-b border-outline-variant/10">Gamma (Data)</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs text-slate-300 divide-y divide-white/[0.02]">
                    {[
                      { name: 'auth_gateway.v1', alpha: 'edit_square', beta: 'visibility', gamma: 'lock' },
                      { name: 'telemetry_ingest_pipe', alpha: 'visibility', beta: 'edit_square', gamma: 'edit_square' },
                      { name: 'log_persistence_db', alpha: 'lock', beta: 'visibility', gamma: 'edit_square' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6 font-mono text-slate-400 group-hover:text-primary transition-colors">{row.name}</td>
                        {[row.alpha, row.beta, row.gamma].map((icon, i) => (
                          <td key={i} className="p-6 text-center">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
                              icon === 'edit_square' ? 'bg-secondary/10 text-secondary' :
                              icon === 'visibility' ? 'bg-tertiary/10 text-tertiary text-opacity-80' :
                              'bg-surface-container-highest text-slate-600'
                            }`}>
                              <span className="material-symbols-outlined text-lg">{icon}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team Details Grid */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {teams.map((team, idx) => (
                <div key={idx} className={`bg-surface-container-low rounded-xl border-l-4 border-${team.color} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group`}>
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{team.name}</h4>
                        <p className={`text-[10px] uppercase font-bold text-${team.color} tracking-widest`}>{team.type}</p>
                      </div>
                      <span className={`px-2 py-1 bg-${team.color}/10 text-${team.color} text-[10px] font-black rounded tracking-widest`}>
                        {team.members} MEMBERS
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Lead */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/5" src={team.lead.avatar} alt={team.lead.name} />
                          <div>
                            <p className="text-sm font-semibold text-on-surface">{team.lead.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tight">{team.lead.role}</p>
                          </div>
                        </div>
                        <button className="material-symbols-outlined text-slate-600 hover:text-primary transition-colors">more_vert</button>
                      </div>

                      {/* Other Members */}
                      {team.membersList.map((tm, tidx) => (
                        <div key={tidx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/5" src={tm.avatar} alt={tm.name} />
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{tm.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono tracking-tight">{tm.role}</p>
                            </div>
                          </div>
                          <button className="material-symbols-outlined text-slate-600 hover:text-primary transition-colors">more_vert</button>
                        </div>
                      ))}

                      {team.extra && (
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-slate-400 font-black text-xs">+{team.extra}</div>
                             <div>
                               <p className="text-sm font-semibold text-slate-500 italic">Remaining Members</p>
                             </div>
                           </div>
                         </div>
                      )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-outline-variant/10">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-3">Assigned Sub-Modules</p>
                      <div className="flex flex-wrap gap-2">
                        {team.modules.map((mod, midx) => (
                          <span key={midx} className="bg-surface-container-highest text-on-surface-variant text-[10px] px-2 py-1 rounded font-mono border border-white/5 tracking-tight hover:text-primary transition-colors cursor-default">
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity Feed (RBAC Audit Trail) */}
            <div className="col-span-12 bg-surface-container-high rounded-xl p-8 border border-white/5 shadow-inner">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">RBAC Audit Trail</h3>
                <button className="text-primary text-[10px] uppercase font-black tracking-widest hover:underline underline-offset-4">View All Logs</button>
              </div>
              <div className="space-y-6">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-6 items-start group">
                    <div className={`mt-1.5 w-2 h-2 rounded-full bg-${log.statusColor} ring-4 ring-${log.statusColor}/10 shrink-0 group-hover:scale-125 transition-transform`}></div>
                    <div className="flex-1">
                      <p className="text-xs text-on-surface font-mono leading-relaxed">
                        <span className="text-primary font-bold">{log.user}</span> {log.action} <span className={`text-${log.statusColor} font-black uppercase tracking-tight`}>{log.permission}</span> 
                        {log.target && <> to <span className="text-slate-400">{log.target}</span></>}
                        {log.resource && <> for <span className="text-slate-200">{log.resource}</span></>}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold opacity-80">
                        {log.time} • EVENT_ID: {log.id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FAB for Quick Invite */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 animate-pulse-slow group">
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
        <span className="absolute right-16 bg-surface-container-highest px-4 py-2 rounded-xl text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 shadow-2xl border border-white/5 pointer-events-none">
          Quick Invite
        </span>
      </button>
    </div>
  );
};

export default TeamsPage;
