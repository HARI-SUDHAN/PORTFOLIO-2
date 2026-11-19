import { useEffect, useRef, useState } from 'react';
import { User, X } from 'lucide-react';
import { ABOUT_SUMMARY, PROFILE } from '../data/portfolioData';

export default function AboutSection() {
  const rigRef = useRef<HTMLDivElement | null>(null);
  const swingRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  // Pendulum physics for the hanging glass photo frame matching reference design
  useEffect(() => {
    const rig = rigRef.current;
    const swing = swingRef.current;
    if (!rig || !swing) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    let angle = 0;
    let angVel = 0;
    let twist = 0;
    let targetAngle = 0;
    let dragging = false;
    let dragId = -1;
    let lastX = 0;
    let lastMoveTime = performance.now();
    let inView = true;
    let rafId = 0;

    const MAX_ANGLE = 0.45;
    const STIFFNESS_DRAG = 52;
    const STIFFNESS_FREE = 16;

    const clampAngle = (val: number, max: number) => Math.max(-max, Math.min(max, val));

    const getPivot = () => {
      const rect = rig.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + 8 };
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max((now - lastMoveTime) / 1000, 0.008);
      const vx = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastMoveTime = now;

      if (dragging && e.pointerId === dragId) {
        const pivot = getPivot();
        targetAngle = clampAngle(
          Math.atan2(-(e.clientX - pivot.x), Math.max(e.clientY - pivot.y, 60)),
          MAX_ANGLE
        );
        return;
      }

      if (reducedMotion || coarsePointer || !inView) return;
      const rect = rig.getBoundingClientRect();
      const dist =
        Math.abs(e.clientX - (rect.left + rect.width / 2)) +
        Math.max(0, Math.abs(e.clientY - (rect.top + rect.height / 2)) - rect.height / 2);
      const influence = Math.max(0, 1 - dist / 900);
      angVel += clampAngle(-vx * 0.00018 * influence, 0.25);
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragId = e.pointerId;
      swing.setPointerCapture?.(e.pointerId);
      swing.style.cursor = 'grabbing';
      lastX = e.clientX;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId === dragId) {
        dragging = false;
        dragId = -1;
        targetAngle = 0;
        swing.style.cursor = '';
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { rootMargin: '200px' }
    );
    io.observe(rig);

    let lastTick = performance.now();
    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTick) / 1000, 0.05);
      lastTick = now;
      if (!inView && !dragging) return;

      const k = dragging ? STIFFNESS_DRAG : STIFFNESS_FREE;
      const target = dragging ? targetAngle : 0;
      angVel += -k * (angle - target) * dt;
      angVel *= Math.exp(-3.2 * dt);
      angle += angVel * dt;

      if (Math.abs(angle) > MAX_ANGLE) {
        angle = Math.sign(angle) * MAX_ANGLE;
        angVel *= -0.3;
      }

      twist += (angVel * 0.6 - twist) * (1 - Math.exp(-6 * dt));
      const deg = (angle * 180) / Math.PI;
      swing.style.transform = `rotateZ(${deg}deg) rotateY(${clampAngle(twist, 0.4) * 30}deg)`;
      if (shadowRef.current) {
        shadowRef.current.style.transform = `translateX(${-deg * 2.2}px) rotateZ(${deg * 0.8}deg)`;
      }
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    swing.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      swing.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  return (
    <section
      id="about"
      className="relative w-full text-gray-100 py-20 sm:py-24 px-4 sm:px-6 lg:px-10 overflow-hidden border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: About Me Content from harisudhanportfolio.vercel.app */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-[#ff334b] font-bold uppercase text-xs sm:text-sm md:text-base tracking-[0.2em]">
              {ABOUT_SUMMARY.role}
            </span>
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight uppercase text-white">
              About Me.
            </h2>
            <div className="w-24 h-1.5 bg-[#a31515] rounded-full mt-2" aria-hidden="true" />
          </div>

          <div className="relative">
            <div className="red-halo" aria-hidden="true" />
            <div className="glass glass-panel-card relative rounded-3xl p-6 sm:p-8 lg:p-11 flex flex-col gap-6 sm:gap-7">
              <div className="flex flex-col gap-4">
                {ABOUT_SUMMARY.paragraphs.map((para, idx) => (
                  <p
                    key={para}
                    className={
                      idx === 0
                        ? 'text-gray-100 text-base sm:text-xl md:text-2xl leading-relaxed font-medium'
                        : 'text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed'
                    }
                  >
                    {para}
                  </p>
                ))}
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {ABOUT_SUMMARY.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="glass-chip px-3.5 py-1.5 text-xs sm:text-sm font-bold text-gray-200 rounded-full whitespace-nowrap"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Areas of Focus
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {ABOUT_SUMMARY.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-red-200 rounded-full ring-1 ring-red-500/35 bg-[#a31515]/15 whitespace-nowrap"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="glass-red inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white whitespace-nowrap hover:-translate-y-0.5"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>More About Me</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Column: Swinging Hanging Glass Photo Frame */}
        <div className="lg:col-span-5 flex justify-center relative lg:sticky lg:top-24">
          <div ref={rigRef} className="hang-rig">
            <span className="hang-nail" aria-hidden="true" />
            <div ref={shadowRef} className="hang-shadow" aria-hidden="true" />

            <div ref={swingRef} className="hang-swing">
              <svg
                className="hang-strings"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <line x1="50" y1="0" x2="12" y2="100" />
                <line x1="50" y1="0" x2="88" y2="100" />
              </svg>

              <div className="hang-frame">
                <span className="hang-ring hang-ring-l" aria-hidden="true" />
                <span className="hang-ring hang-ring-r" aria-hidden="true" />

                <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/40 ring-1 ring-white/15">
                  <img
                    src={PROFILE.profileImage}
                    alt={`${PROFILE.fullName} — ${PROFILE.roleLine}`}
                    draggable={false}
                    loading="lazy"
                    className="w-full h-full object-cover object-top select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                  <div className="hang-glare" aria-hidden="true" />

                  <div className="absolute bottom-3 left-3 right-3 text-center">
                    <span className="text-white text-base md:text-xl font-black uppercase tracking-wider block">
                      {PROFILE.fullName}
                    </span>
                    <span className="text-[#ff465a] text-xs md:text-sm uppercase font-bold tracking-widest">
                      {PROFILE.roleLine}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More About Me Modal (full narrative from harisudhanportfolio.vercel.app/about.html) */}
      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="glass-strong relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl p-6 sm:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff334b]">
                  {ABOUT_SUMMARY.role}
                </span>
                <h3
                  id="about-modal-title"
                  className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1"
                >
                  About Me.
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close modal"
                className="glass-chip inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-200 hover:text-[#ff334b]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-sm sm:text-base text-gray-300 leading-relaxed">
              {ABOUT_SUMMARY.fullStoryParagraphs.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="glass-red rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white"
              >
                Back to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
