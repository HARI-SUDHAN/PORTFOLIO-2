import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { PROJECTS, type ProjectItem } from '../data/portfolioData';

interface ProjectsSectionProps {
  onSelectProject: (project: ProjectItem) => void;
}

// Exact left-to-right sweeping curved rail geometry matching aswin-dev-portfolio.vercel.app
const RAIL_CONFIG = {
  FOV: 42,
  CAM_Z: 9,
  CARD_W: 3.4,
  SPACING: 0.16,
  RAIL_SPAN: 1.7,
  FLY_SPAN: 0.35,
  HOLD: 0.12,
  RAIL: [
    [0, 3, -60],
    [-10, 2, -34],
    [-12, 0.5, -14],
    [-7, -0.4, -1],
    [0, -0.8, 3.2],
    [7, -0.4, -1],
    [12, 0.6, -12],
    [9, 1.6, -26],
    [2, 2.2, -34],
  ] as Array<[number, number, number]>,
  RAIL_MOBILE: [
    [0, 3, -50],
    [-4, 1.5, -26],
    [-3.5, 0, -8],
    [0, -0.6, 2.5],
    [3.5, 0, -8],
    [4, 1.5, -24],
    [1, 2.4, -32],
  ] as Array<[number, number, number]>,
};

const ASPECT = 16 / 9;

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform vec2 uvScale;
  uniform vec2 uvOffset;
  uniform float uOpacity;
  uniform float uHover;
  varying vec2 vUv;

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    vec2 p = vUv - 0.5;
    float d = sdRoundBox(p, vec2(0.495, 0.495), 0.06);
    if (d > 0.0) discard;

    vec2 sampleUv = vUv * uvScale + uvOffset;
    vec4 tex = texture2D(map, sampleUv);

    float rim = smoothstep(-0.025, 0.0, d);
    vec3 rimCol = mix(vec3(1.0, 1.0, 1.0) * 0.14, vec3(1.0, 0.2, 0.3), uHover);
    vec3 col = mix(tex.rgb, rimCol, rim * (0.28 + uHover * 0.65));

    float bottomShade = smoothstep(0.32, 0.0, vUv.y) * 0.25;
    col *= (1.0 - bottomShade);

    float alpha = smoothstep(0.0, -0.008, d) * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }
