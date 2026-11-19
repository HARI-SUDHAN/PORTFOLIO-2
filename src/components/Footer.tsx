import { PROFILE } from '../data/portfolioData';

const SOCIAL_LINKS = [
  { id: 'whatsapp', label: 'WhatsApp', href: PROFILE.whatsappUrl },
  { id: 'linkedin', label: 'LinkedIn', href: PROFILE.linkedinUrl },
  { id: 'github', label: 'GitHub', href: PROFILE.githubUrl },
  { id: 'instagram', label: 'Instagram', href: PROFILE.instagramUrl },
  { id: 'email', label: 'Email', href: `mailto:${PROFILE.email}` },
];

const SECTION_LINKS = [
  { label: 'Projects', href: '#projects' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="glass-bar relative z-10 w-full text-white py-12 px-4 sm:px-6 lg:px-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand Monogram */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <a
            href="#hero"
            className="text-2xl font-black tracking-tight uppercase flex items-center"
          >
            <span className="text-[#ff2a3b] drop-shadow-[0_0_10px_rgba(255,42,59,0.75)]">H</span>
            <span>ARI.</span>
          </a>
          <p className="text-[11px] text-gray-400 font-mono tracking-widest uppercase">
            MERN Stack Developer
          </p>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target={item.id === 'email' ? undefined : '_blank'}
              rel={item.id === 'email' ? undefined : 'noopener noreferrer'}
              className="glass-chip min-h-[38px] inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:scale-105 whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Section Links & Copyright */}
        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-400 uppercase tracking-widest font-bold">
            {SECTION_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#ff334b] transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="text-[11px] text-gray-500 font-mono uppercase tracking-wider text-center md:text-right">
            © {year} {PROFILE.fullName}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
