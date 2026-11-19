import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  crimson: boolean;
  twinkle: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  hot: boolean;
}

/**
 * Lightweight 60fps Canvas 2D starfield + pointer spark trail + background click ripple.
 * Replaces heavy 3D bundles for fast initial load while keeping the exact obsidian-crimson motion feel.
 */
export default function AmbientCanvas() {
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const starCanvas = starCanvasRef.current;
    if (!starCanvas) return;
    const ctx = starCanvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    const starCount = isCoarse ? 85 : 170;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2);
      starCanvas.width = Math.round(width * dpr);
      starCanvas.height = Math.round(height * dpr);
    };
    resize();

    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: (Math.random() - 0.5) * 2.2,
      y: (Math.random() - 0.5) * 2.2,
      z: Math.random() * 0.9 + 0.1,
      size: Math.random() < 0.09 ? 1.9 + Math.random() * 1.4 : 0.7 + Math.random() * 1.1,
      crimson: Math.random() < 0.24,
      twinkle: Math.random() * Math.PI * 2,
    }));

    let mouseX = 0;
    let mouseY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let scrollTarget = window.scrollY;
    let scrollSmooth = scrollTarget;

    const onPointerMove = (e: PointerEvent) => {
      mouseX = (e.clientX / width) * 2 - 1;
      mouseY = (e.clientY / height) * 2 - 1;
    };

    const onScroll = () => {
      scrollTarget = window.scrollY;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (reducedMotion) return;
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        target.closest(
          'a,button,input,textarea,select,label,video,img,nav,[role="button"],.glass,.glass-chip,.glass-red'
        )
      ) {
        return;
      }
      const ripple = document.createElement('span');
      ripple.className = 'pf-ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    let rafId = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) * 0.001;
      smoothX += (mouseX - smoothX) * 0.05;
      smoothY += (mouseY - smoothY) * 0.05;
      scrollSmooth += (scrollTarget - scrollSmooth) * 0.08;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        const parallaxX = smoothX * 26 * s.z;
        const parallaxY = smoothY * 20 * s.z;
        const scrollShift = ((scrollSmooth * 0.00025 * s.z) % 2);

        let px = ((s.x + 1.1) / 2.2) * width + parallaxX;
        let py = (((s.y + 1.1 - scrollShift + 2) % 2) / 2) * height + parallaxY;

        if (px < -10) px += width + 20;
        if (px > width + 10) px -= width + 20;
        if (py < -10) py += height + 20;
        if (py > height + 10) py -= height + 20;

        const pulse = reducedMotion ? 0.65 : 0.45 + 0.45 * Math.sin(t * 1.4 + s.twinkle);
        ctx.fillStyle = s.crimson
          ? `rgba(255, 51, 75, ${0.72 * pulse})`
          : `rgba(243, 244, 246, ${0.58 * pulse})`;

        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    if (reducedMotion) {
      draw(start);
    } else {
      rafId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  useEffect(() => {
    const canvas = sparkCanvasRef.current;
    if (!canvas) return;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(pointer: fine)').matches
    ) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const MAX_SPARKS = 96;
    const sparks: Spark[] = Array.from({ length: MAX_SPARKS }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      max: 1,
      size: 1,
      hot: false,
    }));
    const trail: Array<{ x: number; y: number; t: number }> = [];

    let idx = 0;
    let lastX = -9999;
    let lastY = -9999;
    let glow = 0;
    let running = false;
    let rafId = 0;
    let lastTick = performance.now();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    };
    resize();

    const spawn = (x: number, y: number, dx: number, dy: number) => {
      const s = sparks[idx];
      idx = (idx + 1) % MAX_SPARKS;
      const angle = Math.atan2(dy, dx) + Math.PI + (Math.random() - 0.5) * 2.4;
      const speed = 0.04 + Math.random() * 0.22;
      s.x = x;
      s.y = y;
      s.vx = Math.cos(angle) * speed + dx * 0.015;
      s.vy = Math.sin(angle) * speed + dy * 0.015;
      s.max = s.life = 220 + Math.random() * 320;
      s.size = 0.7 + Math.random() * 1.4;
      s.hot = Math.random() < 0.16;
    };

    const tick = (now: number) => {
      const dt = Math.min(48, now - lastTick);
      lastTick = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = 'lighter';

      let active = false;
      glow *= Math.pow(0.99, dt);
      if (glow > 0.02 && lastX > -100) {
        active = true;
        const grad = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 64);
        grad.addColorStop(0, `rgba(255, 24, 52, ${0.14 * glow})`);
        grad.addColorStop(1, 'rgba(255, 24, 52, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(lastX - 64, lastY - 64, 128, 128);
      }

      while (trail.length && now - trail[0].t > 190) trail.shift();
      if (trail.length > 1) {
        active = true;
        ctx.lineCap = 'round';
        for (let i = 1; i < trail.length; i++) {
          const alpha = 1 - (now - trail[i].t) / 190;
          ctx.strokeStyle = `rgba(255, 42, 60, ${alpha * 0.45})`;
          ctx.lineWidth = 2.2 * alpha;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
      }

      for (const s of sparks) {
        if (s.life <= 0) continue;
        s.life -= dt;
        active = true;
        const alpha = Math.max(0, s.life / s.max);
        const px = s.x;
        const py = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.985;
        s.vy *= 0.985;
        ctx.strokeStyle = s.hot
          ? `rgba(255, 255, 255, ${alpha * 0.85})`
          : `rgba(255, 40, 60, ${alpha * 0.85})`;
        ctx.lineWidth = s.size * alpha;
        ctx.beginPath();
        ctx.moveTo(px - s.vx * 14, py - s.vy * 14);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }

      if (active) {
        rafId = requestAnimationFrame(tick);
      } else {
        running = false;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const x = e.clientX;
      const y = e.clientY;
      if (lastX < -999) {
        lastX = x;
        lastY = y;
      }
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      const now = performance.now();
      trail.push({ x, y, t: now });
      if (trail.length > 12) trail.shift();

      const count = Math.min(5, Math.floor(dist / 8));
      for (let i = 0; i < count; i++) {
        const f = Math.random();
        spawn(lastX + dx * f, lastY + dy * f, dx, dy);
      }
      glow = Math.min(1, glow + dist / 120);
      lastX = x;
      lastY = y;
      if (!running) {
        running = true;
        lastTick = now;
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={starCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      <div className="ambient" aria-hidden="true">
        <i className="o1" />
        <i className="o3" />
      </div>
      <canvas ref={sparkCanvasRef} className="spark-cursor" aria-hidden="true" />
    </>
  );
}
