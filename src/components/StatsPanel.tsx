import { useEffect, useRef, useState } from 'react';
import { STATS } from '../data/portfolioData';

export default function StatsPanel() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [counts, setCounts] = useState<number[]>(() => STATS.map(() => 0));
  const [hasAnimated, setHasAnimated] = useState(false);

  // Trigger count-up on intersection
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setCounts(STATS.map((s) => s.value));
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1100;
          const start = performance.now();

          const step = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setCounts(STATS.map((s) => Math.round(s.value * eased)));
            if (p < 1) requestAnimationFrame(step);
          };

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  // Pointer spotlight tracking matching the reference portfolio
  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    if (!section || !panel) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('--mx', `${(e.clientX - rect.left).toFixed(1)}px`);
      panel.style.setProperty('--my', `${(e.clientY - rect.top).toFixed(1)}px`);
      panel.style.setProperty('--lo', '1');
    };

    const onLeave = () => {
      panel.style.setProperty('--lo', '0');
    };

    panel.addEventListener('pointermove', onMove);
    panel.addEventListener('pointerleave', onLeave);
    return () => {
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section
      id="stats"
      ref={sectionRef}
      aria-labelledby="stats-heading"
      className="relative w-full text-gray-100 py-10 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-10 overflow-hidden border-t border-white/5"
    >
      <h2 id="stats-heading" className="sr-only">
        Engineering Highlights
      </h2>

      <div
        ref={panelRef}
        className="stat-panel glass glass-panel-card relative z-10 max-w-7xl mx-auto rounded-3xl overflow-hidden"
      >
        <div className="stat-light" aria-hidden="true" />
        <div className="stat-rim" aria-hidden="true" />

        <dl className="relative z-10 m-0 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
          {STATS.map((stat, idx) => (
            <div key={stat.id} className="px-6 py-8 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
              <div className="flex flex-col-reverse gap-4 sm:gap-5">
                <dt className="text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.16em] leading-snug text-gray-300">
                  {stat.label}
                </dt>
                <dd className="m-0">
                  <span className="sr-only">
                    {stat.value}
                    {stat.suffix}
                  </span>
                  <div
                    aria-hidden="true"
                    className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-white tabular-nums tracking-tight"
                  >
                    <span>{counts[idx]}</span>
                    <span className="text-[#ff334b]">{stat.suffix}</span>
                  </div>
                  <div
                    className="mt-4 sm:mt-5 w-12 h-1 bg-[#a31515] rounded-full"
                    aria-hidden="true"
                  />
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
