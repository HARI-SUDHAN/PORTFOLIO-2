import { useState, useEffect } from 'react';
import { Download, Menu, X } from 'lucide-react';
import { PROFILE } from '../data/portfolioData';

const NAV_LINKS = [
  { label: 'Projects', href: '#projects' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#07070a]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.85)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#hero"
          className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white whitespace-nowrap shrink-0 flex items-center"
        >
          <span className="text-[#ff2a3b] drop-shadow-[0_0_12px_rgba(255,42,59,0.65)]">H</span>
          <span>ARI.</span>
        </a>

        {/* Zone 2: Single-line navigation links */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-7 text-sm font-semibold tracking-wide text-gray-300"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 whitespace-nowrap shrink-0 hover:text-white transition-colors after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-[#ff2a3b] after:transition-all after:duration-200 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Resume CTA + Mobile Menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={PROFILE.resumeUrl}
            download="Harisudhan_Resume.pdf"
            className="glass-red inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white whitespace-nowrap shrink-0 hover:-translate-y-0.5"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>Resume</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="glass-chip md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-200 hover:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile navigation"
          className="md:hidden glass-strong mx-4 mt-2 rounded-2xl p-4 shadow-2xl"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center justify-between rounded-xl px-4 py-2.5 text-base font-semibold text-gray-200 hover:bg-white/5 hover:text-[#ff334b] transition-colors"
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true" className="text-xs text-gray-500">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
