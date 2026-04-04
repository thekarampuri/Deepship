const CTASection = ({ onSignUp }: { onSignUp: () => void }) => {
  return (
    <section className="py-24 px-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-surface-container-low to-surface-container-lowest rounded-2xl p-12 md:p-24 border border-outline-variant/10 text-center relative overflow-hidden group">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] group-hover:bg-primary/20 transition-colors duration-500"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 blur-[120px] group-hover:bg-secondary/20 transition-colors duration-500"></div>
        
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8 relative z-10 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
          Stop Guessing. Start Seeing.
        </h2>
        <p className="text-on-surface-variant text-xl max-w-2xl mx-auto mb-12 relative z-10 leading-relaxed">
          Join 500+ engineering teams who trust TraceHub to maintain 99.99% uptime through predictive log forensics.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
          <button 
            onClick={onSignUp}
            className="bg-primary text-on-primary px-10 py-4 rounded-lg font-bold hover:brightness-110 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            Start Free Trial
          </button>
          <button className="bg-transparent border border-outline-variant px-10 py-4 rounded-lg font-bold text-white hover:bg-surface-container-high transition-all hover:border-primary/50">
            Talk to an Architect
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
