const FeaturesGrid = () => {
  return (
    <section className="py-32 px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div className="space-y-4">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Surgical Precision Architecture</h2>
          <p className="text-on-surface-variant max-w-xl text-lg">Engineered for petabyte-scale environments where speed isn't a luxury—it's a requirement.</p>
        </div>
        <div className="h-px bg-outline-variant/20 flex-grow mx-12 hidden lg:block"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
        {/* Feature 1 */}
        <div className="md:col-span-8 bg-surface-container-low rounded-xl p-8 relative overflow-hidden group hover:bg-surface-container flex flex-col justify-end transition-all border border-outline-variant/5 hover:border-primary/20">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>dataset</span>
          </div>
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl font-bold text-white">Table Partitioning by Default</h3>
            <p className="text-on-surface-variant max-w-md">Our engine automatically segments logs by tenant, environment, and timestamp, ensuring queries only scan what they need.</p>
            <div className="flex gap-4 pt-4">
              <span className="px-3 py-1 rounded bg-secondary-container/20 text-secondary text-[10px] font-bold uppercase tracking-widest">Optimized for Postgres</span>
              <span className="px-3 py-1 rounded bg-surface-container-highest text-outline text-[10px] font-bold uppercase tracking-widest">Auto-Scale</span>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="md:col-span-4 bg-surface-container-high rounded-xl p-8 flex flex-col gap-6 group hover:bg-surface-container-highest transition-all border border-outline-variant/5 hover:border-primary/20">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">search</span>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">GIN-Indexed Search</h3>
            <p className="text-on-surface-variant">Full-text search that stays fast even at 100TB. No more spinning circles while production burns.</p>
          </div>
          <div className="mt-auto border-t border-outline-variant/10 pt-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Search Performance</span>
            <span className="text-secondary font-mono text-sm">~42ms avg</span>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="md:col-span-4 bg-surface-container-low rounded-xl p-8 flex flex-col gap-6 group hover:bg-surface-container transition-all border border-outline-variant/5 hover:border-primary/20">
          <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">shield_lock</span>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">Strict RBAC Scoping</h3>
            <p className="text-on-surface-variant">Military-grade data isolation. Define access down to the field level with attribute-based control.</p>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="md:col-span-8 bg-surface-container-high rounded-xl p-8 relative overflow-hidden flex items-center group hover:bg-surface-container-highest transition-all border border-outline-variant/5 hover:border-primary/20">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">Visual Telemetry</h3>
              <p className="text-on-surface-variant">Aggregated log patterns visualized in real-time. Identify anomalies before they trigger alerts.</p>
            </div>
            <div className="relative group-hover:scale-105 transition-transform duration-500">
              <img 
                className="rounded-lg shadow-xl border border-outline-variant/15 opacity-80" 
                alt="Visual Telemetry Dashboard"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdHzk7A66U0eK_4Wm9NC9r7F7Ss7fxRysNiP8428ay4Kh-_XDRa3xJaOOSlR_eV87ZONOEgt31_6mmjO246wt2b_vocPJg3r9QDJpApnyDJOuhncqQbUtEhXg2cCWWVx9T69d5G6Lp1U-ihz1YezTNynWmI2BOCNz6OzTxC_9WkdHYDJ9OHNjJMWU-kvdMMGdmGYTkH9HaeXyzc_FrhlGR8xGLO9L7difLHBwKQIgAWZ4b0RDAK_hYT1Hv9wgT2gvFxheX_BdzJ7Q" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
