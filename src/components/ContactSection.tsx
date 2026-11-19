import { useState, type FormEvent } from 'react';
import { Check, Mail, Phone, Send } from 'lucide-react';
import { PROFILE } from '../data/portfolioData';

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    const subject = encodeURIComponent(`Portfolio Inquiry from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 5000);
  };

  return (
    <section
      id="contact"
      className="relative w-full text-gray-100 py-16 sm:py-24 px-4 sm:px-6 lg:px-10 flex flex-col items-center justify-center overflow-hidden border-t border-white/5"
    >
      <div className="flex flex-col items-center text-center mb-12 z-10">
        <span className="text-[#ff334b] font-bold uppercase text-xs sm:text-sm tracking-[0.22em] mb-2">
          Get In Touch
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight uppercase text-white">
          Contact.
        </h2>
        <div className="w-16 h-1.5 bg-[#a31515] mt-3 rounded-full" aria-hidden="true" />
      </div>

      <div className="relative w-full max-w-4xl z-10 flex flex-col gap-5 sm:gap-6">
        {/* Direct Quick-Action Cards (WhatsApp + Phone) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <a
            href={PROFILE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Hari Sudhan on WhatsApp"
            className="whatsapp-card glass glass-hover flex items-center gap-4 rounded-3xl px-5 py-4 sm:px-6 sm:py-5"
          >
            <span className="whatsapp-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                WhatsApp
              </span>
              <span className="text-base sm:text-lg font-extrabold text-gray-100 tabular-nums truncate">
                {PROFILE.phone}
              </span>
            </span>
            <span className="whatsapp-cta ml-auto hidden sm:block shrink-0 text-xs font-bold uppercase tracking-wider">
              Chat →
            </span>
          </a>

          <a
            href={`tel:${PROFILE.phone.replace(/\s+/g, '')}`}
            aria-label="Call Hari Sudhan"
            className="glass glass-hover flex items-center gap-4 rounded-3xl px-5 py-4 sm:px-6 sm:py-5"
          >
            <span className="glass-chip grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[#ff334b]">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Direct Call
              </span>
              <span className="text-base sm:text-lg font-extrabold text-gray-100 tabular-nums truncate">
                {PROFILE.phone}
              </span>
            </span>
          </a>
        </div>

        {/* Contact Form Panel with Red Halo */}
        <div className="relative mt-2">
          <div className="red-halo" style={{ inset: '-14% -10%' }} aria-hidden="true" />

          <div className="glass glass-panel-card relative z-10 w-full p-6 sm:p-10 md:p-12 rounded-3xl">
            {submitted ? (
              <div className="py-10 flex flex-col items-center text-center">
                <div className="glass-red w-16 h-16 text-white rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2">
                  Message Ready!
                </h3>
                <p className="text-sm sm:text-base text-gray-300 font-medium max-w-md">
                  Your email client has been opened with your inquiry details addressed to{' '}
                  {PROFILE.email}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full glass-chip flex items-center justify-center text-[#ff334b] shrink-0">
                      <Mail className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] uppercase font-mono tracking-wider text-gray-400 block">
                        Direct Inquiries
                      </span>
                      <a
                        href={`mailto:${PROFILE.email}`}
                        className="text-sm sm:text-base font-bold text-white hover:text-[#ff465a] transition-colors truncate block"
                      >
                        {PROFILE.email}
                      </a>
                    </div>
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-300 shrink-0">
                    Available for Full-Stack Roles &amp; Freelance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="contact-name"
                      className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400"
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Your Name"
                      className="w-full px-5 py-4 glass-input rounded-2xl text-base sm:text-lg font-medium text-gray-100 placeholder:text-gray-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="contact-email"
                      className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400"
                    >
                      Your Email
                    </label>
                    <input
                      id="contact-email"
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      className="w-full px-5 py-4 glass-input rounded-2xl text-base sm:text-lg font-medium text-gray-100 placeholder:text-gray-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-message"
                    className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400"
                  >
                    Message &amp; Project Scope
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="Tell me about the role, project idea, timeline, or collaboration..."
                    className="w-full px-5 py-4 glass-input rounded-2xl text-base sm:text-lg font-medium text-gray-100 placeholder:text-gray-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="glass-red self-center inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white whitespace-nowrap hover:-translate-y-0.5 mt-1"
                >
                  <span>Send Message</span>
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
