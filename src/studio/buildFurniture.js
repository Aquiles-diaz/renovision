/* ---------- CONSTRUCCIÓN DEL MUEBLE (compartida 3D + AR) ---------- */
import * as THREE from "three";
import { LEGS } from "../data.jsx";
import { getMelaminaTexture } from "./textures.js";

export function buildFurnitureGroup({ furniture, width, bays, melamina, legId }) {
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
