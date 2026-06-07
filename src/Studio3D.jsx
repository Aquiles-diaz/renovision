/* ============ reno · vision — STUDIO 3D ============ */
import React, { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RenoNav } from "./Nav.jsx";
import {
  LINES,
  MELAMINAS,
  LEGS,
  FURNITURE,
  furnitureForRoom,
  melaminaById,
  baysForWidth,
  computeQuote,
  fmtAR,
} from "./data.jsx";
import { sendQuote } from "./sendQuote.js";

/* --- simple line icons (rectangles/lines only) --- */
export function FIcon({ type }) {
  const s = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
  };
  const M = {
    rack: (
      <g>
        <rect x="2" y="9" width="20" height="8" rx="1" />
        <line x1="9" y1="9" x2="9" y2="17" />
        <line x1="15" y1="9" x2="15" y2="17" />
      </g>
    ),
    sideboard: (
      <g>
        <rect x="2.5" y="7" width="19" height="11" rx="1" />
        <line x1="12" y1="7" x2="12" y2="18" />
        <circle cx="9.5" cy="12.5" r=".6" fill="currentColor" />
        <circle cx="14.5" cy="12.5" r=".6" fill="currentColor" />
      </g>
    ),
    shelf: (
      <g>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
      </g>
    ),
    wardrobe: (
      <g>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <circle cx="10.5" cy="12" r=".7" fill="currentColor" />
        <circle cx="13.5" cy="12" r=".7" fill="currentColor" />
      </g>
    ),
    nightstand: (
      <g>
        <rect x="5" y="7" width="14" height="9" rx="1" />
        <line x1="5" y1="11" x2="19" y2="11" />
        <line x1="7.5" y1="16" x2="7.5" y2="19" />
        <line x1="16.5" y1="16" x2="16.5" y2="19" />
      </g>
    ),
    drawers: (
      <g>
        <rect x="5" y="4" width="14" height="16" rx="1" />
        <line x1="5" y1="9.3" x2="19" y2="9.3" />
        <line x1="5" y1="14.6" x2="19" y2="14.6" />
      </g>
    ),
  };
  return <svg {...s}>{M[type] || M.rack}</svg>;
}

/* ---------- TEXTURAS DE MELAMINA (cacheadas) ---------- */
const _texLoader = new THREE.TextureLoader();
const _texCache = {};
function getMelaminaTexture(url) {
  if (!url) return null;
  if (!_texCache[url]) {
    const t = _texLoader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 1);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    _texCache[url] = t;
  }
  return _texCache[url];
}
function loadMelaminaTexture(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    if (_texCache[url] && _texCache[url].image) return resolve(_texCache[url]);
    _texLoader.load(
      url,
      (t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.anisotropy = 8;
        t.colorSpace = THREE.SRGBColorSpace;
        _texCache[url] = t;
        resolve(t);
      },
      undefined,
      () => resolve(null),
    );
  });
}

