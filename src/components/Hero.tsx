import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Github, Instagram, Linkedin, Mail } from 'lucide-react';
import { PROFILE } from '../data/portfolioData';

// Exact 5 Voronoi glass shard polygons from reference design
const P1: [number, number] = [0.22, 0];
const P2: [number, number] = [0.515, 0];
const P3: [number, number] = [0.84, 0];
const P4: [number, number] = [0.34, 1];
const P5: [number, number] = [0.865, 1];
const C1: [number, number] = [0.385, 0.72];
const C2: [number, number] = [0.48, 0.62];
const C3: [number, number] = [0.716, 0.49];

const SHARD_POLYGONS: Array<Array<[number, number]>> = [
  [[0, 0], P1, C2, C1, P4, [0, 1]],
  [P1, P2, C3, C2],
  [P2, P3, C3],
  [P3, [1, 0], [1, 1], P5, C3],
  [C1, C2, C3, P5, P4],
];
const FLOATING_VERTICES = [C1, C2, C3];

const SPRING = { stiffness: 85, damping: 14, maxOffsetRatio: 0.12 };

interface SpringVal {
  position: number;
  velocity: number;
}

interface ShardItem {
  mesh: THREE.Mesh;
  edge: THREE.LineSegments;
  mat: THREE.MeshPhysicalMaterial;
  dir: THREE.Vector3;
  spin: THREE.Vector3;
  lift: number;
  phase: number;
  x: SpringVal;
  y: SpringVal;
  targetX: number;
  targetY: number;
}

function stepSpring(s: SpringVal, target: number, dt: number) {
  let rem = Math.min(Math.max(dt, 0), 0.05);
  while (rem > 0) {
    const step = Math.min(rem, 1 / 120);
    s.velocity += ((target - s.position) * SPRING.stiffness - s.velocity * SPRING.damping) * step;
    s.position += s.velocity * step;
    rem -= step;
  }
  if (Math.abs(s.position - target) < 1e-4 && Math.abs(s.velocity) < 1e-4) {
    s.position = target;
    s.velocity = 0;
  }
}

function clampDrag(val: number, span: number) {
  const max = span * SPRING.maxOffsetRatio;
  return Math.max(-max, Math.min(max, val));
}

function insetPolygon(pts: Array<[number, number]>, inset: number): Array<[number, number]> {
  const n = pts.length;
  const area = pts.reduce((acc, p, i) => {
    const next = pts[(i + 1) % n];
    return acc + (p[0] * next[1] - next[0] * p[1]);
  }, 0);
  const sign = area > 0 ? 1 : -1;

  const lines = pts.map((p, i) => {
    const next = pts[(i + 1) % n];
    let nx = -(next[1] - p[1]);
    let ny = next[0] - p[0];
    const len = Math.hypot(nx, ny) || 1;
    nx = (nx / len) * sign * inset;
    ny = (ny / len) * sign * inset;
    return [
      [p[0] + nx, p[1] + ny],
      [next[0] + nx, next[1] + ny],
    ];
  });

  return lines.map((curr, i) => {
    const [a, b] = lines[(i - 1 + n) % n];
    const [c, d] = curr;
    const dx1 = b[0] - a[0];
    const dy1 = b[1] - a[1];
    const dx2 = d[0] - c[0];
    const dy2 = d[1] - c[1];
    const det = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(det) < 1e-9) return c as [number, number];
    const t = ((c[0] - a[0]) * dy2 - (c[1] - a[1]) * dx2) / det;
    return [a[0] + dx1 * t, a[1] + dy1 * t];
  });
}

function buildRoundedShape(pts: Array<[number, number]>, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const curr = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const v1: [number, number] = [prev[0] - curr[0], prev[1] - curr[1]];
    const v2: [number, number] = [next[0] - curr[0], next[1] - curr[1]];
    const l1 = Math.hypot(v1[0], v1[1]) || 1;
    const l2 = Math.hypot(v2[0], v2[1]) || 1;
    const r = Math.min(radius, l1 * 0.4, l2 * 0.4);
    const pStart: [number, number] = [curr[0] + (v1[0] / l1) * r, curr[1] + (v1[1] / l1) * r];
    const pEnd: [number, number] = [curr[0] + (v2[0] / l2) * r, curr[1] + (v2[1] / l2) * r];
    if (i === 0) shape.moveTo(pStart[0], pStart[1]);
    else shape.lineTo(pStart[0], pStart[1]);
    shape.quadraticCurveTo(curr[0], curr[1], pEnd[0], pEnd[1]);
  }
  shape.closePath();
  return shape;
}

