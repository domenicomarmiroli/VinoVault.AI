import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LocationLayout, Wine } from '../types';
import { computeOccupancy, slotKey } from '../services/cellarLayout';
import { classifyWineType, WineColorCategory } from '../services/wineTypeClassifier';

export type PickInfo =
  | { type: 'bottle'; wine: Wine; column: number; shelf: number; position: number; approximate: boolean; slotIndex: number }
  | { type: 'slot'; column: number; shelf: number; position: number }
  | { type: 'shelf'; column: number; shelf: number };

export type Cellar3DInteraction = 'view' | 'place-slot' | 'place-shelf' | 'preview';

interface Cellar3DProps {
  kind: 'rack' | 'fridge';
  layout: LocationLayout;
  wines: Wine[];
  interaction: Cellar3DInteraction;
  highlightWineId?: string | null;
  onPick?: (info: PickInfo) => void;
  onHover?: (info: PickInfo | null) => void;
  className?: string;
  autoRotate?: boolean;
}

const SLOT_W = 1.0;
const BOTTLE_R = 0.38;
const SHELF_H = 1.05;
const BOARD_T = 0.08;
const DEPTH = 3.2;
const BOTTLE_LEN = 2.65;

interface Metrics {
  colX: number[];
  colW: number[];
  offsetX: number;
  totalW: number;
  baseY: number;
  pad: number;
  post: number;
  maxH: number;
}

const computeMetrics = (kind: 'rack' | 'fridge', layout: LocationLayout): Metrics => {
  const pad = kind === 'fridge' ? 0.25 : 0.1;
  const post = kind === 'fridge' ? 0.12 : 0.18;
  const baseY = kind === 'fridge' ? 0.9 : 0.25;
  const colX: number[] = [];
  const colW: number[] = [];
  let x = post;
  layout.columns.forEach(c => {
    colX.push(x + pad);
    const w = c.bottlesPerShelf * SLOT_W;
    colW.push(w);
    x += w + pad * 2 + post;
  });
  const maxH = Math.max(...layout.columns.map(c => c.shelves * SHELF_H + BOARD_T));
  return { colX, colW, offsetX: -x / 2, totalW: x, baseY, pad, post, maxH };
};

const boardY = (m: Metrics, shelf: number) => m.baseY + shelf * SHELF_H;
const slotCenter = (m: Metrics, column: number, shelf: number, position: number) =>
  new THREE.Vector3(m.offsetX + m.colX[column] + (position + 0.5) * SLOT_W, boardY(m, shelf) + BOARD_T + BOTTLE_R + 0.02, 0);

const GLASS: Record<WineColorCategory, { glass: string; cap: string }> = {
  red: { glass: '#2b0d12', cap: '#7f1d1d' },
  white: { glass: '#7c8a3e', cap: '#d4af37' },
  rose: { glass: '#e7a3b4', cap: '#be185d' },
  sparkling: { glass: '#1d3a28', cap: '#caa53a' },
  dessert: { glass: '#8a5a1c', cap: '#92400e' },
  other: { glass: '#374151', cap: '#6b7280' },
};