/* ---------- CONSTRUCCIÓN DEL MUEBLE (compartida 3D + AR) ---------- */
function buildFurnitureGroup({ furniture, width, bays, melamina, legId }) {
  const group = new THREE.Group();
  const w = width / 1000,
    h = furniture.alto / 1000,
    d = furniture.prof / 1000;
  const leg = LEGS.find((l) => l.id === legId) || LEGS[0];
  const legH = leg.h;
  const col = new THREE.Color(melamina.hex);
  const tex = getMelaminaTexture(melamina.img);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: tex ? 0xffffff : col,
    map: tex || null,
    roughness: 0.62,
    metalness: 0.04,
  });
  const darker = col.clone().multiplyScalar(0.8);
  const edgeMat = new THREE.LineBasicMaterial({ color: darker });
  const innerMat = new THREE.MeshStandardMaterial({
    color: col.clone().multiplyScalar(0.86),
    map: tex || null,
    roughness: 0.7,
  });

  const addBox = (bw, bh, bd, x, y, z, mat) => {
    const g = new THREE.BoxGeometry(bw, bh, bd);
    const m = new THREE.Mesh(g, mat || bodyMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat);
    e.position.set(x, y, z);
    group.add(e);
    return m;
  };

  const yBase = legH;
  const cy = yBase + h / 2;
  const t = 0.018;

  // main body shell
  addBox(w, h, d, 0, cy, 0);

  // cuerpos (bahías de 900 mm) — divisores verticales
  const nBays = Math.max(1, bays);
  for (let i = 1; i < nBays; i++) {
    const x = -w / 2 + (w / nBays) * i;
    addBox(t, h - 0.01, d - 0.01, x, cy, 0, innerMat);
  }

  // back panel
  addBox(w - 0.01, h - 0.01, t, 0, cy, -d / 2 + t / 2, innerMat);

  const kind = furniture.kind;
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.4,
    metalness: 0.5,
  });

  if (kind === "drawers") {
    const rows = 2;
    for (let b = 0; b < nBays; b++) {
      const cx = -w / 2 + (w / nBays) * (b + 0.5);
      for (let r = 1; r <= rows; r++) {
        const y = yBase + (h * r) / (rows + 1);
        addBox(w / nBays - 0.03, t, d - 0.02, cx, y, 0, innerMat);
      }
      addBox((w / nBays) * 0.4, 0.012, 0.02, cx, cy, d / 2, handleMat);
    }
  } else {
    const shelfCount = Math.max(2, Math.round(h / 0.4));
    for (let s = 1; s <= shelfCount; s++) {
      const y = yBase + (h * s) / (shelfCount + 1);
      addBox(w - 0.012, t, d - 0.02, 0, y, 0, innerMat);
    }
    for (let i = 0; i < nBays; i++) {
      const x = -w / 2 + (w / nBays) * (i + 0.5);
      addBox(0.012, 0.14, 0.02, x + (w / nBays) * 0.32, cy, d / 2, handleMat);
    }
    if (kind === "doors-drawer") {
      const dy = yBase + h * 0.12;
      addBox(w - 0.012, t, d - 0.02, 0, yBase + h * 0.22, 0, innerMat);
      addBox(w * 0.28, 0.012, 0.02, 0, dy, d / 2, handleMat);
    }
    if (kind === "doors-glasstop") {
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xbfd0d4,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.35,
      });
      addBox(w - 0.01, 0.012, d - 0.01, 0, yBase + h + 0.006, 0, glassMat);
    }
  }

  // legs
  if (leg.h > 0) {
    const legMat =
      leg.id === "metalicas"
        ? new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.35,
            metalness: 0.7,
          })
        : new THREE.MeshStandardMaterial({ color: darker, roughness: 0.6 });
    const lp = [
      [-w / 2 + 0.07, -d / 2 + 0.07],
      [w / 2 - 0.07, -d / 2 + 0.07],
      [-w / 2 + 0.07, d / 2 - 0.07],
      [w / 2 - 0.07, d / 2 - 0.07],
    ];
    lp.forEach(([lx, lz]) => {
      let lg;
      if (leg.id === "conicas") lg = new THREE.CylinderGeometry(0.012, 0.022, legH, 16);
      else if (leg.id === "metalicas") lg = new THREE.CylinderGeometry(0.01, 0.01, legH, 12);
      else lg = new THREE.BoxGeometry(0.04, legH, 0.04);
      const m = new THREE.Mesh(lg, legMat);
      m.position.set(lx, legH / 2, lz);
      m.castShadow = true;
      group.add(m);
    });
  }

  return group;
}

