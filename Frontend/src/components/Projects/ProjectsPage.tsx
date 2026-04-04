import React from 'react';
import Sidebar from '../Sidebar/Sidebar';

const ProjectsPage: React.FC = () => {
  const projects = [
    {
      id: 'PGW-7712',
      name: 'PaymentGateway',
      status: 'Healthy',
      statusColor: 'secondary',
      subModules: 12,
      manager: 'Elena Rodriguez',
      progress: 85,
      team: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDYsOpXynZcTGU9hJ56skjHY7itx6jHGHv4EIrcbnAuX_joCrLWGYYHYnVjvfzt3a8IzzJVI-aF72l9Omx_Qr-920FF3X0x7H1K_cLAJPEx69M5omsAxR5M-h_vhHa-OJX22NObxJ7Yiz5athCl_Y83HR49jZalvU-Pa9eI3qewfda7KQE-Wb7I6LUdP4xkp6-9UFF3S3NPGqpuxQooFcoJ0f9exViSFshZN6_arO6uTYAwd6e1M6pPjy3OMqtnZSYqTjz1NSIZpF8',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuClCMMULRBf9jLl5apwfuSQ_b-ks3zwnZLz-iJMTqnePn_-5bQ8sWlqsu2GgdU1P23yF2hOI3EB4MqUT58k0NdS5mbZMweAgLqQIOvxIH4jz2-bd9J8VMN_rRZX5jmd4ciO5X14dEiaWFd2vRVgGy_BPGAwb6VoCTsIYlx78Z-PfaIdyFiKdXkF3zjOTqwb6hEDHNmZyhKs9wXDahLKcVKwOhJSyoZlf4TJzhahzDLCIJCGJ0pihiLbeLaLrPjPvfw_VOAFcL2gng4'
      ],
      extraTeam: 4
    },
    {
      id: 'UAS-0921',
      name: 'UserAuthService',
      status: 'Latent',
      statusColor: 'tertiary',
      subModules: 8,
      manager: 'Marcus Chen',
      progress: 42,
      team: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC6VZMNt4Ti5iI_7x_vqYJo4QPGWrG-FHUKqZgIowaa2B81Nqt2Nux5ilOe65sqeYcbpLN8fJ6GBykP-tHDXCiN5uWZaMqfyP1CGvm1njZc_HBBl8bgQzsZvlTzExhLoc-3P3NHxrVYg_tCoTmW50roEohLT46FJ_G5vfDDnZrZUcEqX9i1oUzzeSpBbFW0FC2fYa--76ZTbuW93KomONYQyQwTKg5OBBBunq2kJfDyVcFffLB6eCWzQpBJyzC2dKYNw0w7t4ifQvw',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB3M7MF_1TScysF6cSUjxdxdGyIxM5Vrl1KbyFmV96hIUs132F31Vohjyec0ji-HIgVn9jL6g2r1IuCaqID9aZioHiui0u7cXdqOIxWNHBr-rRCZosOcFM8FT7MWWApO_Nx8lKcq68Trsk1XF-AXurIxq_HssSgZO9bSjrq3QK90FUf4CKp7PqSHD32uPYMDUoRfVNjwXylElrvDPWCjpI18X0Zv324-rWkymKqKhl0EOskQzVcTgYQOPvxGKSXTBPAuu-MF8xWB0k'
      ],
      extraTeam: 0
    },
    {
      id: 'INV-3340',
      name: 'InventorySync',
      status: 'Critical',
      statusColor: 'error',
      subModules: 15,
      manager: 'Sarah Jenkins',
      progress: 95,
      team: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAcgcCNn-67DMB9BQrXk1ocAqcTsAbbWj9zYBYU04VN9H-6mI7oDC9Fq_9H1Fo0Rb4I4KhHorqEw7xykBYVi_V5mOkhGFrCMTxVeMcDB8FA6-xq553zqbIijwSHkdWgNXcstEkotBRWr0H6mMTU_NieJL1QShAJjKgYArHn81A1vjzl2G4p6L9aCC0_2YtII4TeCqagaMAXhTfpBO78My7jlZ5vehhPfAk4soCtUXPvsbRKzpTOlMu4ojX8zfxlrbzOlmA8zArWPcM'
      ],
      extraTeam: 8
    },
    {
      id: 'HUB-8821',
      name: 'NotificationHub',
      status: 'Healthy',
      statusColor: 'secondary',
      subModules: 6,
      manager: 'David Vance',
      progress: 10,
      team: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBW8WKP7xURZ1A1EAmaK6VDAahpwwmLaUit1uEcszAWb9OyM1t01eOsqgzcTIpjZtATsjZ4eJEyba7LfIHg3kaIYGLiypLhdfaPYZIypcW03m5SKqInPmy3QX6g53o2HKVI3UB8jXYXkiOmNmXA7TNvDAP6dk6w1nwKYoIctpsvLgsk5lDt9u7ja6kxPrjP74u37K2lEjnaRg1qB9kPSgpS_7758FD2UDvV73lsP1h_j0665cnSyfDEK4SeIqN-LC1zv3ohG4UJia0'
      ],
      extraTeam: 0
    },
    {
      id: 'LGC-1100',
      name: 'LegacyMigration',
      status: 'Archived',
      statusColor: 'outline-variant',
      subModules: 32,
      manager: 'N/A',
      progress: 100,
      team: [],
      extraTeam: 0,
      isArchived: true
    }
  ];

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">
      <Sidebar />

      <main className="ml-64 pt-20 px-8 pb-12 min-h-screen flex flex-col">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface">Projects Management</h1>
            <p className="text-outline text-sm tracking-tight opacity-80">Orchestrate and monitor system-wide services and dependencies.</p>
          </div>
          <div className="grid grid-cols-3 gap-8 md:gap-12 bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-sm transition-all hover:bg-surface-container-high/40">
            <div className="text-center md:text-left">
              <span className="block text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Total Projects</span>
              <span className="text-3xl font-black text-primary leading-none">24</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Active</span>
              <span className="text-3xl font-black text-secondary leading-none">18</span>
            </div>
            <div className="text-center md:text-left">
              <span className="block text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Sub-modules</span>
              <span className="text-3xl font-black text-tertiary leading-none">142</span>
            </div>
          </div>
        </header>

        {/* Action Bar */}
        <section className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">search</span>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-outline-variant/60" 
              placeholder="Search by name, PM, or module ID..." 
              type="text"
            />
          </div>
          <button className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-outline hover:text-primary hover:border-primary/40 transition-all active:scale-95">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <button className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-outline hover:text-primary hover:border-primary/40 transition-all active:scale-95">
            <span className="material-symbols-outlined">sort</span>
          </button>
        </section>

        {/* Project Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              className="bg-surface-container-low rounded-xl overflow-hidden group hover:bg-surface-container-high transition-all duration-300 border border-outline-variant/5 shadow-sm hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`h-1.5 w-full bg-${project.statusColor}`}></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-primary group-hover:text-[#c0c1ff] transition-colors">{project.name}</h3>
                    <span className="font-mono text-[10px] text-outline uppercase tracking-[0.2em]">{project.id}</span>
                  </div>
                  <span className={`px-2 py-1 bg-${project.statusColor === 'outline-variant' ? 'surface-container-highest' : project.statusColor + '-container'} text-${project.statusColor === 'outline-variant' ? 'on-surface-variant' : 'on-' + project.statusColor + '-container'} text-[10px] font-black rounded uppercase tracking-tighter`}>
                    {project.status}
                  </span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-outline">layers</span>
                      <span className="text-xs text-on-surface-variant font-medium">Sub-modules</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-on-surface">{project.subModules}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-outline">person</span>
                      <span className="text-xs text-on-surface-variant font-medium">Project Manager</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface">{project.manager}</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className={`bg-${project.statusColor} h-full transition-all duration-1000 ease-out`} style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                  <div className="flex -space-x-2">
                    {project.team.map((avatar, idx) => (
                      <div key={idx} className="h-7 w-7 rounded-full border-2 border-surface-container-low bg-surface-container-highest overflow-hidden ring-1 ring-white/5">
                        <img alt="Team member" src={avatar} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {project.extraTeam > 0 && (
                      <div className="h-7 w-7 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[8px] font-black ring-1 ring-white/5">
                        +{project.extraTeam}
                      </div>
                    )}
                    {project.isArchived && (
                      <div className="h-7 w-7 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[8px] font-black ring-1 ring-white/5">
                        ARC
                      </div>
                    )}
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-[#c0c1ff] hover:underline underline-offset-4 transition-all">
                    {project.isArchived ? 'Historical Logs' : 'View Metrics'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Project Card */}
          <button className="border-2 border-dashed border-outline-variant/20 rounded-xl flex flex-col items-center justify-center gap-4 p-8 hover:bg-surface-container-low hover:border-primary/40 transition-all group min-h-[280px]">
            <div className="h-14 w-14 rounded-full bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 shadow-inner">
              <span className="material-symbols-outlined text-4xl">add</span>
            </div>
            <div className="text-center">
              <span className="block text-sm font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">Initialize New Project</span>
              <span className="text-xs text-outline tracking-tight opacity-70">Define system scope and PM</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProjectsPage;
