/* ---------- EXPORT A GLB (para AR) ---------- */
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { buildFurnitureGroup } from "./buildFurniture.js";
import { loadMelaminaTexture } from "./textures.js";

/* exporta el mueble actual a GLB y devuelve un blob URL para AR */
export function exportFurnitureToGLB({ furniture, width, bays, melamina, legId }) {
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
