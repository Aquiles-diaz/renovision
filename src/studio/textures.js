/* ---------- TEXTURAS DE MELAMINA (cacheadas) ---------- */
import * as THREE from "three";

const _texLoader = new THREE.TextureLoader();
const _texCache = {};

export function getMelaminaTexture(url) {
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

export function loadMelaminaTexture(url) {
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
