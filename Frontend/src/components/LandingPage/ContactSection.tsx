import { motion } from 'framer-motion';
import { Mail, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import TextType from '../ui/TextType';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] } },
});

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 px-4 md:px-8 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left — Info */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.div
              variants={fadeUp(0)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--lp-badge-bg))] border border-[hsl(var(--lp-border))] mb-4"
            >
              <span className="text-[11px] font-semibold text-[hsl(var(--lp-badge-text))] tracking-wide">
                Get in Touch
              </span>
            </motion.div>

            <motion.div variants={fadeUp(0.1)} className="mb-4">
              <TextType
                as="h2"
                text="Let's build something great"
                className="font-display text-4xl md:text-5xl text-[hsl(var(--lp-accent))]"
                typingSpeed={60}
                cursorCharacter="_"
                cursorClassName="text-[hsl(var(--lp-accent))] font-light"
                startOnVisible
                loop={false}
              />
            </motion.div>

            <motion.p
              variants={fadeUp(0.2)}
              className="text-[hsl(var(--lp-text-muted))] text-base md:text-lg leading-relaxed mb-8 max-w-md"
            >
              Have questions about TraceHub? Want a personalized demo for your
              team? We'd love to hear from you.
            </motion.p>

            <motion.div variants={fadeUp(0.3)} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--lp-badge-bg))] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[hsl(var(--lp-accent))]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--lp-text))]">Email us</p>
                  <p className="text-sm text-[hsl(var(--lp-text-muted))]">hello@tracehub.io</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--lp-badge-bg))] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[hsl(var(--lp-accent))]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--lp-text))]">Location</p>
                  <p className="text-sm text-[hsl(var(--lp-text-muted))]">Remote-first, Worldwide</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — Contact Form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.form
              variants={fadeUp(0.15)}
              className="bg-[hsl(var(--lp-card))] border border-[hsl(var(--lp-card-border))] rounded-2xl p-6 md:p-8 space-y-5 shadow-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--lp-text))] mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--lp-border))] bg-[hsl(var(--lp-bg))] text-sm text-[hsl(var(--lp-text))] placeholder:text-[hsl(var(--lp-text-muted))]/50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--lp-accent))]/30 focus:border-[hsl(var(--lp-accent))]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--lp-text))] mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--lp-border))] bg-[hsl(var(--lp-bg))] text-sm text-[hsl(var(--lp-text))] placeholder:text-[hsl(var(--lp-text-muted))]/50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--lp-accent))]/30 focus:border-[hsl(var(--lp-accent))]/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--lp-text))] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--lp-border))] bg-[hsl(var(--lp-bg))] text-sm text-[hsl(var(--lp-text))] placeholder:text-[hsl(var(--lp-text-muted))]/50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--lp-accent))]/30 focus:border-[hsl(var(--lp-accent))]/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--lp-text))] mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your team and what you're looking for..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--lp-border))] bg-[hsl(var(--lp-bg))] text-sm text-[hsl(var(--lp-text))] placeholder:text-[hsl(var(--lp-text-muted))]/50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--lp-accent))]/30 focus:border-[hsl(var(--lp-accent))]/50 transition-all resize-none"
                />
              </div>

              <Button size="lg" className="w-full gap-2">
                Send Message
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-[hsl(var(--lp-border))]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[hsl(var(--lp-accent))] text-lg leading-none select-none">&#10022;</span>
            <span className="text-[hsl(var(--lp-text))] text-lg font-bold tracking-tight">TraceHub</span>
          </div>
          <p className="text-sm text-[hsl(var(--lp-text-muted))]">
            &copy; {new Date().getFullYear()} TraceHub. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-[hsl(var(--lp-text-muted))] hover:text-[hsl(var(--lp-text))] transition-colors">Privacy</a>
            <a href="#" className="text-sm text-[hsl(var(--lp-text-muted))] hover:text-[hsl(var(--lp-text))] transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
