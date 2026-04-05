import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Activity, Folder, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';

/* ── Animation variants ─────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } },
});

/* ── SVG Chart (Bezier) ─────────────────────────────────────────────────── */
const ChartSVG = () => {
  const points = [10, 45, 30, 60, 40, 75, 55, 50, 70, 85, 65, 90];
  const w = 280;
  const h = 100;
  const step = w / (points.length - 1);

  const coords = points.map((p, i) => ({ x: i * step, y: h - (p / 100) * h }));
  let d = `M${coords[0].x},${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const cp1x = coords[i - 1].x + step * 0.4;
    const cp1y = coords[i - 1].y;
    const cp2x = coords[i].x - step * 0.4;
    const cp2y = coords[i].y;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${coords[i].x},${coords[i].y}`;
  }
  const fillD = `${d} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(252 56% 57%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(252 56% 57%)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#chartGrad)" />
      <path d={d} fill="none" stroke="hsl(252 56% 57%)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3" fill="hsl(252 56% 57%)" />
    </svg>
  );
};

/* ── Dashboard Preview ──────────────────────────────────────────────────── */
const DashboardPreview = () => {
  const projects = [
    { name: 'auth-service', status: 'healthy', logs: '12.4k' },
    { name: 'payment-api', status: 'warning', logs: '8.2k' },
    { name: 'user-service', status: 'healthy', logs: '15.1k' },
  ];

  const recentLogs = [
    { time: '12:04:18', level: 'ERROR', msg: 'Connection timeout in db-pool', color: 'text-red-500' },
    { time: '12:04:15', level: 'WARN', msg: 'High latency detected us-east-1', color: 'text-amber-500' },
    { time: '12:04:12', level: 'INFO', msg: 'Deployment v2.4.1 completed', color: 'text-emerald-500' },
    { time: '12:04:10', level: 'INFO', msg: 'Health check passed all nodes', color: 'text-emerald-500' },
  ];

  return (
    <div className="select-none pointer-events-none w-full max-w-[1100px] mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-dashboard overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-md px-12 py-0.5 text-[10px] text-gray-400 font-mono">
              app.tracehub.io/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 md:p-6 space-y-5 bg-[#fafafa]">
          {/* Metric cards row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Logs', value: '1.24M', icon: Activity, change: '+12.5%' },
              { label: 'Active Projects', value: '18', icon: Folder, change: '+3' },
              { label: 'Avg Response', value: '142ms', icon: Clock, change: '-8ms' },
              { label: 'Error Rate', value: '0.04%', icon: AlertTriangle, change: '-0.02%' },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{m.label}</span>
                  <m.icon className="w-4 h-4 text-gray-300" />
                </div>
                <div className="text-xl font-bold text-gray-900 leading-none">{m.value}</div>
                <span className="text-[11px] text-emerald-500 font-medium mt-1.5 inline-block">{m.change}</span>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Log Volume</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Last 24 hours</p>
                </div>
                <div className="flex gap-1">
                  {['1H', '6H', '24H', '7D'].map((t) => (
                    <span
                      key={t}
                      className={`text-[9px] px-2 py-0.5 rounded-md font-medium ${
                        t === '24H' ? 'bg-[hsl(252,56%,57%)] text-white' : 'text-gray-400'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ChartSVG />
            </div>

            <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Projects</h4>
              <div className="space-y-2">
                {projects.map((p) => (
                  <div key={p.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="text-xs font-medium text-gray-700">{p.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">{p.logs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Logs table */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Recent Logs</h4>
            <div className="space-y-1">
              {recentLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg">
                  <span className="text-[11px] text-gray-300 font-mono w-14 shrink-0">{log.time}</span>
                  <span className={`text-[11px] font-bold w-12 shrink-0 ${log.color}`}>{log.level}</span>
                  <span className="text-xs text-gray-600 truncate">{log.msg}</span>
                  {log.level === 'INFO' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Hero Section ───────────────────────────────────────────────────────── */
const Hero = ({ onSignUp }: { onSignUp: () => void }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Track scroll progress of the dashboard container
  const { scrollYProgress } = useScroll({
    target: dashboardRef,
    offset: ['start end', 'end start'],
  });

  // Map scroll progress → scale: starts small, grows bigger as user scrolls
  const scale = useTransform(scrollYProgress, [0, 0.45, 0.75], [0.72, 1.05, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [0.3, 1]);

  return (
    <section className="relative flex flex-col items-center justify-start pt-10 md:pt-14 pb-16">
      {/* Background video */}
      <video
        className="fixed inset-0 w-full h-full object-cover opacity-[0.04] -z-10"
        src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Radial background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[hsl(252,56%,57%)] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div
          variants={fadeUp(0)}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(var(--lp-badge-bg))] border border-[hsl(var(--lp-border))] mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--lp-accent))] animate-pulse" />
          <span className="text-[11px] font-semibold text-[hsl(var(--lp-badge-text))] tracking-wide">
            Trusted by 500+ engineering teams
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp(0.1)}
          className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-[hsl(var(--lp-text))] mb-5"
        >
          Observe your logs
          <br />
          with <em className="font-display italic text-[hsl(var(--lp-accent))]">surgical precision</em>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={fadeUp(0.2)}
          className="text-base md:text-lg text-[hsl(var(--lp-text-muted))] max-w-xl leading-relaxed mb-8"
        >
          TraceHub is the centralized log management platform for modern
          development teams. Ingest, analyze, and resolve issues before they
          reach production.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp(0.3)} className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Button size="lg" onClick={onSignUp} className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="lg">
            Book a Demo
          </Button>
        </motion.div>
      </motion.div>

      {/* Dashboard Preview — scroll-based zoom */}
      <motion.div
        ref={dashboardRef}
        style={{ scale, opacity }}
        className="relative z-10 w-full px-4 md:px-6 lg:px-10 will-change-transform origin-top"
      >
        <DashboardPreview />
      </motion.div>
    </section>
  );
};

export default Hero;