/* ---------------- THREE.JS VIEWER ---------------- */
function Viewer3D({ furniture, width, bays, melamina, legId, zoomSignal }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const fitRef = useRef(null);

  // init once
  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth,
      H = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0a09");

    const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 100);
    camera.position.set(2.4, 1.7, 3.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.2;
    controls.maxDistance = 9;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.enablePan = false;
    controls.target.set(0, 0.5, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;

    const amb = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(3.5, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe23a2b, 0.35);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-3, 3, 4);
    scene.add(fill);

    const floorMat = new THREE.ShadowMaterial({ opacity: 0.34 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(30, 60, 0x222220, 0x161614);
    grid.position.y = 0.001;
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth,
        h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const stopAuto = () => {
      controls.autoRotate = false;
    };
    renderer.domElement.addEventListener("pointerdown", stopAuto);

    stateRef.current = { scene, camera, renderer, controls, group, raf, mount, onResize, ro, stopAuto };
    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", stopAuto);
      renderer.dispose();
      if (renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  // (re)build furniture when params change
  useEffect(() => {
    const st = stateRef.current;
    if (!st || !st.scene) return;
    const { scene, controls, camera } = st;
    scene.remove(st.group);

    const group = buildFurnitureGroup({ furniture, width, bays, melamina, legId });
    scene.add(group);
    st.group = group;

    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    controls.target.copy(center);
    const fov = (camera.fov * Math.PI) / 180;
    const fitH = size.y / 2 / Math.tan(fov / 2);
    const fitW = size.x / 2 / Math.tan(fov / 2) / Math.max(0.5, camera.aspect);
    const dist = Math.max(fitH, fitW) * 1.45 + size.z;
    controls.minDistance = dist * 0.45;
    controls.maxDistance = dist * 3.2;
    if (fitRef.current !== furniture.id) {
      const dir = new THREE.Vector3(0.78, 0.55, 1).normalize();
      camera.position.copy(center).add(dir.multiplyScalar(dist));
      fitRef.current = furniture.id;
    }
    controls.update();
  }, [furniture.id, width, bays, melamina.id, legId]);

  // zoom buttons
  useEffect(() => {
    if (!zoomSignal) return;
    const st = stateRef.current;
    if (!st) return;
    const { camera, controls } = st;
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    const factor = zoomSignal.dir === "in" ? 0.82 : 1.22;
    dir.multiplyScalar(factor);
    const newLen = dir.length();
    if (newLen > controls.minDistance && newLen < controls.maxDistance) {
      camera.position.copy(controls.target).add(dir);
    }
  }, [zoomSignal]);

  return <div ref={mountRef} className="viewer__canvas" />;
}

/* exporta el mueble actual a GLB y devuelve un blob URL para AR */
function exportFurnitureToGLB({ furniture, width, bays, melamina, legId }) {
  return loadMelaminaTexture(melamina.img).then(
    () =>
      new Promise((resolve, reject) => {
        const group = buildFurnitureGroup({ furniture, width, bays, melamina, legId });
        const exporter = new GLTFExporter();
        exporter.parse(
          group,
          (result) => {
            const blob = new Blob([result], { type: "model/gltf-binary" });
            resolve(URL.createObjectURL(blob));
          },
          (err) => reject(err),
          { binary: true },
        );
      }),
  );
}

/* ---------------- STUDIO SCREEN ---------------- */
export function StudioScreen({
  room,
  initialFurnitureId,
  initialWidth,
  initialMatId,
  onConfig,
  onBack,
  onHome,
  onMateriales,
}) {
  const list = useMemo(() => furnitureForRoom(room.id), [room.id]);
  const [furnId, setFurnId] = useState(initialFurnitureId || list[0].id);
  const furniture = useMemo(() => FURNITURE.find((f) => f.id === furnId), [furnId]);

  const validInitW =
    initialWidth && furniture.widths.includes(initialWidth) ? initialWidth : furniture.defW;
  const [lineId, setLineId] = useState("BASE");
  const [width, setWidth] = useState(validInitW);
  const [matId, setMatId] = useState(
    initialMatId && melaminaById(initialMatId).id === initialMatId ? initialMatId : "tribal",
  );
  const [legId, setLegId] = useState("sin");
  const [zoomSignal, setZoomSignal] = useState(null);
  const [showBd, setShowBd] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [arUrl, setArUrl] = useState(null);
  const [arLoading, setArLoading] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- contacto / envío de cotización (EmailJS) ---
  const [contactOpen, setContactOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cMessage, setCMessage] = useState("");
  // "idle" | "sending" | "success" | "error"
  const [sendState, setSendState] = useState("idle");
  // "config" (creds faltantes) | "generic" — distingue el copy del error
  const [errorKind, setErrorKind] = useState("generic");
  const nameInputRef = useRef(null);

  // reset ancho al cambiar de módulo
  useEffect(() => {
    setWidth(furniture.defW);
  }, [furnId]);

  const mat = melaminaById(matId);
  const bays = baysForWidth(furniture, width);
  const quote = useMemo(
    () => computeQuote({ furniture, line: lineId, width, material: matId, legs: legId }),
    [furnId, lineId, width, matId, legId],
  );

  const cfg = furniture.widths.length > 1;
  const renderSrc = furniture.render ? furniture.render[mat.tone] : null;
  useEffect(() => {
    setImgErr(false);
  }, [furnId, mat.tone]);

  // reflejar config en la URL (link compartible)
  useEffect(() => {
    if (onConfig) onConfig({ furnId, width, matId });
  }, [furnId, width, matId, onConfig]);

  const zoom = (dir) => setZoomSignal({ dir, t: Date.now() });

  function openAR() {
    setArLoading(true);
    exportFurnitureToGLB({ furniture, width, bays, melamina: mat, legId })
      .then((url) => {
        setArUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setArLoading(false);
      })
      .catch(() => setArLoading(false));
  }
  function closeAR() {
    setArUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // --- contacto: abrir / cerrar (espejo de openAR/closeAR) ---
  function openContact() {
    setSendState("idle");
    setCName("");
    setCEmail("");
    setCPhone("");
    setCMessage("");
    setContactOpen(true);
  }
  function closeContact() {
    setContactOpen(false);
    setSendState("idle");
  }

  // autofocus en "Nombre" + Esc cierra (paridad con el modal AR; UI-SPEC)
  useEffect(() => {
    if (!contactOpen) return undefined;
    const t = setTimeout(() => nameInputRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === "Escape") closeContact();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [contactOpen]);

  // --- validación (UI-SPEC: discreción de Claude sobre el regex exacto) ---
  const nameValid = cName.trim().length > 0;
  const emailValid = cEmail.trim() === "" ? false : /^\S+@\S+\.\S+$/.test(cEmail.trim());
  const phoneDigits = cPhone.replace(/[\s+\-]/g, "").replace(/\D/g, "");
  const phoneValid = cPhone.trim() === "" ? false : phoneDigits.length >= 8;
  // habilitar envío: nombre válido Y (email válido O teléfono válido)
  const canSend = nameValid && (emailValid || phoneValid);

  async function submitContact(e) {
    if (e) e.preventDefault();
    if (!canSend || sendState === "sending") return;
    setSendState("sending");

    const cap = (s, n) => (s || "").trim().slice(0, n);
    const leg = LEGS.find((l) => l.id === legId);
    const line = LINES.find((l) => l.id === lineId);

    // T-03-02: recortar y limitar longitud; sin construir HTML acá.
    const params = {
      name: cap(cName, 120),
      email: cap(cEmail, 160),
      phone: cap(cPhone, 40),
      message: cap(cMessage, 1000),
      // resumen de configuración
      mueble: furniture.name,
      sala: room.name,
      linea: line ? line.name : lineId,
      ancho: `${width} mm`,
      alto: `${furniture.alto} mm`,
      profundidad: `${furniture.prof} mm`,
      cuerpos: String(quote.bays),
      melamina: `${mat.name} · ${mat.finish}`,
      patas: leg ? leg.name : legId,
      total: fmtAR(quote.total),
      // link compartible — misma fuente que copyLink (D-05); NO se construye uno nuevo
      link: window.location.href,
    };

    try {
      await sendQuote(params);
      setSendState("success");
    } catch (err) {
      setErrorKind(err && err.message === "EMAILJS_NOT_CONFIGURED" ? "config" : "generic");
      setSendState("error"); // los campos NO se limpian: el usuario reintenta sin re-tipear
    }
  }

  async function downloadDoc(kind) {
    if (dlLoading) return;
    setDlLoading(true);
    const leg = LEGS.find((l) => l.id === legId) ?? LEGS[0],
      line = LINES.find((l) => l.id === lineId) ?? LINES[0];
    const rows = quote.breakdown
      .map(
        (b) =>
          `<tr><td>${b.label}</td><td style="text-align:right">${fmtAR(b.value)}</td></tr>`,
      )
      .join("");
    const tech = kind === "tecnico";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>reno · ${tech ? "Ficha Técnica" : "Presupuesto"} · ${furniture.name}</title>
    <style>
      *{margin:0;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
      body{background:#fff;color:#111;padding:54px 60px;max-width:780px;margin:auto}
      .logo{font-weight:800;font-size:34px;letter-spacing:-.03em}
      .acc{color:#e23a2b}
      .tag{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#e23a2b;font-weight:700;margin-top:30px}
      h1{font-size:26px;margin:6px 0 2px;font-weight:800}
      .sub{color:#666;font-size:13px;margin-bottom:26px}
      table{width:100%;border-collapse:collapse;margin:10px 0}
      td,th{padding:9px 4px;border-bottom:1px solid #e7e7e7;font-size:13px}
      th{text-align:left;color:#999;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
      .spec td:first-child{color:#888}
      .total{display:flex;justify-content:space-between;align-items:center;margin-top:22px;padding-top:18px;border-top:2px solid #111}
      .total b{font-size:30px}
      .foot{margin-top:40px;font-size:11px;color:#999;line-height:1.6}
    </style></head><body>
      <div class="logo">reno<span class="acc">.</span></div>
      <div class="tag">${tech ? "Ficha técnica" : "Cotización rápida"}</div>
      <h1>${furniture.name}</h1>
      <div class="sub">${room.name} · ${line.name}${cfg ? "" : " · Medida estándar"}</div>
      <table class="spec">
        <tr><td>Ancho</td><td style="text-align:right">${width} mm</td></tr>
        <tr><td>Alto</td><td style="text-align:right">${furniture.alto} mm</td></tr>
        <tr><td>Profundidad</td><td style="text-align:right">${furniture.prof} mm</td></tr>
        <tr><td>Cuerpos</td><td style="text-align:right">${quote.bays} × ${furniture.bayUnit} mm</td></tr>
        <tr><td>Melamina</td><td style="text-align:right">${mat.name} · ${mat.finish}</td></tr>
        <tr><td>Patas</td><td style="text-align:right">${leg.name} ${leg.spec}</td></tr>
      </table>
      ${tech ? `<table class="spec"><tr><th>Especificaciones</th><th></th></tr>${furniture.specs.map((s) => `<tr><td>•</td><td>${s}</td></tr>`).join("")}</table>` : ""}
      ${tech ? "" : `<table><tr><th>Detalle</th><th style="text-align:right">Importe</th></tr>${rows}</table>`}
      <div class="total"><span>${tech ? "Precio de referencia" : "TOTAL"}</span><b>${fmtAR(quote.total)}</b></div>
      <div class="foot">Documento generado por reno · vision — configurador 3D. Precios de referencia en ARS, sujetos a confirmación. Las medidas pueden ajustarse según relevamiento del ambiente.<br/>reno · 2026</div>
    </body></html>`;
    try {
      // Lazy-load html2pdf so it stays out of the initial bundle (D-03).
      const { default: html2pdf } = await import("html2pdf.js");
      const holder = document.createElement("div");
      holder.innerHTML = html; // reuse the SAME html string built above (D-01)
      await html2pdf()
        .set({
          filename: `reno-${furniture.id}-${tech ? "ficha-tecnica" : "presupuesto"}.pdf`,
        })
        .from(holder)
        .save();
    } catch (err) {
      // A PDF failure must never freeze the button or crash the Studio.
      console.error("downloadDoc: PDF generation failed", err);
    } finally {
      setDlLoading(false);
    }
  }

  return (
    <div className="studio fade-in">
      <RenoNav onHome={onHome} onExplore={onBack} onMateriales={onMateriales} active="studio" />

      {/* LEFT RAIL */}
      <aside className="studio__rail">
        <button className="rail-back" onClick={onBack}>
          ← {room.name}
        </button>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">01</span>
            <span className="rail-sec__title">Línea</span>
          </div>
          {LINES.map((l) => (
            <button
              key={l.id}
              className={"line-opt" + (lineId === l.id ? " is-active" : "")}
              onClick={() => setLineId(l.id)}
            >
              <div className="line-opt__name">{l.name}</div>
              <div className="line-opt__desc">{l.desc}</div>
            </button>
          ))}
        </div>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">02</span>
            <span className="rail-sec__title">Mueble</span>
          </div>
          {list.map((f) => (
            <button
              key={f.id}
              className={"furn-opt" + (furnId === f.id ? " is-active" : "")}
              onClick={() => setFurnId(f.id)}
            >
              <span className="furn-ico">
                <FIcon type={f.icon} />
              </span>
              <span>
                <div className="furn-opt__name">{f.name}</div>
                <div className="furn-opt__meta">
                  {f.widths.length > 1
                    ? `${f.widths.join(" / ")} mm`
                    : `${f.widths[0]} mm · estándar`}
                </div>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* CENTER */}
      <div className="studio__center">
        <div className="viewer">
          <Viewer3D
            furniture={furniture}
            width={width}
            bays={bays}
            melamina={mat}
            legId={legId}
            zoomSignal={zoomSignal}
          />
          <div className="viewer__hint">Arrastrá para rotar · scroll para zoom</div>
          <div className="viewer__actions">
            <button className="ar-btn" onClick={openAR} disabled={arLoading}>
              {arLoading ? "Generando…" : "◉ Ver en tu ambiente (AR)"}
            </button>
            <button className="ar-btn ar-btn--ghost" onClick={copyLink}>
              {copied ? "¡Link copiado!" : "↗ Copiar link"}
            </button>
          </div>
          <div className="viewer__zoom">
            <button className="zbtn" onClick={() => zoom("in")} title="Agrandar">
              +
            </button>
            <button className="zbtn" onClick={() => zoom("out")} title="Achicar">
              −
            </button>
          </div>
          <div className="viewer__dims">
            <span className="dimpill">
              <b>{width}</b> ancho
            </span>
            <span className="dimpill">
              <b>{furniture.alto}</b> alto
            </span>
            <span className="dimpill">
              <b>{furniture.prof}</b> prof
            </span>
            <span className="dimpill">
              <b>{bays}</b> cuerpo{bays > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* RENDER DEL MÓDULO (below 3D) */}
        <div className="render">
          <div className="render__img">
            <div className="render__scrim"></div>
            <div className="render__chip">
              <span className="tag">Render · {mat.tone}</span>
            </div>
            {renderSrc && !imgErr ? (
              <img
                className="render__photo"
                src={renderSrc}
                alt={`${furniture.name} ${mat.tone}`}
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="render__placeholder">
                {furniture.name} · {mat.tone}
                <span>[ falta {renderSrc} ]</span>
              </div>
            )}
          </div>
          <div className="render__side">
            <h4>{furniture.name}</h4>
            <p>
              {furniture.frentes.length} frentes disponibles · alto {furniture.alto} mm · prof{" "}
              {furniture.prof} mm.
            </p>
            <ul className="render__specs">
              {furniture.specs.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* COTIZADOR BAR */}
        <div className="cotizar">
          <div className="cotizar__left">
            <span className="tag">Cotización rápida</span>
            <div className="cotizar__total">
              <span className={"amt" + (quote.fixed ? " is-fixed" : "")}>{fmtAR(quote.total)}</span>
              <button
                className="cotizar__note"
                style={{ textDecoration: "underline", textUnderlineOffset: "3px" }}
                onClick={() => setShowBd((s) => !s)}
              >
                {showBd ? "ocultar detalle" : "ver detalle"}
              </button>
            </div>
            <span className="cotizar__note">
              {quote.fixed
                ? "PRECIO FIJO · MEDIDA ESTÁNDAR"
                : "PRECIO SEGÚN MEDIDAS Y CUERPOS · ARS"}
            </span>
          </div>
          <div className="cotizar__actions">
            <button className="dlbtn" onClick={() => downloadDoc("tecnico")} disabled={dlLoading}>
              ↓ Descargar ficha técnica (PDF)
            </button>
            <button
              className="dlbtn"
              onClick={() => downloadDoc("presupuesto")}
              disabled={dlLoading}
            >
              ↓ Descargar presupuesto (PDF)
            </button>
            <button className="btn btn--red" onClick={openContact}>
              Solicitar cotización →
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT RAIL */}
      <aside className="studio__rail studio__rail--right">
        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">03</span>
            <span className="rail-sec__title">Ancho</span>
          </div>
          <div className="mods">
            {furniture.widths.map((wmm) => (
              <button
                key={wmm}
                className={"mod" + (width === wmm ? " is-active" : "")}
                style={{ flex: 1, minWidth: 0 }}
                onClick={() => setWidth(wmm)}
              >
                {wmm}
              </button>
            ))}
          </div>
          <div className="mods__hint">
            {cfg
              ? `Anchos disponibles en mm · ${bays} cuerpo${bays > 1 ? "s" : ""} de ${furniture.bayUnit} mm`
              : `Ancho fijo ${furniture.widths[0]} mm — medida estándar`}
          </div>
          <div className="ctrl" style={{ marginTop: 10 }}>
            <div className="ctrl__top">
              <span className="ctrl__label">Alto</span>
              <span className="ctrl__val is-locked">{furniture.alto} mm</span>
            </div>
            <div className="ctrl__top" style={{ marginTop: 6 }}>
              <span className="ctrl__label">Prof.</span>
              <span className="ctrl__val is-locked">{furniture.prof} mm</span>
            </div>
            <div className="locked-note">● Alto y profundidad fijos (catálogo EXA)</div>
          </div>
        </div>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">04</span>
            <span className="rail-sec__title">Frentes</span>
          </div>
          <div className="mods__hint" style={{ marginTop: 0 }}>
            {furniture.frentes.map((f, i) => (
              <div key={i} style={{ padding: "3px 0" }}>
                • {f}
              </div>
            ))}
          </div>
        </div>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">05</span>
            <span className="rail-sec__title">Melamina</span>
          </div>
          <div className="swatches">
            {MELAMINAS.map((m) => (
              <button
                key={m.id}
                className={"swatch" + (matId === m.id ? " is-active" : "")}
                style={{ backgroundImage: `url(${m.img})`, backgroundColor: m.hex }}
                title={m.name}
                onClick={() => setMatId(m.id)}
              />
            ))}
          </div>
          <div className="swatch__name">
            <b>{mat.name}</b>
            <span>{mat.finish}</span>
          </div>
        </div>

        <div className="rail-sec">
          <div className="rail-sec__head">
            <span className="num-chip">06</span>
            <span className="rail-sec__title">Patas</span>
          </div>
          <div className="legs">
            {LEGS.map((l) => (
              <button
                key={l.id}
                className={"leg" + (legId === l.id ? " is-active" : "")}
                onClick={() => setLegId(l.id)}
              >
                <div className="leg__name">{l.name}</div>
                <div className="leg__spec">
                  {l.spec}
                  {l.price > 0 ? " · " + fmtAR(l.price) : ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        {showBd && (
          <div className="rail-sec" style={{ marginTop: 6 }}>
            <div className="rail-sec__head">
              <span className="rail-sec__title">Detalle de cotización</span>
            </div>
            {quote.breakdown.map((b, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>{b.label}</span>
                <span className="mono" style={{ color: "#fff" }}>
                  {fmtAR(b.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* AR MODAL */}
      {arUrl && (
        <div className="ar-modal" onClick={closeAR}>
          <div className="ar-modal__box" onClick={(e) => e.stopPropagation()}>
            <button className="ar-modal__close" onClick={closeAR}>
              ✕
            </button>
            <model-viewer
              src={arUrl}
              camera-controls
              auto-rotate
              ar
              ar-modes="webxr scene-viewer quick-look"
              shadow-intensity="1"
              exposure="1.1"
              style={{ width: "100%", height: "100%", background: "#0a0a09" }}
            ></model-viewer>
            <div className="ar-modal__hint">
              {furniture.name} · {mat.name}. Tocá el ícono de AR para verlo a escala real en tu
              ambiente (Android / visores compatibles).
            </div>
          </div>
        </div>
      )}

      {/* CONTACT MODAL — reusa overlay .ar-modal + tokens .ar-modal__box (UI-SPEC / D-06) */}
      {contactOpen && (
        <div className="ar-modal" onClick={closeContact}>
          <div className="contact-modal__box" onClick={(e) => e.stopPropagation()}>
            <button className="ar-modal__close" aria-label="Cerrar" onClick={closeContact}>
              ✕
            </button>

            {sendState === "success" ? (
              <div className="contact-modal__status">
                <h3 className="contact-modal__title">✓ ¡Cotización enviada!</h3>
                <p className="contact-modal__body">
                  Te contactamos pronto. Revisá tu casilla.
                </p>
                <button type="button" className="contact-modal__neutral" onClick={closeContact}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form className="contact-modal__form" onSubmit={submitContact}>
                <h3 className="contact-modal__title">Solicitá tu cotización</h3>
                <p className="contact-modal__sub">
                  Te enviamos esta configuración y un asesor te contacta.
                </p>

                <label className="contact-field">
                  <span className="contact-field__label">Nombre *</span>
                  <input
                    ref={nameInputRef}
                    className="contact-field__input"
                    type="text"
                    value={cName}
                    placeholder="Tu nombre"
                    disabled={sendState === "sending"}
                    onChange={(e) => setCName(e.target.value)}
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-field__label">Email</span>
                  <input
                    className="contact-field__input"
                    type="email"
                    value={cEmail}
                    placeholder="tu@email.com"
                    disabled={sendState === "sending"}
                    onChange={(e) => setCEmail(e.target.value)}
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-field__label">Teléfono</span>
                  <input
                    className="contact-field__input"
                    type="tel"
                    value={cPhone}
                    placeholder="+54 9 ..."
                    disabled={sendState === "sending"}
                    onChange={(e) => setCPhone(e.target.value)}
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-field__label">Mensaje (opcional)</span>
                  <textarea
                    className="contact-field__input contact-field__textarea"
                    value={cMessage}
                    placeholder="Contanos algo más…"
                    rows={3}
                    disabled={sendState === "sending"}
                    onChange={(e) => setCMessage(e.target.value)}
                  />
                </label>

                <p className="contact-modal__hint">
                  Dejanos al menos un email o teléfono para poder responderte.
                </p>

                {sendState === "error" && (
                  <div className="contact-modal__error" role="alert">
                    {errorKind === "config" ? (
                      <>
                        <strong>No se pudo enviar tu cotización.</strong>
                        <br />
                        El envío no está disponible en este momento. Probá descargar el
                        presupuesto en PDF.
                      </>
                    ) : (
                      <>
                        <strong>No se pudo enviar tu cotización.</strong>
                        <br />
                        Revisá tu conexión e intentá de nuevo.
                      </>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn--red contact-modal__submit"
                  disabled={!canSend || sendState === "sending"}
                >
                  {sendState === "sending"
                    ? "Enviando…"
                    : sendState === "error"
                      ? "Reintentar"
                      : "Enviar cotización →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
