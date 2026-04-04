const StatsBar = () => {
  const stats = [
    { label: 'Events Processed / Sec', value: '10M+' },
    { label: 'P99 Search Latency', value: '< 150ms' },
    { label: 'Injest Availability', value: '99.999%' },
  ];

  return (
    <section className="bg-surface-container-low border-y border-outline-variant/10 py-16">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
        {stats.map((stat, index) => (
          <div key={index} className="text-center md:text-left space-y-2 group">
            <div className="text-4xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">
              {stat.value}
            </div>
            <div className="text-xs font-bold tracking-widest text-outline uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsBar;
