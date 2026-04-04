const Footer = () => {
  return (
    <footer className="w-full border-t border-[#464555]/15 bg-[#0b1326]">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 max-w-7xl mx-auto font-sans text-xs uppercase tracking-widest">
        <div className="flex flex-col items-center md:items-start gap-4 mb-8 md:mb-0">
          <div className="text-xl font-black text-[#c0c1ff]">TraceHub</div>
          <p className="text-slate-500 normal-case tracking-normal">
            © {new Date().getFullYear()} TraceHub Forensic Systems. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 items-center">
          <a className="text-slate-500 hover:text-[#c0c1ff] transition-colors opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
          <a className="text-slate-500 hover:text-[#c0c1ff] transition-colors opacity-80 hover:opacity-100" href="#">Terms of Service</a>
          <a className="text-slate-500 hover:text-[#c0c1ff] transition-colors opacity-80 hover:opacity-100" href="#">Security</a>
          <a className="text-slate-500 hover:text-[#c0c1ff] transition-colors opacity-80 hover:opacity-100" href="#">Status</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