const makeWoodTexture = (base: string, grain: string) => {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = grain;
    g.globalAlpha = 0.08 + Math.random() * 0.18;
    g.lineWidth = 0.5 + Math.random() * 2;
    const y = Math.random() * 256;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x / 30 + i) * 3);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const makeDisplayTexture = (text: string) => {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = '#05070a'; g.fillRect(0, 0, 256, 96);
  g.fillStyle = '#7dd3fc';
  g.font = 'bold 56px monospace';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const createBottleGeometries = () => {
  const pts = [
    [0, 0], [BOTTLE_R * 0.92, 0], [BOTTLE_R, 0.06], [BOTTLE_R, 1.7], [BOTTLE_R * 0.92, 1.85],
    [BOTTLE_R * 0.55, 2.0], [0.14, 2.12], [0.13, 2.5], [0.15, 2.52], [0.15, BOTTLE_LEN], [0, BOTTLE_LEN],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.LatheGeometry(pts, 28);
  body.rotateX(Math.PI / 2);
  body.translate(0, 0, -DEPTH / 2 + 0.2);
  const cap = new THREE.CylinderGeometry(0.155, 0.155, 0.42, 20);
  cap.rotateX(Math.PI / 2);
  cap.translate(0, 0, -DEPTH / 2 + 0.2 + BOTTLE_LEN - 0.2);
  const label = new THREE.CylinderGeometry(BOTTLE_R + 0.005, BOTTLE_R + 0.005, 0.7, 28, 1, true);
  label.rotateX(Math.PI / 2);
  label.translate(0, 0, -DEPTH / 2 + 0.2 + 0.85);
  return { body, cap, label };
};

const Cellar3D: React.FC<Cellar3DProps> = ({ kind, layout, wines, interaction, highlightWineId, onPick, onHover, className, autoRotate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ onPick, onHover, interaction, autoRotate });
  propsRef.current = { onPick, onHover, interaction, autoRotate };

  const engine = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    structure: THREE.Group;
    content: THREE.Group;
    shared: ReturnType<typeof createBottleGeometries>;
    pickables: THREE.Object3D[];
    slotLookup: { column: number; shelf: number; position: number }[];
    slotMesh: THREE.InstancedMesh | null;
    hovered: THREE.Object3D | null;
    hoveredInstance: number | null;
    highlighted: THREE.Mesh[];
    intro: { from: THREE.Vector3; to: THREE.Vector3; t: number } | null;
    disposables: { dispose: () => void }[];
    contentDisposables: { dispose: () => void }[];
  } | null>(null);

  // Inizializzazione motore 3D (una sola volta)
  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 500);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.screenSpacePanning = true;
    controls.autoRotateSpeed = 0.7;
    // la rotazione automatica si ferma per sempre appena l'utente interagisce
    let userTookControl = false;
    controls.addEventListener('start', () => { userTookControl = true; });

    scene.add(new THREE.HemisphereLight(0xfff7ed, 0x44403c, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7);
    sun.position.set(10, 18, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    scene.add(sun.target);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.22 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const structure = new THREE.Group();
    const content = new THREE.Group();
    scene.add(structure, content);

    const e = {
      renderer, scene, camera, controls, structure, content,
      shared: createBottleGeometries(),
      pickables: [] as THREE.Object3D[], slotLookup: [] as { column: number; shelf: number; position: number }[], slotMesh: null as THREE.InstancedMesh | null,
      hovered: null as THREE.Object3D | null, hoveredInstance: null as number | null, highlighted: [] as THREE.Mesh[],
      intro: null as { from: THREE.Vector3; to: THREE.Vector3; t: number } | null,
      disposables: [] as { dispose: () => void }[], contentDisposables: [] as { dispose: () => void }[],
    };
    engine.current = e;

    // Ombre: adatta il frustum della luce alla scena
    (scene as any).__sun = sun;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const pick = (clientX: number, clientY: number): { info: PickInfo; object: THREE.Object3D; instanceId?: number } | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(e.pickables, false);
      for (const hit of hits) {
        const data = hit.object.userData;
        if (data.kind === 'slot' && hit.instanceId !== undefined) {
          const s = e.slotLookup[hit.instanceId];
          if (s) return { info: { type: 'slot', ...s }, object: hit.object, instanceId: hit.instanceId };
        }
        if (data.kind === 'bottle') return { info: data.info as PickInfo, object: hit.object };
        if (data.kind === 'shelf') return { info: { type: 'shelf', column: data.column, shelf: data.shelf }, object: hit.object };
      }
      return null;
    };

    const setHover = (res: ReturnType<typeof pick>) => {
      // reset precedente
      if (e.hovered && e.hovered.userData.kind === 'shelf') {
        ((e.hovered as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.0;
      }
      if (e.hovered && e.hovered.userData.kind === 'bottle') {
        const group = e.hovered.userData.group as THREE.Object3D;
        group.position.y = group.userData.baseY;
      }
      if (e.slotMesh && e.hoveredInstance !== null) {
        e.slotMesh.setColorAt(e.hoveredInstance, new THREE.Color('#10b981'));
        if (e.slotMesh.instanceColor) e.slotMesh.instanceColor.needsUpdate = true;
      }
      e.hovered = res ? res.object : null;
      e.hoveredInstance = res?.instanceId ?? null;
      if (res?.object.userData.kind === 'shelf') ((res.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.28;
      if (res?.object.userData.kind === 'bottle') {
        const group = res.object.userData.group as THREE.Object3D;
        group.position.y = group.userData.baseY + 0.08;
      }
      if (e.slotMesh && res?.instanceId !== undefined) {
        e.slotMesh.setColorAt(res.instanceId, new THREE.Color('#fde047'));
        if (e.slotMesh.instanceColor) e.slotMesh.instanceColor.needsUpdate = true;
      }
      renderer.domElement.style.cursor = res ? 'pointer' : 'grab';
      propsRef.current.onHover?.(res ? res.info : null);
    };

    let down: { x: number; y: number } | null = null;
    const onDown = (ev: PointerEvent) => { down = { x: ev.clientX, y: ev.clientY }; };
    const onUp = (ev: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y);
      down = null;
      if (moved > 6 || propsRef.current.interaction === 'preview') return;
      const res = pick(ev.clientX, ev.clientY);
      if (res) propsRef.current.onPick?.(res.info);
    };
    const onMove = (ev: PointerEvent) => {
      if (propsRef.current.interaction === 'preview' || ev.buttons) return;
      setHover(pick(ev.clientX, ev.clientY));
    };
    const onLeave = () => setHover(null);
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerleave', onLeave);

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth, h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    let raf = 0;
    const clock = new THREE.Clock();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = clock.getDelta();
      if (e.intro) {
        e.intro.t = Math.min(1, e.intro.t + dt / 1.3);
        const k = 1 - Math.pow(1 - e.intro.t, 3);
        camera.position.lerpVectors(e.intro.from, e.intro.to, k);
        if (e.intro.t >= 1) e.intro = null;
      }
      const pulse = 0.35 + Math.sin(clock.elapsedTime * 4) * 0.25;
      e.highlighted.forEach(m => { (m.material as THREE.MeshPhysicalMaterial).emissiveIntensity = pulse; });
      controls.autoRotate = !!propsRef.current.autoRotate && !userTookControl && !e.intro;
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      e.disposables.forEach(d => d.dispose());
      e.contentDisposables.forEach(d => d.dispose());
      Object.values(e.shared).forEach(g => g.dispose());
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      engine.current = null;
    };
  }, []);

  // Struttura (scaffale o cantinetta)
  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    e.disposables.forEach(d => d.dispose());
    e.disposables = [];
    e.structure.clear();
    const track = <T extends { dispose: () => void }>(x: T) => { e.disposables.push(x); return x; };
    const m = computeMetrics(kind, layout);
    const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, cast = true) => {
      const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      e.structure.add(mesh);
      return mesh;
    };

    const woodTex = track(makeWoodTexture('#a8743f', '#4a2c14'));
    woodTex.repeat.set(2, 1);
    const darkWoodTex = track(makeWoodTexture('#6b4423', '#2b170a'));
    const wood = track(new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.72 }));
    const darkWood = track(new THREE.MeshStandardMaterial({ map: darkWoodTex, roughness: 0.8 }));

    if (kind === 'rack') {
      const heights = layout.columns.map(c => c.shelves * SHELF_H + BOARD_T);
      // fianchi tra le colonne, alti quanto la colonna più alta adiacente
      for (let i = 0; i <= layout.columns.length; i++) {
        const h = Math.max(heights[i - 1] || 0, heights[i] || 0) + 0.12;
        const x = i === 0 ? m.offsetX + m.post / 2 : m.offsetX + m.colX[i - 1] + m.colW[i - 1] + m.pad + m.post / 2;
        box(m.post, h, DEPTH, darkWood, x, m.baseY + h / 2, 0);
      }
      layout.columns.forEach((c, ci) => {
        const w = m.colW[ci] + m.pad * 2;
        const cx = m.offsetX + m.colX[ci] + m.colW[ci] / 2;
        for (let s = 0; s <= c.shelves; s++) {
          box(w, BOARD_T, DEPTH, wood, cx, boardY(m, s) + BOARD_T / 2, 0);
          if (s < c.shelves) {
            // culla frontale e posteriore per le bottiglie
            [DEPTH / 2 - 0.12, -DEPTH / 2 + 0.25].forEach(z => {
              const rod = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.05, w, 10)), darkWood);
              rod.rotation.z = Math.PI / 2;
              rod.position.set(cx, boardY(m, s) + BOARD_T + 0.05, z);
              rod.castShadow = true;
              e.structure.add(rod);
            });
          }
        }
      });
      box(m.totalW, m.baseY, DEPTH, darkWood, 0, m.baseY / 2, 0);
    } else {
      const c = layout.columns[0];
      const innerW = m.colW[0] + m.pad * 2;
      const W = innerW + m.post * 2;
      const H = m.baseY + c.shelves * SHELF_H + 0.55;
      const D = DEPTH + 0.3;
      const zBack = -D / 2;
      const metal = track(new THREE.MeshStandardMaterial({ color: '#1c1c20', metalness: 0.65, roughness: 0.32 }));
      const inner = track(new THREE.MeshStandardMaterial({ color: '#2a2a31', metalness: 0.2, roughness: 0.6, side: THREE.DoubleSide }));
      const chrome = track(new THREE.MeshStandardMaterial({ color: '#d4d4d8', metalness: 0.95, roughness: 0.22 }));
      const steel = track(new THREE.MeshStandardMaterial({ color: '#a1a1aa', metalness: 0.9, roughness: 0.3 }));
      const yOff = 0.12;
      box(m.post, H, D, metal, -W / 2 + m.post / 2, yOff + H / 2, 0);
      box(m.post, H, D, metal, W / 2 - m.post / 2, yOff + H / 2, 0);
      box(W, m.post, D, metal, 0, yOff + H - m.post / 2, 0);
      box(W, m.post, D, metal, 0, yOff + m.post / 2, 0);
      box(W, H, m.post, inner, 0, yOff + H / 2, zBack + m.post / 2);
      // zona compressore con griglia
      box(innerW, m.baseY - m.post, 0.05, metal, 0, yOff + m.post + (m.baseY - m.post) / 2, D / 2 - 0.03);
      for (let i = 0; i < 5; i++) box(innerW * 0.8, 0.04, 0.06, steel, 0, yOff + 0.25 + i * 0.12, D / 2 + 0.01, false);
      // piedini
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
        const foot = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.1, yOff, 12)), steel);
        foot.position.set(sx * (W / 2 - 0.25), yOff / 2, sz * (D / 2 - 0.25));
        e.structure.add(foot);
      });
      // ripiani cromati con bordo in legno
      for (let s = 0; s < c.shelves; s++) {
        const y = boardY(m, s) + yOff - 0.1;
        for (let r = 0; r < 7; r++) {
          const rod = new THREE.Mesh(track(new THREE.CylinderGeometry(0.025, 0.025, innerW, 8)), chrome);
          rod.rotation.z = Math.PI / 2;
          rod.position.set(0, y + BOARD_T, -DEPTH / 2 + 0.2 + r * ((DEPTH - 0.4) / 6));
          e.structure.add(rod);
        }
        box(innerW, 0.16, 0.08, wood, 0, y + BOARD_T + 0.02, DEPTH / 2 - 0.02);
      }
      // striscia LED e luce interna
      const led = new THREE.Mesh(track(new THREE.BoxGeometry(innerW * 0.9, 0.04, 0.08)), track(new THREE.MeshStandardMaterial({ color: '#e0f2fe', emissive: '#bae6fd', emissiveIntensity: 2.5 })));
      led.position.set(0, yOff + H - m.post - 0.05, DEPTH / 2 - 0.4);
      e.structure.add(led);
      const light = new THREE.PointLight(0xdbeafe, 9, H * 1.6, 1.6);
      light.position.set(0, yOff + H - 0.6, DEPTH / 2 - 0.6);
      e.structure.add(light);
      // display temperatura
      const disp = new THREE.Mesh(track(new THREE.PlaneGeometry(0.9, 0.34)), track(new THREE.MeshBasicMaterial({ map: track(makeDisplayTexture('12°C')) })));
      disp.position.set(0, yOff + H - m.post / 2, D / 2 + 0.006);
      e.structure.add(disp);
      // porta in vetro aperta
      const door = new THREE.Group();
      door.position.set(-W / 2, yOff, D / 2);
      const glass = track(new THREE.MeshPhysicalMaterial({ color: '#c7d2fe', transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide }));
      const frame = 0.12;
      const pane = new THREE.Mesh(track(new THREE.BoxGeometry(W - frame * 2, H - frame * 2, 0.04)), glass);
      pane.position.set(W / 2, H / 2, 0.03);
      door.add(pane);
      [[W / 2, frame / 2, W, frame], [W / 2, H - frame / 2, W, frame], [frame / 2, H / 2, frame, H], [W - frame / 2, H / 2, frame, H]].forEach(([x, y, w, h]) => {
        const f = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, 0.08)), metal);
        f.position.set(x, y, 0.03);
        f.castShadow = true;
        door.add(f);
      });
      const handle = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.035, H * 0.45, 12)), steel);
      handle.position.set(W - 0.3, H / 2, 0.18);
      door.add(handle);
      door.rotation.y = -1.95;
      e.structure.add(door);
    }

    // inquadratura
    const bbox = new THREE.Box3().setFromObject(e.structure);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    const fov = (e.camera.fov * Math.PI) / 180;
    const fitH = size.y / 2 / Math.tan(fov / 2);
    const fitW = size.x / 2 / Math.tan(fov / 2) / Math.max(0.5, e.camera.aspect);
    const dist = Math.max(fitH, fitW) * 1.15 + size.z;
    const to = new THREE.Vector3(center.x + dist * 0.32, center.y + dist * 0.18, center.z + dist);
    e.controls.target.copy(center);
    e.controls.minDistance = Math.max(3, dist * 0.15);
    e.controls.maxDistance = dist * 2.5;
    const firstFit = !(e as any).fitted;
    (e as any).fitted = true;
    e.intro = { from: firstFit ? to.clone().multiplyScalar(1.6).setY(to.y * 1.8) : e.camera.position.clone(), to, t: 0 };
    if (firstFit) e.camera.position.copy(e.intro.from);
    const sun = (e.scene as any).__sun as THREE.DirectionalLight;
    const r = Math.max(size.x, size.y, size.z);
    sun.target.position.copy(center);
    sun.position.set(center.x + r * 0.6, center.y + r * 1.2, center.z + r);
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 0.5, far: r * 4 });
    sun.shadow.camera.updateProjectionMatrix();
  }, [kind, layout]);

  // Bottiglie, posti liberi e ripiani selezionabili
  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    e.contentDisposables.forEach(d => d.dispose());
    e.contentDisposables = [];
    e.content.clear();
    e.pickables = [];
    e.slotLookup = [];
    e.slotMesh = null;
    e.hovered = null;
    e.hoveredInstance = null;
    e.highlighted = [];
    const track = <T extends { dispose: () => void }>(x: T) => { e.contentDisposables.push(x); return x; };
    const m = computeMetrics(kind, layout);
    const yOff = kind === 'fridge' ? 0.12 : 0;
    const { placed, taken } = computeOccupancy(layout, wines);

    const materials = new Map<string, { glass: THREE.MeshPhysicalMaterial; cap: THREE.MeshStandardMaterial }>();
    const labelMat = track(new THREE.MeshStandardMaterial({ color: '#f5f0e6', roughness: 0.9 }));
    const getMats = (cat: WineColorCategory, approximate: boolean, highlight: boolean) => {
      const key = `${cat}-${approximate}-${highlight}`;
      if (!materials.has(key)) {
        const glass = track(new THREE.MeshPhysicalMaterial({
          color: GLASS[cat].glass, roughness: 0.12, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.1,
          transparent: approximate, opacity: approximate ? 0.5 : 1,
          emissive: highlight ? new THREE.Color('#f0abfc') : new THREE.Color('#000000'), emissiveIntensity: highlight ? 0.5 : 0,
        }));
        const cap = track(new THREE.MeshStandardMaterial({ color: GLASS[cat].cap, metalness: 0.7, roughness: 0.3, transparent: approximate, opacity: approximate ? 0.5 : 1 }));
        materials.set(key, { glass, cap });
      }
      return materials.get(key)!;
    };

    placed.forEach(p => {
      const cat = classifyWineType(p.wine.type);
      const highlight = !!highlightWineId && p.wine.id === highlightWineId;
      const mats = getMats(cat, p.approximate, highlight);
      const group = new THREE.Group();
      const pos = slotCenter(m, p.column, p.shelf, p.position);
      group.position.set(pos.x, pos.y + yOff, 0);
      group.userData.baseY = pos.y + yOff;
      const info: PickInfo = { type: 'bottle', wine: p.wine, column: p.column, shelf: p.shelf, position: p.position, approximate: p.approximate, slotIndex: p.slotIndex };
      const body = new THREE.Mesh(e.shared.body, mats.glass);
      const cap = new THREE.Mesh(e.shared.cap, mats.cap);
      const label = new THREE.Mesh(e.shared.label, labelMat);
      [body, cap, label].forEach(mesh => {
        mesh.castShadow = true;
        mesh.userData = { kind: 'bottle', info, group };
        group.add(mesh);
      });
      if (highlight) e.highlighted.push(body);
      e.content.add(group);
      if (interaction !== 'preview') e.pickables.push(body, cap, label);
    });

    if (interaction === 'place-slot') {
      const free: { column: number; shelf: number; position: number }[] = [];
      layout.columns.forEach((c, ci) => {
        for (let s = 0; s < c.shelves; s++) for (let p = 0; p < c.bottlesPerShelf; p++) {
          if (!taken.has(slotKey(ci, s, p))) free.push({ column: ci, shelf: s, position: p });
        }
      });
      if (free.length) {
        const geo = track(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 20));
        geo.rotateX(Math.PI / 2);
        const mat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, emissive: '#10b981', emissiveIntensity: 0.35 }));
        const inst = new THREE.InstancedMesh(geo, mat, free.length);
        const dummy = new THREE.Object3D();
        free.forEach((f, i) => {
          const pos = slotCenter(m, f.column, f.shelf, f.position);
          dummy.position.set(pos.x, pos.y + yOff, DEPTH / 2 - 0.35);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
          inst.setColorAt(i, new THREE.Color('#10b981'));
        });
        inst.userData.kind = 'slot';
        e.slotLookup = free;
        e.slotMesh = inst;
        e.content.add(inst);
        e.pickables.push(inst);
      }
    }

    if (interaction === 'place-shelf') {
      layout.columns.forEach((c, ci) => {
        for (let s = 0; s < c.shelves; s++) {
          const mat = track(new THREE.MeshBasicMaterial({ color: '#10b981', transparent: true, opacity: 0, depthWrite: false }));
          const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(m.colW[ci], SHELF_H - BOARD_T - 0.04, DEPTH * 0.98)), mat);
          mesh.position.set(m.offsetX + m.colX[ci] + m.colW[ci] / 2, boardY(m, s) + BOARD_T + (SHELF_H - BOARD_T) / 2 + yOff, 0);
          mesh.userData = { kind: 'shelf', column: ci, shelf: s };
          e.content.add(mesh);
          e.pickables.push(mesh);
        }
      });
    }
  }, [kind, layout, wines, interaction, highlightWineId]);

  return <div ref={mountRef} className={className || 'w-full h-full'} />;
};

export default Cellar3D;
