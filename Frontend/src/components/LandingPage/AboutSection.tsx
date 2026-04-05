import { motion } from 'framer-motion';
import { Shield, Zap, BarChart3, Users, GitBranch, Lock } from 'lucide-react';
import SplitText from '../ui/SplitText';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } },
});

const features = [
  {
    icon: Zap,
    title: 'Real-time Ingestion',
    description: 'Stream millions of log events per second with zero-lag ingestion through our high-throughput pipeline.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Automatically detect anomalies, correlate errors, and surface actionable insights from your log data.',
  },
  {
    icon: Shield,
    title: 'Role-based Access',
    description: 'Granular permissions for Admins, Managers, and Developers — everyone sees exactly what they need.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Organize by projects, invite developers, and manage join requests with built-in team workflows.',
  },
  {
    icon: GitBranch,
    title: 'Multi-service Tracing',
    description: 'Correlate logs across microservices with trace IDs. Follow a request from ingress to database.',
  },
  {
    icon: Lock,
    title: 'Secure by Default',
    description: 'API key management per project, JWT authentication, and scoped access to keep your data safe.',
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4 md:px-8 relative">
      {/* Subtle background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(var(--lp-accent))] opacity-[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.div
            variants={fadeUp(0)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--lp-badge-bg))] border border-[hsl(var(--lp-border))] mb-4"
          >
            <span className="text-[11px] font-semibold text-[hsl(var(--lp-badge-text))] tracking-wide">
              Why TraceHub
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp(0.1)}
            className="font-display text-4xl md:text-5xl text-[hsl(var(--lp-text))] mb-4"
          >
            Everything you need to
            <br />
            <em className="font-display italic text-[hsl(var(--lp-accent))]">master your logs</em>
          </motion.h2>

          <motion.p
            variants={fadeUp(0.2)}
            className="text-[hsl(var(--lp-text-muted))] max-w-2xl mx-auto text-base md:text-lg leading-relaxed"
          >
            Built for modern engineering teams who refuse to fly blind. TraceHub
            gives you full observability across every service, every environment.
          </motion.p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp(i * 0.08)}
              whileHover={{
                y: -8,
                scale: 1.03,
                boxShadow: '0 20px 40px -12px rgba(0,0,0,0.12), 0 0 0 1px hsl(252 56% 57% / 0.15)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group cursor-pointer bg-[hsl(var(--lp-card))] border border-[hsl(var(--lp-card-border))] rounded-2xl p-6 transition-colors duration-300 hover:border-[hsl(var(--lp-accent))]/20"
            >
              <motion.div
                className="w-10 h-10 rounded-xl bg-[hsl(var(--lp-badge-bg))] flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--lp-accent))] transition-colors duration-300"
                whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="w-5 h-5 text-[hsl(var(--lp-accent))] group-hover:text-white transition-colors duration-300" />
              </motion.div>
              <h3 className="text-base font-semibold text-[hsl(var(--lp-text))] mb-2 group-hover:text-[hsl(var(--lp-accent))] transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-sm text-[hsl(var(--lp-text-muted))] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '< 50ms', label: 'Query Latency' },
            { value: '10M+', label: 'Logs / Second' },
            { value: '500+', label: 'Teams Trust Us' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <SplitText
                text={stat.value}
                tag="div"
                className="text-3xl md:text-4xl font-bold text-[hsl(var(--lp-text))] mb-1"
                splitType="chars"
                delay={90}
                duration={0.3}
                ease="power3.out"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-50px"
                textAlign="center"
              />
              <SplitText
                text={stat.label}
                tag="div"
                className="text-sm text-[hsl(var(--lp-text-muted))]"
                splitType="words"
                delay={90}
                duration={0.3}
                ease="power3.out"
                from={{ opacity: 0, y: 20 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-50px"
                textAlign="center"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