function computeFrameRect(w: number, h: number) {
  const mobile = w < 768;
  const left = mobile ? Math.min(Math.max(w * 0.05, 16), 22) : w * 0.055;
  const top = Math.max(h * 0.085, mobile ? 76 : 92);
  const height = mobile ? h * 0.42 : h - top - h * 0.085;
  return { left, top, width: w - left * 2, height, mobile };
}

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function createHeroCompositeTexture(img: HTMLImageElement): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#07070a';
    ctx.fillRect(0, 0, 1600, 900);

    const crimsonGlow = ctx.createRadialGradient(1120, 420, 40, 1120, 420, 620);
    crimsonGlow.addColorStop(0, 'rgba(255, 38, 60, 0.38)');
    crimsonGlow.addColorStop(0.5, 'rgba(139, 17, 24, 0.16)');
    crimsonGlow.addColorStop(1, 'rgba(7, 7, 10, 0)');
    ctx.fillStyle = crimsonGlow;
    ctx.fillRect(0, 0, 1600, 900);

    ctx.drawImage(img, 720, 0, 900, 900);

    const leftScrim = ctx.createLinearGradient(520, 0, 1040, 0);
    leftScrim.addColorStop(0, '#07070a');
    leftScrim.addColorStop(0.55, 'rgba(7, 7, 10, 0.72)');
    leftScrim.addColorStop(1, 'rgba(7, 7, 10, 0)');
    ctx.fillStyle = leftScrim;
    ctx.fillRect(0, 0, 1060, 900);

    const bottomScrim = ctx.createLinearGradient(0, 660, 0, 900);
    bottomScrim.addColorStop(0, 'rgba(7, 7, 10, 0)');
    bottomScrim.addColorStop(1, 'rgba(7, 7, 10, 0.75)');
    ctx.fillStyle = bottomScrim;
    ctx.fillRect(0, 660, 1600, 240);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const copyWrapRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setWebglReady(supportsWebGL());
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!webglReady) return;
    const section = sectionRef.current;
    const host = canvasHostRef.current;
    if (!section || !host) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const keyLight = new THREE.DirectionalLight(0xff465a, 0.85);
    keyLight.position.set(-4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd94a52, 0.55);
    rimLight.position.set(5, -3, 2);
    scene.add(rimLight);

    const hoverLight = new THREE.PointLight(0x8b1118, 0, 6, 1.6);
    hoverLight.position.set(0, 0, 1.5);
    scene.add(hoverLight);

    const fallbackTex = new THREE.DataTexture(new Uint8Array([12, 10, 14, 255]), 1, 1);
    fallbackTex.needsUpdate = true;

    let compositeTex: THREE.Texture = fallbackTex;
    let imageLoaded = false;

    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0x16161b,
      roughness: 0.34,
      metalness: 0,
      specularIntensity: 0.4,
      specularColor: new THREE.Color('#d94a52'),
      clearcoat: 0.75,
      clearcoatRoughness: 0.12,
      iridescence: 0.55,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [100, 400],
      emissive: 0xffffff,
      emissiveMap: fallbackTex,
      emissiveIntensity: 0.05,
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xff334b,
      transparent: true,
      opacity: 0,
    });

    const outerEdgeMat = new THREE.LineBasicMaterial({
      color: 0xff334b,
      transparent: true,
      opacity: 0.22,
    });

    const intactMat = baseMat.clone();
    intactMat.transparent = true;
    intactMat.opacity = 1;
    let intactMesh: THREE.Mesh | null = null;

    const shards: ShardItem[] = [];
    let worldW = 1;
    let worldH = 1;
    let mobileLayout = false;

    const rebuildShards = () => {
      const prev = shards.slice();
      shards.forEach((s) => {
        group.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.edge.geometry.dispose();
        s.mat.dispose();
      });
      shards.length = 0;

      const t = reducedMotion ? 0 : performance.now() / 1000;
      const minDim = Math.min(worldW, worldH);

      SHARD_POLYGONS.forEach((poly, idx) => {
        const mapped = poly.map((pt): [number, number] => {
          let [u, v] = pt;
          const fIdx = FLOATING_VERTICES.indexOf(pt);
          if (fIdx >= 0) {
            u += Math.sin(t * 0.5 + fIdx * 2.1) * 0.006;
            v += Math.cos(t * 0.4 + fIdx * 1.3) * 0.006;
          }
          if (mobileLayout) [u, v] = [v, u];
          return [(u - 0.5) * worldW, (0.5 - v) * worldH];
        });

        const shape = buildRoundedShape(insetPolygon(mapped, minDim * 0.011), minDim * 0.032);
        const depth = minDim * 0.042;
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness: depth * 0.35,
          bevelSize: depth * 0.3,
          bevelSegments: 3,
          curveSegments: 8,
        });
        geo.translate(0, 0, -depth);

        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        const texAspect = 16 / 9;
        const boxAspect = worldW / worldH;
        let uvW = 1;
        let uvH = 1;
        if (boxAspect > texAspect) uvH = texAspect / boxAspect;
        else uvW = boxAspect / texAspect;

        const focusShift = uvW < 1 ? Math.min(0.5, Math.max(0, (0.69 - 0.5) / (1 - uvW))) : 0;
        for (let k = 0; k < pos.count; k++) {
          const uCoord = (pos.getX(k) / worldW + 0.5) * uvW + (1 - uvW) / 2 + focusShift * (1 - uvW);
          const vCoord = (pos.getY(k) / worldH + 0.5) * uvH + (1 - uvH) / 2;
          uv.setXY(k, Math.min(1, Math.max(0, uCoord)), Math.min(1, Math.max(0, vCoord)));
        }
        uv.needsUpdate = true;

        const mat = baseMat.clone();
        mat.emissiveMap = compositeTex;
        const mesh = new THREE.Mesh(geo, mat);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat);
        mesh.add(edges);
        mesh.userData.idx = idx;

        const center = mapped.reduce(
          (acc, p) => [acc[0] + p[0] / mapped.length, acc[1] + p[1] / mapped.length],
          [0, 0]
        );
        const dir = new THREE.Vector3(center[0] / worldW, center[1] / worldH, 0.4 + (idx % 3) * 0.25).normalize();
        const spin = prev[idx]?.spin ?? new THREE.Vector3((Math.random() - 0.5) * 2.1, (Math.random() - 0.5) * 2.1, (Math.random() - 0.5) * 1.2);

        group.add(mesh);
        shards.push({
          mesh,
          edge: edges,
          mat,
          dir,
          spin,
          lift: prev[idx]?.lift ?? 0,
          phase: idx * 1.37,
          x: prev[idx]?.x ?? { position: 0, velocity: 0 },
          y: prev[idx]?.y ?? { position: 0, velocity: 0 },
          targetX: prev[idx]?.targetX ?? 0,
          targetY: prev[idx]?.targetY ?? 0,
        });
      });

      if (intactMesh) {
        group.remove(intactMesh);
        intactMesh.geometry.dispose();
        intactMesh.children.forEach((child) => {
          if (child instanceof THREE.LineSegments) child.geometry.dispose();
        });
        intactMesh = null;
      }

      // Build intact seamless rounded portrait mesh for rest state (zero cracks/notches over face)
      const hw = worldW / 2;
      const hh = worldH / 2;
      const fullPts: Array<[number, number]> = [
        [-hw, hh],
        [hw, hh],
        [hw, -hh],
        [-hw, -hh],
      ];
      const intactShape = buildRoundedShape(fullPts, minDim * 0.032);
      const intactDepth = minDim * 0.042;
      const intactGeo = new THREE.ExtrudeGeometry(intactShape, {
        depth: intactDepth,
        bevelEnabled: true,
        bevelThickness: intactDepth * 0.35,
        bevelSize: intactDepth * 0.3,
        bevelSegments: 3,
        curveSegments: 10,
      });
      intactGeo.translate(0, 0, -intactDepth);

      const iPos = intactGeo.attributes.position;
      const iUv = intactGeo.attributes.uv;
      const texAspect = 16 / 9;
      const boxAspect = worldW / worldH;
      let iUvW = 1;
      let iUvH = 1;
      if (boxAspect > texAspect) iUvH = texAspect / boxAspect;
      else iUvW = boxAspect / texAspect;
      const iFocusShift = iUvW < 1 ? Math.min(0.5, Math.max(0, (0.69 - 0.5) / (1 - iUvW))) : 0;
      for (let k = 0; k < iPos.count; k++) {
        const uCoord = (iPos.getX(k) / worldW + 0.5) * iUvW + (1 - iUvW) / 2 + iFocusShift * (1 - iUvW);
        const vCoord = (iPos.getY(k) / worldH + 0.5) * iUvH + (1 - iUvH) / 2;
        iUv.setXY(k, Math.min(1, Math.max(0, uCoord)), Math.min(1, Math.max(0, vCoord)));
      }
      iUv.needsUpdate = true;
      intactMat.emissiveMap = compositeTex;
      intactMesh = new THREE.Mesh(intactGeo, intactMat);
      intactMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(intactGeo, 25), outerEdgeMat));
      group.add(intactMesh);
    };

    const loadPortrait = new Image();
    loadPortrait.crossOrigin = 'anonymous';
    loadPortrait.onload = () => {
      compositeTex = createHeroCompositeTexture(loadPortrait);
      imageLoaded = true;
      intactMat.emissiveMap = compositeTex;
      intactMat.needsUpdate = true;
      shards.forEach((s) => {
        s.mat.emissiveMap = compositeTex;
        s.mat.needsUpdate = true;
      });
    };
    loadPortrait.src = PROFILE.profileImage;

    const resize = () => {
      const w = section.clientWidth;
      const h = section.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const rect = computeFrameRect(w, h);
      const scale = (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / h;
      worldW = rect.width * scale;
      worldH = rect.height * scale;
      group.position.set(0, -((rect.top - (h - rect.top - rect.height)) / 2) * scale, 0);
      mobileLayout = rect.mobile;
      camera.updateProjectionMatrix();
      rebuildShards();

      const copyEl = copyWrapRef.current;
      if (copyEl) {
        if (rect.mobile) {
          const top = rect.top + rect.height + Math.min(h * 0.02, 16);
          Object.assign(copyEl.style, {
            left: `${rect.left}px`,
            top: `${top}px`,
            width: `${rect.width}px`,
            height: `${Math.max(h - top - h * 0.02, 230)}px`,
          });
        } else {
          Object.assign(copyEl.style, {
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          });
        }
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(section);

    const pointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const dragPlane = new THREE.Plane();
    const hitLocal = new THREE.Vector3();
    const hitPoint = new THREE.Vector3();
    const dragStart = new THREE.Vector2();
    let activeIdx = -1;
    let activePointerId: number | null = null;
    let activeZ = 0;
    let pointerInside = false;

    const onMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerInside = true;

      if (activeIdx >= 0 && e.pointerId === activePointerId) {
        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
          const local = group.worldToLocal(hitPoint.clone());
          const s = shards[activeIdx];
          s.targetX = clampDrag(dragStart.x + local.x - hitLocal.x, worldW);
          s.targetY = clampDrag(dragStart.y + local.y - hitLocal.y, worldH);
        }
      }
    };

    const onLeave = () => {
      pointerInside = false;
    };

    const onUp = () => {
      if (activeIdx < 0) return;
      shards[activeIdx].targetX = 0;
      shards[activeIdx].targetY = 0;
      activeIdx = -1;
      section.classList.remove('shard-dragging');
      host.style.cursor = '';
      if (activePointerId !== null && section.hasPointerCapture(activePointerId)) {
        section.releasePointerCapture(activePointerId);
      }
      activePointerId = null;
    };

    const onDown = (e: PointerEvent) => {
      if (
        activeIdx >= 0 ||
        (e.pointerType === 'mouse' && e.button !== 0) ||
        (e.target as HTMLElement)?.closest('a, button, input, textarea, nav') ||
        section.getBoundingClientRect().top < -section.clientHeight * 0.04
      ) {
        return;
      }
      onMove(e);
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(
        shards.map((s) => s.mesh),
        false
      )[0];
      if (!hit) return;

      activeIdx = hit.object.userData.idx;
      activePointerId = e.pointerId;
      const s = shards[activeIdx];
      activeZ = s.mesh.position.z;
      dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), hit.point);
      hitLocal.copy(group.worldToLocal(hit.point.clone()));
      dragStart.set(s.x.position, s.y.position);
      section.setPointerCapture(e.pointerId);
      section.classList.add('shard-dragging');
      host.style.cursor = 'grabbing';
    };

    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);
    section.addEventListener('pointerdown', onDown);
    section.addEventListener('pointerup', onUp);
    section.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);

    let inView = true;
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) onUp();
    });
    io.observe(section);

    const rot = { x: 0, y: 0 };
    let hoveredIdx = -1;
    let scrollEase = 0;
    let geomTimer = 0;
    let rafId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      if (!inView) {
        lastTime = now;
        return;
      }
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now / 1000;
      const lerpFactor = (k: number) => 1 - Math.exp(-k * dt);

      const dragging = activeIdx >= 0;
      const targetRx = dragging ? rot.x : pointerInside && !reducedMotion ? -pointer.y * THREE.MathUtils.degToRad(5.5) : 0;
      const targetRy = dragging ? rot.y : pointerInside && !reducedMotion ? pointer.x * THREE.MathUtils.degToRad(7) : 0;
      rot.x += (targetRx - rot.x) * lerpFactor(5);
      rot.y += (targetRy - rot.y) * lerpFactor(5);

      const rect = section.getBoundingClientRect();
      const rawProgress = THREE.MathUtils.clamp(-rect.top / (rect.height * 0.72), 0, 1);
      scrollEase += (rawProgress - scrollEase) * lerpFactor(8);
      const shatter = scrollEase * scrollEase * (3 - 2 * scrollEase);

      group.rotation.set(rot.x, rot.y, 0);
      group.updateMatrixWorld(true);

      hoveredIdx = -1;
      if (pointerInside && !coarsePointer && shatter < 0.05) {
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(
          shards.map((s) => s.mesh),
          false
        )[0];
        if (hit) {
          hoveredIdx = hit.object.userData.idx;
          hoverLight.position.set(hit.point.x, hit.point.y, hit.point.z + 1.2);
        }
      }
      hoverLight.intensity += ((hoveredIdx >= 0 || activeIdx >= 0 ? 1.5 : 0) - hoverLight.intensity) * lerpFactor(6);

      geomTimer += dt;
      const anyDragged = shards.some((s) => s.x.position !== 0 || s.y.position !== 0);
      if (!reducedMotion && activeIdx < 0 && !anyDragged && geomTimer > 0.25 && shatter < 0.02) {
        geomTimer = 0;
        rebuildShards();
      }

      const interacting = activeIdx >= 0 || hoveredIdx >= 0 || anyDragged;
      const fractureActive = shatter > 0.008 || interacting;
      const scatterDist = shatter * Math.max(worldW, worldH) * 0.95;

      // Smoothly crossfade out the seamless intact portrait as scroll-break or drag begins
      const intactFade = interacting ? 0 : Math.max(0, 1 - shatter * 14);
      if (intactMesh) {
        intactMesh.visible = intactFade > 0.01;
        intactMat.opacity = intactFade;
        intactMat.emissiveIntensity = (imageLoaded ? 0.94 : 0.05) * (1 - shatter * 0.45);
      }
      outerEdgeMat.opacity = 0.22 * intactFade;
      edgeMat.opacity = fractureActive ? Math.min(0.32, shatter * 0.9 + (interacting ? 0.24 : 0)) : 0;

      shards.forEach((s, idx) => {
        const isDragged = activeIdx === idx || s.x.position !== 0 || s.y.position !== 0;
        s.lift += (((!isDragged && hoveredIdx === idx) ? 1 : 0) - s.lift) * lerpFactor(7);
        stepSpring(s.x, s.targetX, dt);
        stepSpring(s.y, s.targetY, dt);

        s.mesh.visible = fractureActive || intactFade < 0.99;

        const idleZ = reducedMotion || isDragged ? 0 : Math.sin(t * 0.8 + s.phase) * 0.03;
        s.mesh.position.set(
          s.dir.x * scatterDist + s.x.position,
          s.dir.y * scatterDist + s.y.position,
          (activeIdx === idx ? activeZ : idleZ + s.lift * 0.35) + s.dir.z * scatterDist * 0.65
        );
        s.mesh.rotation.set(
          s.spin.x * shatter + s.lift * -0.05 * pointer.y + s.y.position * -0.06,
          s.spin.y * shatter + s.lift * 0.06 * pointer.x + s.x.position * 0.06,
          s.spin.z * shatter + s.x.position * 0.025
        );
        s.mat.emissiveIntensity = (imageLoaded ? 0.94 : 0.05) * (1 - shatter * 0.45) + s.lift * 0.08;
      });

      const copyEl = copyWrapRef.current;
      if (copyEl) {
        copyEl.style.transform = `perspective(1400px) rotateX(${(-rot.x * 180) / Math.PI}deg) rotateY(${(rot.y * 180) / Math.PI}deg) translate3d(${-shatter * 140}px, ${-shatter * 60}px, ${shatter * 80}px)`;
        copyEl.style.opacity = String(Math.max(0, 1 - shatter * 1.2));
      }

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      onUp();
      section.removeEventListener('pointerdown', onDown);
      section.removeEventListener('pointerup', onUp);
      section.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
      if (intactMesh) {
        intactMesh.geometry.dispose();
        intactMesh.children.forEach((child) => {
          if (child instanceof THREE.LineSegments) child.geometry.dispose();
        });
      }
      intactMat.dispose();
      outerEdgeMat.dispose();
      shards.forEach((s) => {
        s.mesh.geometry.dispose();
        s.edge.geometry.dispose();
        s.mat.dispose();
      });
      baseMat.dispose();
      edgeMat.dispose();
      fallbackTex.dispose();
      if (compositeTex !== fallbackTex) compositeTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [webglReady]);

  const useFallback = webglReady === false;

  return (
    <div id="hero" className="w-full flex flex-col overflow-hidden">
      <section
        ref={sectionRef}
        className="relative w-full h-[100svh] min-h-[640px] overflow-hidden"
        style={{ touchAction: 'pan-y' }}
      >
        {useFallback && (
          <div
            className="absolute rounded-[28px] overflow-hidden border border-white/10"
            style={
              isMobile
                ? {
                    left: 'clamp(16px, 5%, 22px)',
                    right: 'clamp(16px, 5%, 22px)',
                    top: 'max(8.5%, 76px)',
                    height: '42%',
                  }
                : {
                    left: '5.5%',
                    right: '5.5%',
                    top: 'max(8.5%, 92px)',
                    bottom: '8.5%',
                  }
            }
          >
            <img
              src={PROFILE.profileImage}
              alt={`${PROFILE.fullName} — ${PROFILE.roleTitle}`}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07070a]/95 via-[#07070a]/55 to-transparent" />
          </div>
        )}

        {/* Three.js 3D Shattering Glass Portrait Canvas */}
        <div
          ref={canvasHostRef}
          className="absolute inset-0 touch-pan-y"
          aria-hidden="true"
        />

        {/* Hero Typography Overlay: First Name -> Associate Software Engineer -> Bio -> CTAs -> Social Icons at bottom */}
        <div
          ref={copyWrapRef}
          className="absolute flex items-center max-md:items-end will-change-transform pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto"
          style={
            useFallback
              ? isMobile
                ? {
                    left: '4%',
                    right: '4%',
                    top: 'calc(max(8.5%, 76px) + 42% + 12px)',
                    bottom: '2%',
                  }
                : {
                    left: '5.5%',
                    right: '5.5%',
                    top: 'max(8.5%, 92px)',
                    bottom: '8.5%',
                  }
              : { transformOrigin: '50% 50%' }
          }
        >
          <div className="pl-[4%] sm:pl-[5%] pr-4 sm:pr-6 max-w-[min(42rem,96%)] max-md:max-w-full max-md:px-3 max-md:pb-2 max-md:w-full max-md:rounded-3xl max-md:bg-gradient-to-t max-md:from-[#07070a]/95 max-md:via-[#07070a]/80 max-md:to-transparent max-md:pt-4">
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* 1. Name First */}
              <span className="text-[#ff2a3b] font-bold uppercase text-[11px] sm:text-xs md:text-sm tracking-[0.25em]">
                {PROFILE.greeting}
              </span>

              <h1 className="text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.88] uppercase drop-shadow-md">
                {PROFILE.fullName}
              </h1>

              {/* 2. Associate Software Engineer underneath */}
              <div className="text-[#ff334b] font-extrabold text-sm sm:text-base md:text-lg lg:text-xl uppercase tracking-wider mt-0.5">
                {PROFILE.roleTitle}
              </div>

              {/* 3. Bio & Primary CTA */}
              <p className="text-gray-300 text-xs sm:text-sm md:text-base font-normal leading-relaxed max-w-xl mt-1">
                {PROFILE.heroBio}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-4">
                <a
                  href="#projects"
                  className="glass-red inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 sm:px-7 sm:py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider text-white whitespace-nowrap shrink-0 hover:-translate-y-0.5"
                >
                  Explore My Work
                </a>
              </div>

              {/* 4. Social Icons at Bottom */}
              <div className="flex flex-wrap items-center gap-2.5 mt-3">
                <a
                  href={PROFILE.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
                <a
                  href={PROFILE.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:text-white"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href={PROFILE.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:text-white"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href={PROFILE.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href={`mailto:${PROFILE.email}`}
                  aria-label="Email"
                  className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
