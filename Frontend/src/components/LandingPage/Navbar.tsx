const Navbar = ({ onSignIn }: { onSignIn: () => void }) => {
  return (
    <header className="w-full top-0 sticky z-50 bg-[#0b1326] border-b border-outline-variant/10 shadow-sm">
      <nav className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto font-sans tracking-tight">
        <div className="flex items-center gap-12">
          <a className="text-xl font-bold tracking-tighter text-[#c0c1ff]" href="#">TraceHub</a>
          <div className="hidden md:flex gap-8 items-center">
            <a className="text-[#c0c1ff] border-b-2 border-[#c0c1ff] pb-1" href="#">Features</a>
            <a className="text-slate-400 hover:text-slate-200 transition-colors duration-200" href="#">Solutions</a>
            <a className="text-slate-400 hover:text-slate-200 transition-colors duration-200" href="#">Documentation</a>
            <a className="text-slate-400 hover:text-slate-200 transition-colors duration-200" href="#">Pricing</a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={onSignIn}
            className="text-slate-400 hover:text-slate-200 transition-colors duration-200"
          >
            Sign In
          </button>
          <button className="bg-primary-container text-on-primary-container px-5 py-2.5 rounded-lg font-semibold hover:brightness-110 active:scale-95 duration-150">
            Contact Sales
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
