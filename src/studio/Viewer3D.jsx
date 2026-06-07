/* ---------------- THREE.JS VIEWER ---------------- */
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildFurnitureGroup } from "./buildFurniture.js";

export function Viewer3D({ furniture, width, bays, melamina, legId, zoomSignal }) {
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
