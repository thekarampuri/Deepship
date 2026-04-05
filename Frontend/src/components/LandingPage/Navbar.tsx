import { Button } from '../ui/button';

const navLinks = [
  { label: 'Home', href: '#' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const Navbar = ({ onSignIn }: { onSignIn: () => void }) => {
  return (
    <header className="w-full z-50 relative">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <a href="#" className="flex items-center gap-1.5 group">
          <span className="text-[hsl(var(--lp-accent))] text-lg leading-none select-none">&#10022;</span>
          <span className="text-[hsl(var(--lp-text))] text-lg font-bold tracking-tight">
            TraceHub
          </span>
        </a>

        {/* Nav Links — centered */}
        <div className="hidden md:flex items-center gap-1 bg-[hsl(var(--lp-surface))] border border-[hsl(var(--lp-border))] rounded-full px-1.5 py-1 shadow-sm">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-1.5 text-sm font-medium text-[hsl(var(--lp-text-muted))] hover:text-[hsl(var(--lp-text))] rounded-full transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Button
          size="sm"
          onClick={onSignIn}
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          Get Started
        </Button>
      </nav>
    </header>
  );
};

export default Navbar;
