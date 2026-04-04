const LogForensicStream = () => {
  return (
    <div className="w-full lg:w-1/2 relative">
      <div className="glass-panel border border-outline-variant/15 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between border-b border-outline-variant/5">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-error-container/50"></div>
            <div className="w-3 h-3 rounded-full bg-tertiary-container/50"></div>
            <div className="w-3 h-3 rounded-full bg-secondary-container/50"></div>
          </div>
          <div className="text-[10px] text-outline tracking-widest uppercase font-bold">Log Forensic Stream</div>
        </div>
        <div className="p-6 space-y-3 mono-text text-sm">
          <div className="flex gap-4 p-2 rounded bg-surface-container-high border-l-2 border-secondary group hover:bg-surface-container-highest transition-colors">
            <span className="text-outline/50 shrink-0">12:04:12</span>
            <span className="text-secondary shrink-0">[INFO]</span>
            <span className="text-on-surface-variant truncate">Connection pool initialized. (ID: 0x4f2a)</span>
          </div>
          <div className="flex gap-4 p-2 rounded bg-surface-container-high border-l-2 border-tertiary group hover:bg-surface-container-highest transition-colors">
            <span className="text-outline/50 shrink-0">12:04:15</span>
            <span className="text-tertiary shrink-0">[WARN]</span>
            <span className="text-on-surface-variant truncate">Latent response detected in region: us-east-1</span>
          </div>
          <div className="flex gap-4 p-2 rounded bg-error-container/20 border-l-2 border-error group hover:bg-error-container/30 transition-colors">
            <span className="text-outline/50 shrink-0">12:04:18</span>
            <span className="text-error shrink-0">[FATAL]</span>
            <span className="text-error-container truncate font-bold">NullPointerException in CheckoutFlow.java:412</span>
          </div>
          <div className="flex gap-4 p-2 rounded bg-surface-container-high border-l-2 border-secondary group hover:bg-surface-container-highest transition-colors">
            <span className="text-outline/50 shrink-0">12:04:20</span>
            <span className="text-secondary shrink-0">[INFO]</span>
            <span className="text-on-surface-variant truncate">Autoscaling group triggered. Instantiating...</span>
          </div>
        </div>
      </div>
      {/* Decorative blur */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 blur-[100px] -z-10"></div>
    </div>
  );
};

const Hero = ({ onSignUp }: { onSignUp: () => void }) => {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden px-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="w-full lg:w-1/2 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/15">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[0.6875rem] font-bold tracking-widest text-secondary uppercase">v2.4 GA Released</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Observe. Detect. <br/><span className="text-primary">Resolve.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
            TraceHub is the high-resolution forensic lens for modern dev teams. Transform chaotic log streams into surgical telemetry narratives with zero overhead.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={onSignUp}
              className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-lg font-bold text-lg hover:brightness-110 transition-all shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Try for Free
            </button>
            <button className="bg-surface-container-highest text-primary px-8 py-4 rounded-lg font-bold text-lg border border-primary/20 hover:bg-surface-container-high transition-all hover:scale-[1.02] active:scale-[0.98]">
              Book a Demo
            </button>
          </div>
        </div>
        <LogForensicStream />
      </div>
    </section>
  );
};

export default Hero;