`;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function totalSpan(count: number) {
  return RAIL_CONFIG.RAIL_SPAN + RAIL_CONFIG.FLY_SPAN + (count - 1) * RAIL_CONFIG.SPACING + RAIL_CONFIG.HOLD;
}

function getCardTimeline(progress: number, index: number, count: number) {
  const t = clamp01(progress) * totalSpan(count) - index * RAIL_CONFIG.SPACING;
  return {
    rail: clamp01(t / RAIL_CONFIG.RAIL_SPAN),
    fly: clamp01((t - RAIL_CONFIG.RAIL_SPAN) / RAIL_CONFIG.FLY_SPAN),
    opacity: t <= 0 ? 0 : Math.min(1, t / 0.12),
  };
}

function computeLandingCells(count: number, viewW: number, viewH: number, fov: number, camZ: number) {
  const halfFov = (fov / 2) * (Math.PI / 180);
  const worldH = 2 * camZ * Math.tan(halfFov);
  const aspect = viewW / viewH;
  const worldW = worldH * aspect;

  // 1 column on narrow mobile, 3 columns side-by-side on tablet/desktop
  const cols = aspect < 0.85 ? 1 : 3;
  const rows = Math.ceil(count / cols);
  const topOffset = worldH * (aspect < 0.85 ? 0.25 : 0.34);
  const availH = worldH - topOffset - worldH * 0.06;
  const gap = Math.min(worldW, worldH) * 0.028;

  let cardW = Math.min(
    (worldW * 0.9 - gap * (cols - 1)) / cols,
    ((availH - gap * (rows - 1)) / rows) * ASPECT
  );
  cardW = Math.max(cardW, 0.55);
  const cardH = cardW / ASPECT;
  const totalW = cols * cardW + (cols - 1) * gap;
  const totalH = rows * cardH + (rows - 1) * gap;
  const startY = worldH / 2 - topOffset - (availH - totalH) / 2;

  return {
    cells: Array.from({ length: count }, (_, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        x: -totalW / 2 + cardW / 2 + col * (cardW + gap),
        y: startY - cardH / 2 - row * (cardH + gap),
        side: cols > 1 && col === 0 ? -1 : cols > 1 && col === cols - 1 ? 1 : 0,
        vert: rows > 1 && row === 0 ? 1 : rows > 1 && row === rows - 1 ? -1 : 0,
      };
    }),
    cellW: cardW,
    cellH: cardH,
  };
}

export default function ProjectsSection({ onSelectProject }: ProjectsSectionProps) {
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelectProject);
  onSelectRef.current = onSelectProject;

  const [useSimpleFallback, setUseSimpleFallback] = useState(false);

  useEffect(() => {
    const check = () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setUseSimpleFallback(reduced);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Exact left-to-right sweeping curved rail animation from aswin-dev-portfolio.vercel.app
  useEffect(() => {
    if (useSimpleFallback) return;
    const container = stageContainerRef.current;
    const host = canvasHostRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setUseSimpleFallback(true);
      return;
    }

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(RAIL_CONFIG.FOV, 1, 0.1, 200);
    camera.position.set(0, 0, RAIL_CONFIG.CAM_Z);

    const railPoints = (window.innerWidth < 768 ? RAIL_CONFIG.RAIL_MOBILE : RAIL_CONFIG.RAIL).map(
      ([x, y, z]) => new THREE.Vector3(x, y, z)
    );
    const curve = new THREE.CatmullRomCurve3(railPoints, false, 'centripetal', 0.5);
    const samples = 200;
    const sampledPoints = curve.getPoints(samples);
    const sampledTangents = sampledPoints.map((_, i) => {
      const a = Math.max(0, i - 1);
      const b = Math.min(samples, i + 1);
      return sampledPoints[b].clone().sub(sampledPoints[a]).normalize();
    });

    const sampleRail = (t: number, outPos: THREE.Vector3, outTan: THREE.Vector3) => {
      const scaled = clamp01(t) * samples;
      const i = Math.min(samples - 1, Math.floor(scaled));
      const f = scaled - i;
      outPos.lerpVectors(sampledPoints[i], sampledPoints[i + 1], f);
      outTan.lerpVectors(sampledTangents[i], sampledTangents[i + 1], f).normalize();
    };

    const cardGeo = new THREE.PlaneGeometry(ASPECT, 1, 24, 14);
    const texLoader = new THREE.TextureLoader();
    const emptyTex = new THREE.DataTexture(new Uint8Array([10, 8, 10, 255]), 1, 1);
    emptyTex.needsUpdate = true;

    const updateCoverUV = (mat: THREE.ShaderMaterial, w: number, h: number) => {
      const imgAspect = w / h;
      if (imgAspect > ASPECT) {
        const s = ASPECT / imgAspect;
        mat.uniforms.uvScale.value.set(s, 1);
        mat.uniforms.uvOffset.value.set((1 - s) / 2, 0);
      } else {
        const s = imgAspect / ASPECT;
        mat.uniforms.uvScale.value.set(1, s);
        mat.uniforms.uvOffset.value.set(0, (1 - s) / 2);
      }
    };

    const cards = PROJECTS.map((project, idx) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          map: { value: emptyTex },
          uvScale: { value: new THREE.Vector2(1, 1) },
          uvOffset: { value: new THREE.Vector2(0, 0) },
          uOpacity: { value: 0 },
          uHover: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      mesh.userData.index = idx;
      scene.add(mesh);

      texLoader.load(project.poster, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.uniforms.map.value = tex;
        updateCoverUV(mat, tex.image.width, tex.image.height);
      });

      return { project, mesh, mat, hover: 0 };
    });

    let viewW = 1;
    let viewH = 1;
    let layout: ReturnType<typeof computeLandingCells> | null = null;

    const onResize = () => {
      viewW = host.clientWidth;
      viewH = host.clientHeight;
      renderer.setSize(viewW, viewH, false);
      camera.aspect = viewW / viewH;
      camera.updateProjectionMatrix();
      layout = computeLandingCells(cards.length, viewW, viewH, RAIL_CONFIG.FOV, RAIL_CONFIG.CAM_Z);
    };
    onResize();
    window.addEventListener('resize', onResize);

    let scrollProgress = 0;
    let smoothProgress = 0;
    let inView = false;

    const updateScroll = () => {
      const rect = container.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      scrollProgress = span > 0 ? clamp01(-rect.top / span) : 0;
    };
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { rootMargin: '250px' }
    );
    io.observe(host);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(9, 9);
    let hoveredIdx = -1;
    let pointerX = 0;
    let pointerY = 0;
    let downX = 0;
    let downY = 0;
    let pointerActive = false;
    let isTouchPointer = coarse;

    const hideTooltip = () => {
      pointerActive = false;
      hoveredIdx = -1;
      pointer.set(9, 9);
      if (tooltip) tooltip.style.opacity = '0';
    };

    const updatePointer = (e: PointerEvent) => {
      isTouchPointer = e.pointerType === 'touch';
      if (isTouchPointer) {
        hideTooltip();
        return;
      }
      const rect = host.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
      pointer.set((pointerX / rect.width) * 2 - 1, -(pointerY / rect.height) * 2 + 1);
      pointerActive = true;
    };

    const pick = () => {
      if (!pointerActive || isTouchPointer) {
        hoveredIdx = -1;
        return;
      }
      raycaster.setFromCamera(pointer, camera);
      const visibleMeshes = cards
        .filter((c) => c.mat.uniforms.uOpacity.value > 0.3)
        .map((c) => c.mesh);
      const hits = raycaster.intersectObjects(visibleMeshes);
      hoveredIdx = hits.length ? hits[0].object.userData.index : -1;
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      if (e.pointerType !== 'touch') {
        updatePointer(e);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10) return;
      const rect = host.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      pointer.set((px / rect.width) * 2 - 1, -(py / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const visibleMeshes = cards
        .filter((c) => c.mat.uniforms.uOpacity.value > 0.3)
        .map((c) => c.mesh);
      const hits = raycaster.intersectObjects(visibleMeshes);
      if (hits.length) {
        const idx = hits[0].object.userData.index;
        onSelectRef.current(cards[idx].project);
      }
      if (e.pointerType === 'touch') {
        hideTooltip();
      }
    };

    const onPointerLeave = () => {
      hideTooltip();
    };

    const onScrollHide = () => {
      const rect = container.getBoundingClientRect();
      const stageVisible = rect.bottom > 80 && rect.top < window.innerHeight - 80;
      if (!stageVisible || isTouchPointer) {
        hideTooltip();
      }
    };

    host.addEventListener('pointermove', updatePointer);
    host.addEventListener('pointerleave', onPointerLeave);
    host.addEventListener('pointercancel', onPointerLeave);
    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('pointerup', onPointerUp);
    window.addEventListener('scroll', onScrollHide, { passive: true });

    const pos = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const horiz = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const basis = new THREE.Matrix4();
    const railQuat = new THREE.Quaternion();
    const flatQuat = new THREE.Quaternion();
    const bankQuat = new THREE.Quaternion();
    const railEndPos = new THREE.Vector3();
    const cellPos = new THREE.Vector3();
    const ctrlPos = new THREE.Vector3();
    const tempAxis = new THREE.Vector3();

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!inView || document.hidden || !layout) return;

      smoothProgress += (scrollProgress - smoothProgress) * (1 - Math.exp(-7 * dt));
      if (Math.abs(scrollProgress - smoothProgress) < 1e-5) smoothProgress = scrollProgress;

      cards.forEach((c, idx) => {
        const tl = getCardTimeline(smoothProgress, idx, cards.length);
        sampleRail(tl.rail, pos, tan);

        horiz.set(tan.x, 0, tan.z);
        if (horiz.lengthSq() < 1e-4) horiz.set(1, 0, 0);
        horiz.normalize();
        normal.crossVectors(horiz, up).normalize();
        if (normal.z < 0) normal.negate();

        basis.makeBasis(tempAxis.crossVectors(up, normal).normalize(), up, normal);
        railQuat.setFromRotationMatrix(basis);

        const railScale = RAIL_CONFIG.CARD_W / ASPECT;
        const cell = layout!.cells[idx];

        if (tl.fly <= 0) {
          // Exact left-to-right curved rail flight with tangent-following rotation
          c.mesh.position.copy(pos);
          c.mesh.quaternion.copy(railQuat);
          c.mesh.scale.setScalar(railScale);
        } else {
          // Smooth bezier fly-out + gentle banking tilt into final 3-card view
          sampleRail(1, railEndPos, tan);
          cellPos.set(cell.x, cell.y, 0);
          ctrlPos.set(
            cell.x + cell.side * layout!.cellW * 0.9,
            cell.y + cell.vert * layout!.cellH * 1.6,
            1.2
          );

          const e = easeInOutCubic(tl.fly);
          const inv = 1 - e;
          c.mesh.position.set(
            inv * inv * railEndPos.x + 2 * inv * e * ctrlPos.x + e * e * cellPos.x,
            inv * inv * railEndPos.y + 2 * inv * e * ctrlPos.y + e * e * cellPos.y,
            inv * inv * railEndPos.z + 2 * inv * e * ctrlPos.z + e * e * cellPos.z
          );

          flatQuat.identity();
          c.mesh.quaternion.copy(railQuat).slerp(flatQuat, e);
          bankQuat.setFromAxisAngle(
            tempAxis.set(0, 0, 1),
            Math.sin(Math.PI * e) * 0.18 * (cell.side || cell.vert || 1)
          );
          c.mesh.quaternion.multiply(bankQuat);
          c.mesh.scale.setScalar(THREE.MathUtils.lerp(railScale, layout!.cellH, e));
        }

        c.mesh.renderOrder = Math.round(c.mesh.position.z * 100);
        c.hover += ((idx === hoveredIdx ? 1 : 0) - c.hover) * (1 - Math.exp(-10 * dt));
        c.mat.uniforms.uHover.value = c.hover;
        c.mesh.scale.multiplyScalar(1 + c.hover * 0.05);
        c.mat.uniforms.uOpacity.value = tl.opacity;
        c.mesh.visible = tl.opacity > 0.001;
      });

      scene.updateMatrixWorld(true);
      pick();
      host.style.cursor = hoveredIdx >= 0 ? 'pointer' : '';

      if (tooltip) {
        const containerRect = container.getBoundingClientRect();
        const sectionInScreen =
          containerRect.bottom > 80 && containerRect.top < window.innerHeight - 80;
        if (hoveredIdx >= 0 && pointerActive && !isTouchPointer && sectionInScreen) {
          const p = cards[hoveredIdx].project;
          if (tooltip.dataset.id !== p.id) {
            tooltip.dataset.id = p.id;
            const titleEl = tooltip.querySelector('[data-t]');
            const subEl = tooltip.querySelector('[data-s]');
            const catEl = tooltip.querySelector('[data-c]');
            if (titleEl) titleEl.textContent = p.title;
            if (subEl) subEl.textContent = p.subtitle;
            if (catEl) catEl.textContent = p.category;
          }
          tooltip.style.opacity = '1';
          const maxX = viewW - tooltip.offsetWidth - 12;
          const maxY = viewH - tooltip.offsetHeight - 12;
          tooltip.style.transform = `translate(${Math.max(12, Math.min(pointerX + 18, maxX))}px, ${Math.max(12, Math.min(pointerY + 18, maxY))}px)`;
        } else {
          tooltip.style.opacity = '0';
        }
      }

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('scroll', onScrollHide);
      host.removeEventListener('pointermove', updatePointer);
      host.removeEventListener('pointerleave', onPointerLeave);
      host.removeEventListener('pointercancel', onPointerLeave);
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointerup', onPointerUp);
      if (tooltip) tooltip.style.opacity = '0';
      cards.forEach((c) => {
        c.mat.dispose();
      });
      cardGeo.dispose();
      emptyTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [useSimpleFallback]);

  // Clean reduced-motion / no-WebGL fallback grid
  if (useSimpleFallback) {
    return (
      <section
        id="projects"
        className="relative w-full text-gray-100 py-24 px-4 md:px-10 border-t border-white/5"
      >
        <div className="flex flex-col items-center text-center mb-12">
          <span className="text-[#ff334b] font-bold uppercase text-xs md:text-sm tracking-[0.22em] mb-2">
            Featured Works
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight uppercase text-white">
            Projects.
          </h2>
          <div className="w-16 h-1.5 bg-[#a31515] mt-3 rounded-full" aria-hidden="true" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              className="glass glass-panel-card rounded-2xl overflow-hidden flex flex-col group"
            >
              <button
                type="button"
                onClick={() => onSelectProject(project)}
                className="relative w-full aspect-[16/9] overflow-hidden text-left"
              >
                <img
                  src={project.poster}
                  alt={project.title}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </button>
              <div className="p-5 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => onSelectProject(project)}
                  className="text-left min-w-0"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ff465a]">
                    {project.category}
                  </span>
                  <h3 className="text-xl font-black text-white truncate">{project.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{project.subtitle}</p>
                </button>
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-red inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-bold uppercase tracking-wider text-white shrink-0"
                >
                  <span>View</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="projects"
      ref={stageContainerRef}
      className="relative w-full text-gray-100 border-t border-white/5"
      style={{ height: '240vh' }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="relative z-20 pt-20 sm:pt-24 px-4 flex flex-col items-center text-center pointer-events-none">
          <span className="text-[#ff334b] font-bold uppercase text-xs sm:text-sm tracking-[0.22em] mb-2">
            Featured Works
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight uppercase text-white">
            Projects.
          </h2>
          <div className="w-16 h-1.5 bg-[#a31515] mt-2.5 rounded-full" aria-hidden="true" />
        </div>

        {/* Exact Left-to-Right Curved Rail 3D Stage */}
        <div ref={canvasHostRef} className="absolute inset-0 z-10" />

        {/* Cursor-Following Glass Tooltip (scoped inside sticky viewport) */}
        <div
          ref={tooltipRef}
          aria-hidden="true"
          className="glass-strong pointer-events-none absolute left-0 top-0 z-30 rounded-2xl px-4 py-3 opacity-0 transition-opacity duration-200 max-w-xs"
        >
          <span
            data-c=""
            className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff465a]"
          />
          <span data-t="" className="block text-base font-black text-white mt-0.5" />
          <span data-s="" className="block text-xs text-gray-300" />
          <span className="mt-1.5 block text-[10px] font-mono uppercase tracking-wider text-gray-400">
            Click to inspect &amp; open live site →
          </span>
        </div>

        {/* Bottom Quick Links Strip */}
        <div className="relative z-20 mt-auto pb-6 px-4 flex flex-wrap items-center justify-center gap-2.5 pointer-events-auto">
          {PROJECTS.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project)}
              className="glass-chip min-h-[38px] inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-200 hover:text-white"
            >
              <span>{project.title}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#ff334b]" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
